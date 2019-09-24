"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cos_nodejs_sdk_v5_1 = __importDefault(require("cos-nodejs-sdk-v5"));
const util_1 = __importDefault(require("util"));
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
        const res = await this.cloudService.request('CreateAuthDomain', {
            EnvId: this.envId,
            Domains: domains
        });
        const promises = domains.map(async (domain) => {
            this.modifyCosCorsDomain(domain);
        });
        await Promise.all(promises);
        return res;
    }
    async deleteEnvDomain(domains) {
        const { Domains } = await this.getEnvAuthDomains();
        const domainIds = Domains.filter(item => domains.includes(item.Domain)).map(item => item.Id);
        const res = await this.cloudService.request('DeleteAuthDomain', {
            EnvId: this.envId,
            DomainIds: domainIds
        });
        const promises = domains.map(async (domain) => {
            this.modifyCosCorsDomain(domain, true);
        });
        await Promise.all(promises);
        return res;
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
    async getCOSDomains() {
        const cos = this.getCos();
        const getBucketCors = util_1.default.promisify(cos.getBucketCors).bind(cos);
        const { bucket, region } = this.getStorageConfig();
        const res = await getBucketCors({
            Bucket: bucket,
            Region: region
        });
        return res.CORSRules;
    }
    async modifyCosCorsDomain(domain, deleted = false) {
        const cos = this.getCos();
        const putBucketCors = util_1.default.promisify(cos.putBucketCors).bind(cos);
        const { bucket, region } = this.getStorageConfig();
        let corsRules = await this.getCOSDomains();
        corsRules = corsRules.filter(item => {
            return !(item.AllowedOrigins &&
                item.AllowedOrigins.length === 2 &&
                item.AllowedOrigins[0] === `http://${domain}` &&
                item.AllowedOrigins[1] === `https://${domain}`);
        });
        if (!deleted) {
            corsRules.push({
                AllowedOrigin: [`http://${domain}`, `https://${domain}`],
                AllowedMethod: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
                AllowedHeader: ['*'],
                ExposeHeader: ['Etag', 'Date'],
                MaxAgeSeconds: '5'
            });
        }
        await putBucketCors({
            Bucket: bucket,
            Region: region,
            CORSRules: corsRules
        });
    }
    getCos() {
        const { secretId, secretKey, token } = this.getAuthConfig();
        if (!token) {
            return new cos_nodejs_sdk_v5_1.default({
                SecretId: secretId,
                SecretKey: secretKey
            });
        }
        return new cos_nodejs_sdk_v5_1.default({
            getAuthorization: function (_, callback) {
                callback({
                    TmpSecretId: secretId,
                    TmpSecretKey: secretKey,
                    XCosSecurityToken: token,
                    ExpiredTime: 3600 * 1000
                });
            }
        });
    }
    getAuthConfig() {
        const { secretId, secretKey, token } = this.environment.cloudBaseContext;
        const envId = this.environment.getEnvId();
        return {
            envId,
            secretId,
            secretKey,
            token
        };
    }
    getStorageConfig() {
        const envConfig = this.environment.lazyEnvironmentConfig;
        const storageConfig = envConfig.Storages && envConfig.Storages[0];
        const { Region, Bucket } = storageConfig;
        return {
            env: envConfig.EnvId,
            region: Region,
            bucket: Bucket
        };
    }
}
__decorate([
    utils_1.preLazy()
], EnvService.prototype, "createEnvDomain", null);
__decorate([
    utils_1.preLazy()
], EnvService.prototype, "deleteEnvDomain", null);
exports.EnvService = EnvService;
