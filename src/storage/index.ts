import fs from 'fs'
import Util from 'util'
import path from 'path'
import makeDir from 'make-dir'
import walkdir from 'walkdir'
import micromatch from 'micromatch'
import COS from 'cos-nodejs-sdk-v5'
import { cloudBaseRequest, CloudService, fetchStream, preLazy, isDirectory } from '../utils'
import { CloudBaseError } from '../error'
import { Environment } from '../environment'

import {
    IUploadMetadata,
    IListFileInfo,
    IFileInfo,
    ITempUrlInfo,
    IResponseInfo
} from '../interfaces'

export interface IProgressData {
    loaded: number // 已经上传的部分 字节
    total: number // 整个文件的大小 字节
    speed: number // 文件上传速度 字节/秒
    percent: number // 百分比 小数 0 - 1
}

export interface IOptions {
    onProgress?: OnProgress
    onFileFinish?: OnFileFinish
    ignore?: string | string[]
    // 是否获取文件 fileId
    fileId?: boolean
}

export interface IFileOptions extends IOptions {
    localPath: string
    cloudPath?: string
}

export interface ICustomOptions {
    bucket: string
    region: string
}

export interface IWalkCloudDirOptions {
    prefix: string
    bucket: string
    region: string
    marker?: string
}

type AclType = 'READONLY' | 'PRIVATE' | 'ADMINWRITE' | 'ADMINONLY'
type OnProgress = (progressData: IProgressData) => void
type OnFileFinish = (error: Error, res: any, fileData: any) => void

const BIG_FILE_SIZE = 5242880 // 5MB 1024*1024*5

export class StorageService {
    private environment: Environment
    private tcbService: CloudService

    constructor(environment: Environment) {
        this.environment = environment
        this.tcbService = new CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08')
    }

    /**
     * 上传文件
     * localPath 为文件夹时，会尝试在文件夹中寻找 cloudPath 中的文件名
     * @param {string} localPath 本地文件的绝对路径
     * @param {string} cloudPath 云端文件路径，如 img/test.png
     * @returns {Promise<void>}
     */
    @preLazy()
    public async uploadFile(options: IFileOptions): Promise<void> {
        const { localPath, cloudPath = '', onProgress } = options
        const { bucket, region } = this.getStorageConfig()

        await this.uploadFileCustom({
            localPath,
            cloudPath,
            bucket,
            region,
            onProgress
        })
    }

    /**
     * 上传文件，支持自定义 Bucket 和 Region
     * @param {string} localPath
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     */
    @preLazy()
    public async uploadFileCustom(options: IFileOptions & ICustomOptions) {
        const { localPath, cloudPath, bucket, region, onProgress, fileId = true } = options
        let localFilePath = ''
        let resolveLocalPath = path.resolve(localPath)
        if (!fs.existsSync(resolveLocalPath)) {
            throw new CloudBaseError(`本地路径不存在：${resolveLocalPath}`)
        }

        // 如果 localPath 是一个文件夹，尝试在文件下寻找 cloudPath 中的文件
        const fileStats = fs.statSync(resolveLocalPath)
        if (fileStats.isDirectory()) {
            const fileName = path.parse(cloudPath).base
            const attemptFilePath = path.join(localPath, fileName)
            if (fs.existsSync(attemptFilePath)) {
                localFilePath = path.resolve(attemptFilePath)
            }
        } else {
            localFilePath = resolveLocalPath
        }

        if (!localFilePath) {
            throw new CloudBaseError('本地文件不存在！')
        }

        const cos = this.getCos()
        const putObject = Util.promisify(cos.putObject).bind(cos)
        const sliceUploadFile = Util.promisify(cos.sliceUploadFile).bind(cos)
        let cosFileId

        // 针对静态托管，fileId 不是必须的
        if (fileId) {
            // 针对文件存储，cosFileId 是必须的，区分上传人员，否则无法获取下载连接
            const res = await this.getUploadMetadata(cloudPath)
            cosFileId = res.cosFileId
        }

        let res

        // 小文件，直接上传
        if (fileStats.size < BIG_FILE_SIZE) {
            res = await putObject({
                onProgress,
                Bucket: bucket,
                Region: region,
                Key: cloudPath,
                StorageClass: 'STANDARD',
                ContentLength: fileStats.size,
                Body: fs.createReadStream(localFilePath),
                'x-cos-meta-fileid': cosFileId
            })
        } else {
            // 大文件，分块上传
            res = await sliceUploadFile({
                Bucket: bucket,
                Region: region,
                Key: cloudPath,
                FilePath: localFilePath,
                StorageClass: 'STANDARD',
                AsyncLimit: 3,
                onProgress,
                'x-cos-meta-fileid': cosFileId
            })
        }

        if (res.statusCode !== 200) {
            throw new CloudBaseError(`上传文件错误：${JSON.stringify(res)}`)
        }
    }

