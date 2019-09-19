"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("../error");
const utils_1 = require("../utils");
class EnvService {
    constructor(environment) {
        this.environment = environment;
        this.envId = environment.getEnvId();
        this.cloudService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
    }
    async listEnvs() {
        return this.cloudService.request('DescribeEnvs');
    }
    async createEnv(name) {
        const params = {
            Alias: name,
            EnvId: `${name}-${utils_1.guid6()}`,
            Source: 'qcloud'
        };
        try {
            return this.cloudService.request('CreateEnvAndResource', params);
        }
        catch (e) {
            throw new error_1.CloudBaseError(`创建环境失败：${e.message}`);
        }
    }
    async getEnvAuthDomains() {
        return this.cloudService.request('DescribeAuthDomains', {
            EnvId: this.envId
        });
    }
    async createEnvDomain(domains) {
        return this.cloudService.request('CreateAuthDomain', {
            EnvId: this.envId,
            Domains: domains
        });
    }
    async deleteEnvDomain(domainIds) {
        return this.cloudService.request('DeleteAuthDomain', {
            EnvId: this.envId,
            DomainIds: domainIds
        });
    }
    async getEnvInfo() {
        const { EnvList, RequestId } = await this.cloudService.request('DescribeEnvs', {
            EnvId: this.envId
        });
        return {
            EnvInfo: EnvList && EnvList.length ? EnvList[0] : {},
            RequestId
        };
    }
    async updateEnvInfo(alias) {
        return this.cloudService.request('ModifyEnv', {
            EnvId: this.envId,
            Alias: alias
        });
    }
    async getLoginConfigList() {
        return this.cloudService.request('DescribeLoginConfigs', {
            EnvId: this.envId
        });
    }
    async createLoginConfig(platform, appId, appSecret) {
        const validPlatform = ['WECHAT-OPEN', 'WECHAT-PUBLIC'];
        if (!validPlatform.includes(platform)) {
            throw new error_1.CloudBaseError(`Invalid platform value: ${platform}. Now only support 'WECHAT-OPEN', 'WECHAT-PUBLIC'`);
        }
        return this.cloudService.request('CreateLoginConfig', {
            EnvId: this.envId,
            Platform: platform,
            PlatformId: appId,
            PlatformSecret: utils_1.rsaEncrypt(appSecret),
            Status: 'ENABLE'
        });
    }
    async updateLoginConfig(configId, status = 'ENABLE', appId = '', appSecret = '') {
        const validStatus = ['ENABLE', 'DISABLE'];
        if (!validStatus.includes(status)) {
            throw new error_1.CloudBaseError(`Invalid status value: ${status}. Only support 'ENABLE', 'DISABLE'`);
        }
        const params = {
            EnvId: this.envId,
            ConfigId: configId,
            Status: status
        };
        appId && (params.PlatformId = appId);
        appSecret && (params.PlatformSecret = utils_1.rsaEncrypt(appSecret));
        return this.cloudService.request('UpdateLoginConfig', params);
    }
}
exports.EnvService = EnvService;
