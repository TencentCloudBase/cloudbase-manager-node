import { Environment } from '../environment';
import { IListFileInfo, IFileInfo, ITempUrlInfo } from '../interfaces';
export declare class StorageService {
    private environment;
    private cloudService;
    constructor(environment: Environment);
    uploadFile(localPath: string, cloudPath: string): Promise<void>;
    uploadDirectory(source: string, cloudDirectory: string): Promise<void>;
    downloadFile(cloudPath: string, localPath: any): Promise<void>;
    downloadDirectory(cloudDirectory: string, localPath: string): Promise<void>;
    listDirectoryFiles(cloudDirectory: string, max?: number, marker?: string): Promise<IListFileInfo[]>;
    getTemporaryUrl(fileList: (string | ITempUrlInfo)[]): Promise<{
        fileId: string;
        url: string;
    }[]>;
    deleteFile(cloudPathList: string[]): Promise<void>;
    getFileInfo(cloudPath: string): Promise<IFileInfo>;
    deleteDirectory(cloudDirectory: string): Promise<void>;
    private getUploadMetadata;
    private getCos;
    private getAuthConfig;
    private getCloudKey;
    private cloudPathToFileId;
    private getStorageConfig;
    private walkdir;
}
