/// <reference types="node" />
import { Environment } from '../environment';
import { IListFileInfo } from '../interfaces';
export interface IProgressData {
    loaded: number;
    total: number;
    speed: number;
    percent: number;
}
export declare type OnProgress = (progressData: IProgressData) => void;
export declare type OnFileFinish = (error: Error, res: any, fileData: any) => void;
export interface IHostingFileOptions {
    localPath: string;
    cloudPath?: string;
    parallel?: number;
    files?: {
        localPath: string;
        cloudPath: string;
    }[];
    onProgress?: OnProgress;
    onFileFinish?: OnFileFinish;
    ignore?: string | string[];
    retryCount?: number;
    retryInterval?: number;
}
export interface IHostingFilesOptions {
    localPath?: string;
    cloudPath?: string;
    parallel?: number;
    files: {
        localPath: string;
        cloudPath: string;
    }[];
    onProgress?: OnProgress;
    onFileFinish?: OnFileFinish;
    ignore?: string | string[];
    retryCount?: number;
    retryInterval?: number;
}
export declare type IHostingOptions = IHostingFileOptions | IHostingFilesOptions;
export interface IHostingCloudOptions {
    cloudPath: string;
    isDir: boolean;
}
export interface IBindDomainOptions {
    domain: string;
    certId: string;
}
export interface ICheckSourceOptions {
    domains: string[];
}
export interface ITcbOrigin {
    Master: string;
    Slave: string;
}
export interface IIpFilter {
    Switch: string;
    FilterType?: string;
    Filters?: string[];
}
export interface IIpFreqLimit {
    Switch: string;
    Qps?: number;
}
export interface ITcbAuthentication {
    Switch: string;
    SecretKey: string;
    SignParam?: string;
    TimeParam?: string;
    ExpireTime?: string;
}
export interface ITcbCache {
    RuleType: string;
    RuleValue: string;
    CacheTtl: number;
}
export interface ITcbRefererRule {
    RefererType: string;
    Referers: string[];
    AllowEmpty: boolean;
}
export interface ITcbReferer {
    Switch: string;
    RefererRules?: ITcbRefererRule[];
}
export interface ITcbDomainConfig {
    Cache?: ITcbCache[];
    IpFilter?: IIpFilter;
    IpFreqLimit?: IIpFreqLimit;
    Refer?: ITcbReferer;
}
export interface IModifyOptions {
    domain: string;
    domainId: number;
    domainConfig: ITcbDomainConfig;
}
export interface IDeleteDomainOptions {
    domain: string;
}
export interface IDomainInfo {
    Domain: string;
    DomainId: number;
    Status: 'process' | 'online' | 'offline';
    DomainConfig: Record<string, string>;
    CName: String;
}
export interface IHostingInfo {
    EnvId: string;
    CdnDomain: string;
    Bucket: string;
    Regoin: string;
    Status: string;
    MaxDomain: number;
    Id: number;
    PolicyId: number;
}
export interface IRoutingRules {
    keyPrefixEquals?: string;
    httpErrorCodeReturnedEquals?: string;
    replaceKeyWith?: string;
    replaceKeyPrefixWith?: string;
}
export interface IBucketWebsiteOptiosn {
    indexDocument: string;
    errorDocument?: string;
    routingRules?: Array<IRoutingRules>;
}
export interface IFindOptions {
    prefix?: string;
    marker?: string;
    maxKeys?: number;
}
export declare class HostingService {
    private environment;
    private tcbService;
    private cdnService;
    constructor(environment: Environment);
    /**
     * 获取 hosting 信息
     */
    getInfo(): Promise<IHostingInfo[]>;
    /**
     * 开启 hosting 服务，异步任务
     */
    enableService(): Promise<{
        code: number;
        requestId: string;
    }>;
    findFiles(options: IFindOptions): Promise<any>;
    /**
     * 展示文件列表
     */
    listFiles(): Promise<IListFileInfo[]>;
    /**
     * 销毁静态托管服务
     */
    destroyService(): Promise<{
        code: number;
        requestId: string;
    }>;
    /**
     * 支持上传单个文件，文件夹，或多个文件
     * @param options
     */
    uploadFiles(options: IHostingOptions): Promise<any>;
    /**
     * 删除文件或文件夹
     * @param options
     */
    deleteFiles(options: IHostingCloudOptions): Promise<{
        Deleted: {
            Key: string;
        }[];
        Error: Object[];
    } | {
        Deleted: any[];
        Error: any[];
    }>;
    /**
     * 下载文件
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 文件本地存储路径，文件需指定文件名称
     * @returns {Promise<NodeJS.ReadableStream>}
     */
    downloadFile(options: {
        cloudPath: string;
        localPath?: string;
    }): Promise<NodeJS.ReadableStream | string>;
    /**
     * 下载文件夹
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 本地文件夹存储路径
     * @returns {Promise<(NodeJS.ReadableStream | string)[]>}
     */
    downloadDirectory(options: {
        cloudPath: string;
        localPath?: string;
    }): Promise<void>;
    walkLocalDir(envId: string, dir: string): Promise<string[]>;
    /**
     * 绑定自定义域名
     * @param {IBindDomainOptions} options
     * @returns
     * @memberof HostingService
     */
    CreateHostingDomain(options: IBindDomainOptions): Promise<{}>;
    /**
     * 删除托管域名
     *
     * @param {IBindDomainOptions} options
     * @returns
     * @memberof HostingService
     */
    deleteHostingDomain(options: IDeleteDomainOptions): Promise<{
        RequestId: string;
    }>;
    /**
     * 查询域名状态信息
     * @param options
     */
    tcbCheckResource(options: ICheckSourceOptions): Promise<{
        Domains: IDomainInfo[];
        RecordCount: number;
        RequestId: string;
    }>;
    /**
     * 域名配置变更
     * @param options
     */
    tcbModifyAttribute(options: IModifyOptions): Promise<{}>;
    /**
     * 查询静态网站配置
     * @memberof HostingService
     */
    getWebsiteConfig(): Promise<any>;
    /**
     * 配置静态网站文档
     * @param options
     */
    setWebsiteDocument(options: IBucketWebsiteOptiosn): Promise<any>;
    /**
     * 检查 hosting 服务状态
     */
    private checkStatus;
    /**
     * 获取配置
     */
    private getHostingConfig;
    /**
     * 将 cloudPath 转换成 cloudPath/ 形式
     */
    private getCloudKey;
}
