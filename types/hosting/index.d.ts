import { Environment } from '../environment';
interface IHostingFileOptions {
    localPath: string;
    cloudPath: string;
    onProgress?: (data: any) => void;
    onFileFinish?: (...args: any[]) => void;
}
interface IHostingCloudOptions {
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
    listFiles(): Promise<import("../interfaces").IListFileInfo[]>;
    /**
     * 销毁静态托管服务
     */
    destroyService(): Promise<{
        code: number;
        requestId: any;
    }>;
    /**
     * 上传文件或文件夹
     * @param options
     */
    uploadFiles(options: IHostingFileOptions): Promise<void>;
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
export {};
