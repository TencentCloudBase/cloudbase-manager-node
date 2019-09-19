import { BaseService } from '../baseService';
import { IServiceVersion, ICloudFunctionTrigger } from '../interfaces';
import { FunctionService } from './index';
export declare class FunctionTrigger extends BaseService {
    private functionService;
    constructor(functionService: FunctionService, serviceVersion: IServiceVersion, baseParams?: Record<string, any>);
    createFunctionTriggers(name: string, triggers: ICloudFunctionTrigger[]): Promise<void>;
    deleteFunctionTrigger(name: string, triggerName: string): Promise<void>;
}