    /**
     * 上传文件夹
     * @param {string} localPath 本地文件夹路径
     * @param {string} cloudPath 云端文件夹
     * @param {(string | string[])} ignore
     * @returns {Promise<void>}
     */
    @preLazy()
    public async uploadDirectory(options: IFileOptions): Promise<void> {
        const { localPath, cloudPath = '', ignore, onProgress, onFileFinish } = options
        // 此处不检查路径是否存在
        // 绝对路径 /var/blog/xxxx
        const { bucket, region } = this.getStorageConfig()
        await this.uploadDirectoryCustom({
            localPath,
            cloudPath,
            bucket,
            region,
            ignore,
            onProgress,
            onFileFinish
        })
    }

    /**
     * 上传文件夹，支持自定义 Region 和 Bucket
     * @param {string} localPath
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     * @param {IOptions} options
     * @returns {Promise<void>}
     */
    @preLazy()
    public async uploadDirectoryCustom(options: IFileOptions & ICustomOptions): Promise<void> {
        const {
            localPath,
            cloudPath,
            bucket,
            region,
            onProgress,
            onFileFinish,
            ignore,
            fileId = true
        } = options
        // 此处不检查路径是否存在
        // 绝对路径 /var/blog/xxxx
        const resolvePath = path.resolve(localPath)
        // 在路径结尾加上 '/'
        const resolveLocalPath = path.join(resolvePath, path.sep)
        const filePaths = await this.walkLocalDir(resolveLocalPath, ignore)

        if (!filePaths || !filePaths.length) {
            return
        }

        const fileStatsList = filePaths.map(filePath => {
            // 处理 windows 路径
            const fileKeyPath = filePath.replace(resolveLocalPath, '').replace(/\\/g, '/')
            // 解析 cloudPath
            let cloudFileKey = path.join(cloudPath, fileKeyPath).replace(/\\/g, '/')

            if (isDirectory(filePath)) {
                cloudFileKey = this.getCloudKey(cloudFileKey)
                return {
                    filePath,
                    cloudFileKey,
                    isDir: true
                }
            } else {
                return {
                    filePath,
                    cloudFileKey,
                    isDir: false
                }
            }
        })

        // 创建文件夹对象
        const createDirs = fileStatsList
            .filter(info => info.isDir)
            .map(info => {
                // 如果是文件夹，则创建空文件夹对象
                return this.createCloudDirectroyCustom({
                    cloudPath: info.cloudFileKey,
                    bucket,
                    region
                })
            })

        await Promise.all(createDirs)

        // 上传文件对象
        const promises = fileStatsList
            .filter(stats => !stats.isDir)
            .map(async stats => {
                let cosFileId
                if (fileId) {
                    const res = await this.getUploadMetadata(stats.cloudFileKey)
                    cosFileId = res.cosFileId
                }

                return {
                    Bucket: bucket,
                    Region: region,
                    Key: stats.cloudFileKey,
                    FilePath: stats.filePath,
                    'x-cos-meta-fileid': cosFileId
                }
            })

        const files = await Promise.all(promises)

        const cos = this.getCos()
        const uploadFiles = Util.promisify(cos.uploadFiles).bind(cos)

        await uploadFiles({
            files,
            SliceSize: BIG_FILE_SIZE,
            onProgress,
            onFileFinish
        })
    }

