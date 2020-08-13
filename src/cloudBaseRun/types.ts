export interface IModifyServerFlowOption {
    serverName: string
    versionFlowItems?: ICloudBaseRunVersionFlowItem[]
    trafficType?: string
}

export interface ICloudBaseRunVersionFlowItem {
    versionName: string // 版本名称
    flowRatio: number // 流量占比
    urlParam?: IObjectKV // 流量参数
    priority?: number // 优先级（数值越小，优先级越高）
    isDefaultPriority?: boolean // 是否是默认兜底版本
}

export interface IObjectKV {
    key: string
    value: string
}

export interface IClouBaseRunKVPriority {
    key: string
    value: string
    priority: number
}
