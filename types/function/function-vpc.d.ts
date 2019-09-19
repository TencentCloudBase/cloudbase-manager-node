import { IServiceVersion } from '../interfaces';
import { FunctionService } from './index';
import { BaseService } from '../baseService';
export declare class FunctionVpc extends BaseService {
    private functionService;
    constructor(functionService: FunctionService, serviceVersion: IServiceVersion, baseParams?: Record<string, any>);
    getVpcs(): Promise<any>;
    getSubnets(vpcId: string): Promise<any>;
}
