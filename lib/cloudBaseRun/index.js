"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudBaseRunService = void 0;
const utils_1 = require("../utils");
class CloudBaseRunService {
    constructor(environment) {
        this.environment = environment;
        this.tcbService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
    }
    // 修改容器内版本流量配置
    async modifyServerFlow(options) {
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('ModifyCloudBaseRunServerFlowConf', {
            EnvId: envId,
            ServerName: options.serverName,
            VersionFlowItems: utils_1.upperCaseObjKey(options.versionFlowItems)
            // TrafficType: options.trafficType
        });
    }
    getEnvInfo() {
        const envConfig = this.environment.lazyEnvironmentConfig;
        return {
            envId: envConfig.EnvId
        };
    }
}
__decorate([
    utils_1.preLazy()
], CloudBaseRunService.prototype, "modifyServerFlow", null);
exports.CloudBaseRunService = CloudBaseRunService;