    /**
     * 创建一个空的文件夹
     * @param {string} cloudPath
     */
    @preLazy()
    public async createCloudDirectroy(cloudPath: string) {
        const { bucket, region } = this.getStorageConfig()
        await this.createCloudDirectroyCustom({
            cloudPath,
            bucket,
            region
        })
    }

    /**
     * 创建一个空的文件夹，支持自定义 Region 和 Bucket
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     */
    @preLazy()
    public async createCloudDirectroyCustom(options: ICustomOptions & { cloudPath: string }) {
        const { cloudPath, bucket, region } = options
        const cos = this.getCos()
        const putObject = Util.promisify(cos.putObject).bind(cos)

        const dirKey = this.getCloudKey(cloudPath)

        const res = await putObject({
            Bucket: bucket,
            Region: region,
            Key: dirKey,
            Body: ''
        })

        if (res.statusCode !== 200) {
            throw new CloudBaseError(`创建文件夹失败：${JSON.stringify(res)}`)
        }
    }

    /**
     * 下载文件
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 文件本地存储路径，文件需指定文件名称
     * @returns {Promise<void>}
     */
    @preLazy()
    public async downloadFile(options: IFileOptions): Promise<void> {
        const { cloudPath, localPath } = options
        const resolveLocalPath = path.resolve(localPath)
        const fileDir = path.dirname(localPath)

        if (!fs.existsSync(fileDir)) {
            throw new CloudBaseError('路径文件夹不存在')
        }

        const urlList = await this.getTemporaryUrl([cloudPath])
        const { url } = urlList[0]

        const { proxy } = await this.getAuthConfig()
        const res = await fetchStream(url, {}, proxy)
        const dest = fs.createWriteStream(resolveLocalPath)
        res.body.pipe(dest)
    }

    /**
     * 下载文件夹
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 本地文件夹存储路径
     * @returns {Promise<void>}
     */
    @preLazy()
    public async downloadDirectory(options: IFileOptions): Promise<void> {
        const { cloudPath, localPath } = options
        const resolveLocalPath = path.resolve(localPath)

        if (!fs.existsSync(resolveLocalPath)) {
            throw new CloudBaseError('本地存储路径不存在！')
        }

        const cloudDirectoryKey = this.getCloudKey(cloudPath)
        const files = await this.walkCloudDir(cloudDirectoryKey)

        const promises = files.map(async file => {
            const fileRelativePath = file.Key.replace(cloudDirectoryKey, '')
            // 空路径和文件夹跳过
            if (!fileRelativePath || /\/$/g.test(fileRelativePath)) {
                return
            }
            const localFilePath = path.join(resolveLocalPath, fileRelativePath)
            // 创建文件的父文件夹
            const fileDir = path.dirname(localFilePath)
            await makeDir(fileDir)
            await this.downloadFile({
                cloudPath: file.Key,
                localPath: localFilePath
            })
        })

        await Promise.all(promises)
    }

    /**
     * 列出文件夹下的文件
     * @link https://cloud.tencent.com/document/product/436/7734
     * @param {string} cloudPath 云端文件夹，如果为空字符串，则表示根目录
     * @returns {Promise<ListFileInfo[]>}
     */
    @preLazy()
    public async listDirectoryFiles(cloudPath: string): Promise<IListFileInfo[]> {
        const files = await this.walkCloudDir(cloudPath)

        return files
    }

