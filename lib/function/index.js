"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const packer_1 = require("./packer");
const error_1 = require("../error");
const utils_1 = require("../utils");
class FunctionService {
    constructor(environment) {
        this.tcbRole = {
            Role: 'TCB_QcsRole',
            Stamp: 'MINI_QCBASE'
        };
        this.environment = environment;
        this.scfService = new utils_1.CloudService(environment.cloudBaseContext, 'scf', '2018-04-16');
        this.vpcService = new utils_1.CloudService(environment.cloudBaseContext, 'vpc', '2017-03-12');
    }
    /**
     * 创建云函数
     * @param {ICloudFunction} func 云函数信息
     * @param {string} functionRootPath 云函数根目录
     * @param {boolean} [force=false] 是否覆盖同名云函数
     * @param {string} base64Code
     * @returns {Promise<void>}
     */
    async createFunction(func, functionRootPath, force = false, base64Code) {
        // TODO: 优化处理逻辑
        const { namespace } = this.getFunctionConfig();
        let base64;
        let packer;
        const funcName = func.name;
        // 校验运行时
        const validRuntime = ['Nodejs8.9', 'Php7', 'Java8'];
        if (func.config.runtime && !validRuntime.includes(func.config.runtime)) {
            throw new error_1.CloudBaseError(`${funcName} Invalid runtime value：${func.config.runtime}. Now only support: ${validRuntime.join(', ')}`);
        }
        // CLI 从本地读取
        if (!base64Code) {
            packer = new packer_1.FunctionPacker(functionRootPath, funcName);
            const type = func.config.runtime === 'Java8' ? packer_1.CodeType.JavaFile : packer_1.CodeType.File;
            base64 = await packer.build(type);
            if (!base64) {
                throw new error_1.CloudBaseError('函数不存在！');
            }
        }
        else {
            base64 = base64Code;
        }
        // 转换环境变量
        const envVariables = Object.keys(func.config.envVariables || {}).map(key => ({
            Key: key,
            Value: func.config.envVariables[key]
        }));
        const params = {
            FunctionName: funcName,
            Namespace: namespace,
            Code: {
                ZipFile: base64
            },
            // 不可选择
            MemorySize: 256,
            Role: 'TCB_QcsRole',
            Stamp: 'MINI_QCBASE'
        };
        const { config } = func;
        // 修复参数存在 undefined 字段时，会出现鉴权失败的情况
        // Environment 为覆盖式修改，不保留已有字段
        envVariables.length && (params.Environment = { Variables: envVariables });
        // 处理入口
        params.Handler = func.handler || 'index.main';
        // 默认超时时间为 20S
        params.Timeout = Number(config.timeout) || 20;
        // 默认运行环境 Nodejs8.9
        params.Runtime = config.runtime || 'Nodejs8.9';
        // VPC 网络
        params.VpcConfig = {
            SubnetId: (config.vpc && config.vpc.subnetId) || '',
            VpcId: (config.vpc && config.vpc.vpcId) || ''
        };
        // Node 安装依赖
        func.config.runtime === 'Nodejs8.9' && (params.InstallDependency = 'TRUE');
        try {
            // 创建云函数
            await this.scfService.request('CreateFunction', params);
            // 创建函数触发器
            await this.createFunctionTriggers(funcName, func.triggers);
        }
        catch (e) {
            // 已存在同名函数，强制更新
            if (e.code === 'ResourceInUse.FunctionName' && force) {
                // 更新函数配置和代码
                this.updateFunctionConfig(func.name, func.config);
                await this.updateFunctionCode(func, functionRootPath, base64Code);
                // 创建函数触发器
                await this.createFunctionTriggers(funcName, func.triggers);
                return;
            }
            // 不强制覆盖，抛出错误
            if (e.message && !force) {
                throw new error_1.CloudBaseError(`[${funcName}] 部署失败：\n${e.message}`, {
                    code: e.code
                });
            }
        }
    }
    /**
     * 列出函数
     * @param {number} [limit=20]
     * @param {number} [offset=0]
     * @returns {Promise<Record<string, string>[]>}
     */
    async listFunctions(limit = 20, offset = 0) {
        // 获取Function 环境配置
        const { namespace } = this.getFunctionConfig();
        const res = await this.scfService.request('ListFunctions', {
            Namespace: namespace,
            Limit: limit,
            Offset: offset
        });
        const { Functions = [] } = res;
        const data = [];
        Functions.forEach(func => {
            const { FunctionId, FunctionName, Runtime, AddTime, ModTime, Status } = func;
            data.push({
                FunctionId,
                FunctionName,
                Runtime,
                AddTime,
                ModTime,
                Status
            });
        });
        return data;
    }
    /**
     * 删除云函数
     * @param {string} name 云函数名称
     * @returns {Promise<IResponseInfo>}
     */
    async deleteFunction(name) {
        const { namespace } = this.getFunctionConfig();
        return this.scfService.request('DeleteFunction', {
            FunctionName: name,
            Namespace: namespace
        });
    }
    /**
     * 获取云函数详细信息
     * @param {string} name 云函数名称
     * @returns {Promise<Record<string, string>>}
     */
    async getFunctionDetail(name) {
        const { namespace } = this.getFunctionConfig();
        const res = await this.scfService.request('GetFunction', {
            FunctionName: name,
            Namespace: namespace,
            ShowCode: 'TRUE'
        });
        const data = {};
        // 提取信息的键
        const validKeys = [
            'Status',
            'CodeInfo',
            'CodeSize',
            'Environment',
            'FunctionName',
            'Handler',
            'MemorySize',
            'ModTime',
            'Namespace',
            'Runtime',
            'Timeout',
            'Triggers',
            'VpcConfig'
        ];
        // 响应字段为 Duration 首字母大写形式，将字段转换成驼峰命名
        Object.keys(res).forEach(key => {
            if (!validKeys.includes(key))
                return;
            data[key] = res[key];
        });
        const { VpcId = '', SubnetId = '' } = data.VpcConfig || {};
        if (VpcId && SubnetId) {
            try {
                const vpcs = await this.getVpcs();
                const subnets = await this.getSubnets(VpcId);
                const vpc = vpcs.find(item => item.VpcId === VpcId);
                const subnet = subnets.find(item => item.SubnetId === SubnetId);
                data.VpcConfig = {
                    vpc,
                    subnet
                };
            }
            catch (e) {
                data.VPC = {
                    vpc: '',
                    subnet: ''
                };
            }
        }
        return data;
    }
    /**
     * 获取函数日志
     * @param {{
     *         name: string
     *         offset: number
     *         limit: number
     *         order: string
     *         orderBy: string
     *         startTime: string
     *         endTime: string
     *         requestId: string
     *     }} options
     * @returns {Promise<IFunctionLogRes>}
     */
    async getFunctionLogs(options) {
        const { name, offset = 0, limit = 10, order, orderBy, startTime, endTime, requestId } = options;
        const { namespace } = this.getFunctionConfig();
        const params = {
            Namespace: namespace,
            FunctionName: name,
            Offset: offset,
            Limit: limit,
            Order: order,
            OrderBy: orderBy,
            StartTime: startTime,
            EndTime: endTime,
            functionRequestId: requestId
        };
        const res = await this.scfService.request('GetFunctionLogs', params);
        return res;
    }
    /**
     * 更新云函数配置
     * @param {string} name 云函数名称
     * @param {ICloudFunctionConfig} config 云函数配置
     * @returns {Promise<IResponseInfo>}
     */
    async updateFunctionConfig(name, config) {
        const { namespace } = this.getFunctionConfig();
        const envVariables = Object.keys(config.envVariables || {}).map(key => ({
            Key: key,
            Value: config.envVariables[key]
        }));
        const params = {
            FunctionName: name,
            Namespace: namespace
        };
        // 修复参数存在 undefined 字段时，会出现鉴权失败的情况
        // Environment 为覆盖式修改，不保留已有字段
        envVariables.length && (params.Environment = { Variables: envVariables });
        // 不设默认超时时间，防止覆盖已有配置
        config.timeout && (params.Timeout = config.timeout);
        // 运行时
        config.runtime && (params.Runtime = config.runtime);
        // VPC 网络
        params.VpcConfig = {
            SubnetId: (config.vpc && config.vpc.subnetId) || '',
            VpcId: (config.vpc && config.vpc.vpcId) || ''
        };
        return this.scfService.request('UpdateFunctionConfiguration', params);
    }
    /**
     * 更新云函数代码
     * functionRootPath 与 base64Code 可任选其中一个
     * @param {ICloudFunction} func 云函数信息
     * @param {string} functionRootPath 云函数的目录路径（可选）
     * @param {string} base64Code 云函数 ZIP 文件的 base64 编码（可选）
     * @returns {Promise<IResponseInfo>}
     */
    async updateFunctionCode(func, functionRootPath, base64Code) {
        let base64;
        let packer;
        const funcName = func.name;
        const { namespace } = this.getFunctionConfig();
        // 校验运行时
        const validRuntime = ['Nodejs8.9', 'Php7', 'Java8'];
        if (func.config && func.config.runtime && !validRuntime.includes(func.config.runtime)) {
            throw new error_1.CloudBaseError(`${funcName} 非法的运行环境：${func.config.runtime}，当前支持环境：${validRuntime.join(', ')}`);
        }
        // CLI 从本地读取
        if (!base64Code) {
            packer = new packer_1.FunctionPacker(functionRootPath, funcName);
            const type = func.config.runtime === 'Java8' ? packer_1.CodeType.JavaFile : packer_1.CodeType.File;
            base64 = await packer.build(type);
            if (!base64) {
                throw new error_1.CloudBaseError('函数不存在！');
            }
        }
        else {
            base64 = base64Code;
        }
        const params = {
            FunctionName: funcName,
            Namespace: namespace,
            ZipFile: base64,
            Handler: func.handler || 'index.main'
        };
        try {
            // 更新云函数代码
            return this.scfService.request('UpdateFunctionCode', params);
        }
        catch (e) {
            throw new error_1.CloudBaseError(`[${funcName}] 函数代码更新失败： ${e.message}`, {
                code: e.code
            });
        }
    }
    /**
     * 调用云函数
     * @param {string} name 云函数名称
     * @param {Record<string, any>} params 调用函数传入参数
     * @returns {Promise<IFunctionInvokeRes>}
     */
    async invokeFunction(name, params) {
        const { namespace } = this.getFunctionConfig();
        const _params = {
            FunctionName: name,
            Namespace: namespace,
            ClientContext: JSON.stringify(params),
            LogType: 'Tail'
        };
        try {
            const { RequestId, Result } = await this.scfService.request('Invoke', _params);
            return Object.assign({ RequestId }, Result);
        }
        catch (e) {
            throw new error_1.CloudBaseError(`[${name}] 调用失败：\n${e.message}`);
        }
    }
    /**
     * 复制云函数
     * @param {string} name 云函数名称
     * @param {string} newFunctionName 新的云函数名称
     * @param {string} targetEnvId 目标环境 Id
     * @param {boolean} [force=false] 是否覆盖同名云函数
     * @returns {Promise<IResponseInfo>}
     */
    async copyFunction(name, newFunctionName, targetEnvId, force = false) {
        const { namespace } = this.getFunctionConfig();
        if (!namespace || !name || !newFunctionName) {
            throw new error_1.CloudBaseError('参数缺失');
        }
        return this.scfService.request('CopyFunction', {
            FunctionName: name,
            NewFunctionName: newFunctionName,
            Namespace: namespace,
            TargetNamespace: targetEnvId || namespace,
            Override: force ? true : false
        });
    }
    /**
     * 创建云函数触发器
     * @param {string} name 云函数名称
     * @param {ICloudFunctionTrigger[]} triggers 云函数触发器配置
     * @returns {Promise<IResponseInfo>}
     */
    async createFunctionTriggers(name, triggers = []) {
        const { namespace } = this.getFunctionConfig();
        const parsedTriggers = triggers.map(item => {
            if (item.type !== 'timer') {
                throw new error_1.CloudBaseError(`不支持的触发器类型 [${item.type}]，目前仅支持定时触发器（timer）！`);
            }
            return {
                TriggerName: item.name,
                Type: item.type,
                TriggerDesc: item.config
            };
        });
        return this.scfService.request('BatchCreateTrigger', {
            FunctionName: name,
            Namespace: namespace,
            Triggers: JSON.stringify(parsedTriggers),
            Count: parsedTriggers.length
        });
    }
    /**
     * 删除云函数触发器
     * @param {string} name 云函数名称
     * @param {string} triggerName 云函数触发器名称
     * @returns {Promise<IResponseInfo>}
     */
    async deleteFunctionTrigger(name, triggerName) {
        const { namespace } = this.getFunctionConfig();
        return this.scfService.request('DeleteTrigger', {
            FunctionName: name,
            Namespace: namespace,
            TriggerName: triggerName,
            Type: 'timer'
        });
    }
    getFunctionConfig() {
        const envConfig = this.environment.lazyEnvironmentConfig;
        const namespace = envConfig.Functions[0].Namespace;
        return {
            namespace,
            env: envConfig.EnvId
        };
    }
    /**
     * 获取 vpc 信息
     * @returns
     */
    async getVpcs() {
        const { VpcSet } = await this.vpcService.request('DescribeVpcs');
        return VpcSet;
    }
    /**
     * 获取子网
     * @param {string} vpcId
     * @returns
     */
    async getSubnets(vpcId) {
        const { SubnetSet } = await this.vpcService.request('DescribeSubnets', {
            Filters: [
                {
                    Name: 'vpc-id',
                    Values: [vpcId]
                }
            ]
        });
        return SubnetSet;
    }
}
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "createFunction", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "listFunctions", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "deleteFunction", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "getFunctionDetail", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "getFunctionLogs", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "updateFunctionConfig", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "updateFunctionCode", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "invokeFunction", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "copyFunction", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "createFunctionTriggers", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "deleteFunctionTrigger", null);
exports.FunctionService = FunctionService;
