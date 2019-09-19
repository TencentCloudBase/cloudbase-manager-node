import { Environment } from '../environment';
import { IResponseInfo, ICloudFunction, IFunctionLogOptions, ICloudFunctionConfig, ICloudFunctionTrigger, IFucntionInvokeRes } from '../interfaces';
export declare class FunctionService {
    private environment;
    private vpcService;
    private scfService;
    private tcbRole;
    constructor(environment: Environment);
    createFunction(func: ICloudFunction, functionRootPath: string, force: boolean, base64Code: string): Promise<void>;
    listFunction(limit?: number, offset?: number): Promise<Record<string, string>[]>;
    deleteFunction(name: string): Promise<IResponseInfo>;
    getFunctionDetail(name: string): Promise<Record<string, string>>;
    getFunctionLogs(options: IFunctionLogOptions): Promise<Record<string, string>[]>;
    updateFunctionConfig(name: string, config: ICloudFunctionConfig): Promise<IResponseInfo>;
    updateFunctionCode(func: ICloudFunction, functionRootPath: string, base64Code: string): Promise<IResponseInfo>;
    invokeFunction(name: string, params: Record<string, any>): Promise<IFucntionInvokeRes>;
    copyFunction(name: string, newFunctionName: string, targetEnvId?: string, force?: boolean): Promise<IResponseInfo>;
    createFunctionTriggers(name: string, triggers: ICloudFunctionTrigger[]): Promise<IResponseInfo>;
    deleteFunctionTrigger(name: string, triggerName: string): Promise<IResponseInfo>;
    private getFunctionConfig;
    private getVpcs;
    private getSubnets;
}
