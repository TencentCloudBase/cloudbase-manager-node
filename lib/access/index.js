"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessService = void 0;
const utils_1 = require("../utils");
class AccessService {
    constructor(environment) {
        this.environment = environment;
        this.tcbService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
    }
    // 创建云接入路径
    async createAccess(options) {
        const { path, name, type = 1, auth } = options;
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('CreateCloudBaseGWAPI', {
            ServiceId: envId,
            Path: path,
            Type: type,
            Name: name,
            AuthSwitch: auth ? 1 : 2
        });
    }
    // 获取云接入自定义域名列表
    async getDomainList() {
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('DescribeCloudBaseGWService', {
            ServiceId: envId
        });
    }
    // 获取云接入服务列表
    async getAccessList(options = {}) {
        const { path, name, offset, limit } = options;
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('DescribeCloudBaseGWAPI', {
            ServiceId: envId,
            Path: path,
            Name: name,
            Offset: offset,
            limit: limit
        });
    }
    // 切换云接入服务开关：开启/关闭
    async switchAuth(auth) {
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('ModifyCloudBaseGWPrivilege', {
            ServiceId: envId,
            EnableService: auth,
            Options: [
                {
                    Key: 'serviceswitch',
                    Value: auth ? 'true' : 'false'
                }
            ]
        });
    }
    // 更新云接入路径鉴权
    async switchPathAuth(options) {
        const { apiIds, auth } = options;
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('ModifyCloudBaseGWAPIPrivilegeBatch', {
            ServiceId: envId,
            APIIdSet: apiIds,
            Options: [
                {
                    Key: 'authswitch',
                    Value: auth ? 'true' : 'false'
                }
            ]
        });
    }
    // 删除云接入服务
    async deleteAccess(options) {
        const { name, type = 1, apiId } = options;
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('DeleteCloudBaseGWAPI', {
            ServiceId: envId,
            Name: name,
            Type: type,
            APIId: apiId
        });
    }
    // 添加自定义域名
    async addCustomDomain(options) {
        const { domain, certId } = options;
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('BindCloudBaseGWDomain', {
            Domain: domain,
            ServiceId: envId,
            CertId: certId
        });
    }
    // 删除自定义域名
    async deleteCustomDomain(domain) {
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('DeleteCloudBaseGWDomain', {
            Domain: domain,
            ServiceId: envId
        });
    }
    getEnvInfo() {
        var _a;
        const envConfig = this.environment.lazyEnvironmentConfig;
        const appId = (_a = envConfig.Storages[0]) === null || _a === void 0 ? void 0 : _a.AppId;
        const { proxy } = this.environment.cloudBaseContext;
        return {
            appId,
            proxy,
            envId: envConfig.EnvId
        };
    }
}
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "createAccess", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "getDomainList", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "getAccessList", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "switchAuth", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "switchPathAuth", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "deleteAccess", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "addCustomDomain", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "deleteCustomDomain", null);
exports.AccessService = AccessService;
