import { FunctionPacker, CodeType } from './packer'
import { Environment } from '../environment'
import {
    IResponseInfo,
    ICloudFunction,
    IFunctionLogOptions,
    ICloudFunctionConfig,
    ICloudFunctionTrigger,
    IFunctionInvokeRes,
    IFunctionLogRes,
    IFunctionDownloadUrlRes
} from '../interfaces'
import { CloudBaseError } from '../error'
import { CloudService, preLazy, sleep } from '../utils'
import { SCF_STATUS } from '../constant'

interface ICreateFunctionParam {
    func: ICloudFunction // 云函数信息
    functionRootPath: string // 云函数根目录
    force: boolean // 是否覆盖同名云函数
    base64Code: string
    codeSecret?: string // 代码保护密钥
}

interface IUpdateFunctionCodeParam {
    func: ICloudFunction // 云函数信息
    functionRootPath?: string // 云函数的目录路径（可选） functionRootPath 与 base64Code 可任选其中一个
    base64Code?: string // 云函数 ZIP 文件的 base64 编码（可选）
    codeSecret?: string // 代码保护密钥
}

interface IUpdateFunctionIncrementalCodeParam {
    func: ICloudFunction
    functionRootPath: string // 必选
    deleteFiles?: Array<string> // 要删除的文件和目录列表
    addFiles?: string // 新增或修改的文件路径 （指定单个文件或单个文件夹）
}

export class FunctionService {
    private environment: Environment
    private vpcService: CloudService
    private scfService: CloudService

    private tcbRole: any = {
        Role: 'TCB_QcsRole',
        Stamp: 'MINI_QCBASE'
    }

    constructor(environment: Environment) {
        this.environment = environment
        this.scfService = new CloudService(environment.cloudBaseContext, 'scf', '2018-04-16')
        this.vpcService = new CloudService(environment.cloudBaseContext, 'vpc', '2017-03-12')
    }

    /**
     * 增量更新函数代码
     * @param {IUpdateFunctionIncrementalCodeParam} funcParam
     * @returns {Promise<void>}
     * @memberof FunctionService
     */
    @preLazy()
    public async updateFunctionIncrementalCode(
        funcParam: IUpdateFunctionIncrementalCodeParam
    ): Promise<IResponseInfo> {
        const { namespace } = this.getFunctionConfig()
        const { functionRootPath, func, deleteFiles, addFiles } = funcParam
        const { name, runtime } = func
        const params: any = {
            FunctionName: name,
            Namespace: namespace
        }

        let packer: FunctionPacker
        let base64

        // 校验运行时 待确认 php7 Java8 环境是否支持增量更新
        const validRuntime = ['Nodejs8.9', 'Php7', 'Java8']
        if (func && func.runtime && !validRuntime.includes(func.runtime)) {
            throw new CloudBaseError(
                `${name} Invalid runtime value：${
                    func.runtime
                }. Now only support: ${validRuntime.join(', ')}`
            )
        }

        if (deleteFiles) {
            params.DeleteFiles = deleteFiles
        }

        if (addFiles) {
            // 将选中的增量文件或增量文件夹  转base64
            packer = new FunctionPacker(functionRootPath, name, [], addFiles)
            const type: CodeType = func.runtime === 'Java8' ? CodeType.JavaFile : CodeType.File
            base64 = await packer.build(type)
            if (!base64) {
                throw new CloudBaseError('函数不存在！')
            }

            params.AddFiles = base64
        }

        const res = await this.scfService.request('UpdateFunctionIncrementalCode', params)
        return res
    }