    /**
     * 获取文件临时下载链接
     * @param {((string | ITempUrlInfo)[])} fileList 文件路径或文件信息数组
     * @returns {Promise<{ fileId: string; url: string }[]>}
     */
    @preLazy()
    public async getTemporaryUrl(
        fileList: (string | ITempUrlInfo)[]
    ): Promise<{ fileId: string; url: string }[]> {
        if (!fileList || !Array.isArray(fileList)) {
            throw new CloudBaseError('fileList 必须是非空的数组')
        }

        const files: ITempUrlInfo[] = fileList.map(item => {
            if (typeof item === 'string') {
                return { cloudPath: item, maxAge: 3600 }
            } else {
                return item
            }
        })

        const invalidData = files.find(
            item => !item.cloudPath || !item.maxAge || typeof item.cloudPath !== 'string'
        )

        if (invalidData) {
            throw new CloudBaseError(`非法参数：${JSON.stringify(invalidData)}`)
        }

        const notExistsFiles = []

        const checkFileRequests = files.map(file =>
            (async () => {
                try {
                    await this.getFileInfo(file.cloudPath)
                } catch (e) {
                    if (e.statusCode === 404) {
                        notExistsFiles.push(file.cloudPath)
                    }
                }
            })()
        )

        await Promise.all(checkFileRequests)

        // 文件路径不存在
        if (notExistsFiles.length) {
            throw new CloudBaseError(`以下文件不存在：${notExistsFiles.join(', ')}`)
        }

        const data = files.map(item => ({
            fileid: this.cloudPathToFileId(item.cloudPath),
            max_age: item.maxAge
        }))

        const config = this.getAuthConfig()

        const res = await cloudBaseRequest({
            config,
            params: {
                file_list: data,
                action: 'storage.batchGetDownloadUrl'
            },
            method: 'POST'
        })

        const downloadList = res.data.download_list.map(item => ({
            url: item.download_url,
            fileId: item.fileid || item.fileID
        }))

        return downloadList
    }

    /**
     * 删除文件
     * @param {string[]} cloudPathList 云端文件路径数组
     * @returns {Promise<void>}
     */
    @preLazy()
    public async deleteFile(cloudPathList: string[]): Promise<void> {
        if (!cloudPathList || !Array.isArray(cloudPathList)) {
            throw new CloudBaseError('fileList必须是非空的数组')
        }

        const hasInvalidFileId = cloudPathList.some(file => !file || typeof file !== 'string')
        if (hasInvalidFileId) {
            throw new CloudBaseError('fileList的元素必须是非空的字符串')
        }

        const { bucket, env } = this.getStorageConfig()
        const fileIdList = cloudPathList.map(filePath => this.cloudPathToFileId(filePath))

        const config = this.getAuthConfig()
        const res = await cloudBaseRequest({
            config,
            params: {
                action: 'storage.batchDeleteFile',
                fileid_list: fileIdList
            },
            method: 'POST'
        })

        const failedList = res.data.delete_list
            .filter(item => item.code !== 'SUCCESS')
            .map(item => `${item.fileID} : ${item.code}`)
        if (failedList.length) {
            throw new CloudBaseError(`部分删除文件失败：${JSON.stringify(failedList)}`)
        }
    }

    /**
     * 删除文件，可以指定 Bucket 和 Region
     * @param {string[]} cloudPathList
     * @param {string} bucket
     * @param {string} region
     * @returns {Promise<void>}
     */
    @preLazy()
    public async deleteFileCustom(
        cloudPathList: string[],
        bucket: string,
        region: string
    ): Promise<void> {
        if (!cloudPathList || !Array.isArray(cloudPathList)) {
            throw new CloudBaseError('fileList必须是非空的数组')
        }

        const hasInvalidFileId = cloudPathList.some(file => !file || typeof file !== 'string')
        if (hasInvalidFileId) {
            throw new CloudBaseError('fileList的元素必须是非空的字符串')
        }

        const cos = this.getCos()
        const deleteObject = Util.promisify(cos.deleteObject).bind(cos)

        const promises = cloudPathList.map(async file =>
            deleteObject({
                Bucket: bucket,
                Region: region,
                Key: file
            })
        )

        await Promise.all(promises)
    }

