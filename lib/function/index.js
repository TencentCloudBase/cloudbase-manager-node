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
const packer_1 = require("./packer");
const error_1 = require("../error");
const utils_1 = require("../utils");
const constant_1 = require("../constant");
const fs_1 = require("../utils/fs");
const path_1 = __importDefault(require("path"));
const fs_2 = __importDefault(require("fs"));
// 校验函数参数
function validCreateParams(func, codeSecret) {
    var _a;
    // 校验 CodeSecret 格式
    if (codeSecret && !/^[A-Za-z0-9+=/]{1,160}$/.test(codeSecret)) {
        throw new error_1.CloudBaseError('CodeSecret 格式错误，CodeSecret 只能包含 1-160 位大小字母、数字、"+"、"="、"/"');
    }
    // 校验运行时
    const validRuntime = ['Nodejs8.9', 'Php7', 'Java8'];
    if (((_a = func) === null || _a === void 0 ? void 0 : _a.runtime) && !validRuntime.includes(func.runtime)) {
        throw new error_1.CloudBaseError(`${func.name} Invalid runtime value：${func.runtime}. Now only support: ${validRuntime.join(', ')}`);
    }
}
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
     * 增量更新函数代码
     * @param {IUpdateFunctionIncrementalCodeParam} funcParam
     * @returns {Promise<void>}
     * @memberof FunctionService
     */
    async updateFunctionIncrementalCode(funcParam) {
        const { namespace } = this.getFunctionConfig();
        const { functionRootPath, func, deleteFiles, addFiles } = funcParam;
        const { name, runtime } = func;
        const params = {
            FunctionName: name,
            Namespace: namespace
        };
        let packer;
        let base64;
        validCreateParams(func);
        if (deleteFiles) {
            params.DeleteFiles = deleteFiles;
        }
        if (addFiles) {
            // 将选中的增量文件或增量文件夹  转base64
            packer = new packer_1.FunctionPacker(functionRootPath, name, [], addFiles);
            const type = func.runtime === 'Java8' ? packer_1.CodeType.JavaFile : packer_1.CodeType.File;
            base64 = await packer.build(type);
            if (!base64) {
                throw new error_1.CloudBaseError('函数不存在！');
            }
            params.AddFiles = base64;
        }
        const res = await this.scfService.request('UpdateFunctionIncrementalCode', params);
        return res;
    }
    /**
     * 创建云函数
     * @param {ICreateFunctionParam} funcParam
     * @returns {(Promise<IResponseInfo | ICreateFunctionRes>)}
     */
    async createFunction(funcParam) {
        var _a, _b;
        // TODO: 优化处理逻辑
        const { namespace } = this.getFunctionConfig();
        const { func, functionRootPath, force = false, base64Code, codeSecret } = funcParam;
        let base64;
        let packer;
        const funcName = func.name;
        validCreateParams(func, codeSecret);
        let installDependency;
        // Node 8.9 默认安装依赖
        installDependency = func.runtime === 'Nodejs8.9' ? 'TRUE' : 'FALSE';
        // 是否安装依赖，选项可以覆盖
        if (typeof func.installDependency !== 'undefined') {
            installDependency = func.installDependency ? 'TRUE' : 'FALSE';
        }
        // CLI 从本地读取
        if (!base64Code) {
            // 云端安装依赖，自动忽略 node_modules 目录
            const ignore = installDependency === 'TRUE'
                ? ['node_modules/**/*', 'node_modules', ...(func.ignore || [])]
                : [...(func.ignore || [])];
            packer = new packer_1.FunctionPacker(functionRootPath, funcName, ignore);
            const type = func.runtime === 'Java8' ? packer_1.CodeType.JavaFile : packer_1.CodeType.File;
            base64 = await packer.build(type);
            if (!base64) {
                throw new error_1.CloudBaseError('函数不存在！');
            }
        }
        else {
            base64 = base64Code;
        }
        // 转换环境变量
        const envVariables = Object.keys(func.envVariables || {}).map(key => ({
            Key: key,
            Value: func.envVariables[key]
        }));
        // 当不存在 L5 配置时，不修改 L5 状态，否则根据 true/false 进行修改
        const l5Enable = typeof ((_a = func) === null || _a === void 0 ? void 0 : _a.l5) === 'undefined' ? null : ((_b = func) === null || _b === void 0 ? void 0 : _b.l5) ? 'TRUE' : 'FALSE';
        const params = {
            FunctionName: funcName,
            Namespace: namespace,
            Code: {
                ZipFile: base64
            },
            // 不可选择
            MemorySize: 256,
            Role: 'TCB_QcsRole',
            Stamp: 'MINI_QCBASE',
            L5Enable: l5Enable
        };
        // 修复参数存在 undefined 字段时，会出现鉴权失败的情况
        // Environment 为覆盖式修改，不保留已有字段
        envVariables.length && (params.Environment = { Variables: envVariables });
        // 处理入口
        params.Handler = func.handler || 'index.main';
        // 默认超时时间为 20S
        params.Timeout = Number(func.timeout) || 20;
        // 默认运行环境 Nodejs8.9
        params.Runtime = func.runtime || 'Nodejs8.9';
        // VPC 网络
        params.VpcConfig = {
            SubnetId: (func.vpc && func.vpc.subnetId) || '',
            VpcId: (func.vpc && func.vpc.vpcId) || ''
        };
        // 自动安装依赖
        params.InstallDependency = installDependency;
        // 代码保护
        if (codeSecret) {
            params.CodeSecret = codeSecret;
        }
        // 当使用 VPC 网络时，开启 EIP 配置
        if (params.VpcConfig.SubnetId && params.VpcConfig.VpcId) {
            params.EipConfig = { EipFixed: 'TRUE' };
        }
        else {
            params.EipConfig = { EipFixed: 'FALSE' };
        }
        // 函数层
        func.layers && func.layers.length && (params.Layers = func.layers);
        try {
            // 创建云函数
            const res = await this.scfService.request('CreateFunction', params);
            // 创建函数触发器、失败自动重试
            await this.retryCreateTrigger(funcName, func.triggers);
            // await this.createFunctionTriggers(funcName, func.triggers)
            // 如果选择自动安装依赖，且等待依赖安装
            if (params.InstallDependency && func.isWaitInstall === true) {
                await this.waitFunctionActive(funcName, codeSecret);
            }
            return res;
        }
        catch (e) {
            // 已存在同名函数，强制更新
            if (e.code === 'ResourceInUse.FunctionName' && force) {
                // 创建函数触发器
                const triggerRes = await this.createFunctionTriggers(funcName, func.triggers);
                // 更新函数配置和代码
                const configRes = await this.updateFunctionConfig(func);
                // 更新函数代码
                const codeRes = await this.retryUpdateFunctionCode({
                    func,
                    functionRootPath,
                    base64Code: base64,
                    codeSecret: codeSecret
                });
                // 返回全部操作的响应值
                return {
                    triggerRes,
                    configRes,
                    codeRes
                };
            }
            // 不强制覆盖，抛出错误
            if (e.message && !force) {
                throw new error_1.CloudBaseError(`[${funcName}] 部署失败：\n${e.message}`, {
                    code: e.code,
                    requestId: e.requestId
                });
            }
            throw e;
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
    async getFunctionDetail(name, codeSecret) {
        const { namespace } = this.getFunctionConfig();
        const params = {
            FunctionName: name,
            Namespace: namespace,
            ShowCode: 'TRUE'
        };
        if (codeSecret) {
            params.CodeSecret = codeSecret;
        }
        const res = await this.scfService.request('GetFunction', params);
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
            FunctionRequestId: requestId
        };
        const res = await this.scfService.request('GetFunctionLogs', params);
        return res;
    }
    /**
     * 更新云函数配置
     * @param {ICloudFunction} func 云函数配置
     * @returns {Promise<IResponseInfo>}
     */
    async updateFunctionConfig(func) {
        const { namespace } = this.getFunctionConfig();
        const envVariables = Object.keys(func.envVariables || {}).map(key => ({
            Key: key,
            Value: func.envVariables[key]
        }));
        // 当不存在 L5 配置时，不修改 L5 状态，否则根据 true/false 进行修改
        const l5Enable = typeof func.l5 === 'undefined' ? null : func.l5 ? 'TRUE' : 'FALSE';
        const params = {
            FunctionName: func.name,
            Namespace: namespace,
            L5Enable: l5Enable
        };
        // 修复参数存在 undefined 字段时，会出现鉴权失败的情况
        // Environment 为覆盖式修改，不保留已有字段
        envVariables.length && (params.Environment = { Variables: envVariables });
        // 不设默认超时时间，防止覆盖已有配置
        func.timeout && (params.Timeout = func.timeout);
        // 运行时
        func.runtime && (params.Runtime = func.runtime);
        // VPC 网络
        params.VpcConfig = {
            SubnetId: (func.vpc && func.vpc.subnetId) || '',
            VpcId: (func.vpc && func.vpc.vpcId) || ''
        };
        // Node 8.9 默认安装依赖
        func.runtime === 'Nodejs8.9' && (params.InstallDependency = 'TRUE');
        // 是否安装依赖，选项可以覆盖
        if (typeof func.installDependency !== 'undefined') {
            params.InstallDependency = func.installDependency ? 'TRUE' : 'FALSE';
        }
        // 函数层
        func.layers && func.layers.length && (params.Layers = func.layers);
        return this.scfService.request('UpdateFunctionConfiguration', params);
    }
    /**
     *
     * @param {IUpdateFunctionCodeParam} funcParam
     * @returns {Promise<IResponseInfo>}
     * @memberof FunctionService
     */
    async updateFunctionCode(funcParam) {
        let base64;
        let packer;
        const { func, functionRootPath, base64Code, codeSecret } = funcParam;
        const funcName = func.name;
        const { namespace } = this.getFunctionConfig();
        validCreateParams(func);
        let installDependency;
        // Node 8.9 默认安装依赖
        installDependency = func.runtime === 'Nodejs8.9' ? 'TRUE' : 'FALSE';
        // 是否安装依赖，选项可以覆盖
        if (typeof func.installDependency !== 'undefined') {
            installDependency = func.installDependency ? 'TRUE' : 'FALSE';
        }
        // CLI 从本地读取
        if (!base64Code) {
            const ignore = installDependency === 'TRUE'
                ? ['node_modules/**/*', 'node_modules', ...(func.ignore || [])]
                : [...(func.ignore || [])];
            packer = new packer_1.FunctionPacker(functionRootPath, funcName, ignore);
            const type = func.runtime === 'Java8' ? packer_1.CodeType.JavaFile : packer_1.CodeType.File;
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
            Handler: func.handler || 'index.main',
            InstallDependency: installDependency
        };
        if (codeSecret) {
            params.CodeSecret = codeSecret;
        }
        try {
            // 更新云函数代码
            const res = await this.scfService.request('UpdateFunctionCode', params);
            if (installDependency && func.isWaitInstall === true) {
                await this.waitFunctionActive(funcName, codeSecret);
            }
            return res;
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
            LogType: 'Tail'
        };
        if (params) {
            _params.ClientContext = JSON.stringify(params);
        }
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
    /* eslint-disable-next-line */
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
        if (!triggers || !triggers.length)
            return null;
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
    /**
     * 获取云函数代码下载 链接
     * @param {string} functionName
     * @param {string} [codeSecret]
     * @returns {Promise<IFunctionDownloadUrlRes>}
     * @memberof FunctionService
     */
    async getFunctionDownloadUrl(functionName, codeSecret) {
        const { namespace } = this.getFunctionConfig();
        const params = {
            FunctionName: functionName,
            Namespace: namespace
        };
        if (codeSecret) {
            params.CodeSecret = codeSecret;
        }
        try {
            const { Url, CodeSha256, RequestId } = await this.scfService.request('GetFunctionAddress', params);
            return { Url, RequestId, CodeSha256 };
        }
        catch (e) {
            throw new error_1.CloudBaseError(`[${functionName}] 获取函数代码下载链接失败：\n${e.message}`);
        }
    }
    // 创建文件层版本
    async createLayer(options) {
        const { contentPath = '', name, base64Content = '', runtimes = [], description = '', licenseInfo = '' } = options;
        // checkFullAccess(contentPath)
        const validRuntime = ['Nodejs8.9', 'Php7', 'Java8'];
        if (runtimes.some(item => validRuntime.indexOf(item) === -1)) {
            throw new error_1.CloudBaseError(`Invalid runtime value. Now only support: ${validRuntime.join(', ')}`);
        }
        let base64;
        if (base64Content) {
            base64 = base64Content;
        }
        else if (fs_1.isDirectory(contentPath)) {
            // 压缩文件夹
            const dirName = path_1.default.parse(contentPath).name;
            const dest = path_1.default.join(process.cwd(), `temp-${dirName}.zip`);
            // ZIP 文件存在，删除 ZIP 文件
            if (fs_1.checkPathExist(dest)) {
                fs_1.delSync(dest);
            }
            await utils_1.zipDir({
                dirPath: contentPath,
                outputPath: dest
            });
            // 转换成 base64
            const fileBuffer = await fs_2.default.promises.readFile(dest);
            base64 = fileBuffer.toString('base64');
            fs_1.delSync(dest);
        }
        else {
            const fileType = path_1.default.extname(contentPath);
            if (fileType !== '.zip') {
                throw new error_1.CloudBaseError('文件类型不正确，目前只支持 ZIP 文件！');
            }
            const fileBuffer = await fs_2.default.promises.readFile(contentPath);
            base64 = fileBuffer.toString('base64');
        }
        return this.scfService.request('PublishLayerVersion', {
            LayerName: name,
            CompatibleRuntimes: runtimes,
            Content: {
                // 最大支持 20M
                ZipFile: base64
            },
            Description: description,
            LicenseInfo: licenseInfo
        });
    }
    // 删除文件层版本
    async deleteLayerVersion(options) {
        const { name, version } = options;
        return this.scfService.request('DeleteLayerVersion', {
            LayerName: name,
            LayerVersion: version
        });
    }
    // 获取层版本列表
    async listLayerVersions(options) {
        var _a;
        const { name, runtimes } = options;
        let param = {
            LayerName: name
        };
        if ((_a = runtimes) === null || _a === void 0 ? void 0 : _a.length) {
            const validRuntime = ['Nodejs8.9', 'Php7', 'Java8'];
            if (runtimes.some(item => validRuntime.indexOf(item) === -1)) {
                throw new error_1.CloudBaseError(`Invalid runtime value. Now only support: ${validRuntime.join(', ')}`);
            }
            param.CompatibleRuntime = runtimes;
        }
        return this.scfService.request('ListLayerVersions', param);
    }
    // 获取文件层列表
    async listLayers(options) {
        const { limit = 20, offset = 0, runtime, searchKey } = options;
        let param = {
            Limit: limit,
            Offset: offset,
            SearchKey: searchKey
        };
        if (runtime) {
            const validRuntime = ['Nodejs8.9', 'Php7', 'Java8'];
            if (validRuntime.indexOf(runtime) === -1) {
                throw new error_1.CloudBaseError(`Invalid runtime value. Now only support: ${validRuntime.join(', ')}`);
            }
            param.CompatibleRuntime = runtime;
        }
        return this.scfService.request('ListLayers', param);
    }
    // 获取层版本详细信息
    async getLayerVersion(options) {
        const { name, version } = options;
        return this.scfService.request('GetLayerVersion', {
            LayerName: name,
            LayerVersion: version
        });
    }
    async retryCreateTrigger(name, triggers, count = 0) {
        try {
            await this.createFunctionTriggers(name, triggers);
        }
        catch (e) {
            if (count < 3) {
                await utils_1.sleep(500);
                await this.retryCreateTrigger(name, triggers, count + 1);
            }
            else {
                throw e;
            }
        }
    }
    async retryUpdateFunctionCode(param, count = 0) {
        try {
            return await this.updateFunctionCode(param);
        }
        catch (e) {
            if (count < 3) {
                await utils_1.sleep(500);
                return await this.retryUpdateFunctionCode(param, count + 1);
            }
            else {
                throw e;
            }
        }
    }
    /**
     *
     * @private
     * @returns
     * @memberof FunctionService
     */
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
    async waitFunctionActive(funcName, codeSecret) {
        // 检查函数状态
        let status;
        do {
            const { Status } = await this.getFunctionDetail(funcName, codeSecret);
            await utils_1.sleep(1000);
            status = Status;
        } while (status === constant_1.SCF_STATUS.CREATING || status === constant_1.SCF_STATUS.UPDATING);
    }
}
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "updateFunctionIncrementalCode", null);
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
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "getFunctionDownloadUrl", null);
exports.FunctionService = FunctionService;