    /**
     *
     * @param {ICreateFunctionParam} funcParam
     * @returns {Promise<void>}
     * @memberof FunctionService
     */
    @preLazy()
    public async createFunction(funcParam: ICreateFunctionParam): Promise<void> {
        // TODO: 优化处理逻辑
        const { namespace } = this.getFunctionConfig()
        const { func, functionRootPath, force = false, base64Code, codeSecret } = funcParam
        let base64
        let packer: FunctionPacker
        const funcName = func.name
        // const { config = {} } = func

        // 校验运行时
        const validRuntime = ['Nodejs8.9', 'Php7', 'Java8']
        if (func && func.runtime && !validRuntime.includes(func.runtime)) {
            throw new CloudBaseError(
                `${funcName} Invalid runtime value：${
                    func.runtime
                }. Now only support: ${validRuntime.join(', ')}`
            )
        }

        let installDependency
        // Node 8.9 默认安装依赖
        installDependency = func.runtime === 'Nodejs8.9' ? 'TRUE' : 'FALSE'
        // 是否安装依赖，选项可以覆盖
        if (typeof func.installDependency !== 'undefined') {
            installDependency = func.installDependency ? 'TRUE' : 'FALSE'
        }

        // CLI 从本地读取
        if (!base64Code) {
            // 云端安装依赖，自动忽略 node_modules 目录
            const ignore =
                installDependency === 'TRUE'
                    ? ['node_modules/**/*', 'node_modules', ...(func.ignore || [])]
                    : [...(func.ignore || [])]
            packer = new FunctionPacker(functionRootPath, funcName, ignore)
            const type: CodeType = func.runtime === 'Java8' ? CodeType.JavaFile : CodeType.File
            base64 = await packer.build(type)

            if (!base64) {
                throw new CloudBaseError('函数不存在！')
            }
        } else {
            base64 = base64Code
        }

        // 转换环境变量
        const envVariables = Object.keys(func.envVariables || {}).map(key => ({
            Key: key,
            Value: func.envVariables[key]
        }))

        const params: any = {
            FunctionName: funcName,
            Namespace: namespace,
            Code: {
                ZipFile: base64
            },
            // 不可选择
            MemorySize: 256,
            Role: 'TCB_QcsRole',
            Stamp: 'MINI_QCBASE'
        }

        // 修复参数存在 undefined 字段时，会出现鉴权失败的情况
        // Environment 为覆盖式修改，不保留已有字段
        envVariables.length && (params.Environment = { Variables: envVariables })
        // 处理入口
        params.Handler = func.handler || 'index.main'
        // 默认超时时间为 20S
        params.Timeout = Number(func.timeout) || 20
        // 默认运行环境 Nodejs8.9
        params.Runtime = func.runtime || 'Nodejs8.9'
        // VPC 网络
        params.VpcConfig = {
            SubnetId: (func.vpc && func.vpc.subnetId) || '',
            VpcId: (func.vpc && func.vpc.vpcId) || ''
        }
        // 自动安装依赖
        params.InstallDependency = installDependency

        // 代码保护
        if (codeSecret) {
            params.CodeSecret = codeSecret
        }

        try {
            // 创建云函数
            await this.scfService.request('CreateFunction', params)
            // 创建函数触发器
            await this.createFunctionTriggers(funcName, func.triggers)

            // 如果选择自动安装依赖，且等待依赖安装
            if (params.InstallDependency && func.isWaitInstall === true) {
                await this.waitFunctionActive(funcName)
            }
        } catch (e) {
            // 已存在同名函数，强制更新
            if (e.code === 'ResourceInUse.FunctionName' && force) {
                // 创建函数触发器
                await this.createFunctionTriggers(funcName, func.triggers)
                // 更新函数配置和代码
                await this.updateFunctionConfig(func)
                // 更新函数代码
                await this.updateFunctionCode({
                    func,
                    functionRootPath,
                    base64Code: base64,
                    codeSecret: codeSecret
                })
                return
            }

            // 不强制覆盖，抛出错误
            if (e.message && !force) {
                throw new CloudBaseError(`[${funcName}] 部署失败：\n${e.message}`, {
                    code: e.code
                })
            }
        }
    }

