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
exports.DatabaseService = void 0;
const path_1 = __importDefault(require("path"));
const error_1 = require("../error");
const utils_1 = require("../utils");
function preLazy() {
    return function (target, propertyKey, descriptor) {
        let oldFunc = descriptor.value;
        descriptor.value = async function () {
            // 检查当前环境对象上是否已加载好环境信息
            const currentEnvironment = this.environment;
            if (!currentEnvironment.inited) {
                await currentEnvironment.lazyInit();
            }
            let result = await oldFunc.apply(this, arguments);
            return result;
        };
    };
}
class DatabaseService {
    constructor(environment) {
        this.DEFAULT_MGO_OFFSET = 0;
        this.DEFAULT_MGO_LIMIT = 100;
        this.environment = environment;
        this.envId = environment.getEnvId();
        this.dbOpService = new utils_1.CloudService(environment.cloudBaseContext, DatabaseService.tcbServiceVersion.service, DatabaseService.tcbServiceVersion.version);
        this.collOpService = new utils_1.CloudService(environment.cloudBaseContext, DatabaseService.flexdbServiceVersion.service, DatabaseService.flexdbServiceVersion.version);
    }
    getCurrEnvironment() {
        return this.environment;
    }
    getDatabaseConfig() {
        const currEnv = this.environment;
        const { Databases } = currEnv.lazyEnvironmentConfig;
        return {
            Tag: Databases[0].InstanceId
        };
    }
    async checkCollectionExists(collectionName) {
        try {
            const result = await this.describeCollection(collectionName);
            return {
                RequestId: result.RequestId,
                Exists: true
            };
        }
        catch (e) {
            return {
                RequestId: e.requestId,
                Msg: e.message,
                Exists: false
            };
        }
    }
    async createCollection(collectionName) {
        let { Tag } = this.getDatabaseConfig();
        const res = await this.collOpService.request('CreateTable', {
            Tag,
            TableName: collectionName
        });
        return res;
    }
    async deleteCollection(collectionName) {
        // 先检查当前集合是否存在
        const existRes = await this.checkCollectionExists(collectionName);
        if (existRes.Exists) {
            let { Tag } = this.getDatabaseConfig();
            const res = await this.collOpService.request('DeleteTable', {
                Tag,
                TableName: collectionName
            });
            return res;
        }
        else {
            return existRes;
        }
    }
    async updateCollection(collectionName, indexiesInfo) {
        let { Tag } = this.getDatabaseConfig();
        const res = await this.collOpService.request('UpdateTable', Object.assign({ Tag, TableName: collectionName }, indexiesInfo));
        return res;
    }
    async describeCollection(collectionName) {
        let { Tag } = this.getDatabaseConfig();
        return this.collOpService.request('DescribeTable', {
            Tag,
            TableName: collectionName
        });
    }
    // 获取
    async listCollections(options = {
        MgoLimit: this.DEFAULT_MGO_LIMIT,
        MgoOffset: this.DEFAULT_MGO_OFFSET
    }) {
        let { Tag } = this.getDatabaseConfig();
        if (options.MgoLimit === undefined) {
            options.MgoLimit = this.DEFAULT_MGO_LIMIT;
        }
        if (options.MgoOffset === undefined) {
            options.MgoOffset = this.DEFAULT_MGO_OFFSET;
        }
        const res = await this.collOpService.request('ListTables', Object.assign({ Tag }, options));
        if (res.Tables === null) {
            // 无集合
            res.Collections = [];
        }
        else {
            // 云 API 返回转换为与TCB一致
            res.Collections = res.Tables.map(item => {
                item.CollectionName = item.TableName;
                delete item.TableName;
                return item;
            });
        }
        delete res.Tables;
        return res;
    }
    async createCollectionIfNotExists(collectionName) {
        const existRes = await this.checkCollectionExists(collectionName);
        let res;
        if (!existRes.Exists) {
            res = await this.createCollection(collectionName);
            return {
                RequestId: res.RequestId,
                IsCreated: true,
                ExistsResult: existRes
            };
        }
        else {
            return {
                RequestId: '',
                IsCreated: false,
                ExistsResult: existRes
            };
        }
    }
    // 检查集合中是否存在某索引
    async checkIndexExists(collectionName, indexName) {
        const result = await this.describeCollection(collectionName);
        let exists = result.Indexes.some(item => {
            return item.Name === indexName;
        });
        return {
            RequestId: result.RequestId,
            Exists: exists
        };
    }
    // 查询DB的数据存储分布
    async distribution() {
        const res = await this.dbOpService.request('DescribeDbDistribution', {
            EnvId: this.envId
        });
        return res;
    }
    // 查询DB 迁移进度
    async migrateStatus(jobId) {
        const res = await this.dbOpService.request('DatabaseMigrateQueryInfo', {
            EnvId: this.envId,
            JobId: jobId
        });
        return res;
    }
    // 数据库导入数据
    async import(collectionName, file, options) {
        let filePath;
        let fileType;
        if (file['FilePath']) {
            let temp = 'tmp/db-imports/';
            if (options['ObjectKeyPrefix']) {
                temp = options['ObjectKeyPrefix'];
                delete options['ObjectKeyPrefix'];
            }
            filePath = path_1.default.join(temp, path_1.default.basename(file['FilePath']));
            // 调用cos接口 上传文件  todo
            await this.environment.getStorageService().uploadFile({
                localPath: file['FilePath'],
                cloudPath: filePath
            });
            fileType = path_1.default.extname(filePath).substring(1);
        }
        else if (file['ObjectKey']) {
            delete options['ObjectKeyPrefix'];
            filePath = file['ObjectKey'];
            fileType = path_1.default.extname(filePath).substring(1);
        }
        else {
            throw new error_1.CloudBaseError('Miss file.filePath or file.objectKey');
        }
        if (file['FileType']) {
            fileType = file['FileType'];
        }
        return this.dbOpService.request('DatabaseMigrateImport', Object.assign({ CollectionName: collectionName, FilePath: filePath, FileType: fileType, EnvId: this.envId }, options));
    }
    // 数据库导出数据
    async export(collectionName, file, options) {
        let filePath;
        let fileType;
        if (file['ObjectKey']) {
            filePath = file['ObjectKey'];
            fileType = path_1.default.extname(filePath).substring(1);
        }
        else {
            throw new error_1.CloudBaseError('Miss file.filePath or file.objectKey');
        }
        if (file['FileType']) {
            fileType = file['FileType'];
        }
        return this.dbOpService.request('DatabaseMigrateExport', Object.assign({ CollectionName: collectionName, FilePath: filePath, FileType: fileType, EnvId: this.envId }, options));
    }
}
DatabaseService.tcbServiceVersion = {
    service: 'tcb',
    version: '2018-06-08'
};
DatabaseService.flexdbServiceVersion = {
    service: 'flexdb',
    version: '2018-11-27'
};
__decorate([
    preLazy()
], DatabaseService.prototype, "createCollection", null);
__decorate([
    preLazy()
], DatabaseService.prototype, "deleteCollection", null);
__decorate([
    preLazy()
], DatabaseService.prototype, "updateCollection", null);
__decorate([
    preLazy()
], DatabaseService.prototype, "describeCollection", null);
__decorate([
    preLazy()
], DatabaseService.prototype, "listCollections", null);
exports.DatabaseService = DatabaseService;