    /**
     * 获取文件信息
     * @param {string} cloudPath 云端文件路径
     * @returns {Promise<FileInfo>}
     */
    @preLazy()
    public async getFileInfo(cloudPath: string): Promise<IFileInfo> {
        const cos = this.getCos()
        const headObject = Util.promisify(cos.headObject).bind(cos)
        const { bucket, region } = this.getStorageConfig()

        const { headers } = await headObject({
            Bucket: bucket,
            Region: region,
            Key: cloudPath
        })

        if (!headers) {
            throw new CloudBaseError(`[${cloudPath}] 获取文件信息失败`)
        }

        // 文件大小 KB
        const size = Number(Number(headers['content-length']) / 1024).toFixed(2)

        return {
            Size: size,
            Type: headers['content-type'],
            Date: headers['date'],
            ETag: headers['etag']
        }
    }

    /**
     * 删除文件夹
     * @param {string} cloudPath 云端文件夹路径
     * @returns {Promise<void>}
     */
    @preLazy()
    public async deleteDirectory(cloudPath: string): Promise<void> {
        const { bucket, region } = this.getStorageConfig()

        await this.deleteDirectoryCustom({
            cloudPath,
            bucket,
            region
        })
    }

    /**
     * 删除文件，可以指定 bucket 和 region
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     * @returns {Promise<void>}
     */
    @preLazy()
    public async deleteDirectoryCustom(
        options: { cloudPath: string } & ICustomOptions
    ): Promise<void> {
        const { cloudPath, bucket, region } = options
        const key = this.getCloudKey(cloudPath)

        const cos = this.getCos()
        const deleteObject = Util.promisify(cos.deleteObject).bind(cos)

        const files = await this.walkCloudDirCustom({
            bucket,
            region,
            prefix: key
        })

        const promises = files.map(async file =>
            deleteObject({
                Bucket: bucket,
                Region: region,
                Key: file.Key
            })
        )

        await Promise.all(promises)
    }

    /**
     * 获取文件存储权限
     * READONLY：所有用户可读，仅创建者和管理员可写
     * PRIVATE：仅创建者及管理员可读写
     * ADMINWRITE：所有用户可读，仅管理员可写
     * ADMINONLY：仅管理员可读写
     * @returns
     */
    @preLazy()
    public async getStorageAcl(): Promise<AclType> {
        const { bucket, env } = this.getStorageConfig()

        const res = await this.tcbService.request('DescribeStorageACL', {
            EnvId: env,
            Bucket: bucket
        })

        return res.AclTag
    }

    /**
     * 设置文件存储权限
     * READONLY：所有用户可读，仅创建者和管理员可写
     * PRIVATE：仅创建者及管理员可读写
     * ADMINWRITE：所有用户可读，仅管理员可写
     * ADMINONLY：仅管理员可读写
     * @param {string} acl
     * @returns
     */
    @preLazy()
    public async setStorageAcl(acl: AclType): Promise<IResponseInfo> {
        const validAcl = ['READONLY', 'PRIVATE', 'ADMINWRITE', 'ADMINONLY']
        if (!validAcl.includes(acl)) {
            throw new CloudBaseError('非法的权限类型')
        }

        const { bucket, env } = this.getStorageConfig()

        const res = await this.tcbService.request('ModifyStorageACL', {
            EnvId: env,
            Bucket: bucket,
            AclTag: acl
        })

        return res
    }

    /**
     * 遍历云端文件夹
     * @param {string} prefix
     * @param {string} [marker] 路径开始标志
     * @returns {Promise<IListFileInfo[]>}
     */
    @preLazy()
    public async walkCloudDir(prefix: string, marker?: string): Promise<IListFileInfo[]> {
        const { bucket, region } = this.getStorageConfig()
        return this.walkCloudDirCustom({
            prefix,
            bucket,
            region,
            marker
        })
    }

