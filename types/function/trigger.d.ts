import { ICloudFunctionTrigger } from '../interfaces';
export declare class FunctionsTrigger {
    envId: string;
    constructor(envId: string);
    createFunctionTriggers(name: string, triggers: ICloudFunctionTrigger[]): Promise<void>;
    deleteFunctionTrigger(name: string, triggerName: string): Promise<void>;
}
