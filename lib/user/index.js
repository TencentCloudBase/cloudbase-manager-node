"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const utils_1 = require("../utils");
class UserService {
    constructor(environment) {
        this.environment = environment;
        this.tcbService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
    }
    // 获取云开发用户列表
    async getEndUserList(options) {
        const { limit, offset } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        return this.tcbService.request('DescribeEndUsers', {
            EnvId,
            Limit: limit,
            Offset: offset
        });
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
    async setEndUserStatus(options) {
        const { uuid, status } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        return this.tcbService.request('ModifyEndUser', {
            EnvId,
            UUId: uuid,
            Status: status
        });
    }
    // 批量删除云开发用户
    async deleteEndUsers(options) {
        const { userList } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        return this.tcbService.request('DeleteEndUser', {
            EnvId,
            UserList: userList
        });
    }
    // 创建用户名密码
    async createEndUser(options) {
        const { username, password } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        return this.tcbService.request('CreateEndUserAccount', {
            EnvId,
            Username: username,
            Password: password,
        });
    }
    // 更改用户账户
    async modifyEndUser(options) {
        const { uuid, username, password } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        const reqData = {
            EnvId,
            Uuid: uuid
        };
        if (this.isValidStr(username)) {
            reqData.Username = username;
        }
        if (this.isValidStr(password)) {
            reqData.Password = password;
        }
        return this.tcbService.request('ModifyEndUserAccount', reqData);
    }
    // 更改用户信息
    async updateEndUser(options) {
        const { uuid, nickName, gender, avatarUrl, country, province, city } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        return this.tcbService.request('ModifyEndUserInfo', {
            UUId: uuid,
            EnvId,
            Data: [{
                    Key: 'Name',
                    Value: nickName
                }, {
                    Key: 'Gender',
                    Value: gender
                }, {
                    Key: 'AvatarUrl',
                    Value: avatarUrl
                }, {
                    Key: 'Country',
                    Value: country
                }, {
                    Key: 'Province',
                    Value: province
                }, {
                    Key: 'City',
                    Value: city
                }]
        });
    }
    isValidStr(obj) {
        return typeof obj === 'string' && obj.trim().length > 0;
    }
}
__decorate([
    utils_1.preLazy()
], UserService.prototype, "getEndUserList", null);
__decorate([
    utils_1.preLazy()
], UserService.prototype, "setEndUserStatus", null);
__decorate([
    utils_1.preLazy()
], UserService.prototype, "deleteEndUsers", null);
__decorate([
    utils_1.preLazy()
], UserService.prototype, "createEndUser", null);
__decorate([
    utils_1.preLazy()
], UserService.prototype, "modifyEndUser", null);
__decorate([
    utils_1.preLazy()
], UserService.prototype, "updateEndUser", null);
exports.UserService = UserService;
