"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
const function_1 = require("./function");
const storage_1 = require("./storage");
const env_1 = require("./env");
class Environment {
    constructor(context, envId) {
        this.inited = false;
        this.envId = envId;
        this.cloudBaseContext = context;
        // 拉取当前环境 的环境信息 todo
        this.functionService = new function_1.FunctionService(this);
        this.databaseService = new database_1.DatabaseService(this);
        this.storageService = new storage_1.StorageService(this);
        this.envService = new env_1.EnvService(this);
    }
    async lazyInit() {
        if (!this.inited) {
            const envConfig = this.envService;
            return envConfig.getEnvInfo().then(envInfo => {
                this.lazyEnvironmentConfig = envInfo.EnvInfo;
                this.inited = true;
                return this.lazyEnvironmentConfig;
            });
        }
        else {
            return this.lazyEnvironmentConfig;
        }
    }
    getEnvId() {
        return this.envId;
    }
    getStorageService() {
        return this.storageService;
    }
    getDatabaseService() {
        return this.databaseService;
    }
    getFunctionService() {
        return this.functionService;
    }
    getEnvService() {
        return this.envService;
    }
    getServicesEnvInfo() {
        const envConfig = this.envService;
        return envConfig.getEnvInfo().then(envInfo => {
            return envInfo.EnvInfo;
        });
    }
}
exports.Environment = Environment;
