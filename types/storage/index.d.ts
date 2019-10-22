import { Environment } from '../environment';
import { IListFileInfo, IFileInfo, ITempUrlInfo, IResponseInfo } from '../interfaces';
declare type AclType = 'READONLY' | 'PRIVATE' | 'ADMINWRITE' | 'ADMINONLY';
export declare class StorageService {
    private environment;
    private tcbService;
    constructor(environment: Environment);
    /**
     * 上传文件
     * localPath 为文件夹时，会尝试在文件夹中寻找 cloudPath 中的文件名
     * @param {string} localPath 本地文件的绝对路径
     * @param {string} cloudPath 云端文件路径，如 img/test.png
     * @returns {Promise<void>}
     */
    uploadFile(localPath: string, cloudPath: string): Promise<void>;
    /**
     * 上传文件夹
     * @param {string} source 本地文件夹
     * @param {string} cloudDirectory 云端文件夹
     * @returns {Promise<void>}
     */
    uploadDirectory(source: string, cloudDirectory: string): Promise<void>;
    /**
     * 下载文件
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 文件本地存储路径，文件需指定文件名称
     * @returns {Promise<void>}
     */
    downloadFile(cloudPath: string, localPath: any): Promise<void>;
    /**
     * 下载文件夹
     * @param {string} cloudDirectory 云端文件路径
     * @param {string} localPath 本地文件夹存储路径
     * @returns {Promise<void>}
     */
    downloadDirectory(cloudDirectory: string, localPath: string): Promise<void>;
    /**
     * 列出文件夹下的文件
     * @link https://cloud.tencent.com/document/product/436/7734
     * @param {string} cloudDirectory 云端文件夹
     * @returns {Promise<ListFileInfo[]>}
     */
    listDirectoryFiles(cloudDirectory: string): Promise<IListFileInfo[]>;
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
     * 获取文件信息
     * @param {string} cloudPath 云端文件路径
     * @returns {Promise<FileInfo>}
     */
    getFileInfo(cloudPath: string): Promise<IFileInfo>;
    /**
     * 删除文件夹
     * @param {string} cloudDirectory 云端文件夹
     * @returns {Promise<void>}
     */
    deleteDirectory(cloudDirectory: string): Promise<void>;
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
     * 获取文件上传链接属性
     */
    private getUploadMetadata;
    /**
     * 获取 COS 配置
     */
    private getCos;
    /**
     * 获取授权信息
     */
    private getAuthConfig;
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
     * 遍历本地文件夹
     */
    private walkLocalDir;
}
export {};
