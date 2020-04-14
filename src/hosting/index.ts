import path from 'path'
import { CloudBaseError } from '../error'
import { Environment } from '../environment'
import { CloudService, preLazy, checkReadable, isDirectory } from '../utils'

interface IHostingFileOptions {
    localPath: string
    cloudPath: string
    onProgress?: (data: any) => void
    onFileFinish?: (...args) => void
}

interface IHostingCloudOptions {
    cloudPath: string
    isDir: boolean
}

const HostingStatusMap = {
    init: '初始化中',
    process: '处理中',
    online: '上线',
    destroying: '销毁中',
    offline: '下线',
    create_fail: '初始化失败', // eslint-disable-line
    destroy_fail: '销毁失败' // eslint-disable-line
}

export interface IHostingInfo {
    EnvId: string
    CdnDomain: string
    Bucket: string
    Regoin: string
    Status: string
    MaxDomain: number
    Id: number
    PolicyId: number
}

export class HostingService {
    private environment: Environment
    private tcbService: CloudService

    constructor(environment: Environment) {
        this.environment = environment
        this.tcbService = new CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08')
    }

    /**
     * 获取 hosting 信息
     */
    @preLazy()
    async getInfo(): Promise<IHostingInfo[]> {
        const { envId } = this.getHostingConfig()
        const { Data } = await this.tcbService.request('DescribeStaticStore', {
            EnvId: envId
        })

        return Data
    }

    /**
     * 开启 hosting 服务，异步任务
     */
    @preLazy()
    async enableService() {
        const { envId } = this.getHostingConfig()

        const hostings = await this.getInfo()
        // hosting 服务已开启
        if (hostings?.length) {
            const website = hostings[0]
            // offline 状态的服务可重新开启
            if (website.Status !== 'offline') {
                throw new CloudBaseError('静态网站服务已开启，请勿重复操作！')
            }
        }

        const res = await this.tcbService.request('CreateStaticStore', {
            EnvId: envId
        })

        const code = res.Result === 'succ' ? 0 : -1

        return {
            code,
            requestId: res.RequestId
        }
    }

    /**
     * 展示文件列表
     */
    @preLazy()
    async listFiles() {
        const hosting = await this.checkStatus()
        const { Bucket, Regoin } = hosting
        const storageService = await this.environment.getStorageService()

        const list = await storageService.walkCloudDirCustom({
            prefix: '',
            bucket: Bucket,
            region: Regoin
        })

        return list
    }

    /**
     * 销毁静态托管服务
     */
    @preLazy()
    async destroyService() {
        const { envId } = this.getHostingConfig()

        const files = await this.listFiles()

        if (files?.length) {
            throw new CloudBaseError('静态网站文件不为空，无法销毁！', {
                code: 'INVALID_OPERATION'
            })
        }

        const hostings = await this.getInfo()

        if (!hostings || !hostings.length) {
            throw new CloudBaseError('静态网站服务未开启！', {
                code: 'INVALID_OPERATION'
            })
        }

        const website = hostings[0]

        // destroy_fail 状态可重试
        if (website.Status !== 'online' && website.Status !== 'destroy_fail') {
            throw new CloudBaseError(
                `静态网站服务【${HostingStatusMap[website.Status]}】，无法进行此操作！`,
                {
                    code: 'INVALID_OPERATION'
                }
            )
        }

        const res = await this.tcbService.request('DestroyStaticStore', {
            EnvId: envId
        })

        const code = res.Result === 'succ' ? 0 : -1
        return {
            code,
            requestId: res.RequestId
        }
    }

    /**
     * 上传文件或文件夹
     * @param options
     */
    @preLazy()
    async uploadFiles(options: IHostingFileOptions) {
        const { localPath, cloudPath, onProgress, onFileFinish } = options
        const resolvePath = path.resolve(localPath)
        // 检查路径是否存在
        checkReadable(resolvePath, true)

        const hosting = await this.checkStatus()
        const { Bucket, Regoin } = hosting
        const storageService = await this.environment.getStorageService()

        if (isDirectory(resolvePath)) {
            await storageService.uploadDirectoryCustom({
                localPath: resolvePath,
                cloudPath,
                bucket: Bucket,
                region: Regoin,
                onProgress,
                onFileFinish,
                fileId: false
            })
        } else {
            const assignCloudPath = cloudPath || path.parse(resolvePath).base
            await storageService.uploadFileCustom({
                localPath: resolvePath,
                cloudPath: assignCloudPath,
                bucket: Bucket,
                region: Regoin,
                onProgress,
                fileId: false
            })
        }
    }

    /**
     * 删除文件或文件夹
     * @param options
     */
    @preLazy()
    async deleteFiles(options: IHostingCloudOptions) {
        const { cloudPath, isDir } = options
        const hosting = await this.checkStatus()
        const { Bucket, Regoin } = hosting
        const storageService = await this.environment.getStorageService()

        if (isDir) {
            await storageService.deleteDirectoryCustom({
                cloudPath,
                bucket: Bucket,
                region: Regoin
            })
        } else {
            await storageService.deleteFileCustom([cloudPath], Bucket, Regoin)
        }
    }

    // 遍历文件
    @preLazy()
    async walkLocalDir(envId: string, dir: string) {
        const storageService = await this.environment.getStorageService()
        return storageService.walkLocalDir(dir)
    }

    /**
     * 检查 hosting 服务状态
     */
    @preLazy()
    private async checkStatus() {
        const hostings = await this.getInfo()

        if (!hostings || !hostings.length) {
            throw new CloudBaseError(
                `您还没有开启静态网站服务，请先到云开发控制台开启静态网站服务！`,
                {
                    code: 'INVALID_OPERATION'
                }
            )
        }

        const website = hostings[0]

        if (website.Status !== 'online') {
            throw new CloudBaseError(
                `静态网站服务【${HostingStatusMap[website.Status]}】，无法进行此操作！`,
                {
                    code: 'INVALID_OPERATION'
                }
            )
        }

        return website
    }

    /**
     * 获取配置
     */
    private getHostingConfig() {
        const envConfig = this.environment.lazyEnvironmentConfig
        const appId = envConfig.Storages[0]?.AppId
        const { proxy } = this.environment.cloudBaseContext

        return {
            appId,
            proxy,
            envId: envConfig.EnvId
        }
    }
}
