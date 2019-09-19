import { Environment } from '../environment'
import { IResponseInfo, AuthDomain, EnvInfo, LoginConfigItem } from '../interfaces'
import { CloudBaseError } from '../error'
import { guid6, rsaEncrypt, CloudService } from '../utils'

interface ICreateEnvRes {
    // 环境当前状态：NORMAL：正常可用 NOINITIALIZE：尚未初始化 INITIALIZING：初始化过程中
    Status: 'NORMAL' | 'NOINITIALIZE' | 'INITIALIZING'
    // 唯一请求 ID，每次请求都会返回。定位问题时需要提供该次请求的 RequestId。
    RequestId: string
}

interface IDeleteDomainRes {
    RequestId: string
    Deleted: number
}

interface IAuthDomainsRes {
    RequestId: string
    Domains: AuthDomain[]
}

interface IListEnvRes {
    RequestId: string
    EnvList: EnvInfo[]
}

interface IEnvLoginConfigRes {
    RequestId: string
    ConfigList: LoginConfigItem[]
}

export class EnvService {
    private environment: Environment
    private envId: string
    private cloudService: CloudService

    constructor(environment: Environment) {
        this.environment = environment
        this.envId = environment.getEnvId()
        this.cloudService = new CloudService(
            environment.cloudBaseContext,
            'tcb',
            '2018-06-08'
        )
    }

    /**
     * 列出所有环境
     * @returns {Promise<IListEnvRes>}
     */
    async listEnvs(): Promise<IListEnvRes> {
        return this.cloudService.request('DescribeEnvs')
    }

    /**
     * 创建新环境
     * @param {string} name 环境名称
     * @returns {Promise<ICreateEnvRes>}
     */
    async createEnv(name: string): Promise<ICreateEnvRes> {
        const params = {
            Alias: name,
            EnvId: `${name}-${guid6()}`,
            Source: 'qcloud'
        }

        try {
            return this.cloudService.request('CreateEnvAndResource', params)
        } catch (e) {
            throw new CloudBaseError(`创建环境失败：${e.message}`)
        }
    }

    /**
     * 拉取安全域名列表
     * @returns {Promise<IAuthDomainsRes>}
     */
    public async getEnvAuthDomains(): Promise<IAuthDomainsRes> {
        return this.cloudService.request('DescribeAuthDomains', {
            EnvId: this.envId
        })
    }

    /**
     * 添加环境安全域名
     * @param {string[]} domains 域名字符串数组
     * @returns {Promise<IResponseInfo>}
     */
    public async createEnvDomain(domains: string[]): Promise<IResponseInfo> {
        return this.cloudService.request('CreateAuthDomain', {
            EnvId: this.envId,
            Domains: domains
        })
    }

    /**
     * 删除环境安全域名
     * @param {string[]} domainIds 域名 Id 数组
     * @returns {Promise<IDeleteDomainRes>}
     */
    public async deleteEnvDomain(domainIds: string[]): Promise<IDeleteDomainRes> {
        return this.cloudService.request('DeleteAuthDomain', {
            EnvId: this.envId,
            DomainIds: domainIds
        })
    }

    /**
     * 获取环境信息
     * @returns {Promise<IEnvInfoRes>}
     */
    public async getEnvInfo(): Promise<{
        EnvInfo: EnvInfo
        RequestId: string
    }> {
        // NOTE: DescribeEnv 接口废弃，需要使用 DescribeEnvs 接口
        const { EnvList, RequestId } = await this.cloudService.request('DescribeEnvs', {
            EnvId: this.envId
        })

        return {
            EnvInfo: EnvList && EnvList.length ? EnvList[0] : {},
            RequestId
        }
    }

    /**
     * 修改环境名称
     * @param {string} alias 环境名称
     * @returns {Promise<IResponseInfo>}
     */
    public async updateEnvInfo(alias: string): Promise<IResponseInfo> {
        return this.cloudService.request('ModifyEnv', {
            EnvId: this.envId,
            Alias: alias
        })
    }

    /**
     * 拉取登录配置列表
     * @returns {Promise<IEnvLoginConfigRes>}
     */
    async getLoginConfigList(): Promise<IEnvLoginConfigRes> {
        return this.cloudService.request('DescribeLoginConfigs', {
            EnvId: this.envId
        })
    }

    /**
     * 创建登录方式
     * 'WECHAT-OPEN'：微信开放平台
     * 'WECHAT-PUBLIC'：微信公众平台
     * @param {('WECHAT-OPEN' | 'WECHAT-PUBLIC')} platform 'WECHAT-OPEN' | 'WECHAT-PUBLIC'
     * @param {string} appId 微信 appId
     * @param {string} appSecret 微信 appSecret
     * @returns {Promise<IResponseInfo>}
     */
    async createLoginConfig(
        platform: 'WECHAT-OPEN' | 'WECHAT-PUBLIC',
        appId: string,
        appSecret: string
    ): Promise<IResponseInfo> {
        const validPlatform = ['WECHAT-OPEN', 'WECHAT-PUBLIC']
        if (!validPlatform.includes(platform)) {
            throw new CloudBaseError(
                `Invalid platform value: ${platform}. Now only support 'WECHAT-OPEN', 'WECHAT-PUBLIC'`
            )
        }

        return this.cloudService.request('CreateLoginConfig', {
            EnvId: this.envId,
            // 平台， “QQ" "WECHAT-OPEN" "WECHAT-PUBLIC"
            Platform: platform,
            PlatformId: appId,
            PlatformSecret: rsaEncrypt(appSecret),
            Status: 'ENABLE'
        })
    }

    /**
     * 更新登录方式配置
     * @param {string} configId 配置 Id，从配置列表中获取
     * @param {string} [status='ENABLE'] 是否启用 'ENABLE', 'DISABLE' ，可选
     * @param {string} [appId=''] 微信 appId，可选
     * @param {string} [appSecret=''] 微信 appSecret，可选
     * @returns {Promise<IResponseInfo>}
     */
    async updateLoginConfig(
        configId: string,
        status = 'ENABLE',
        appId = '',
        appSecret = ''
    ): Promise<IResponseInfo> {
        const validStatus = ['ENABLE', 'DISABLE']
        if (!validStatus.includes(status)) {
            throw new CloudBaseError(
                `Invalid status value: ${status}. Only support 'ENABLE', 'DISABLE'`
            )
        }
        const params: any = {
            EnvId: this.envId,
            ConfigId: configId,
            Status: status
        }

        appId && (params.PlatformId = appId)
        appSecret && (params.PlatformSecret = rsaEncrypt(appSecret))

        return this.cloudService.request('UpdateLoginConfig', params)
    }
}
