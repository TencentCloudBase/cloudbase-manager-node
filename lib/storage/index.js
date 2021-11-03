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
exports.StorageService = void 0;
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const path_1 = __importDefault(require("path"));
const make_dir_1 = __importDefault(require("make-dir"));
const walkdir_1 = __importDefault(require("walkdir"));
const micromatch_1 = __importDefault(require("micromatch"));
const cos_nodejs_sdk_v5_1 = __importDefault(require("cos-nodejs-sdk-v5"));
const utils_1 = require("../utils");
const error_1 = require("../error");
const parallel_1 = require("../utils/parallel");
const BIG_FILE_SIZE = 5242880; // 5MB 1024*1024*5
class StorageService {
    constructor(environment) {
        this.environment = environment;
        this.tcbService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
    }
    /**
     * 上传文件
     * localPath 为文件夹时，会尝试在文件夹中寻找 cloudPath 中的文件名
     * @param {string} localPath 本地文件的绝对路径
     * @param {string} cloudPath 云端文件路径，如 img/test.png
     * @returns {Promise<any>}
     */
    async uploadFile(options) {
        const { localPath, cloudPath = '', onProgress } = options;
        const { bucket, region } = this.getStorageConfig();
        return this.uploadFileCustom({
            localPath,
            cloudPath,
            bucket,
            region,
            onProgress
        });
    }
    /**
     * 批量上传文件，默认并发 5
     * @param options
     */
    async uploadFiles(options) {
        const { files, onProgress, parallel, onFileFinish, ignore, retryCount, retryInterval } = options;
        const { bucket, region } = this.getStorageConfig();
        return this.uploadFilesCustom({
            files,
            bucket,
            region,
            ignore,
            parallel,
            onProgress,
            onFileFinish,
            retryCount,
            retryInterval
        });
    }
    /**
     * 上传文件，支持自定义 Bucket 和 Region
     * @param {string} localPath
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     */
    async uploadFileCustom(options) {
        const { localPath, cloudPath, bucket, region, onProgress, fileId = true } = options;
        let localFilePath = '';
        let resolveLocalPath = path_1.default.resolve(localPath);
        utils_1.checkFullAccess(resolveLocalPath, true);
        // 如果 localPath 是一个文件夹，尝试在文件下寻找 cloudPath 中的文件
        const fileStats = fs_1.default.statSync(resolveLocalPath);
        if (fileStats.isDirectory()) {
            const fileName = path_1.default.parse(cloudPath).base;
            const attemptFilePath = path_1.default.join(localPath, fileName);
            if (utils_1.checkFullAccess(attemptFilePath)) {
                localFilePath = path_1.default.resolve(attemptFilePath);
            }
        }
        else {
            localFilePath = resolveLocalPath;
        }
        if (!localFilePath) {
            throw new error_1.CloudBaseError('本地文件不存在！');
        }
        const cos = this.getCos();
        const putObject = util_1.default.promisify(cos.putObject).bind(cos);
        const sliceUploadFile = util_1.default.promisify(cos.sliceUploadFile).bind(cos);
        let cosFileId;
        // 针对静态托管，fileId 不是必须的
        if (fileId) {
            // 针对文件存储，cosFileId 是必须的，区分上传人员，否则无法获取下载连接
            const res = await this.getUploadMetadata(cloudPath);
            cosFileId = res.cosFileId;
        }
        let res;
        // 小文件，直接上传
        if (fileStats.size < BIG_FILE_SIZE) {
            res = await putObject({
                onProgress,
                Bucket: bucket,
                Region: region,
                Key: cloudPath,
                StorageClass: 'STANDARD',
                ContentLength: fileStats.size,
                Body: fs_1.default.createReadStream(localFilePath),
                'x-cos-meta-fileid': cosFileId
            });
        }
        else {
            // 大文件，分块上传
            res = await sliceUploadFile({
                Bucket: bucket,
                Region: region,
                Key: cloudPath,
                FilePath: localFilePath,
                StorageClass: 'STANDARD',
                AsyncLimit: 3,
                onProgress,
                'x-cos-meta-fileid': cosFileId
            });
        }
        if (res.statusCode !== 200) {
            throw new error_1.CloudBaseError(`上传文件错误：${JSON.stringify(res)}`);
        }
        return res;
    }
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
    async uploadDirectory(options) {
        const { localPath, cloudPath = '', ignore, onProgress, onFileFinish, parallel, retryCount, retryInterval } = options;
        // 此处不检查路径是否存在
        // 绝对路径 /var/blog/xxxx
        const { bucket, region } = this.getStorageConfig();
        return this.uploadDirectoryCustom({
            localPath,
            cloudPath,
            parallel,
            retryCount,
            retryInterval,
            bucket,
            region,
            ignore,
            onProgress,
            onFileFinish
        });
    }
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
    async uploadDirectoryCustom(options) {
        const { localPath, cloudPath, bucket, region, onProgress, onFileFinish, ignore, fileId = true, parallel = 20, retryCount = 0, retryInterval = 500 } = options;
        // 此处不检查路径是否存在
        // 绝对路径 /var/blog/xxxx
        const resolvePath = path_1.default.resolve(localPath);
        // 在路径结尾加上 '/'
        const resolveLocalPath = path_1.default.join(resolvePath, path_1.default.sep);
        const filePaths = await this.walkLocalDir(resolveLocalPath, ignore);
        if (!filePaths || !filePaths.length) {
            return;
        }
        const fileStatsList = filePaths.map(filePath => {
            // 处理 windows 路径
            const fileKeyPath = filePath.replace(resolveLocalPath, '').replace(/\\/g, '/');
            // 解析 cloudPath
            let cloudFileKey = path_1.default.join(cloudPath, fileKeyPath).replace(/\\/g, '/');
            if (utils_1.isDirectory(filePath)) {
                cloudFileKey = this.getCloudKey(cloudFileKey);
                return {
                    filePath,
                    cloudFileKey,
                    isDir: true
                };
            }
            else {
                return {
                    filePath,
                    cloudFileKey,
                    isDir: false
                };
            }
        });
        // 创建目录请求
        const creatingDirController = new parallel_1.AsyncTaskParallelController(parallel, 50);
        const creatingDirTasks = fileStatsList
            .filter(info => info.isDir)
            .map(info => () => this.createCloudDirectroyCustom({
            cloudPath: info.cloudFileKey,
            bucket,
            region
        }));
        creatingDirController.loadTasks(creatingDirTasks);
        await creatingDirController.run();
        // 上传文件对象
        const tasks = fileStatsList
            .filter(stats => !stats.isDir)
            .map(stats => async () => {
            let cosFileId;
            if (fileId) {
                const res = await this.getUploadMetadata(stats.cloudFileKey);
                cosFileId = res.cosFileId;
            }
            return {
                Bucket: bucket,
                Region: region,
                Key: stats.cloudFileKey,
                FilePath: stats.filePath,
                'x-cos-meta-fileid': cosFileId
            };
        });
        // 控制请求并发
        const getMetadataController = new parallel_1.AsyncTaskParallelController(parallel, 50);
        getMetadataController.loadTasks(tasks);
        const files = await getMetadataController.run();
        // 对文件上传进行处理
        const cos = this.getCos(parallel);
        const uploadFiles = util_1.default.promisify(cos.uploadFiles).bind(cos);
        const params = {
            files,
            SliceSize: BIG_FILE_SIZE,
            onProgress,
            onFileFinish
        };
        return this.uploadFilesWithRetry({
            uploadFiles,
            options: params,
            times: retryCount,
            interval: retryInterval,
            failedFiles: []
        });
    }
    /**
     * 批量上传文件
     * @param options
     */
    async uploadFilesCustom(options) {
        const { files, bucket, region, ignore, onProgress, onFileFinish, fileId = true, parallel = 20, retryCount = 0, retryInterval = 500 } = options;
        if (!files || !files.length) {
            return;
        }
        let fileList = files
            .map(item => {
            const { localPath, cloudPath } = item;
            return {
                filePath: localPath,
                cloudFileKey: cloudPath
            };
        })
            .filter(item => ((ignore === null || ignore === void 0 ? void 0 : ignore.length) ? !micromatch_1.default.isMatch(item.filePath, ignore) : true));
        // 生成上传文件属性
        const tasks = fileList.map(stats => async () => {
            let cosFileId;
            if (fileId) {
                const res = await this.getUploadMetadata(stats.cloudFileKey);
                cosFileId = res.cosFileId;
            }
            return {
                Bucket: bucket,
                Region: region,
                Key: stats.cloudFileKey,
                FilePath: stats.filePath,
                'x-cos-meta-fileid': cosFileId
            };
        });
        // 控制请求并发
        const asyncTaskController = new parallel_1.AsyncTaskParallelController(parallel, 50);
        asyncTaskController.loadTasks(tasks);
        fileList = await asyncTaskController.run();
        const cos = this.getCos(parallel);
        const uploadFiles = util_1.default.promisify(cos.uploadFiles).bind(cos);
        const params = {
            files: fileList,
            SliceSize: BIG_FILE_SIZE,
            onProgress,
            onFileFinish
        };
        // return uploadFiles({
        //     onProgress,
        //     onFileFinish,
        //     files: fileList,
        //     SliceSize: BIG_FILE_SIZE
        // })
        return this.uploadFilesWithRetry({
            uploadFiles,
            options: params,
            times: retryCount,
            interval: retryInterval,
            failedFiles: []
        });
    }
    /**
     * 创建一个空的文件夹
     * @param {string} cloudPath
     */
    async createCloudDirectroy(cloudPath) {
        const { bucket, region } = this.getStorageConfig();
        await this.createCloudDirectroyCustom({
            cloudPath,
            bucket,
            region
        });
    }
    /**
     * 创建一个空的文件夹，支持自定义 Region 和 Bucket
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     */
    async createCloudDirectroyCustom(options) {
        const { cloudPath, bucket, region } = options;
        const cos = this.getCos();
        const putObject = util_1.default.promisify(cos.putObject).bind(cos);
        const dirKey = this.getCloudKey(cloudPath);
        const res = await putObject({
            Bucket: bucket,
            Region: region,
            Key: dirKey,
            Body: ''
        });
        if (res.statusCode !== 200) {
            throw new error_1.CloudBaseError(`创建文件夹失败：${JSON.stringify(res)}`);
        }
    }
    /**
     * 下载文件
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 文件本地存储路径，文件需指定文件名称
     * @returns {Promise<NodeJS.ReadableStream>}
     */
    async downloadFile(options) {
        const { cloudPath, localPath } = options;
        const resolveLocalPath = path_1.default.resolve(localPath);
        const fileDir = path_1.default.dirname(localPath);
        utils_1.checkFullAccess(fileDir, true);
        const urlList = await this.getTemporaryUrl([cloudPath]);
        const { url } = urlList[0];
        const { proxy } = await this.environment.getAuthConfig();
        const res = await utils_1.fetchStream(url, {}, proxy);
        // localPath 不存在时，返回 ReadableStream
        if (!localPath) {
            return res.body;
        }
        const dest = fs_1.default.createWriteStream(resolveLocalPath);
        res.body.pipe(dest);
        // 写完成后返回
        return new Promise(resolve => {
            dest.on('close', () => {
                // 返回文件地址
                resolve(resolveLocalPath);
            });
        });
    }
    /**
     * 下载文件夹
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 本地文件夹存储路径
     * @returns {Promise<(NodeJS.ReadableStream | string)[]>}
     */
    async downloadDirectory(options) {
        const { cloudPath, localPath } = options;
        const resolveLocalPath = path_1.default.resolve(localPath);
        utils_1.checkFullAccess(resolveLocalPath, true);
        const cloudDirectoryKey = this.getCloudKey(cloudPath);
        const files = await this.walkCloudDir(cloudDirectoryKey);
        const promises = files.map(async (file) => {
            const fileRelativePath = file.Key.replace(cloudDirectoryKey, '');
            // 空路径和文件夹跳过
            if (!fileRelativePath || /\/$/g.test(fileRelativePath)) {
                return;
            }
            const localFilePath = path_1.default.join(resolveLocalPath, fileRelativePath);
            // 创建文件的父文件夹
            const fileDir = path_1.default.dirname(localFilePath);
            await make_dir_1.default(fileDir);
            return this.downloadFile({
                cloudPath: file.Key,
                localPath: localFilePath
            });
        });
        return Promise.all(promises);
    }
    /**
     * 列出文件夹下的文件
     * @link https://cloud.tencent.com/document/product/436/7734
     * @param {string} cloudPath 云端文件夹，如果为空字符串，则表示根目录
     * @returns {Promise<ListFileInfo[]>}
     */
    async listDirectoryFiles(cloudPath) {
        return this.walkCloudDir(cloudPath);
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
        const notExistsFiles = [];
        const checkFileRequests = files.map(file => (async () => {
            try {
                await this.getFileInfo(file.cloudPath);
            }
            catch (e) {
                if (e.statusCode === 404) {
                    notExistsFiles.push(file.cloudPath);
                }
            }
        })());
        await Promise.all(checkFileRequests);
        // 文件路径不存在
        if (notExistsFiles.length) {
            throw new error_1.CloudBaseError(`以下文件不存在：${notExistsFiles.join(', ')}`);
        }
        const data = files.map(item => ({
            fileid: this.cloudPathToFileId(item.cloudPath),
            max_age: item.maxAge
        }));
        const config = this.environment.getAuthConfig();
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
        const config = this.environment.getAuthConfig();
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
     * 删除文件，可以指定 Bucket 和 Region
     * @param {string[]} cloudPathList
     * @param {string} bucket
     * @param {string} region
     * @returns {Promise<void>}
     */
    async deleteFileCustom(cloudPathList, bucket, region) {
        if (!cloudPathList || !Array.isArray(cloudPathList)) {
            throw new error_1.CloudBaseError('fileList必须是非空的数组');
        }
        const hasInvalidFileId = cloudPathList.some(file => !file || typeof file !== 'string');
        if (hasInvalidFileId) {
            throw new error_1.CloudBaseError('fileList的元素必须是非空的字符串');
        }
        const cos = this.getCos();
        const deleteObject = util_1.default.promisify(cos.deleteObject).bind(cos);
        const promises = cloudPathList.map(async (file) => deleteObject({
            Bucket: bucket,
            Region: region,
            Key: file
        }));
        await Promise.all(promises);
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
     * @param {string} cloudPath 云端文件夹路径
     * @returns {Promise<void>}
     */
    async deleteDirectory(cloudPath) {
        const { bucket, region } = this.getStorageConfig();
        return this.deleteDirectoryCustom({
            cloudPath,
            bucket,
            region
        });
    }
    /**
     * 删除文件，可以指定 bucket 和 region
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     * @returns {Promise<void>}
     */
    async deleteDirectoryCustom(options) {
        const { cloudPath, bucket, region } = options;
        const key = this.getCloudKey(cloudPath);
        const cos = this.getCos();
        const deleteMultipleObject = util_1.default.promisify(cos.deleteMultipleObject).bind(cos);
        // 遍历获取全部文件
        const files = await this.walkCloudDirCustom({
            bucket,
            region,
            prefix: key
        });
        // 文件为空时，不能调用删除接口
        if (!files.length) {
            return {
                Deleted: [],
                Error: []
            };
        }
        // COS 接口最大一次删除 1000 个 Key
        // 将数组切分为 500 个文件一组
        const sliceGroup = [];
        const total = Math.ceil(files.length / 500);
        for (let i = 0; i < total; i++) {
            sliceGroup.push(files.splice(0, 500));
        }
        const tasks = sliceGroup.map(group => deleteMultipleObject({
            Bucket: bucket,
            Region: region,
            Objects: group.map(file => ({ Key: file.Key }))
        }));
        // 删除多个文件
        const taskRes = await Promise.all(tasks);
        // 合并响应结果
        const Deleted = taskRes.map(_ => _.Deleted).reduce((prev, next) => [...prev, ...next], []);
        const Error = taskRes.map(_ => _.Error).reduce((prev, next) => [...prev, ...next], []);
        return {
            Deleted,
            Error
        };
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
        return this.tcbService.request('ModifyStorageACL', {
            EnvId: env,
            Bucket: bucket,
            AclTag: acl
        });
    }
    /**
     * 遍历云端文件夹
     * @param {string} prefix
     * @param {string} [marker] 路径开始标志
     * @returns {Promise<IListFileInfo[]>}
     */
    async walkCloudDir(prefix, marker) {
        const { bucket, region } = this.getStorageConfig();
        return this.walkCloudDirCustom({
            prefix,
            bucket,
            region,
            marker
        });
    }
    /**
     * 遍历云端文件夹，支持自定义 Bucket 和 Region
     * @param {string} prefix
     * @param {string} [marker]
     * @param {string} bucket
     * @param {string} region
     * @returns {Promise<IListFileInfo[]>}
     */
    async walkCloudDirCustom(options) {
        const { prefix, bucket, region, marker = '/' } = options;
        let fileList = [];
        const cos = this.getCos();
        const getBucket = util_1.default.promisify(cos.getBucket).bind(cos);
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
            moreFiles = await this.walkCloudDirCustom({
                bucket,
                region,
                prefix: prefixKey,
                marker: res.NextMarker
            });
        }
        fileList.push(...moreFiles);
        return fileList;
    }
    /**
     * 遍历本地文件夹
     * 忽略不包含 dir 路径，即如果 ignore 匹配 dir，dir 也不会被忽略
     * @private
     * @param {string} dir
     * @param {(string | string[])} [ignore]
     * @returns
     */
    async walkLocalDir(dir, ignore) {
        try {
            return walkdir_1.default.async(dir, {
                filter: (currDir, files) => {
                    // NOTE: ignore 为空数组时会忽略全部文件
                    if (!ignore || !ignore.length)
                        return files;
                    return files.filter(item => {
                        // 当前文件全路径
                        const fullPath = path_1.default.join(currDir, item);
                        // 文件相对于传入目录的路径
                        const fileRelativePath = fullPath.replace(path_1.default.join(dir, path_1.default.sep), '');
                        // 匹配
                        return !micromatch_1.default.isMatch(fileRelativePath, ignore);
                    });
                }
            });
        }
        catch (e) {
            throw new error_1.CloudBaseError(e.message);
        }
    }
    /**
     * 获取文件上传链接属性
     */
    async getUploadMetadata(path) {
        const config = this.environment.getAuthConfig();
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
     * 获取静态网站配置
     */
    async getWebsiteConfig(options) {
        const { bucket, region } = options;
        const cos = this.getCos();
        const getBucketWebsite = util_1.default.promisify(cos.getBucketWebsite).bind(cos);
        const res = await getBucketWebsite({
            Bucket: bucket,
            Region: region
        });
        return res;
    }
    /**
     * 配置文档
     */
    async putBucketWebsite(options) {
        const { indexDocument, errorDocument, bucket, region, routingRules } = options;
        const cos = this.getCos();
        const putBucketWebsite = util_1.default.promisify(cos.putBucketWebsite).bind(cos);
        let params = {
            Bucket: bucket,
            Region: region,
            WebsiteConfiguration: {
                IndexDocument: {
                    Suffix: indexDocument
                },
                ErrorDocument: {
                    Key: errorDocument
                }
            }
        };
        if (routingRules) {
            params.WebsiteConfiguration.RoutingRules = [];
            for (let value of routingRules) {
                const routeItem = {};
                if (value.keyPrefixEquals) {
                    routeItem.Condition = {
                        KeyPrefixEquals: value.keyPrefixEquals
                    };
                }
                if (value.httpErrorCodeReturnedEquals) {
                    routeItem.Condition = {
                        HttpErrorCodeReturnedEquals: value.httpErrorCodeReturnedEquals
                    };
                }
                if (value.replaceKeyWith) {
                    routeItem.Redirect = {
                        ReplaceKeyWith: value.replaceKeyWith
                    };
                }
                if (value.replaceKeyPrefixWith) {
                    routeItem.Redirect = {
                        ReplaceKeyPrefixWith: value.replaceKeyPrefixWith
                    };
                }
                params.WebsiteConfiguration.RoutingRules.push(routeItem);
            }
        }
        const res = await putBucketWebsite(params);
        return res;
    }
    /**
     * 查询object列表
     * @param {IGetBucketOpions} options
     * @memberof StorageService
     */
    async getBucket(options) {
        // const { bucket } = this.getStorageConfig()
        const { prefix, maxKeys, marker, bucket, region } = options;
        const cos = this.getCos();
        const getBucket = util_1.default.promisify(cos.getBucket).bind(cos);
        const prefixKey = this.getCloudKey(prefix);
        const res = await getBucket({
            Bucket: bucket,
            Region: region,
            Prefix: prefixKey,
            MaxKeys: maxKeys,
            Marker: marker
        });
        return res;
    }
    /**
     * 获取 COS 配置
     */
    getCos(parallel = 20) {
        const { secretId, secretKey, token, proxy } = this.environment.getAuthConfig();
        const cosProxy = process.env.TCB_COS_PROXY;
        return new cos_nodejs_sdk_v5_1.default({
            FileParallelLimit: parallel,
            SecretId: secretId,
            SecretKey: secretKey,
            Proxy: cosProxy || proxy,
            SecurityToken: token
        });
    }
    /**
     * 将 cloudPath 转换成 cloudPath/ 形式
     */
    getCloudKey(cloudPath) {
        if (!cloudPath) {
            return '';
        }
        // 单个 / 转换成根目录
        if (cloudPath === '/') {
            return '';
        }
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
        var _a;
        const envConfig = this.environment.lazyEnvironmentConfig;
        const storageConfig = (_a = envConfig === null || envConfig === void 0 ? void 0 : envConfig.Storages) === null || _a === void 0 ? void 0 : _a[0];
        const { Region, Bucket } = storageConfig;
        const region = process.env.TCB_COS_REGION || Region;
        return {
            region,
            bucket: Bucket,
            env: envConfig.EnvId
        };
    }
    /**
     * 带重试功能的上传多文件函数
     * @param uploadFiles sdk上传函数
     * @param options sdk上传函数参数
     * @param times 重试次数
     * @param interval 重试时间间隔(毫秒)
     * @param failedFiles 失败文件列表
     * @returns
     */
    async uploadFilesWithRetry({ uploadFiles, options, times, interval, failedFiles }) {
        const { files, onFileFinish } = options;
        const tempFailedFiles = [];
        const res = await uploadFiles(Object.assign(Object.assign({}, options), { files: failedFiles.length
                ? files.filter(file => failedFiles.includes(file.Key))
                : files, onFileFinish: (...args) => {
                const error = args[0];
                const fileInfo = args[2];
                if (error) {
                    tempFailedFiles.push(fileInfo.Key);
                }
                onFileFinish === null || onFileFinish === void 0 ? void 0 : onFileFinish.apply(null, args);
            } }));
        if (!(tempFailedFiles === null || tempFailedFiles === void 0 ? void 0 : tempFailedFiles.length) || times <= 0)
            return res;
        if (times > 0) {
            setTimeout(() => this.uploadFilesWithRetry({
                uploadFiles,
                options,
                times: times - 1,
                interval,
                failedFiles: tempFailedFiles
            }), interval);
        }
    }
}
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadFile", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadFiles", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadFileCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadDirectory", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadDirectoryCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadFilesCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "createCloudDirectroy", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "createCloudDirectroyCustom", null);
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
], StorageService.prototype, "deleteFileCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "getFileInfo", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "deleteDirectory", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "deleteDirectoryCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "getStorageAcl", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "setStorageAcl", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "walkCloudDir", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "walkCloudDirCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "putBucketWebsite", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "getBucket", null);
exports.StorageService = StorageService;
