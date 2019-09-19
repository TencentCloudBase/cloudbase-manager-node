export interface IFunctionVPC {
    subnetId: string
    vpcId: string
}

export interface ICloudFunctionConfig {
    timeout?: number
    envVariables?: Record<string, string | number | boolean>
    runtime?: string
    vpc?: IFunctionVPC
}

export interface ICloudFunctionTrigger {
    name: string
    type: string
    config: string
}

export interface ICloudFunction {
    name: string
    config?: ICloudFunctionConfig
    triggers?: ICloudFunctionTrigger[]
    params?: Record<string, string>
    handler?: string
}

export interface IFunctionLogOptions {
    name: string
    offset?: number
    limit?: number
    order?: string
    orderBy?: string
    startTime?: string
    endTime?: string
    requestId?: string
}

export interface IFucntionInvokeRes {
    RequestId: string // 请求 Id
    Log: string // 表示执行过程中的日志输出
    RetMsg: string // 表示执行函数的返回
    ErrMsg: string // 表示执行函数的错误返回信息
    MemUsage: number // 执行函数时的内存大小，单位为Byte
    Duration: number // 表示执行函数的耗时，单位是毫秒
    BillDuration: number // 表示函数的计费耗时，单位是毫秒
    FunctionRequestId: string // 此次函数执行的Id
}