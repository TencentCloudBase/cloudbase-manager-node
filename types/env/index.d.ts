import { Environment } from '../environment';
import { IResponseInfo, AuthDomain, EnvInfo, LoginConfigItem } from '../interfaces';
interface ICreateEnvRes {
    Status: 'NORMAL' | 'NOINITIALIZE' | 'INITIALIZING';
    RequestId: string;
}
interface IDeleteDomainRes {
    RequestId: string;
    Deleted: number;
}
interface IAuthDomainsRes {
    RequestId: string;
    Domains: AuthDomain[];
}
interface IListEnvRes {
    RequestId: string;
    EnvList: EnvInfo[];
}
interface IEnvLoginConfigRes {
    RequestId: string;
    ConfigList: LoginConfigItem[];
}
export declare class EnvService {
    private environment;
    private envId;
    private cloudService;
    constructor(environment: Environment);
    listEnvs(): Promise<IListEnvRes>;
    createEnv(name: string): Promise<ICreateEnvRes>;
    getEnvAuthDomains(): Promise<IAuthDomainsRes>;
    createEnvDomain(domains: string[]): Promise<IResponseInfo>;
    deleteEnvDomain(domainIds: string[]): Promise<IDeleteDomainRes>;
    getEnvInfo(): Promise<{
        EnvInfo: EnvInfo;
        RequestId: string;
    }>;
    updateEnvInfo(alias: string): Promise<IResponseInfo>;
    getLoginConfigList(): Promise<IEnvLoginConfigRes>;
    createLoginConfig(platform: 'WECHAT-OPEN' | 'WECHAT-PUBLIC', appId: string, appSecret: string): Promise<IResponseInfo>;
    updateLoginConfig(configId: string, status?: string, appId?: string, appSecret?: string): Promise<IResponseInfo>;
}
export {};
