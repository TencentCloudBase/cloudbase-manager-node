# 云开发环境

env 实例可以对云开发环境进行管理

获得 env 实例: 示例代码如下

```javascript
import CloudBase from '@cloudbase/manager-node'

const { env } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})
```

## 目录

- [获取所有环境信息](#获取所有环境信息)
- [创建环境](#创建环境)
- [获取合法域名列表](#获取合法域名列表)
- [添加环境安全域名](#添加环境安全域名)
- [删除环境安全域名](#删除环境安全域名)
- [获取环境信息](#获取环境信息)
- [修改环境别名](#修改环境别名)
- [拉取登录配置列表](#拉取登录配置列表)
- [创建登录方式](#创建登录方式)
- [更新登录方式配置](#更新登录方式配置)

## 获取所有环境信息

## 接口定义

```javascript
listEnvs()
```

## 参数说明

无

## 调用示例

```javascript
const res = await env.listEnvs()
```

## 返回结果

```json
{
    "EnvList": [
        {
            "EnvId": "lukeke-42f08e",
            "Source": "qcloud",
            "Alias": "lukeke",
            "Status": "NORMAL",
            "CreateTime": "2019-09-15 17:04:43",
            "UpdateTime": "2019-09-15 17:04:50",
            "PackageId": "basic",
            "PackageName": "基础版",
            "Databases": [],
            "Storages": [],
            "Functions": [],
            "LogServices": []
        }
    ],
    "RequestId": "a42bf1cd-c5db-4ddb-9a6d-6a8c4cde9744"
}
```

## 创建环境

### 接口定义

```javascript
createEnv(name: string)
```

### 参数说明

| 参数名 | 类型   | 描述   |
| ------ | ------ | ------ |
| name   | String | 环境名 |

### 调用示例

```javascript
const res = await env.createEnv('aaa')
```

### 返回示例

```json
{
    "Status": "INITIALIZING",
    "RequestId": "e2571ff3-da04-4c53-8438-f58bf057ce4a"
}
```

> ⚠️Status 为环境当前状态
>
> -   NORMAL：正常可用
> -   NOINITIALIZE：尚未初始化
> -   INITIALIZING：初始化过程中

**NOTE**：因为创建环境是一个异步操作，所以创建环境返回成功，并不代表创建环境成功，环境可能任处于初始化状态中，可能会因为某些原因初始化失败，请根据环境状态判断环境是否创建成功！

## 获取合法域名列表

### 接口定义

```javascript
getEnvAuthDomains()
```

### 参数说明

无

### 调用示例

```javascript
const envs = await env.getEnvAuthDomains()
```

### 返回示例

```js
{
    "Domains": [
        {
            "Id": "397c8004-eab4-41ee-86b3-972db37eb6e8", // 域名ID
            "Domain": "luke.com", // 域名
            "Type": "USER", // 域名类型。包含以下取值：system user
            "Status": "ENABLE", // 状态。包含以下取值：ENABLE DISABLE
            "CreateTime": "2019-09-18 15:05:45", // 创建时间
            "UpdateTime": "2019-09-18 15:05:45" // 	更新时间
        }
    ],
    "RequestId": "89841b3d-0b6e-47ec-be21-308c72814b18"
}
```

## 添加环境安全域名

### 接口定义

```javascript
createEnvDomain(domains: string[])
```

### 参数说明

| 参数名  | 类型     | 描述         |
| ------- | -------- | ------------ |
| domains | String[] | 安全域名数组 |

### 调用示例

```javascript
const res = await env.createEnvDomain(['luke.com'])
```

### 返回示例

```json
{
    "RequestId": "e2571ff3-da04-4c53-8438-f58bf057ce4a"
}
```

## 删除环境安全域名

### 接口定义

```javascript
deleteEnvDomain(domains: string[])
```

### 参数说明

| 参数名    | 类型     | 描述             |
| --------- | -------- | ---------------- |
| domains | String[] | 安全域名数组 |

### 调用示例

```javascript
const res = await env.deleteEnvDomain(['luke.com'])
```

### 返回示例

```json
{
    "RequestId": "e2571ff3-da04-4c53-8438-f58bf057ce4a",
    "Deleted": 1
}
```

## 获取环境信息

### 接口定义

```javascript
getEnvInfo()
```

### 参数说明

无

### 调用示例

```javascript
const res = await env.getEnvInfo()
```

### 返回示例

```js
{
    "EnvInfo": {
        "EnvId": "luke-87pns", // 该环境的账户下唯一标识
        "Source": "miniapp", // 环境来源。包含以下取值： miniapp：微信小程序 qcloud ：腾讯云
        "Alias": "lukemodify", // 环境别名，要以a-z开头，不能包含 a-zA-z0-9- 以外的字符
        "Status": "NORMAL", // 环境状态。包含以下取值：NORMAL：正常可用 UNAVAILABLE：服务不可用，可能是尚未初始化或者初始化过程中
        "CreateTime": "2019-05-12 22:25:40", // 创建时间
        "UpdateTime": "2019-09-15 18:37:14", // 最后修改时间
        "PackageId": "basic", // 云开发产品套餐ID
        "PackageName": "基础版", // 套餐中文名称
        "Databases": [], // 数据库列表
        "Storages": [], // 存储列表
        "Functions": [], // 函数列表
        "LogServices": [] // 云日志服务列表
    },
    "RequestId": "d79a65f1-1b8c-40c7-8073-f2e34c52b3a0"
}
```

## 修改环境别名

### 接口定义

```javascript
updateEnvInfo(alias: string)
```

### 参数说明

| 参数名 | 类型   | 描述     |
| ------ | ------ | -------- |
| alias  | String | 环境别名 |

### 调用示例

```javascript
const res = await env.updateEnvInfo('lukemodify')
```

### 返回示例

```json
{
    "RequestId": "e2571ff3-da04-4c53-8438-f58bf057ce4a"
}
```

## 拉取登录配置列表

### 接口定义

```javascript
getLoginConfigList()
```

### 参数说明

无

### 调用示例

```javascript
const res = await env.getLoginConfigList()
```

### 返回示例

```json
{ "ConfigList": [], "RequestId": "6599c241-319c-40fe-9f80-72bee656a911" }
```

## 创建登录方式

### 接口定义

```javascript
createLoginConfig(
        platform: 'WECHAT-OPEN' | 'WECHAT-PUBLIC',
        appId: string,
        appSecret: string
    )
```

### 参数说明

| 参数名    | 类型   | 描述                               |
| --------- | ------ | ---------------------------------- |
| platform  | String | 平台 "WECHAT-OPEN" "WECHAT-PUBLIC" |
| appId     | String | 第三方平台的 AppID                 |
| appSecret | String | 第三方平台的 AppSecret             |

### 调用示例

```javascript
const res = await env.createLoginConfig('WECHAT-OPEN', 'appId', 'appSecret')
```

### 返回示例

```json
{
    "RequestId": "e2571ff3-da04-4c53-8438-f58bf057ce4a"
}
```

## 更新登录方式配置

### 接口定义

```javascript
updateLoginConfig(
        configId: string,
        status = 'ENABLE',
        appId = '',
        appSecret = ''
    )
```

### 参数说明

| 参数名    | 类型   | 描述                   |
| --------- | ------ | ---------------------- |
| configId  | String | 配置的记录 ID          |
| status    | String | ”ENABLE”, “DISABLE”    |
| appId     | String | 第三方平台的 AppSecret |
| appSecret | String | 第三方平台的 AppSecret |

### 调用示例

```javascript
const loginConfigRes = await env.getLoginConfigList()
const updateLoginConfigRes = await env.updateLoginConfig(
    loginConfigRes.ConfigList[0].Id,
    '',
    'appId',
    'appSecret'
)
```

### 返回示例

```json
{
    "RequestId": "e2571ff3-da04-4c53-8438-f58bf057ce4a"
}
```
