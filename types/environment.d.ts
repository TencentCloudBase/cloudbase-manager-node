import { DatabaseService } from './database';
import { FunctionService } from './function';
import { StorageService } from './storage';
import { EnvService } from './env';
import { CloudBaseContext } from './context';
export declare class Environment {
    inited: boolean;
    cloudBaseContext: CloudBaseContext;
    lazyEnvironmentConfig: any;
    private envId;
    private functionService;
    private databaseService;
    private storageService;
    private envService;
    constructor(context: CloudBaseContext, envId: string);
    lazyInit(): Promise<any>;
    getEnvId(): string;
    getStorageService(): StorageService;
    getDatabaseService(): DatabaseService;
    getFunctionService(): FunctionService;
    getEnvService(): EnvService;
    getServicesEnvInfo(): Promise<any>;
}
