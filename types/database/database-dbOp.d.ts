import { IServiceVersion, IResponseInfo, CollectionDispension } from '../interfaces';
import { DatabaseService } from './index';
interface IDistributionInfo extends IResponseInfo {
    Collections: CollectionDispension;
    Count: number;
    Total: number;
}
interface IDatabaseMigrateQueryInfo extends IResponseInfo {
    Status: string;
    RecordSuccess: number;
    RecordFail: number;
    ErrorMsg: string;
    FileUrl: string;
}
interface IDatabaseImportAndExportInfo extends IResponseInfo {
    JobId: number;
}
export declare class DbOpService {
    private environment;
    private envId;
    private cloudService;
    constructor(databaseService: DatabaseService, serviceVersion: IServiceVersion, baseParams?: Record<string, any>);
    distribution(): Promise<IDistributionInfo>;
    migrateStatus(jobId: number): Promise<IDatabaseMigrateQueryInfo>;
    import(collectionName: string, file: any, options: any): Promise<IDatabaseImportAndExportInfo>;
    export(collectionName: string, file: any, options: any): Promise<IDatabaseImportAndExportInfo>;
}
export {};
