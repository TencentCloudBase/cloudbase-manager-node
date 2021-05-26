export interface EndUserInfo {
    UUId: string
    WXOpenId: string
    QQOpenId: string
    Phone: string
    Email: string
    NickName: string
    Gender: string
    AvatarUrl: string
    Country: string
    Province: string
    City: string
    UpdateTime: string
    CreateTime: string
    IsAnonymous: boolean
    IsDisabled: boolean
    HasPassword: boolean
    UserName: string
}

export type EndUserStatus = 'ENABLE' | 'DISABLE'
