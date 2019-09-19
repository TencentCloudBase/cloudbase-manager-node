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
const path_1 = __importDefault(require("path"));
const error_1 = require("../error");
const database_1 = require("@cloudbase/database");
const cloudbaseRequest_1 = require("../utils/cloudbaseRequest");
const utils_1 = require("../utils");
function preLazy() {
    return function (target, propertyKey, descriptor) {
        let oldFunc = descriptor.value;
        descriptor.value = async function () {
            const currentEnvironment = this.environment;
            if (!currentEnvironment.inited) {
                await currentEnvironment.lazyInit();
            }
            let result = await oldFunc.apply(this, arguments);
            return result;
        };
    };
}
class DatabaseService extends database_1.Db {
    constructor(environment, dbConfig) {
        super(Object.assign(Object.assign({ envId: environment.getEnvId() }, environment.cloudBaseContext), dbConfig));
        this.DEFAULT_MGO_OFFSET = 0;
        this.DEFAULT_MGO_LIMIT = 100;
        database_1.Db.reqClass = cloudbaseRequest_1.CloudBaseRequest;
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
        const res = await this.collOpService.request('DescribeTable', {
            Tag,
            TableName: collectionName
        });
        return res;
    }
    async listCollections(options = {
        MgoLimit: this.DEFAULT_MGO_LIMIT,
        MgoOffset: this.DEFAULT_MGO_OFFSET
    }) {
        let { Tag } = this.getDatabaseConfig();
        const res = await this.collOpService.request('ListTables', Object.assign({ Tag }, options));
        res.Collections = res.Tables.map(item => {
            item.CollectionName = item.TableName;
            delete item.TableName;
            return item;
        });
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
    async distribution() {
        const res = await this.dbOpService.request('DescribeDbDistribution', {
            EnvId: this.envId
        });
        return res;
    }
    async migrateStatus(jobId) {
        const res = await this.dbOpService.request('DatabaseMigrateQueryInfo', {
            EnvId: this.envId,
            JobId: jobId
        });
        return res;
    }
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
            await this.environment.getStorageService().uploadFile(file['FilePath'], filePath);
            fileType = path_1.default.extname(filePath);
        }
        else if (file['ObjectKey']) {
            delete options['ObjectKeyPrefix'];
            filePath = file['ObjectKey'];
            fileType = path_1.default.extname(filePath);
        }
        else {
            throw new error_1.CloudBaseError('Miss file.filePath or file.objectKey');
        }
        if (file['FileType']) {
            fileType = file['FileType'];
        }
        return this.dbOpService.request('DatabaseMigrateImport', Object.assign({ CollectionName: collectionName, FilePath: filePath, FileType: fileType, EnvId: this.envId }, options));
    }
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
