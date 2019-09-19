import { EnvConfigService } from './index';
export declare class EnvLogin {
    private cloudService;
    private envId;
    constructor(envConfigService: EnvConfigService);
    getLoginConfigList(): Promise<any>;
    createLoginConfig({ platform, appId, appSecret }: {
        platform: any;
        appId: any;
        appSecret: any;
    }): Promise<void>;
    updateLoginConfig({ configId, status, appId, appSecret }: {
        configId: any;
        status?: string;
        appId?: string;
        appSecret?: string;
    }): Promise<void>;
}
