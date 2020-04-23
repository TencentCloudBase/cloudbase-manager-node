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
}
export declare type IHostingOptions = IHostingFileOptions | IHostingFilesOptions;
export interface IHostingCloudOptions {
    cloudPath: string;
    isDir: boolean;
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
export declare class HostingService {
    private environment;
    private tcbService;
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
        requestId: any;
    }>;
    /**
     * 展示文件列表
     */
    listFiles(): Promise<IListFileInfo[]>;
    /**
     * 销毁静态托管服务
     */
    destroyService(): Promise<{
        code: number;
        requestId: any;
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
    deleteFiles(options: IHostingCloudOptions): Promise<void>;
    walkLocalDir(envId: string, dir: string): Promise<string[]>;
    /**
     * 检查 hosting 服务状态
     */
    private checkStatus;
    /**
     * 获取配置
     */
    private getHostingConfig;
}
