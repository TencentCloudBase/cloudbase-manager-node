import { Environment } from '../environment'
import { CloudService, preLazy, upperCaseObjKey } from '../utils'
import { IModifyServerFlowOption } from './types'
import { IResponseInfo } from '../interfaces'

export class CloudBaseRunService {
    private tcbService: CloudService
    private environment: Environment

    constructor(environment: Environment) {
        this.environment = environment
        this.tcbService = new CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08')
    }

    // 修改容器内版本流量配置
    @preLazy()
    public async modifyServerFlow(
        options: IModifyServerFlowOption
    ): Promise<{
        Result: string // succ代表成功
        RequestId: string // 请求ID
    }> {
        const { envId } = this.getEnvInfo()

        return this.tcbService.request('ModifyCloudBaseRunServerFlowConf', {
            EnvId: envId,
            ServerName: options.serverName,
            VersionFlowItems: upperCaseObjKey(options.versionFlowItems)
            // TrafficType: options.trafficType
        })
    }

    private getEnvInfo() {
        const envConfig = this.environment.lazyEnvironmentConfig

        return {
            envId: envConfig.EnvId
        }
    }
}
