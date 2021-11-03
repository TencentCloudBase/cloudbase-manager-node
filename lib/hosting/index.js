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
exports.HostingService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const make_dir_1 = __importDefault(require("make-dir"));
const error_1 = require("../error");
const utils_1 = require("../utils");
const parallel_1 = require("../utils/parallel");
const envDomainCache = new Map();
const HostingStatusMap = {
    init: '初始化中',
    process: '处理中',
    online: '上线',
    destroying: '销毁中',
    offline: '下线',
    create_fail: '初始化失败',
    destroy_fail: '销毁失败' // eslint-disable-line
};
class HostingService {
    constructor(environment) {
        this.environment = environment;
        this.tcbService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
        this.cdnService = new utils_1.CloudService(environment.cloudBaseContext, 'cdn', '2018-06-06');
    }
    /**
     * 获取 hosting 信息
     */
    async getInfo() {
        const { envId } = this.getHostingConfig();
        const { Data } = await this.tcbService.request('DescribeStaticStore', {
            EnvId: envId
        });
        return Data;
    }
    /**
     * 开启 hosting 服务，异步任务
     */
    async enableService() {
        const { envId } = this.getHostingConfig();
        const hostings = await this.getInfo();
        // hosting 服务已开启
        if (hostings === null || hostings === void 0 ? void 0 : hostings.length) {
            const website = hostings[0];
            // offline 状态的服务可重新开启
            if (website.Status !== 'offline') {
                throw new error_1.CloudBaseError('静态网站服务已开启，请勿重复操作！');
            }
        }
        const res = await this.tcbService.request('CreateStaticStore', {
            EnvId: envId
        });
        const code = res.Result === 'succ' ? 0 : -1;
        return {
            code,
            requestId: res.RequestId
        };
    }
    async findFiles(options) {
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const { maxKeys, marker, prefix } = options;
        const storageService = await this.environment.getStorageService();
        const res = await storageService.getBucket({
            bucket: Bucket,
            region: Regoin,
            maxKeys,
            marker,
            prefix
        });
        return res;
    }
    /**
     * 展示文件列表
     */
    async listFiles() {
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const storageService = await this.environment.getStorageService();
        const list = await storageService.walkCloudDirCustom({
            prefix: '',
            bucket: Bucket,
            region: Regoin
        });
        return list;
    }
    /**
     * 销毁静态托管服务
     */
    async destroyService() {
        const { envId } = this.getHostingConfig();
        const files = await this.listFiles();
        if (files === null || files === void 0 ? void 0 : files.length) {
            throw new error_1.CloudBaseError('静态网站文件不为空，无法销毁！', {
                code: 'INVALID_OPERATION'
            });
        }
        const hostings = await this.getInfo();
        if (!hostings || !hostings.length) {
            throw new error_1.CloudBaseError('静态网站服务未开启！', {
                code: 'INVALID_OPERATION'
            });
        }
        const website = hostings[0];
        // destroy_fail 状态可重试
        if (website.Status !== 'online' && website.Status !== 'destroy_fail') {
            throw new error_1.CloudBaseError(`静态网站服务【${HostingStatusMap[website.Status]}】，无法进行此操作！`, {
                code: 'INVALID_OPERATION'
            });
        }
        const res = await this.tcbService.request('DestroyStaticStore', {
            EnvId: envId
        });
        const code = res.Result === 'succ' ? 0 : -1;
        return {
            code,
            requestId: res.RequestId
        };
    }
    /**
     * 支持上传单个文件，文件夹，或多个文件
     * @param options
     */
    async uploadFiles(options) {
        const { localPath, cloudPath, files = [], onProgress, onFileFinish, parallel = 20, ignore, retryCount, retryInterval } = options;
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const storageService = await this.environment.getStorageService();
        let uploadFiles = Array.isArray(files) ? files : [];
        // localPath 存在，上传文件夹/文件
        if (localPath) {
            const resolvePath = path_1.default.resolve(localPath);
            // 检查路径是否存在
            utils_1.checkReadable(resolvePath, true);
            if (utils_1.isDirectory(resolvePath)) {
                return storageService.uploadDirectoryCustom({
                    localPath: resolvePath,
                    cloudPath,
                    bucket: Bucket,
                    region: Regoin,
                    onProgress,
                    onFileFinish,
                    fileId: false,
                    ignore,
                    retryCount,
                    retryInterval,
                });
            }
            else {
                // 文件上传统一通过批量上传接口
                const assignCloudPath = cloudPath || path_1.default.parse(resolvePath).base;
                uploadFiles.push({
                    localPath: resolvePath,
                    cloudPath: assignCloudPath
                });
            }
        }
        // 文件上传统一通过批量上传接口
        return storageService.uploadFilesCustom({
            ignore,
            parallel,
            onProgress,
            onFileFinish,
            bucket: Bucket,
            region: Regoin,
            files: uploadFiles,
            fileId: false,
            retryCount,
            retryInterval,
        });
    }
    /**
     * 删除文件或文件夹
     * @param options
     */
    async deleteFiles(options) {
        const { cloudPath, isDir } = options;
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const storageService = await this.environment.getStorageService();
        if (isDir) {
            return storageService.deleteDirectoryCustom({
                cloudPath,
                bucket: Bucket,
                region: Regoin
            });
        }
        else {
            try {
                await storageService.deleteFileCustom([cloudPath], Bucket, Regoin);
                return {
                    Deleted: [{ Key: cloudPath }],
                    Error: []
                };
            }
            catch (e) {
                return {
                    Deleted: [],
                    Error: [e]
                };
            }
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
        const envConfig = this.environment.lazyEnvironmentConfig;
        const cacheHosting = envDomainCache.get(envConfig.EnvId);
        let CdnDomain;
        // 2 分钟有效
        if ((cacheHosting === null || cacheHosting === void 0 ? void 0 : cacheHosting.cacheTime) && Number(cacheHosting === null || cacheHosting === void 0 ? void 0 : cacheHosting.cacheTime) + 120000 < Date.now()) {
            console.log('cache');
            CdnDomain = cacheHosting.CdnDomain;
        }
        else {
            const hosting = await this.checkStatus();
            CdnDomain = hosting.CdnDomain;
            envDomainCache.set(envConfig.EnvId, Object.assign(Object.assign({}, hosting), { cacheTime: Date.now() }));
        }
        const url = new URL(cloudPath, `https://${CdnDomain}`).toString();
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
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const cloudDirectoryKey = this.getCloudKey(cloudPath);
        const storageService = await this.environment.getStorageService();
        const files = await storageService.walkCloudDirCustom({
            prefix: cloudDirectoryKey,
            bucket: Bucket,
            region: Regoin
        });
        const tasks = files.map(file => async () => {
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
        // 下载请求
        const creatingDirController = new parallel_1.AsyncTaskParallelController(20, 50);
        creatingDirController.loadTasks(tasks);
        await creatingDirController.run();
    }
    // 遍历文件
    async walkLocalDir(envId, dir) {
        const storageService = await this.environment.getStorageService();
        return storageService.walkLocalDir(dir);
    }
    /**
     * 绑定自定义域名
     * @param {IBindDomainOptions} options
     * @returns
     * @memberof HostingService
     */
    async CreateHostingDomain(options) {
        const { envId } = this.getHostingConfig();
        const { certId, domain } = options;
        const res = await this.tcbService.request('CreateHostingDomain', {
            EnvId: envId,
            Domain: domain,
            CertId: certId
        });
        return res;
    }
    /**
     * 删除托管域名
     *
     * @param {IBindDomainOptions} options
     * @returns
     * @memberof HostingService
     */
    async deleteHostingDomain(options) {
        const { envId } = this.getHostingConfig();
        const { domain } = options;
        return this.tcbService.request('DeleteHostingDomain', {
            EnvId: envId,
            Domain: domain
        });
    }
    /**
     * 查询域名状态信息
     * @param options
     */
    async tcbCheckResource(options) {
        return this.cdnService.request('TcbCheckResource', {
            Domains: options.domains
        });
    }
    /**
     * 域名配置变更
     * @param options
     */
    async tcbModifyAttribute(options) {
        const { domain, domainId, domainConfig } = options;
        const res = await this.cdnService.request('TcbModifyAttribute', {
            Domain: domain,
            DomainId: domainId,
            DomainConfig: domainConfig
        });
        return res;
    }
    /**
     * 查询静态网站配置
     * @memberof HostingService
     */
    async getWebsiteConfig() {
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const storageService = await this.environment.getStorageService();
        const res = await storageService.getWebsiteConfig({ bucket: Bucket, region: Regoin });
        return res;
    }
    /**
     * 配置静态网站文档
     * @param options
     */
    async setWebsiteDocument(options) {
        const { indexDocument, errorDocument, routingRules } = options;
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const storageService = await this.environment.getStorageService();
        const res = await storageService.putBucketWebsite({
            bucket: Bucket,
            region: Regoin,
            indexDocument,
            errorDocument,
            routingRules
        });
        return res;
    }
    /**
     * 检查 hosting 服务状态
     */
    async checkStatus() {
        const hostings = await this.getInfo();
        if (!hostings || !hostings.length) {
            throw new error_1.CloudBaseError(`您还没有开启静态网站服务，请先到云开发控制台开启静态网站服务！`, {
                code: 'INVALID_OPERATION'
            });
        }
        const website = hostings[0];
        if (website.Status !== 'online') {
            throw new error_1.CloudBaseError(`静态网站服务【${HostingStatusMap[website.Status]}】，无法进行此操作！`, {
                code: 'INVALID_OPERATION'
            });
        }
        return website;
    }
    /**
     * 获取配置
     */
    getHostingConfig() {
        var _a;
        const envConfig = this.environment.lazyEnvironmentConfig;
        const appId = (_a = envConfig.Storages[0]) === null || _a === void 0 ? void 0 : _a.AppId;
        const { proxy } = this.environment.cloudBaseContext;
        return {
            appId,
            proxy,
            envId: envConfig.EnvId
        };
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
}
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "getInfo", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "enableService", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "listFiles", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "destroyService", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "uploadFiles", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "deleteFiles", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "downloadFile", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "downloadDirectory", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "walkLocalDir", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "CreateHostingDomain", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "deleteHostingDomain", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "checkStatus", null);
exports.HostingService = HostingService;
