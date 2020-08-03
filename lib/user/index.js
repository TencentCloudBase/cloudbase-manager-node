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
    // 停用云开发用户
    async disableEndUser(options) {
        const { uuid } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        return this.tcbService.request('ModifyEndUser', {
            EnvId,
            UUId: uuid,
            Status: 'DISABLE'
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
}
__decorate([
    utils_1.preLazy()
], UserService.prototype, "getEndUserList", null);
__decorate([
    utils_1.preLazy()
], UserService.prototype, "disableEndUser", null);
__decorate([
    utils_1.preLazy()
], UserService.prototype, "deleteEndUsers", null);
exports.UserService = UserService;
