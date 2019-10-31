import { Environment } from '../environment';
import { IResponseInfo, ICloudFunction, IFunctionLogOptions, ICloudFunctionConfig, ICloudFunctionTrigger, IFunctionInvokeRes, IFunctionLogRes } from '../interfaces';
export declare class FunctionService {
    private environment;
    private vpcService;
    private scfService;
    private tcbRole;
    constructor(environment: Environment);
    /**
     * 创建云函数
     * @param {ICloudFunction} func 云函数信息
     * @param {string} functionRootPath 云函数根目录
     * @param {boolean} [force=false] 是否覆盖同名云函数
     * @param {string} base64Code
     * @returns {Promise<void>}
     */
    createFunction(func: ICloudFunction, functionRootPath: string, force: boolean, base64Code: string): Promise<void>;
    /**
     * 列出函数
     * @param {number} [limit=20]
     * @param {number} [offset=0]
     * @returns {Promise<Record<string, string>[]>}
     */
    listFunction(limit?: number, offset?: number): Promise<Record<string, string>[]>;
    /**
     * 删除云函数
     * @param {string} name 云函数名称
     * @returns {Promise<IResponseInfo>}
     */
    deleteFunction(name: string): Promise<IResponseInfo>;
    /**
     * 获取云函数详细信息
     * @param {string} name 云函数名称
     * @returns {Promise<Record<string, string>>}
     */
    getFunctionDetail(name: string): Promise<Record<string, string>>;
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
    getFunctionLogs(options: IFunctionLogOptions): Promise<IFunctionLogRes>;
    /**
     * 更新云函数配置
     * @param {string} name 云函数名称
     * @param {ICloudFunctionConfig} config 云函数配置
     * @returns {Promise<IResponseInfo>}
     */
    updateFunctionConfig(name: string, config: ICloudFunctionConfig): Promise<IResponseInfo>;
    /**
     * 更新云函数代码
     * functionRootPath 与 base64Code 可任选其中一个
     * @param {ICloudFunction} func 云函数信息
     * @param {string} functionRootPath 云函数的目录路径（可选）
     * @param {string} base64Code 云函数 ZIP 文件的 base64 编码（可选）
     * @returns {Promise<IResponseInfo>}
     */
    updateFunctionCode(func: ICloudFunction, functionRootPath: string, base64Code: string): Promise<IResponseInfo>;
    /**
     * 调用云函数
     * @param {string} name 云函数名称
     * @param {Record<string, any>} params 调用函数传入参数
     * @returns {Promise<IFunctionInvokeRes>}
     */
    invokeFunction(name: string, params: Record<string, any>): Promise<IFunctionInvokeRes>;
    /**
     * 复制云函数
     * @param {string} name 云函数名称
     * @param {string} newFunctionName 新的云函数名称
     * @param {string} targetEnvId 目标环境 Id
     * @param {boolean} [force=false] 是否覆盖同名云函数
     * @returns {Promise<IResponseInfo>}
     */
    copyFunction(name: string, newFunctionName: string, targetEnvId?: string, force?: boolean): Promise<IResponseInfo>;
    /**
     * 创建云函数触发器
     * @param {string} name 云函数名称
     * @param {ICloudFunctionTrigger[]} triggers 云函数触发器配置
     * @returns {Promise<IResponseInfo>}
     */
    createFunctionTriggers(name: string, triggers?: ICloudFunctionTrigger[]): Promise<IResponseInfo>;
    /**
     * 删除云函数触发器
     * @param {string} name 云函数名称
     * @param {string} triggerName 云函数触发器名称
     * @returns {Promise<IResponseInfo>}
     */
    deleteFunctionTrigger(name: string, triggerName: string): Promise<IResponseInfo>;
    private getFunctionConfig;
    /**
     * 获取 vpc 信息
     * @returns
     */
    private getVpcs;
    /**
     * 获取子网
     * @param {string} vpcId
     * @returns
     */
    private getSubnets;
}
