import { EnvConfigService } from './index';
export declare class EnvDomain {
    private cloudService;
    private envId;
    constructor(envConfigService: EnvConfigService);
    getEnvAuthDomains(): Promise<any>;
    createEnvDomain({ domains }: {
        domains: any;
    }): Promise<void>;
    deleteEnvDomain({ domainIds }: {
        domainIds: any;
    }): Promise<any>;
}