    /**
     * 遍历云端文件夹，支持自定义 Bucket 和 Region
     * @param {string} prefix
     * @param {string} [marker]
     * @param {string} bucket
     * @param {string} region
     * @returns {Promise<IListFileInfo[]>}
     */
    @preLazy()
    public async walkCloudDirCustom(options: IWalkCloudDirOptions): Promise<IListFileInfo[]> {
        const { prefix, bucket, region, marker = '/' } = options
        let fileList = []
        const cos = this.getCos()
        const getBucket = Util.promisify(cos.getBucket).bind(cos)

        const prefixKey = this.getCloudKey(prefix)

        const res = await getBucket({
            Bucket: bucket,
            Region: region,
            Prefix: prefixKey,
            MaxKeys: 100,
            Marker: marker
        })

        fileList.push(...res.Contents)

        let moreFiles = []
        if (res.IsTruncated === 'true' || res.IsTruncated === true) {
            moreFiles = await this.walkCloudDirCustom({
                bucket,
                region,
                prefix: prefixKey,
                marker: res.NextMarker
            })
        }

        fileList.push(...moreFiles)
        return fileList
    }

    /**
     * 遍历本地文件夹
     * 忽略不包含 dir 路径，即如果 ignore 匹配 dir，dir 也不会被忽略
     * @private
     * @param {string} dir
     * @param {(string | string[])} [ignore]
     * @returns
     */
    public async walkLocalDir(dir: string, ignore?: string | string[]) {
        try {
            return walkdir.async(dir, {
                filter: (dir: string, files: string[]) => {
                    // NOTE: ignore 为空数组时会忽略全部文件
                    if (!ignore || !ignore.length) return files
                    return micromatch.not(files, ignore)
                }
            })
        } catch (e) {
            throw new CloudBaseError(e.message)
        }
    }

    /**
     * 获取文件上传链接属性
     */
    public async getUploadMetadata(path: string): Promise<IUploadMetadata> {
        const config = this.getAuthConfig()

        const res = await cloudBaseRequest({
            config,
            params: {
                path,
                action: 'storage.getUploadMetadata'
            },
            method: 'POST'
        })
        if (res.code) {
            throw new CloudBaseError(`${res.code}: ${res.message || ''}`, {
                requestId: res.requestId
            })
        }
        return res.data
    }

    /**
     * 获取 COS 配置
     */
    private getCos() {
        const { secretId, secretKey, token, proxy } = this.getAuthConfig()
        const cosProxy = process.env.TCB_COS_PROXY
        if (!token) {
            return new COS({
                SecretId: secretId,
                SecretKey: secretKey,
                Proxy: cosProxy || proxy
            })
        }

        return new COS({
            getAuthorization: function(_, callback) {
                callback({
                    TmpSecretId: secretId,
                    TmpSecretKey: secretKey,
                    XCosSecurityToken: token,
                    ExpiredTime: 3600 * 1000,
                    Proxy: cosProxy || proxy
                })
            }
        })
    }

    /**
     * 获取授权信息
     */
    private getAuthConfig() {
        const { secretId, secretKey, token, proxy } = this.environment.cloudBaseContext
        const envId = this.environment.getEnvId()

        return {
            envId,
            secretId,
            secretKey,
            token,
            proxy
        }
    }

    /**
     * 将 cloudPath 转换成 cloudPath/ 形式
     */
    private getCloudKey(cloudPath: string): string {
        if (!cloudPath) {
            return ''
        }
        return cloudPath[cloudPath.length - 1] === '/' ? cloudPath : `${cloudPath}/`
    }

    /**
     * 将 cloudPath 转换成 fileId
     */
    private cloudPathToFileId(cloudPath: string): string {
        const { env, bucket } = this.getStorageConfig()
        return `cloud://${env}.${bucket}/${cloudPath}`
    }

    /**
     * 获取存储桶配置
     */
    private getStorageConfig() {
        const envConfig = this.environment.lazyEnvironmentConfig
        const storageConfig = envConfig?.Storages?.[0]
        const { Region, Bucket } = storageConfig
        const region = process.env.TCB_COS_REGION || Region

        return {
            region,
            bucket: Bucket,
            env: envConfig.EnvId
        }
    }
}
