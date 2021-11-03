/// <reference types="node" />
import { Environment } from '../environment';
import { IUploadMetadata, IListFileInfo, IFileInfo, ITempUrlInfo, IResponseInfo } from '../interfaces';
export interface IProgressData {
    loaded: number;
    total: number;
    speed: number;
    percent: number;
}
export interface IOptions {
    onProgress?: OnProgress;
    onFileFinish?: OnFileFinish;
    ignore?: string | string[];
    fileId?: boolean;
    parallel?: number;
}
export interface IFileOptions extends IOptions {
    localPath: string;
    cloudPath?: string;
    parallel?: number;
    retryCount?: number;
    retryInterval?: number;
}
export interface IFilesOptions extends IOptions {
    ignore?: string | string[];
    files: {
        localPath: string;
        cloudPath?: string;
    }[];
    retryCount?: number;
    retryInterval?: number;
}
export interface ICustomOptions {
    bucket: string;
    region: string;
}
export interface IWalkCloudDirOptions {
    prefix: string;
    bucket: string;
    region: string;
    marker?: string;
}
export interface IRoutingRules {
    keyPrefixEquals?: string;
    httpErrorCodeReturnedEquals?: string;
    replaceKeyWith?: string;
    replaceKeyPrefixWith?: string;
}
export interface IBucketWebsiteOptions {
    indexDocument: string;
    errorDocument?: string;
    routingRules?: Array<IRoutingRules>;
    region: string;
    bucket: string;
}
export interface IGetBucketOpions {
    bucket?: string;
    region?: string;
    prefix?: string;
    marker?: string;
    maxKeys?: number;
}
export declare type AclType = 'READONLY' | 'PRIVATE' | 'ADMINWRITE' | 'ADMINONLY';
declare type OnProgress = (progressData: IProgressData) => void;
declare type OnFileFinish = (error: Error, res: any, fileData: any) => void;
export declare class StorageService {
    private environment;
    private tcbService;
    constructor(environment: Environment);
    /**
     * 上传文件
     * localPath 为文件夹时，会尝试在文件夹中寻找 cloudPath 中的文件名
     * @param {string} localPath 本地文件的绝对路径
     * @param {string} cloudPath 云端文件路径，如 img/test.png
     * @returns {Promise<any>}
     */
    uploadFile(options: IFileOptions): Promise<any>;
    /**
     * 批量上传文件，默认并发 5
     * @param options
     */
    uploadFiles(options: IFilesOptions): Promise<void>;
    /**
     * 上传文件，支持自定义 Bucket 和 Region
     * @param {string} localPath
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     */
    uploadFileCustom(options: IFileOptions & ICustomOptions): Promise<any>;
    /**
     * 上传文件夹
     * @param {string} localPath 本地文件夹路径
     * @param {string} cloudPath 云端文件夹
     * @param {number} parallel 并发量
     * @param {number} retryCount 重试次数
     * @param {number} retryInterval 重试时间间隔(毫秒)
     * @param {(string | string[])} ignore
     * @param {(string | string[])} ignore
     * @returns {Promise<void>}
     */
    uploadDirectory(options: IFileOptions): Promise<void>;
    /**
     * 上传文件夹，支持自定义 Region 和 Bucket
     * @param {string} localPath
     * @param {string} cloudPath
     * @param {number} parallel
     * @param {number} retryCount
     * @param {number} retryInterval
     * @param {string} bucket
     * @param {string} region
     * @param {IOptions} options
     * @returns {Promise<void>}
     */
    uploadDirectoryCustom(options: IFileOptions & ICustomOptions): Promise<void>;
    /**
     * 批量上传文件
     * @param options
     */
    uploadFilesCustom(options: IFilesOptions & ICustomOptions): Promise<any>;
    /**
     * 创建一个空的文件夹
     * @param {string} cloudPath
     */
    createCloudDirectroy(cloudPath: string): Promise<void>;
    /**
     * 创建一个空的文件夹，支持自定义 Region 和 Bucket
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     */
    createCloudDirectroyCustom(options: ICustomOptions & {
        cloudPath: string;
    }): Promise<void>;
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
    }): Promise<(NodeJS.ReadableStream | string)[]>;
    /**
     * 列出文件夹下的文件
     * @link https://cloud.tencent.com/document/product/436/7734
     * @param {string} cloudPath 云端文件夹，如果为空字符串，则表示根目录
     * @returns {Promise<ListFileInfo[]>}
     */
    listDirectoryFiles(cloudPath: string): Promise<IListFileInfo[]>;
    /**
     * 获取文件临时下载链接
     * @param {((string | ITempUrlInfo)[])} fileList 文件路径或文件信息数组
     * @returns {Promise<{ fileId: string; url: string }[]>}
     */
    getTemporaryUrl(fileList: (string | ITempUrlInfo)[]): Promise<{
        fileId: string;
        url: string;
    }[]>;
    /**
     * 删除文件
     * @param {string[]} cloudPathList 云端文件路径数组
     * @returns {Promise<void>}
     */
    deleteFile(cloudPathList: string[]): Promise<void>;
    /**
     * 删除文件，可以指定 Bucket 和 Region
     * @param {string[]} cloudPathList
     * @param {string} bucket
     * @param {string} region
     * @returns {Promise<void>}
     */
    deleteFileCustom(cloudPathList: string[], bucket: string, region: string): Promise<void>;
    /**
     * 获取文件信息
     * @param {string} cloudPath 云端文件路径
     * @returns {Promise<FileInfo>}
     */
    getFileInfo(cloudPath: string): Promise<IFileInfo>;
    /**
     * 删除文件夹
     * @param {string} cloudPath 云端文件夹路径
     * @returns {Promise<void>}
     */
    deleteDirectory(cloudPath: string): Promise<{
        Deleted: {
            Key: string;
        }[];
        Error: Object[];
    }>;
    /**
     * 删除文件，可以指定 bucket 和 region
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     * @returns {Promise<void>}
     */
    deleteDirectoryCustom(options: {
        cloudPath: string;
    } & ICustomOptions): Promise<{
        Deleted: {
            Key: string;
        }[];
        Error: Object[];
    }>;
    /**
     * 获取文件存储权限
     * READONLY：所有用户可读，仅创建者和管理员可写
     * PRIVATE：仅创建者及管理员可读写
     * ADMINWRITE：所有用户可读，仅管理员可写
     * ADMINONLY：仅管理员可读写
     * @returns
     */
    getStorageAcl(): Promise<AclType>;
    /**
     * 设置文件存储权限
     * READONLY：所有用户可读，仅创建者和管理员可写
     * PRIVATE：仅创建者及管理员可读写
     * ADMINWRITE：所有用户可读，仅管理员可写
     * ADMINONLY：仅管理员可读写
     * @param {string} acl
     * @returns
     */
    setStorageAcl(acl: AclType): Promise<IResponseInfo>;
    /**
     * 遍历云端文件夹
     * @param {string} prefix
     * @param {string} [marker] 路径开始标志
     * @returns {Promise<IListFileInfo[]>}
     */
    walkCloudDir(prefix: string, marker?: string): Promise<IListFileInfo[]>;
    /**
     * 遍历云端文件夹，支持自定义 Bucket 和 Region
     * @param {string} prefix
     * @param {string} [marker]
     * @param {string} bucket
     * @param {string} region
     * @returns {Promise<IListFileInfo[]>}
     */
    walkCloudDirCustom(options: IWalkCloudDirOptions): Promise<IListFileInfo[]>;
    /**
     * 遍历本地文件夹
     * 忽略不包含 dir 路径，即如果 ignore 匹配 dir，dir 也不会被忽略
     * @private
     * @param {string} dir
     * @param {(string | string[])} [ignore]
     * @returns
     */
    walkLocalDir(dir: string, ignore?: string | string[]): Promise<string[]>;
    /**
     * 获取文件上传链接属性
     */
    getUploadMetadata(path: string): Promise<IUploadMetadata>;
    /**
     * 获取静态网站配置
     */
    getWebsiteConfig(options: {
        bucket: string;
        region: string;
    }): Promise<any>;
    /**
     * 配置文档
     */
    putBucketWebsite(options: IBucketWebsiteOptions): Promise<any>;
    /**
     * 查询object列表
     * @param {IGetBucketOpions} options
     * @memberof StorageService
     */
    getBucket(options: IGetBucketOpions): Promise<any>;
    /**
     * 获取 COS 配置
     */
    private getCos;
    /**
     * 将 cloudPath 转换成 cloudPath/ 形式
     */
    private getCloudKey;
    /**
     * 将 cloudPath 转换成 fileId
     */
    private cloudPathToFileId;
    /**
     * 获取存储桶配置
     */
    private getStorageConfig;
    /**
     * 带重试功能的上传多文件函数
     * @param uploadFiles sdk上传函数
     * @param options sdk上传函数参数
     * @param times 重试次数
     * @param interval 重试时间间隔(毫秒)
     * @param failedFiles 失败文件列表
     * @returns
     */
    private uploadFilesWithRetry;
}
export {};
