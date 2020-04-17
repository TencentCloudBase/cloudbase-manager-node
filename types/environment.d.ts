import { DatabaseService } from './database';
import { FunctionService } from './function';
import { StorageService } from './storage';
import { EnvService } from './env';
import { CommonService } from './common';
import { CloudBaseContext } from './context';
import { HostingService } from './hosting';
export declare class Environment {
    inited: boolean;
    cloudBaseContext: CloudBaseContext;
    lazyEnvironmentConfig: any;
    private envId;
    private functionService;
    private databaseService;
    private storageService;
    private envService;
    private hostingService;
    constructor(context: CloudBaseContext, envId: string);
    lazyInit(): Promise<any>;
    getEnvId(): string;
    getStorageService(): StorageService;
    getDatabaseService(): DatabaseService;
    getFunctionService(): FunctionService;
    getEnvService(): EnvService;
    getHostingService(): HostingService;
    getCommonService(serviceType: string, serviceVersion: any): CommonService;
    getServicesEnvInfo(): Promise<any>;
    getAuthConfig(): {
        envId: string;
        secretId: string;
        secretKey: string;
        token: string;
        proxy: string;
    };
}
