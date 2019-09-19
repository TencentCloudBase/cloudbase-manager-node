import { CloudService } from './utils/request';
import { IServiceVersion } from './interfaces';
import { CloudBaseContext } from './context';
export declare class BaseService {
    protected apiService: string;
    protected version: string;
    protected cloudBaseContext: CloudBaseContext;
    protected cloudService: CloudService;
    constructor(serviceVersion: IServiceVersion, baseParams?: Record<string, any>);
    getCloudService(): CloudService;
}