    /**
     * 列出函数
     * @param {number} [limit=20]
     * @param {number} [offset=0]
     * @returns {Promise<Record<string, string>[]>}
     */
    @preLazy()
    async listFunctions(limit = 20, offset = 0): Promise<Record<string, string>[]> {
        // 获取Function 环境配置
        const { namespace } = this.getFunctionConfig()

        const res: any = await this.scfService.request('ListFunctions', {
            Namespace: namespace,
            Limit: limit,
            Offset: offset
        })
        const { Functions = [] } = res
        const data: Record<string, string>[] = []
        Functions.forEach(func => {
            const { FunctionId, FunctionName, Runtime, AddTime, ModTime, Status } = func
            data.push({
                FunctionId,
                FunctionName,
                Runtime,
                AddTime,
                ModTime,
                Status
            })
        })

        return data
    }

    /**
     * 删除云函数
     * @param {string} name 云函数名称
     * @returns {Promise<IResponseInfo>}
     */
    @preLazy()
    async deleteFunction(name: string): Promise<IResponseInfo> {
        const { namespace } = this.getFunctionConfig()
        return this.scfService.request('DeleteFunction', {
            FunctionName: name,
            Namespace: namespace
        })
    }

    /**
     * 获取云函数详细信息
     * @param {string} name 云函数名称
     * @returns {Promise<Record<string, string>>}
     */
    @preLazy()
    async getFunctionDetail(name: string, codeSecret?: string): Promise<Record<string, string>> {
        const { namespace } = this.getFunctionConfig()

        const params: any = {
            FunctionName: name,
            Namespace: namespace,
            ShowCode: 'TRUE'
        }

        if (codeSecret) {
            params.CodeSecret = codeSecret
        }

        const res = await this.scfService.request('GetFunction', params)

        const data: Record<string, any> = {}
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
        ]

        // 响应字段为 Duration 首字母大写形式，将字段转换成驼峰命名
        Object.keys(res).forEach(key => {
            if (!validKeys.includes(key)) return
            data[key] = res[key]
        })

        const { VpcId = '', SubnetId = '' } = data.VpcConfig || {}

        if (VpcId && SubnetId) {
            try {
                const vpcs = await this.getVpcs()
                const subnets = await this.getSubnets(VpcId)
                const vpc = vpcs.find(item => item.VpcId === VpcId)
                const subnet = subnets.find(item => item.SubnetId === SubnetId)
                data.VpcConfig = {
                    vpc,
                    subnet
                }
            } catch (e) {
                data.VPC = {
                    vpc: '',
                    subnet: ''
                }
            }
        }

        return data
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
    @preLazy()
    async getFunctionLogs(options: IFunctionLogOptions): Promise<IFunctionLogRes> {
        const {
            name,
            offset = 0,
            limit = 10,
            order,
            orderBy,
            startTime,
            endTime,
            requestId
        } = options
        const { namespace } = this.getFunctionConfig()

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
        }

