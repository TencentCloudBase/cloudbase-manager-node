import { Environment } from '../environment'
import { CloudService, preLazy } from '../utils'
import { EndUserInfo , EndUserStatus } from './types'

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

    // // 停用云开发用户
    // @preLazy()
    // public async disableEndUser(options: {
    //     uuid: string
    // }) {
    //     const { uuid } = options
    //     const { EnvId } = this.environment.lazyEnvironmentConfig

    //     return this.tcbService.request<{
    //         RequestId: string
    //     }>('ModifyEndUser', {
    //         EnvId,
    //         UUId: uuid,
    //         Status: 'DISABLE'
    //     })
    // }

    // 设置云开发用户状态（停用或启用）
    @preLazy()
    public async setEndUserStatus(options: {
        uuid: string,
        status: EndUserStatus
    }) {
        const { uuid, status } = options
        const { EnvId } = this.environment.lazyEnvironmentConfig

        return this.tcbService.request<{
            RequestId: string
        }>('ModifyEndUser', {
            EnvId,
            UUId: uuid,
            Status: status
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

    // 创建用户名密码
    @preLazy()
    public async createEndUser(options: {
        username: string
        password: string
    }) {
        const { username, password } = options
        const { EnvId } = this.environment.lazyEnvironmentConfig

        return this.tcbService.request<{
            RequestId: string,
            User: EndUserInfo
        }>('CreateEndUserAccount', {
            EnvId,
            Username: username,
            Password: password,
        })
    }

    // 更改用户账户
    @preLazy()
    public async modifyEndUser(options: {
        uuid: string,
        password?: string,
        username?: string
    }) {
        const { uuid, username, password } = options
        const { EnvId } = this.environment.lazyEnvironmentConfig

        const reqData: any = {
            EnvId,
            Uuid: uuid
        }

        if (this.isValidStr(username)) {
            reqData.Username = username
        }
        if (this.isValidStr(password)) {
            reqData.Password = password
        }

        return this.tcbService.request<{
            RequestId: string
        }>('ModifyEndUserAccount', reqData)
    }

    // 更改用户信息
    @preLazy()
    public async updateEndUser(options: {
        uuid: string,
        nickName: string,
        gender: string,
        avatarUrl: string,
        country: string,
        province: string,
        city: string
    }) {
        const { uuid, nickName, gender, avatarUrl, country, province, city } = options
        const { EnvId } = this.environment.lazyEnvironmentConfig

        return this.tcbService.request<{
            RequestId: string
        }>('ModifyEndUserInfo', {
            UUId: uuid,
            EnvId,
            Data: [{
                Key: 'Name',
                Value: nickName
            },{
                Key: 'Gender',
                Value: gender
            },{
                Key: 'AvatarUrl',
                Value: avatarUrl
            },{
                Key: 'Country',
                Value: country
            },{
                Key: 'Province',
                Value: province
            },{
                Key: 'City',
                Value: city
            }]})
    }

    private isValidStr(obj: any) {
        return typeof obj === 'string' && obj.trim().length > 0
    }
}
