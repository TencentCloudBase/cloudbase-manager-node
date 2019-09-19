import fs from 'fs'
import Util from 'util'
import path from 'path'
import fetch from 'node-fetch'
import walkdir from 'walkdir'
import COS from 'cos-nodejs-sdk-v5'
import { cloudBaseRequest, CloudService } from '../utils'
import { CloudBaseError } from '../error'
import { Environment } from '../environment'

import { IUploadMetadata, IListFileInfo, IFileInfo, ITempUrlInfo } from '../interfaces'

function preLazy() {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let oldValue = descriptor.value
        descriptor.value = async function() {
            // 检查当前环境对象上是否已加载好环境信息
            const currentEnvironment = this.environment

            if (!currentEnvironment.inited) {
                await currentEnvironment.lazyInit()
            }
            let result = await oldValue.apply(this, arguments)
            return result
        }
    }
}

export class StorageService {
    private environment: Environment
    private cloudService: CloudService

    constructor(environment: Environment) {
        this.environment = environment
        this.cloudService = new CloudService(environment.cloudBaseContext, 'cos', '2018-11-27')
    }

    /**
     * 上传文件
     * @param {string} localPath 本地文件的绝对路径
     * @param {string} cloudPath 云端文件路径，如 img/test.png
     * @returns {Promise<void>}
     */
    @preLazy()
    public async uploadFile(localPath: string, cloudPath: string): Promise<void> {
        if (!fs.existsSync(path.resolve(localPath))) {
            throw new CloudBaseError('文件不存在！')
        }

        if (fs.statSync(localPath).isDirectory()) {
            return
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
            Body: fs.createReadStream(path.resolve(localPath)),
            'x-cos-meta-fileid': cosFileId
        })

        if (res.statusCode !== 200) {
            throw new CloudBaseError(`上传文件错误：${JSON.stringify(res)}`)
        }
    }

    /**
     * 下载文件
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 文件本地存储路径，文件需指定文件名称
     * @returns {Promise<void>}
     */
    @preLazy()
    public async downloadFile(cloudPath: string, localPath): Promise<void> {
        const urlList = await this.getTemporaryUrl([cloudPath])
        const { url } = urlList[0]

        const res = await fetch(url)
        const dest = fs.createWriteStream(localPath)
        res.body.pipe(dest)
    }

    /**
     * 列出文件夹下的所有文件
     * @link https://cloud.tencent.com/document/product/436/7734
     * @param {string} cloudDirectory 云端文件夹
     * @param {number} [max=20] 最大传输数据条目数量
     * @param {string} [marker=''] 起始路径名，后（不含）按照 UTF-8 字典序返回条目
     * @returns {Promise<ListFileInfo[]>}
     */
    @preLazy()
    public async listDirectoryFiles(
        cloudDirectory: string,
        max = 20,
        marker = ''
    ): Promise<IListFileInfo[]> {
        if (!cloudDirectory) {
            throw new CloudBaseError('目录不能为空！')
        }

        if (max > 1000) {
            throw new CloudBaseError('每次最多返回 1000 条数据')
        }

        const cos = this.getCos()
        const getBucket = Util.promisify(cos.getBucket).bind(cos)
        const { bucket, region } = this.getStorageConfig()
        const key = this.getCloudKey(cloudDirectory)

        const res = await getBucket({
            Bucket: bucket,
            Region: region,
            Prefix: key,
            MaxKeys: max,
            Marker: marker
        })

        return res.Contents
    }

    /**
     * 获取文件临时下载链接
     * @param {((string | ITempUrlInfo)[])} fileList 文件路径或文件信息数组
     * @returns {Promise<{ fileId: string; url: string }[]>}
     */
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
     * 上传文件夹
     * TODO: 支持忽略文件/文件夹
     * @param {string} source 本地文件夹
     * @param {string} cloudDirectory 云端文件夹
     * @returns {Promise<void>}
     */
    @preLazy()
    public async uploadDirectory(source: string, cloudDirectory: string): Promise<void> {
        // 此处不检查路径是否存在
        // 绝对路径 /var/blog/xxxx
        const localPath = path.resolve(source)
        const filePaths = await this.walkdir(localPath)

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
     * 删除文件夹
     * @param {string} cloudDirectory 云端文件夹
     * @returns {Promise<void>}
     */
    @preLazy()
    public async deleteDirectory(cloudDirectory: string): Promise<void> {
        const cos = this.getCos()
        const deleteObject = Util.promisify(cos.deleteObject).bind(cos)
        const { bucket, region } = this.getStorageConfig()

        const key = this.getCloudKey(cloudDirectory)

        const files = await this.listDirectoryFiles(key)

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

    private getAuthConfig() {
        const { secretId, secretKey, token } = this.environment.cloudBaseContext
        const envId = this.environment.getEnvId()

        return {
            envId,
            secretId,
            secretKey,
            token
        }
    }

    /**
     * 将 cloudPath 转换成 cloudPath/ 形式
     * @private
     * @param {string} cloudPath
     * @returns {string}
     */
    private getCloudKey(cloudPath: string): string {
        return cloudPath[cloudPath.length - 1] === '/' ? cloudPath : `${cloudPath}/`
    }

    /**
     * 将 cloudPath 转换成 fileId
     * @private
     * @param {string} cloudPath
     * @returns {string}
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
     * 遍历文件夹
     * @private
     * @param {string} dir
     * @returns
     */
    private async walkdir(dir: string) {
        try {
            return walkdir.async(dir)
        } catch (e) {
            throw new CloudBaseError(e.message)
        }
    }
}