        const res: IFunctionLogRes = await this.scfService.request('GetFunctionLogs', params)
        return res
    }

    /**
     * 更新云函数配置
     * @param {ICloudFunction} func 云函数配置
     * @returns {Promise<IResponseInfo>}
     */
    @preLazy()
    async updateFunctionConfig(func: ICloudFunction): Promise<IResponseInfo> {
        const { namespace } = this.getFunctionConfig()

        const envVariables = Object.keys(func.envVariables || {}).map(key => ({
            Key: key,
            Value: func.envVariables[key]
        }))

        const params: any = {
            FunctionName: func.name,
            Namespace: namespace
        }

        // 修复参数存在 undefined 字段时，会出现鉴权失败的情况
        // Environment 为覆盖式修改，不保留已有字段
        envVariables.length && (params.Environment = { Variables: envVariables })
        // 不设默认超时时间，防止覆盖已有配置
        func.timeout && (params.Timeout = func.timeout)
        // 运行时
        func.runtime && (params.Runtime = func.runtime)
        // VPC 网络
        params.VpcConfig = {
            SubnetId: (func.vpc && func.vpc.subnetId) || '',
            VpcId: (func.vpc && func.vpc.vpcId) || ''
        }
        // Node 8.9 默认安装依赖
        func.runtime === 'Nodejs8.9' && (params.InstallDependency = 'TRUE')
        // 是否安装依赖，选项可以覆盖
        if (typeof func.installDependency !== 'undefined') {
            params.InstallDependency = func.installDependency ? 'TRUE' : 'FALSE'
        }

        return this.scfService.request('UpdateFunctionConfiguration', params)
    }

    /**
     *
     * @param {IUpdateFunctionCodeParam} funcParam
     * @returns {Promise<IResponseInfo>}
     * @memberof FunctionService
     */
    @preLazy()
    async updateFunctionCode(funcParam: IUpdateFunctionCodeParam): Promise<IResponseInfo> {
        let base64
        let packer
        const { func, functionRootPath, base64Code, codeSecret } = funcParam
        const funcName = func.name
        // const { config = {} } = func

        const { namespace } = this.getFunctionConfig()

        // 校验运行时
        const validRuntime = ['Nodejs8.9']
        if (func && func.runtime && !validRuntime.includes(func.runtime)) {
            throw new CloudBaseError(
                `${funcName} 非法的运行环境：${func.runtime}，当前支持环境：${validRuntime.join(
                    ', '
                )}`
            )
        }

        let installDependency
        // Node 8.9 默认安装依赖
        installDependency = func.runtime === 'Nodejs8.9' ? 'TRUE' : 'FALSE'
        // 是否安装依赖，选项可以覆盖
        if (typeof func.installDependency !== 'undefined') {
            installDependency = func.installDependency ? 'TRUE' : 'FALSE'
        }

        // CLI 从本地读取
        if (!base64Code) {
            const ignore =
                installDependency === 'TRUE'
                    ? ['node_modules/**/*', 'node_modules', ...(func.ignore || [])]
                    : [...(func.ignore || [])]
            packer = new FunctionPacker(functionRootPath, funcName, ignore)
            const type: CodeType = func.runtime === 'Java8' ? CodeType.JavaFile : CodeType.File
            base64 = await packer.build(type)

            if (!base64) {
                throw new CloudBaseError('函数不存在！')
            }
        } else {
            base64 = base64Code
        }

        const params: any = {
            FunctionName: funcName,
            Namespace: namespace,
            ZipFile: base64,
            Handler: func.handler || 'index.main'
        }

        if (codeSecret) {
            params.CodeSecret = codeSecret
        }

        try {
            // 更新云函数代码
            const res = await this.scfService.request('UpdateFunctionCode', params)
            if (installDependency && func.isWaitInstall === true) {
                await this.waitFunctionActive(funcName)
            }
            return res
        } catch (e) {
            throw new CloudBaseError(`[${funcName}] 函数代码更新失败： ${e.message}`, {
                code: e.code
            })
        }
    }

    /**
     * 调用云函数
     * @param {string} name 云函数名称
     * @param {Record<string, any>} params 调用函数传入参数
     * @returns {Promise<IFunctionInvokeRes>}
     */
    @preLazy()
    async invokeFunction(name: string, params: Record<string, any>): Promise<IFunctionInvokeRes> {
        const { namespace } = this.getFunctionConfig()

        const _params = {
            FunctionName: name,
            Namespace: namespace,
            ClientContext: JSON.stringify(params),
            LogType: 'Tail'
        }

        try {
            const { RequestId, Result } = await this.scfService.request('Invoke', _params)
            return {
                RequestId,
                ...Result
            }
        } catch (e) {
            throw new CloudBaseError(`[${name}] 调用失败：\n${e.message}`)
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
    @preLazy()
    async copyFunction(
        name: string,
        newFunctionName: string,
        targetEnvId?: string,
        force = false
    ): Promise<IResponseInfo> {
        const { namespace } = this.getFunctionConfig()

        if (!namespace || !name || !newFunctionName) {
            throw new CloudBaseError('参数缺失')
        }

        return this.scfService.request('CopyFunction', {
            FunctionName: name,
            NewFunctionName: newFunctionName,
            Namespace: namespace,
            TargetNamespace: targetEnvId || namespace,
            Override: force ? true : false
        })
    }

    /**
     * 创建云函数触发器
     * @param {string} name 云函数名称
     * @param {ICloudFunctionTrigger[]} triggers 云函数触发器配置
     * @returns {Promise<IResponseInfo>}
     */
    @preLazy()
    async createFunctionTriggers(
        name: string,
        triggers: ICloudFunctionTrigger[] = []
    ): Promise<IResponseInfo> {
        if (!triggers || !triggers.length) return null
        const { namespace } = this.getFunctionConfig()

        const parsedTriggers = triggers.map(item => {
            if (item.type !== 'timer') {
                throw new CloudBaseError(
                    `不支持的触发器类型 [${item.type}]，目前仅支持定时触发器（timer）！`
                )
            }
            return {
                TriggerName: item.name,
                Type: item.type,
                TriggerDesc: item.config
            }
        })

        return this.scfService.request('BatchCreateTrigger', {
            FunctionName: name,
            Namespace: namespace,
            Triggers: JSON.stringify(parsedTriggers),
            Count: parsedTriggers.length
        })
    }

    /**
     * 删除云函数触发器
     * @param {string} name 云函数名称
     * @param {string} triggerName 云函数触发器名称
     * @returns {Promise<IResponseInfo>}
     */
    @preLazy()
    async deleteFunctionTrigger(name: string, triggerName: string): Promise<IResponseInfo> {
        const { namespace } = this.getFunctionConfig()

        return this.scfService.request('DeleteTrigger', {
            FunctionName: name,
            Namespace: namespace,
            TriggerName: triggerName,
            Type: 'timer'
        })
    }

    /**
     * 获取云函数代码下载 链接
     * @param {string} functionName
     * @param {string} [codeSecret]
     * @returns {Promise<IFunctionDownloadUrlRes>}
     * @memberof FunctionService
     */
    @preLazy()
    public async getFunctionDownloadUrl(
        functionName: string,
        codeSecret?: string
    ): Promise<IFunctionDownloadUrlRes> {
        const { namespace } = this.getFunctionConfig()

        const params: any = {
            FunctionName: functionName,
            Namespace: namespace
        }

        if (codeSecret) {
            params.CodeSecret = codeSecret
        }

        try {
            const { Url, CodeSha256, RequestId } = await this.scfService.request(
                'GetFunctionAddress',
                params
            )
            return { Url, RequestId, CodeSha256 }
        } catch (e) {
            throw new CloudBaseError(`[${functionName}] 获取函数代码下载链接失败：\n${e.message}`)
        }
    }

    /**
     *
     * @private
     * @returns
     * @memberof FunctionService
     */
    private getFunctionConfig() {
        const envConfig = this.environment.lazyEnvironmentConfig
        const namespace = envConfig.Functions[0].Namespace

        return {
            namespace,
            env: envConfig.EnvId
        }
    }

    /**
     * 获取 vpc 信息
     * @returns
     */
    private async getVpcs() {
        const { VpcSet } = await this.vpcService.request('DescribeVpcs')
        return VpcSet
    }

    /**
     * 获取子网
     * @param {string} vpcId
     * @returns
     */
    private async getSubnets(vpcId: string) {
        const { SubnetSet } = await this.vpcService.request('DescribeSubnets', {
            Filters: [
                {
                    Name: 'vpc-id',
                    Values: [vpcId]
                }
            ]
        })
        return SubnetSet
    }

    private async waitFunctionActive(funcName: string) {
        // 检查函数状态
        let status
        do {
            const { Status } = await this.getFunctionDetail(funcName)
            await sleep(1000)
            status = Status
        } while (status === SCF_STATUS.CREATING || status === SCF_STATUS.UPDATING)
    }
}
