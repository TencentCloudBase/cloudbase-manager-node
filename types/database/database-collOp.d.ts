import { IExistsRes, IServiceVersion } from '../interfaces';
import { CreateIndex, DropIndex, IndexInfo, TableInfo, Pager, IResponseInfo } from '../interfaces/index';
import { DatabaseService } from './index';
interface IIndexiesInfo {
    CreateIndexes?: Array<CreateIndex>;
    DropIndexes?: Array<DropIndex>;
}
interface ITableInfo extends IResponseInfo {
    Indexes?: Array<IndexInfo>;
    IndexNum?: number;
}
interface IMgoQueryInfo {
    MgoLimit?: number;
    MgoOffset?: number;
}
interface ICollectionInfo extends IResponseInfo {
    Collections: Array<TableInfo>;
    Pager: Pager;
}
interface ICollectionExistInfo extends IResponseInfo {
    IsCreated: boolean;
    ExistsResult: IExistsRes;
}
export declare class CollOpService {
    private DEFAULT_MGO_OFFSET;
    private DEFAULT_MGO_LIMIT;
    private databaseService;
    private cloudService;
    constructor(databaseService: DatabaseService, serviceVersion: IServiceVersion, baseParams?: Record<string, any>);
    checkCollectionExists(collectionName: string): Promise<IExistsRes>;
    createCollection(collectionName: string): Promise<any>;
    deleteCollection(collectionName: string): Promise<any>;
    updateCollection(collectionName: string, indexiesInfo: IIndexiesInfo): Promise<any>;
    describeCollection(collectionName: string): Promise<ITableInfo>;
    listCollections(options?: IMgoQueryInfo): Promise<ICollectionInfo>;
    createCollectionIfNotExists(collectionName: string): Promise<ICollectionExistInfo>;
    checkIndexExists(collectionName: string, indexName: string): Promise<IExistsRes>;
}
export {};
