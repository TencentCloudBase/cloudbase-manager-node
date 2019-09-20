"use strict";
const environmentManager_1 = require("./environmentManager");
const utils_1 = require("./utils");
const constant_1 = require("./constant");
const context_1 = require("./context");
class CloudBase {
    constructor(config) {
        this.cloudBaseConfig = {};
        if (config.secretId && config.secretKey) {
            this.cloudBaseConfig.secretId = config.secretId;
            this.cloudBaseConfig.secretKey = config.secretKey;
            if (config.token) {
                this.cloudBaseConfig.token = config.token;
            }
        }
        else {
            if (utils_1.getRuntime() === constant_1.RUN_ENV.SCF) {
                const secretId = utils_1.getEnvVar(constant_1.ENV_NAME.ENV_SECRETID);
                const secretKey = utils_1.getEnvVar(constant_1.ENV_NAME.ENV_SECRETKEY);
                const token = utils_1.getEnvVar(constant_1.ENV_NAME.ENV_SESSIONTOKEN);
                if (!secretId || !secretKey) {
                    throw new Error(constant_1.ERRROR.MISS_SECRET_INFO_IN_ENV);
                }
                this.cloudBaseConfig = {
                    secretId,
                    secretKey,
                    token
                };
            }
            else {
                throw new Error(constant_1.ERRROR.MISS_SECRET_INFO_IN_ARGS);
            }
        }
        if (config.envId) {
            this.cloudBaseConfig.envId = config.envId;
        }
        this.context = new context_1.CloudBaseContext(this.cloudBaseConfig);
        this.environmentManager = new environmentManager_1.EnvironmentManager(this.context);
        this.environmentManager.add(config.envId || '');
    }
    static init(config) {
        if (!CloudBase.cloudBase) {
            CloudBase.cloudBase = new CloudBase(config);
        }
        return CloudBase.cloudBase;
    }
    addEnvironment(envId) {
        this.environmentManager.add(envId);
    }
    currentEnvironment() {
        return this.environmentManager.getCurrentEnv();
    }
    get functions() {
        return this.currentEnvironment().getFunctionService();
    }
    get storage() {
        return this.currentEnvironment().getStorageService();
    }
    get database() {
        return this.currentEnvironment().getDatabaseService();
    }
    get env() {
        return this.currentEnvironment().getEnvService();
    }
    getEnvironmentManager() {
        return this.environmentManager;
    }
    getManagerConfig() {
        return this.cloudBaseConfig;
    }
}
module.exports = CloudBase;
