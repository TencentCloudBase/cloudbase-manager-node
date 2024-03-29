import { Environment } from '../environment';
import { IResponseInfo, ICloudFunction, IFunctionLogOptions, ICloudFunctionTrigger, IFunctionInvokeRes, IFunctionLogRes, IFunctionDownloadUrlRes } from '../interfaces';
import { IFunctionInfo } from './types';
export interface IFunctionCode {
    func: ICloudFunction;
    functionRootPath?: string;
    base64Code?: string;
    functionPath?: string;
}
export interface ICreateFunctionParam {
    func: ICloudFunction & {
        path?: string;
    };
    functionRootPath?: string;
    force?: boolean;
    base64Code?: string;
    functionPath?: string;
    codeSecret?: string;
}
export interface IUpdateFunctionCodeParam {
    func: ICloudFunction;
    functionPath?: string;
    functionRootPath?: string;
    base64Code?: string;
    codeSecret?: string;
}
export interface IUpdateFunctionIncrementalCodeParam {
    func: ICloudFunction;
    functionRootPath: string;
    deleteFiles?: Array<string>;
    addFiles?: string;
}
export interface ICreateFunctionRes {
    triggerRes: IResponseInfo;
    configRes: IResponseInfo;
    codeRes: IResponseInfo;
}
export interface IFunctionLayerOptions {
    contentPath?: string;
    base64Content?: string;
    name: string;
    runtimes: string[];
    description?: string;
    licenseInfo?: string;
}
export interface ICreateLayerResponse extends IResponseInfo {
    LayerVersion: number;
}
export interface ILayerOptions {
    name: string;
    version: number;
}
export interface IVersionListOptions {
    name: string;
    runtimes?: string[];
}
export interface ILayerListOptions {
    offset?: number;
    limit?: number;
    runtime?: string;
    searchKey?: string;
}
export interface ILayerVersionInfo {
    CompatibleRuntimes: string[];
    AddTime: string;
    Description: string;
    LicenseInfo: string;
    LayerVersion: number;
    LayerName: string;
    Status: string;
}
export interface IListLayerVersionsRes extends IResponseInfo {
    LayerVersions: Array<ILayerVersionInfo>;
}
export interface IListLayerRes extends IResponseInfo {
    Layers: Array<ILayerVersionInfo>;
    TotalCount: number;
}
export interface IGetLayerVersionRes extends IResponseInfo {
    CompatibleRuntimes: string[];
    CodeSha256: string;
    Location: string;
    AddTime: string;
    Description: string;
    LicenseInfo: string;
    LayerVersion: number;
    LayerName: string;
    Status: string;
}
export interface ISetProvisionedConcurrencyConfig {
    functionName: string;
    qualifier: string;
    versionProvisionedConcurrencyNum: number;
}
export interface IGetProvisionedConcurrencyConfig {
    functionName: string;
    qualifier?: string;
}
export interface IVersionProvisionedConcurrencyInfo {
    AllocatedProvisionedConcurrencyNum: number;
    AvailableProvisionedConcurrencyNum: number;
    Status: string;
    StatusReason: string;
    Qualifier: string;
}
export interface IGetProvisionedConcurrencyRes extends IResponseInfo {
    UnallocatedConcurrencyNum: number;
    Allocated: IVersionProvisionedConcurrencyInfo[];
}
export interface IPublishVersionParams {
    functionName: string;
    description?: string;
}
export interface IPublishVersionRes extends IResponseInfo {
    FunctionVersion: string;
    CodeSize: number;
    MemorySize: number;
    Description: string;
    Handler: string;
    Timeout: number;
    Runtime: string;
    Namespace: string;
}
export interface IListFunctionVersionParams {
    functionName: string;
    offset?: number;
    limit?: number;
    order?: string;
    orderBy?: string;
}
export interface IFunctionVersion {
    Version: string;
    Description: string;
    AddTime: string;
    ModTime: string;
    Status: string;
}
export interface IFunctionVersionsRes extends IResponseInfo {
    FunctionVersion: string[];
    Versions: IFunctionVersion[];
    TotalCount: number;
}
export interface IVersionMatch {
    Version: string;
    Key: string;
    Method: string;
    Expression: string;
}
export interface IVersionWeight {
    Version: string;
    Weight: number;
}
export interface IRoutingConfig {
    AdditionalVersionWeights?: IVersionWeight[];
    AddtionVersionMatchs?: IVersionMatch[];
}
export interface IUpdateFunctionAliasConfig {
    functionName: string;
    name: string;
    functionVersion: string;
    description?: string;
    routingConfig?: IRoutingConfig;
}
export interface IGetFunctionAlias {
    functionName: string;
    name: string;
}
export interface IGetFunctionAliasRes extends IResponseInfo {
    FunctionVersion: string;
    Name: string;
    RoutingConfig: IRoutingConfig;
    Description: string;
    AddTime: string;
    ModTime: string;
}
export declare class FunctionService {
    private environment;
    private vpcService;
    private scfService;
    constructor(environment: Environment);
    /**
     * 增量更新函数代码
     * @param {IUpdateFunctionIncrementalCodeParam} funcParam
     * @returns {Promise<void>}
     * @memberof FunctionService
     */
    updateFunctionIncrementalCode(funcParam: IUpdateFunctionIncrementalCodeParam): Promise<IResponseInfo>;
    /**
     * 创建云函数
     * @param {ICreateFunctionParam} funcParam
     * @returns {(Promise<IResponseInfo | ICreateFunctionRes>)}
     */
    createFunction(funcParam: ICreateFunctionParam): Promise<IResponseInfo | ICreateFunctionRes>;
    /**
     * @param {number} [limit=20]
     * @param {number} [offset=0]
     * @returns {Promise<{
     *         Functions: Record<string, string>[]
     *         RequestId: string
     *         TotalCount: number
     *     }>}
     * @memberof FunctionService
     */
    getFunctionList(limit?: number, offset?: number): Promise<{
        Functions: Record<string, string>[];
        RequestId: string;
        TotalCount: number;
    }>;
    /**
     * 列出函数
     * @param {number} [limit=20]
     * @param {number} [offset=0]
     * @returns {Promise<Record<string, string>[]>}
     */
    listFunctions(limit?: number, offset?: number): Promise<Record<string, string>[]>;
    /**
     * 删除云函数
     * @param {string} name 云函数名称
     * @param {string} qualifier 需要删除的版本号，不填默认删除函数下全部版本。
     * @returns {Promise<IResponseInfo>}
     */
    deleteFunction(name: string, qualifier?: string): Promise<IResponseInfo>;
    /**
     * 获取云函数详细信息
     * @param {string} name 云函数名称
     * @returns {Promise<Record<string, string>>}
     */
    getFunctionDetail(name: string, codeSecret?: string): Promise<IFunctionInfo>;
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
     * @param {ICloudFunction} func 云函数配置
     * @returns {Promise<IResponseInfo>}
     */
    updateFunctionConfig(func: ICloudFunction): Promise<IResponseInfo>;
    /**
     *
     * @param {IUpdateFunctionCodeParam} funcParam
     * @returns {Promise<IResponseInfo>}
     * @memberof FunctionService
     */
    updateFunctionCode(funcParam: IUpdateFunctionCodeParam): Promise<IResponseInfo>;
    /**
     * 调用云函数
     * @param {string} name 云函数名称
     * @param {Record<string, any>} params 调用函数传入参数
     * @returns {Promise<IFunctionInvokeRes>}
     */
    invokeFunction(name: string, params?: Record<string, any>): Promise<IFunctionInvokeRes>;
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
    /**
     * 获取云函数代码下载 链接
     * @param {string} functionName
     * @param {string} [codeSecret]
     * @returns {Promise<IFunctionDownloadUrlRes>}
     * @memberof FunctionService
     */
    getFunctionDownloadUrl(functionName: string, codeSecret?: string): Promise<IFunctionDownloadUrlRes>;
    createLayer(options: IFunctionLayerOptions): Promise<ICreateLayerResponse>;
    deleteLayerVersion(options: ILayerOptions): Promise<IResponseInfo>;
    listLayerVersions(options: IVersionListOptions): Promise<IListLayerVersionsRes>;
    listLayers(options: ILayerListOptions): Promise<IListLayerRes>;
    getLayerVersion(options: ILayerOptions): Promise<IGetLayerVersionRes>;
    /**
     * 设置预置并发
     * @private
     * @param {IProvisionedConcurrencyConfig} concurrencyConfig
     * @returns
     * @memberof FunctionService
     */
    setProvisionedConcurrencyConfig(concurrencyConfig: ISetProvisionedConcurrencyConfig): Promise<IResponseInfo>;
    /**
     * 获取函数预置并发详情
     * @private
     * @param {IGetProvisionedConcurrencyConfig} concurrencyConfig
     * @returns {Promise<IGetProvisionedConcurrencyRes>}
     * @memberof FunctionService
     */
    getProvisionedConcurrencyConfig(concurrencyConfig: IGetProvisionedConcurrencyConfig): Promise<IGetProvisionedConcurrencyRes>;
    /**
     * 删除预置并发
     * @private
     * @param {IGetProvisionedConcurrencyConfig} concurrencyConfig
     * @returns {Promise<IResponseInfo>}
     * @memberof FunctionService
     */
    deleteProvisionedConcurrencyConfig(concurrencyConfig: IGetProvisionedConcurrencyConfig): Promise<IResponseInfo>;
    /**
     * 发布新版本
     * @param {IPublishVersionParams} publishParams
     * @returns {Promise<IPublishVersionRes>}
     * @memberof FunctionService
     */
    publishVersion(publishParams: IPublishVersionParams): Promise<IPublishVersionRes>;
    /**
     * 查询函数版本详情
     * @param {IListFunctionVersionParams} listVersionParams
     * @returns {Promise<IFunctionVersionsRes>}
     * @memberof FunctionService
     */
    listVersionByFunction(listVersionParams: IListFunctionVersionParams): Promise<IFunctionVersionsRes>;
    /**
     *
     * @param {IUpdateFunctionAliasConfig} updateVersionConfigParams
     * @returns {Promise<IResponseInfo>}
     * @memberof FunctionService
     */
    updateFunctionAliasConfig(updateVersionConfigParams: IUpdateFunctionAliasConfig): Promise<IResponseInfo>;
    /**
     * 查询函数别名详情
     * @param {IGetFunctionAlias} params
     * @returns {Promise<IGetFunctionAliasRes>}
     * @memberof FunctionService
     */
    getFunctionAlias(params: IGetFunctionAlias): Promise<IGetFunctionAliasRes>;
    private createAccessPath;
    private getCodeParams;
    private getTempCosInfo;
    private retryCreateTrigger;
    /**
     * 获取函数配置信息
     * @private
     * @returns
     * @memberof FunctionService
     */
    private getFunctionConfig;
    /**
     * 获取日志cls配置信息
     */
    private getClsServiceConfig;
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
    private waitFunctionActive;
}
