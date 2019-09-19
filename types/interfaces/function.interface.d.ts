export interface IFunctionVPC {
    subnetId: string;
    vpcId: string;
}
export interface ICloudFunctionConfig {
    timeout?: number;
    envVariables?: Record<string, string | number | boolean>;
    runtime?: string;
    vpc?: IFunctionVPC;
}
export interface ICloudFunctionTrigger {
    name: string;
    type: string;
    config: string;
}
export interface ICloudFunction {
    name: string;
    config?: ICloudFunctionConfig;
    triggers?: ICloudFunctionTrigger[];
    params?: Record<string, string>;
    handler?: string;
}
export interface IFunctionLogOptions {
    name: string;
    offset?: number;
    limit?: number;
    order?: string;
    orderBy?: string;
    startTime?: string;
    endTime?: string;
    requestId?: string;
}
export interface IFucntionInvokeRes {
    RequestId: string;
    Log: string;
    RetMsg: string;
    ErrMsg: string;
    MemUsage: number;
    Duration: number;
    BillDuration: number;
    FunctionRequestId: string;
}
