import { EnvironmentManager } from './environmentManager';
import { Environment } from './environment';
import { FunctionService } from './function';
import { StorageService } from './storage';
import { DatabaseService } from './database';
import { EnvService } from './env';
interface CloudBaseConfig {
    secretId?: string;
    secretKey?: string;
    token?: string;
    envId?: string;
}
declare class CloudBase {
    private static CloudBase;
    static init(config: CloudBaseConfig): CloudBase;
    private context;
    private cloudBaseConfig;
    private environmentManager;
    constructor(config: CloudBaseConfig);
    addEnvironment(envId: string): void;
    currentEnvironment(): Environment;
    readonly functions: FunctionService;
    readonly storage: StorageService;
    readonly database: DatabaseService;
    readonly env: EnvService;
    getEnvironmentManager(): EnvironmentManager;
    getManagerConfig(): CloudBaseConfig;
}
export = CloudBase;
