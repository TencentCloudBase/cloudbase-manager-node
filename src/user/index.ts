import { Environment } from '../environment'
import { CloudService, preLazy } from '../utils'
import { EndUserInfo } from './types'

export class UserService {
    private environment: Environment
    private tcbService: CloudService

    constructor(environment: Environment) {
        this.environment = environment
        this.tcbService = new CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08')
    }

    // 获取云开发用户列表
    @preLazy()
    public async getEndUserList(options: {
        limit: number,
        offset: number,
    }) {
        const { limit, offset } = options
        const { EnvId } = this.environment.lazyEnvironmentConfig

        return this.tcbService.request<{
            Total: number
            Users: EndUserInfo[]
            RequestId: string
        }>('DescribeEndUsers', {
            EnvId,
            Limit: limit,
            Offset: offset
        })
    }

    // 停用云开发用户
    @preLazy()
    public async disableEndUser(options: {
        uuid: string
    }) {
        const { uuid } = options
        const { EnvId } = this.environment.lazyEnvironmentConfig

        return this.tcbService.request<{
            RequestId: string
        }>('ModifyEndUser', {
            EnvId,
            UUId: uuid,
            Status: 'DISABLE'
        })
    }

    // 批量删除云开发用户
    @preLazy()
    public async deleteEndUsers(options: {
        userList: string[]
    }) {
        const { userList } = options
        const { EnvId } = this.environment.lazyEnvironmentConfig

        return this.tcbService.request<{
            RequestId: string
        }>('DeleteEndUser', {
            EnvId,
            UserList: userList
        })
    }
}
