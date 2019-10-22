import fs from 'fs'
import Util from 'util'
import path from 'path'
import makeDir from 'make-dir'
import walkdir from 'walkdir'
import COS from 'cos-nodejs-sdk-v5'
import { cloudBaseRequest, CloudService, fetchStream, preLazy } from '../utils'
import { CloudBaseError } from '../error'
import { Environment } from '../environment'

import {
    IUploadMetadata,
    IListFileInfo,
    IFileInfo,
    ITempUrlInfo,
    IResponseInfo
} from '../interfaces'

type AclType = 'READONLY' | 'PRIVATE' | 'ADMINWRITE' | 'ADMINONLY'

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
    public async uploadFile(localPath: string, cloudPath: string): Promise<void> {
        let localFilePath = ''
        let resolveLocalPath = path.resolve(localPath)
        if (!fs.existsSync(resolveLocalPath)) {
            throw new CloudBaseError(`本地路径不存在：${resolveLocalPath}`)
        }

        // 如果 localPath 是一个文件夹，尝试在文件下寻找 cloudPath 中的文件
        if (fs.statSync(resolveLocalPath).isDirectory()) {
            const fileName = cloudPath.split('/').pop()
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
        const { bucket, region } = this.getStorageConfig()
        // cosFileId 是必须的，否则无法获取下载连接
        const { cosFileId } = await this.getUploadMetadata(cloudPath)

        const res = await putObject({
            Bucket: bucket,
            Region: region,
            Key: cloudPath,
            StorageClass: 'STANDARD',
            Body: fs.createReadStream(localFilePath),
            'x-cos-meta-fileid': cosFileId
        })

        if (res.statusCode !== 200) {
            throw new CloudBaseError(`上传文件错误：${JSON.stringify(res)}`)
        }
    }

    /**
     * 上传文件夹
     * @param {string} source 本地文件夹
     * @param {string} cloudDirectory 云端文件夹
     * @returns {Promise<void>}
     */
    @preLazy()
    public async uploadDirectory(source: string, cloudDirectory: string): Promise<void> {
        // TODO: 支持忽略文件/文件夹
        // 此处不检查路径是否存在
        // 绝对路径 /var/blog/xxxx
        const localPath = path.resolve(source)
        const filePaths = await this.walkLocalDir(localPath)

        if (!filePaths || !filePaths.length) {
            return
        }

        const promises = filePaths
            .filter(filePath => !fs.statSync(filePath).isDirectory())
            .map(filePath => {
                const fileKeyPath = filePath.replace(localPath, '')
                const cloudPath = path.join(cloudDirectory, fileKeyPath)
                return this.uploadFile(filePath, cloudPath)
            })

        await Promise.all(promises)
    }

    /**
     * 下载文件
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 文件本地存储路径，文件需指定文件名称
     * @returns {Promise<void>}
     */
    @preLazy()
    public async downloadFile(cloudPath: string, localPath): Promise<void> {
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
     * @param {string} cloudDirectory 云端文件路径
     * @param {string} localPath 本地文件夹存储路径
     * @returns {Promise<void>}
     */
    @preLazy()
    public async downloadDirectory(cloudDirectory: string, localPath: string): Promise<void> {
        const resolveLocalPath = path.resolve(localPath)

        if (!fs.existsSync(resolveLocalPath)) {
            throw new CloudBaseError('本地存储路径不存在！')
        }

        const cloudDirectoryKey = this.getCloudKey(cloudDirectory)

        try {
            await this.getFileInfo(cloudDirectoryKey)
        } catch (e) {
            if (e.statusCode === 404) {
                throw new CloudBaseError(`云端路径不存在：${cloudDirectory}`)
            }
        }

        const files = await this.walkCloudDir(cloudDirectoryKey)

        const promises = files.map(async file => {
            const fileRelativePath = file.Key.replace(cloudDirectoryKey, '')
            if (!fileRelativePath) {
                return
            }
            const localFilePath = path.join(resolveLocalPath, fileRelativePath)
            // 创建文件的父文件夹
            const fileDir = path.dirname(localFilePath)
            await makeDir(fileDir)
            await this.downloadFile(file.Key, localFilePath)
        })

        await Promise.all(promises)
    }

    /**
     * 列出文件夹下的文件
     * @link https://cloud.tencent.com/document/product/436/7734
     * @param {string} cloudDirectory 云端文件夹
     * @returns {Promise<ListFileInfo[]>}
     */
    @preLazy()
    public async listDirectoryFiles(cloudDirectory: string): Promise<IListFileInfo[]> {
        if (!cloudDirectory) {
            throw new CloudBaseError('目录不能为空！')
        }

        const key = this.getCloudKey(cloudDirectory)
        const files = await this.walkCloudDir(key)

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
     * @param {string} cloudDirectory 云端文件夹
     * @returns {Promise<void>}
     */
    @preLazy()
    public async deleteDirectory(cloudDirectory: string): Promise<void> {
        const key = this.getCloudKey(cloudDirectory)

        try {
            await this.getFileInfo(key)
        } catch (e) {
            if (e.statusCode === 404) {
                throw new CloudBaseError(`云端路径不存在：${cloudDirectory}`)
            }
        }

        const cos = this.getCos()
        const deleteObject = Util.promisify(cos.deleteObject).bind(cos)
        const { bucket, region } = this.getStorageConfig()

        const files = await this.walkCloudDir(key)

        const promises = files.map(
            async file =>
                await deleteObject({
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
        let fileList = []
        const cos = this.getCos()
        const getBucket = Util.promisify(cos.getBucket).bind(cos)
        const { bucket, region } = this.getStorageConfig()

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
            moreFiles = await this.walkCloudDir(prefixKey, res.NextMarker)
        }

        fileList.push(...moreFiles)
        return fileList
    }

    /**
     * 获取文件上传链接属性
     */
    private async getUploadMetadata(path: string): Promise<IUploadMetadata> {
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
        const { secretId, secretKey, token } = this.getAuthConfig()
        if (!token) {
            return new COS({
                SecretId: secretId,
                SecretKey: secretKey
            })
        }

        return new COS({
            getAuthorization: function(_, callback) {
                callback({
                    TmpSecretId: secretId,
                    TmpSecretKey: secretKey,
                    XCosSecurityToken: token,
                    ExpiredTime: 3600 * 1000
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
        const storageConfig = envConfig.Storages && envConfig.Storages[0]
        const { Region, Bucket } = storageConfig
        return {
            env: envConfig.EnvId,
            region: Region,
            bucket: Bucket
        }
    }

    /**
     * 遍历本地文件夹
     */
    private async walkLocalDir(dir: string) {
        try {
            return walkdir.async(dir)
        } catch (e) {
            throw new CloudBaseError(e.message)
        }
    }
}
