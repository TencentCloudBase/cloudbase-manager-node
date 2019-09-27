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
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const path_1 = __importDefault(require("path"));
const make_dir_1 = __importDefault(require("make-dir"));
const walkdir_1 = __importDefault(require("walkdir"));
const cos_nodejs_sdk_v5_1 = __importDefault(require("cos-nodejs-sdk-v5"));
const utils_1 = require("../utils");
const error_1 = require("../error");
class StorageService {
    constructor(environment) {
        this.environment = environment;
        this.tcbService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
    }
    /**
     * 上传文件
     * @param {string} localPath 本地文件的绝对路径
     * @param {string} cloudPath 云端文件路径，如 img/test.png
     * @returns {Promise<void>}
     */
    async uploadFile(localPath, cloudPath) {
        if (!fs_1.default.existsSync(path_1.default.resolve(localPath))) {
            throw new error_1.CloudBaseError('文件不存在！');
        }
        if (fs_1.default.statSync(localPath).isDirectory()) {
            return;
        }
        const cos = this.getCos();
        const putObject = util_1.default.promisify(cos.putObject).bind(cos);
        const { bucket, region } = this.getStorageConfig();
        // cosFileId 是必须的，否则无法获取下载连接
        const { cosFileId } = await this.getUploadMetadata(cloudPath);
        const res = await putObject({
            Bucket: bucket,
            Region: region,
            Key: cloudPath,
            StorageClass: 'STANDARD',
            Body: fs_1.default.createReadStream(path_1.default.resolve(localPath)),
            'x-cos-meta-fileid': cosFileId
        });
        if (res.statusCode !== 200) {
            throw new error_1.CloudBaseError(`上传文件错误：${JSON.stringify(res)}`);
        }
    }
    /**
     * 上传文件夹
     * @param {string} source 本地文件夹
     * @param {string} cloudDirectory 云端文件夹
     * @returns {Promise<void>}
     */
    async uploadDirectory(source, cloudDirectory) {
        // TODO: 支持忽略文件/文件夹
        // 此处不检查路径是否存在
        // 绝对路径 /var/blog/xxxx
        const localPath = path_1.default.resolve(source);
        const filePaths = await this.walkLocalDir(localPath);
        if (!filePaths || !filePaths.length) {
            return;
        }
        const promises = filePaths
            .filter(filePath => !fs_1.default.statSync(filePath).isDirectory())
            .map(filePath => {
            const fileKeyPath = filePath.replace(localPath, '');
            const cloudPath = path_1.default.join(cloudDirectory, fileKeyPath);
            return this.uploadFile(filePath, cloudPath);
        });
        await Promise.all(promises);
    }
    /**
     * 下载文件
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 文件本地存储路径，文件需指定文件名称
     * @returns {Promise<void>}
     */
    async downloadFile(cloudPath, localPath) {
        const resolveLocalPath = path_1.default.resolve(localPath);
        const fileDir = path_1.default.dirname(localPath);
        if (!fs_1.default.existsSync(fileDir)) {
            throw new error_1.CloudBaseError('路径文件夹不存在');
        }
        const urlList = await this.getTemporaryUrl([cloudPath]);
        const { url } = urlList[0];
        const { proxy } = await this.getAuthConfig();
        const res = await utils_1.fetchStream(url, {}, proxy);
        const dest = fs_1.default.createWriteStream(resolveLocalPath);
        res.body.pipe(dest);
    }
    /**
     * 下载文件夹
     * @param {string} cloudDirectory 云端文件路径
     * @param {string} localPath 本地文件夹存储路径
     * @returns {Promise<void>}
     */
    async downloadDirectory(cloudDirectory, localPath) {
        const resolveLocalPath = path_1.default.resolve(localPath);
        if (!fs_1.default.existsSync(resolveLocalPath)) {
            throw new error_1.CloudBaseError('本地存储路径不存在！');
        }
        const cloudDirectoryKey = this.getCloudKey(cloudDirectory);
        const files = await this.walkCloudDir(cloudDirectoryKey);
        const promises = files.map(async (file) => {
            const fileRelativePath = file.Key.replace(cloudDirectoryKey, '');
            const localFilePath = path_1.default.join(resolveLocalPath, fileRelativePath);
            // 创建文件的父文件夹
            const fileDir = path_1.default.dirname(localFilePath);
            await make_dir_1.default(fileDir);
            await this.downloadFile(file.Key, localFilePath);
        });
        await Promise.all(promises);
    }
    /**
     * 列出文件夹下的文件
     * @link https://cloud.tencent.com/document/product/436/7734
     * @param {string} cloudDirectory 云端文件夹
     * @returns {Promise<ListFileInfo[]>}
     */
    async listDirectoryFiles(cloudDirectory) {
        if (!cloudDirectory) {
            throw new error_1.CloudBaseError('目录不能为空！');
        }
        const key = this.getCloudKey(cloudDirectory);
        const files = await this.walkCloudDir(key);
        return files;
    }
    /**
     * 获取文件临时下载链接
     * @param {((string | ITempUrlInfo)[])} fileList 文件路径或文件信息数组
     * @returns {Promise<{ fileId: string; url: string }[]>}
     */
    async getTemporaryUrl(fileList) {
        if (!fileList || !Array.isArray(fileList)) {
            throw new error_1.CloudBaseError('fileList 必须是非空的数组');
        }
        const files = fileList.map(item => {
            if (typeof item === 'string') {
                return { cloudPath: item, maxAge: 3600 };
            }
            else {
                return item;
            }
        });
        const invalidData = files.find(item => !item.cloudPath || !item.maxAge || typeof item.cloudPath !== 'string');
        if (invalidData) {
            throw new error_1.CloudBaseError(`非法参数：${JSON.stringify(invalidData)}`);
        }
        const data = files.map(item => ({
            fileid: this.cloudPathToFileId(item.cloudPath),
            max_age: item.maxAge
        }));
        const config = this.getAuthConfig();
        const res = await utils_1.cloudBaseRequest({
            config,
            params: {
                file_list: data,
                action: 'storage.batchGetDownloadUrl'
            },
            method: 'POST'
        });
        const downloadList = res.data.download_list.map(item => ({
            url: item.download_url,
            fileId: item.fileid || item.fileID
        }));
        return downloadList;
    }
    /**
     * 删除文件
     * @param {string[]} cloudPathList 云端文件路径数组
     * @returns {Promise<void>}
     */
    async deleteFile(cloudPathList) {
        if (!cloudPathList || !Array.isArray(cloudPathList)) {
            throw new error_1.CloudBaseError('fileList必须是非空的数组');
        }
        const hasInvalidFileId = cloudPathList.some(file => !file || typeof file !== 'string');
        if (hasInvalidFileId) {
            throw new error_1.CloudBaseError('fileList的元素必须是非空的字符串');
        }
        const { bucket, env } = this.getStorageConfig();
        const fileIdList = cloudPathList.map(filePath => this.cloudPathToFileId(filePath));
        const config = this.getAuthConfig();
        const res = await utils_1.cloudBaseRequest({
            config,
            params: {
                action: 'storage.batchDeleteFile',
                fileid_list: fileIdList
            },
            method: 'POST'
        });
        const failedList = res.data.delete_list
            .filter(item => item.code !== 'SUCCESS')
            .map(item => `${item.fileID} : ${item.code}`);
        if (failedList.length) {
            throw new error_1.CloudBaseError(`部分删除文件失败：${JSON.stringify(failedList)}`);
        }
    }
    /**
     * 获取文件信息
     * @param {string} cloudPath 云端文件路径
     * @returns {Promise<FileInfo>}
     */
    async getFileInfo(cloudPath) {
        const cos = this.getCos();
        const headObject = util_1.default.promisify(cos.headObject).bind(cos);
        const { bucket, region } = this.getStorageConfig();
        const { headers } = await headObject({
            Bucket: bucket,
            Region: region,
            Key: cloudPath
        });
        if (!headers) {
            throw new error_1.CloudBaseError(`[${cloudPath}] 获取文件信息失败`);
        }
        // 文件大小 KB
        const size = Number(Number(headers['content-length']) / 1024).toFixed(2);
        return {
            Size: size,
            Type: headers['content-type'],
            Date: headers['date'],
            ETag: headers['etag']
        };
    }
    /**
     * 删除文件夹
     * @param {string} cloudDirectory 云端文件夹
     * @returns {Promise<void>}
     */
    async deleteDirectory(cloudDirectory) {
        const cos = this.getCos();
        const deleteObject = util_1.default.promisify(cos.deleteObject).bind(cos);
        const { bucket, region } = this.getStorageConfig();
        const key = this.getCloudKey(cloudDirectory);
        const files = await this.walkCloudDir(key);
        const promises = files.map(async (file) => await deleteObject({
            Bucket: bucket,
            Region: region,
            Key: file.Key
        }));
        await Promise.all(promises);
    }
    /**
     * 获取文件存储权限
     * READONLY：所有用户可读，仅创建者和管理员可写
     * PRIVATE：仅创建者及管理员可读写
     * ADMINWRITE：所有用户可读，仅管理员可写
     * ADMINONLY：仅管理员可读写
     * @returns
     */
    async getStorageAcl() {
        const { bucket, env } = this.getStorageConfig();
        const res = await this.tcbService.request('DescribeStorageACL', {
            EnvId: env,
            Bucket: bucket
        });
        return res.AclTag;
    }
    /**
     * 设置文件存储权限
     * READONLY：所有用户可读，仅创建者和管理员可写
     * PRIVATE：仅创建者及管理员可读写
     * ADMINWRITE：所有用户可读，仅管理员可写
     * ADMINONLY：仅管理员可读写
     * @param {string} acl
     * @returns
     */
    async setStorageAcl(acl) {
        const validAcl = ['READONLY', 'PRIVATE', 'ADMINWRITE', 'ADMINONLY'];
        if (!validAcl.includes(acl)) {
            throw new error_1.CloudBaseError('非法的权限类型');
        }
        const { bucket, env } = this.getStorageConfig();
        const res = await this.tcbService.request('ModifyStorageACL', {
            EnvId: env,
            Bucket: bucket,
            AclTag: acl
        });
        return res;
    }
    /**
     * 遍历云端文件夹
     * @param {string} prefix
     * @param {string} [marker] 路径开始标志
     * @returns {Promise<IListFileInfo[]>}
     */
    async walkCloudDir(prefix, marker) {
        let fileList = [];
        const cos = this.getCos();
        const getBucket = util_1.default.promisify(cos.getBucket).bind(cos);
        const { bucket, region } = this.getStorageConfig();
        const prefixKey = this.getCloudKey(prefix);
        const res = await getBucket({
            Bucket: bucket,
            Region: region,
            Prefix: prefixKey,
            MaxKeys: 100,
            Marker: marker
        });
        fileList.push(...res.Contents);
        let moreFiles = [];
        if (res.IsTruncated === 'true' || res.IsTruncated === true) {
            moreFiles = await this.walkCloudDir(prefixKey, res.NextMarker);
        }
        fileList.push(...moreFiles);
        return fileList;
    }
    /**
     * 获取文件上传链接属性
     */
    async getUploadMetadata(path) {
        const config = this.getAuthConfig();
        const res = await utils_1.cloudBaseRequest({
            config,
            params: {
                path,
                action: 'storage.getUploadMetadata'
            },
            method: 'POST'
        });
        if (res.code) {
            throw new error_1.CloudBaseError(`${res.code}: ${res.message || ''}`, {
                requestId: res.requestId
            });
        }
        return res.data;
    }
    /**
     * 获取 COS 配置
     */
    getCos() {
        const { secretId, secretKey, token } = this.getAuthConfig();
        if (!token) {
            return new cos_nodejs_sdk_v5_1.default({
                SecretId: secretId,
                SecretKey: secretKey
            });
        }
        return new cos_nodejs_sdk_v5_1.default({
            getAuthorization: function (_, callback) {
                callback({
                    TmpSecretId: secretId,
                    TmpSecretKey: secretKey,
                    XCosSecurityToken: token,
                    ExpiredTime: 3600 * 1000
                });
            }
        });
    }
    /**
     * 获取授权信息
     */
    getAuthConfig() {
        const { secretId, secretKey, token, proxy } = this.environment.cloudBaseContext;
        const envId = this.environment.getEnvId();
        return {
            envId,
            secretId,
            secretKey,
            token,
            proxy
        };
    }
    /**
     * 将 cloudPath 转换成 cloudPath/ 形式
     */
    getCloudKey(cloudPath) {
        return cloudPath[cloudPath.length - 1] === '/' ? cloudPath : `${cloudPath}/`;
    }
    /**
     * 将 cloudPath 转换成 fileId
     */
    cloudPathToFileId(cloudPath) {
        const { env, bucket } = this.getStorageConfig();
        return `cloud://${env}.${bucket}/${cloudPath}`;
    }
    /**
     * 获取存储桶配置
     */
    getStorageConfig() {
        const envConfig = this.environment.lazyEnvironmentConfig;
        const storageConfig = envConfig.Storages && envConfig.Storages[0];
        const { Region, Bucket } = storageConfig;
        return {
            env: envConfig.EnvId,
            region: Region,
            bucket: Bucket
        };
    }
    /**
     * 遍历本地文件夹
     */
    async walkLocalDir(dir) {
        try {
            return walkdir_1.default.async(dir);
        }
        catch (e) {
            throw new error_1.CloudBaseError(e.message);
        }
    }
}
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadFile", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadDirectory", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "downloadFile", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "downloadDirectory", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "listDirectoryFiles", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "getTemporaryUrl", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "deleteFile", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "getFileInfo", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "deleteDirectory", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "getStorageAcl", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "setStorageAcl", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "walkCloudDir", null);
exports.StorageService = StorageService;
