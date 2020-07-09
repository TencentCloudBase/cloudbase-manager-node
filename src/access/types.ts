export interface ICreateAccessOptions {
    path: string
    // 云函数名或云应用名称
    name: string
    // 1 表示云函数，2 表示云应用
    type?: 1 | 2
    // 鉴权开关
    auth?: boolean
}

export interface IApi {
    ServiceId: string
    APIId: string
    Path: string
    Type: number
    Name: string
    CreateTime: number
    EnvId: string
    EnableAuth: boolean
}

export interface IUpdateOptions {
    // APIId
    apiIds: string[]
    // true 为开启，false 为关闭
    auth: boolean
}

export interface IService {
    ServiceId: string
    Domain: string
    OpenTime: number
    Status?: number
}

export interface IDeleteOptions {
    name?: string
    type?: number
    apiId?: string
    path?: string
}

export interface IGetOptions {
    path?: string
    name?: string
    limit?: number
    offset?: number
}

export interface IDomainOptions {
    // 域名
    domain: string
    // 腾讯云 SSL 证书 Id
    certId?: string
}
