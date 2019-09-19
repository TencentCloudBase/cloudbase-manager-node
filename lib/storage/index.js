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
const node_fetch_1 = __importDefault(require("node-fetch"));
const walkdir_1 = __importDefault(require("walkdir"));
const cos_nodejs_sdk_v5_1 = __importDefault(require("cos-nodejs-sdk-v5"));
const utils_1 = require("../utils");
const error_1 = require("../error");
function preLazy() {
    return function (target, propertyKey, descriptor) {
        let oldValue = descriptor.value;
        descriptor.value = async function () {
            const currentEnvironment = this.environment;
            if (!currentEnvironment.inited) {
                await currentEnvironment.lazyInit();
            }
            let result = await oldValue.apply(this, arguments);
            return result;
        };
    };
}
class StorageService {
    constructor(environment) {
        this.environment = environment;
        this.cloudService = new utils_1.CloudService(environment.cloudBaseContext, 'cos', '2018-11-27');
    }
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
    async downloadFile(cloudPath, localPath) {
        const urlList = await this.getTemporaryUrl([cloudPath]);
        const { url } = urlList[0];
        const res = await node_fetch_1.default(url);
        const dest = fs_1.default.createWriteStream(localPath);
        res.body.pipe(dest);
    }
    async listDirectoryFiles(cloudDirectory, max = 20, marker = '') {
        if (!cloudDirectory) {
            throw new error_1.CloudBaseError('目录不能为空！');
        }
        if (max > 1000) {
            throw new error_1.CloudBaseError('每次最多返回 1000 条数据');
        }
        const cos = this.getCos();
        const getBucket = util_1.default.promisify(cos.getBucket).bind(cos);
        const { bucket, region } = this.getStorageConfig();
        const key = this.getCloudKey(cloudDirectory);
        const res = await getBucket({
            Bucket: bucket,
            Region: region,
            Prefix: key,
            MaxKeys: max,
            Marker: marker
        });
        return res.Contents;
    }
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
        const size = Number(Number(headers['content-length']) / 1024).toFixed(2);
        return {
            Size: size,
            Type: headers['content-type'],
            Date: headers['date'],
            ETag: headers['etag']
        };
    }
    async uploadDirectory(source, cloudDirectory) {
        const localPath = path_1.default.resolve(source);
        const filePaths = await this.walkdir(localPath);
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
    async deleteDirectory(cloudDirectory) {
        const cos = this.getCos();
        const deleteObject = util_1.default.promisify(cos.deleteObject).bind(cos);
        const { bucket, region } = this.getStorageConfig();
        const key = this.getCloudKey(cloudDirectory);
        const files = await this.listDirectoryFiles(key);
        const promises = files.map(async (file) => await deleteObject({
            Bucket: bucket,
            Region: region,
            Key: file.Key
        }));
        await Promise.all(promises);
    }
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
    getAuthConfig() {
        const { secretId, secretKey, token } = this.environment.cloudBaseContext;
        const envId = this.environment.getEnvId();
        return {
            envId,
            secretId,
            secretKey,
            token
        };
    }
    getCloudKey(cloudPath) {
        return cloudPath[cloudPath.length - 1] === '/' ? cloudPath : `${cloudPath}/`;
    }
    cloudPathToFileId(cloudPath) {
        const { env, bucket } = this.getStorageConfig();
        return `cloud://${env}.${bucket}/${cloudPath}`;
    }
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
    async walkdir(dir) {
        try {
            return walkdir_1.default.async(dir);
        }
        catch (e) {
            throw new error_1.CloudBaseError(e.message);
        }
    }
}
__decorate([
    preLazy()
], StorageService.prototype, "uploadFile", null);
__decorate([
    preLazy()
], StorageService.prototype, "downloadFile", null);
__decorate([
    preLazy()
], StorageService.prototype, "listDirectoryFiles", null);
__decorate([
    preLazy()
], StorageService.prototype, "deleteFile", null);
__decorate([
    preLazy()
], StorageService.prototype, "getFileInfo", null);
__decorate([
    preLazy()
], StorageService.prototype, "uploadDirectory", null);
__decorate([
    preLazy()
], StorageService.prototype, "deleteDirectory", null);
exports.StorageService = StorageService;