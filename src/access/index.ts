import { Environment } from '../environment'
import { CloudService, preLazy } from '../utils'
import {
    ICreateAccessOptions,
    IApi,
    IUpdateOptions,
    IService,
    IDeleteOptions,
    IGetOptions,
    IDomainOptions
} from './types'
import { IResponseInfo } from '../interfaces'

export class AccessService {
    private tcbService: CloudService
    private environment: Environment

    constructor(environment: Environment) {
        this.environment = environment
        this.tcbService = new CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08')
    }

    // 创建云接入路径
    @preLazy()
    public async createAccess(options: ICreateAccessOptions) {
        const { path, name, type = 1, auth } = options
        const { envId } = this.getEnvInfo()

        return this.tcbService.request<{
            APIId: string
            RequestId: string
        }>('CreateCloudBaseGWAPI', {
            ServiceId: envId,
            Path: path,
            Type: type,
            Name: name,
            AuthSwitch: auth ? 1 : 2
        })
    }

    // 获取云接入自定义域名列表
    @preLazy()
    public async getDomainList() {
        const { envId } = this.getEnvInfo()
        return this.tcbService.request<{
            RequestId: string
            // 云接入默认域名
            DefaultDomain: string
            // 是否开启了云接入服务
            EnableService: boolean
            // 云接入服务列表
            ServiceSet: IService[]
        }>('DescribeCloudBaseGWService', {
            ServiceId: envId
        })
    }

    // 获取云接入服务列表
    @preLazy()
    public async getAccessList(options: IGetOptions = {}) {
        const { path, name, offset, limit } = options
        const { envId } = this.getEnvInfo()

        return this.tcbService.request<{
            RequestId: string
            APISet: IApi[]
            Total: number
            Limit: number
            Offset: number
            EnableService: boolean
        }>('DescribeCloudBaseGWAPI', {
            ServiceId: envId,
            Path: path,
            Name: name,
            Offset: offset,
            limit: limit
        })
    }

    // 切换云接入服务开关：开启/关闭
    @preLazy()
    public async switchAuth(auth: boolean) {
        const { envId } = this.getEnvInfo()
        return this.tcbService.request<{
            Count: number
            RequestId: string
        }>('ModifyCloudBaseGWPrivilege', {
            ServiceId: envId,
            EnableService: auth,
            Options: [
                {
                    Key: 'serviceswitch',
                    Value: auth ? 'true' : 'false'
                }
            ]
        })
    }

    // 更新云接入路径鉴权
    @preLazy()
    public async switchPathAuth(options: IUpdateOptions) {
        const { apiIds, auth } = options
        const { envId } = this.getEnvInfo()
        return this.tcbService.request<{
            Count: number
            RequestId: string
        }>('ModifyCloudBaseGWAPIPrivilegeBatch', {
            ServiceId: envId,
            APIIdSet: apiIds,
            Options: [
                {
                    Key: 'authswitch',
                    Value: auth ? 'true' : 'false'
                }
            ]
        })
    }

    // 删除云接入服务
    @preLazy()
    public async deleteAccess(options: IDeleteOptions) {
        const { name, type = 1, apiId } = options
        const { envId } = this.getEnvInfo()

        return this.tcbService.request<IResponseInfo>('DeleteCloudBaseGWAPI', {
            ServiceId: envId,
            Name: name,
            Type: type,
            APIId: apiId
        })
    }

    // 添加自定义域名
    @preLazy()
    public async addCustomDomain(options: IDomainOptions) {
        const { domain, certId } = options
        const { envId } = this.getEnvInfo()

        return this.tcbService.request<IResponseInfo>('BindCloudBaseGWDomain', {
            Domain: domain,
            ServiceId: envId,
            CertId: certId
        })
    }

    // 删除自定义域名
    @preLazy()
    public async deleteCustomDomain(domain: string) {
        const { envId } = this.getEnvInfo()

        return this.tcbService.request<IResponseInfo>('DeleteCloudBaseGWDomain', {
            Domain: domain,
            ServiceId: envId
        })
    }

    private getEnvInfo() {
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
