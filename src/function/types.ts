export interface ITag {
    TagKey: string
    TagValue: string[]
}

/**
 * VPC
 */
export interface IVpc {
    VpcId: string
    VpcName: string
    CidrBlock: string
    Ipv6CidrBlock: string
    IsDefault: false
    EnableMulticast: false
    CreatedTime: string
    EnableDhcp: boolean
    DhcpOptionsId: string
    DnsServerSet: string[]
    DomainName: string
    TagSet: any[]
    AssistantCidrSet: any[]
}

/**
 * 子网
 */

export interface ISubnet {
    VpcId: string
    SubnetId: string
    SubnetName: string
    CidrBlock: string
    Ipv6CidrBlock: string
    IsDefault: boolean
    IsRemoteVpcSnat: boolean
    EnableBroadcast: boolean
    Zone: string
    RouteTableId: string
    NetworkAclId: string
    TotalIpAddressCount: number
    AvailableIpAddressCount: number
    CreatedTime: string
    TagSet: any[]
}
/**
 * 函数
 */
export interface IFunctionLog {
    FunctionName: string
    RetMsg: string
    RequestId: string
    StartTime?: string
    RetCode?: number
    InvokeFinished?: number
    Duration?: number
    BillDuration?: number
    MemUsage: number
    Log?: string
    Level?: string
    Source?: string
}

export interface ILogFilter {
    RetCode?: 'not0' | 'is0' | 'TimeLimitExceeded' | 'ResourceLimitExceeded' | 'UserCodeException'
}

export type IRegion = number

export interface IEnvVariable {
    Key: string
    Value: string
}

export interface ITrigger {
    Name: string
    Type: string
    Config: string
    TriggerName: string
    TriggerDesc: string
}

export interface IFunctionInfo {
    FunctionName: string
    FunctionId: string
    Runtime: string
    Handler: string
    CodeSize: number
    Timeout: number
    FunctionVersion: string
    MemorySize: number
    UseGpu: 'TRUE' | 'FALSE'
    CodeInfo: string
    CodeResult: string
    CodeError: string
    ErrNo: number
    Role: string
    InstallDependency: 'FALSE' | 'TRUE'
    AddTime: string
    ModTime: string
    Namespace: string
    Status: string
    StatusDesc: string
    Description: string
    Tags: ITag[]
    VpcConfig: {
        VpcId?: string
        SubnetId?: string
        vpc?: string
        subnet?: string
    }
    Environment: {
        Variables: IEnvVariable[]
    }
    Type: string

    EipConfig: {
        EipFixed: 'FALSE' | 'TRUE'
        Eips: string[]
    }

    PublicNetConfig: {
        PublicNetStatus: 'ENABLE' | 'DISABLE'
        EipConfig: {
            EipStatus: 'ENABLE' | 'DISABLE'
            EipAddress: string[]
        }
    }

    Triggers: ITrigger[]
}

export interface IFunctionCode {
    // 对象存储桶名称
    CosBucketName?: string
    // 对象存储对象路径
    CosObjectName?: string
    // 包含函数代码文件及其依赖项的 zip 格式文件，使用该接口时要求将 zip 文件的内容转成 base64 编码，最大支持20M
    ZipFile: string
}


export interface ILayerVersionItem {
    LayerName: string
    LayerVersion: number
}

export interface IFunctionUpdateAttribute {
    Code: IFunctionCode
    Description: string
    FunctionName: string
    MemorySize: number
    Timeout: number
    UseGpu: 'FALSE' | 'TRUE'
    Namespace: string
    Environment: { Variables: IEnvVariable[] }
    VpcConfig: { VpcId: string; SubnetId: string }
    InstallDependency?: 'FALSE' | 'TRUE'
    PublicNetConfig: {
        PublicNetStatus: string
        EipConfig: { EipStatus: string; EipAddress: string[] }
    }
    Layers?: ILayerVersionItem[]
}
