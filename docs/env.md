# 云开发环境管理

## listEnvs

### 1. 接口描述

接口功能：获取所有环境信息

接口声明：`listEnvs(): Promise<Object>`

### 2. 输入参数

无

### 3. 返回结果

| 字段      | 必填 | 类型                  | 说明         |
| --------- | ---- | --------------------- | ------------ |
| RequestId | 是   | String                | 请求唯一标识 |
| EnvList   | 是   | Array.&lt;EnvItem&gt; | 环境数组     |

#### EnvItem

| 字段        | 必填 | 类型   | 说明           |
| ----------- | ---- | ------ | -------------- |
| EnvId       | 是   | String | 环境 ID        |
| Source      | 是   | String | 来源           |
| Alias       | 是   | String | 环境别名       |
| Status      | 是   | String | 环境状态       |
| CreateTime  | 是   | String | 创建时间       |
| UpdateTime  | 是   | String | 更新时间       |
| PackageId   | 是   | String | 环境套餐 ID    |
| PackageName | 是   | String | 套餐名         |
| Databases   | 是   | Array  | 数据库资源详情 |
| Storages    | 是   | Array  | 存储资源详情   |
| Functions   | 是   | Array  | 函数资源详情   |
| LogServices | 是   | Array  | 日志资源详情   |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { env } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const res = await env.listEnvs()
  const { EnvList } = res
  for (let env in EnvList) {
    // 遍历envList
    console.log(env)
  }
}

test()
```

## createEnv

### 1. 接口描述

接口功能：创建环境

接口声明：`createEnv(param: ICreateEnvParam): Promise<Object>`

> ⚠️ 该接口支持 SDK 内闭环完成环境创建，目前只支持创建 web 端云开发环境，主账户可操作，子账户需主账户授权后再创建环境

子账户创建环境流程:

- 主账户开通云开发
- 子账户创建环境还需 开通 QCloudFinanceFullAccess(财务权限)
- 子账户使用当前接口完成环境创建

> ⚠️ 若你想创建预付费的环境，本 API 目前仅支持创建预付费的免费环境，每个主账户最多有一个免费环境。如果该账户已经创建过免费环境，调用本 API 创建预付费环境会返回商品下单异常错误，请到云开发控制台创建更多预付费环境。

**NOTE**：因为创建环境是一个异步操作，所以创建环境接口返回成功时，仍需等待环境资源的初始化，一般需 3~5 分钟

### 2. 输入参数

ICreateEnvParam 结构体

| 字段        | 必填 | 类型   | 说明                                                                                  |
| ----------- | ---- | ------ | ------------------------------------------------------------------------------------- |
| name        | 是   | String | 环境名                                                                                |
| paymentMode | 否   | String | 环境套餐类型: 预付费(包年包月) prepay, 后付费(按量付费) postpay，不传默认使用 postpay |
| channel     | 否   | String | 支持以下选项 'web'，'cocos'，'qq'，'cloudgame'                                        |

### 3. 返回结果

| 字段  | 必填 | 类型   | 说明    |
| ----- | ---- | ------ | ------- |
| envId | 是   | String | 环境 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { env } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const res = await env.createEnv({
    name: 'test',
    paymentMode: 'postpay',
    channel: 'web'
  })
  console.log(res.envId)
}

test()
```

## getEnvAuthDomains

### 1. 接口描述

接口功能：获取合法域名列表

接口声明：`getEnvAuthDomains(): Promise<Object>`

### 2. 输入参数

无

### 3. 返回结果

| 字段    | 必填 | 类型                 | 说明     |
| ------- | ---- | -------------------- | -------- |
| Domains | 是   | Array.&lt;Domain&gt; | 域名列表 |
| envId   | 是   | String               | 环境 ID  |

**Domain**

| 字段       | 必填 | 类型   | 说明                                |
| ---------- | ---- | ------ | ----------------------------------- |
| Id         | 是   | String | 域名 ID                             |
| Domain     | 是   | String | 域名                                |
| Type       | 是   | String | 域名类型。包含以下取值：system user |
| Status     | 是   | String | 状态。包含以下取值：ENABLE DISABLE  |
| CreateTime | 是   | String | 创建时间                            |
| UpdateTime | 是   | String | 更新时间                            |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { env } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const res = await env.getEnvAuthDomains()
  const { Domains } = res
  for (let domain in Domains) {
    console.log(domain)
  }
}

test()
```

## createEnvDomain

### 1. 接口描述

接口功能：添加环境安全域名

接口声明：`createEnvDomain(domains: string[]): Promise<Object>`

### 2. 输入参数

| 字段    | 必填 | 类型                 | 说明         |
| ------- | ---- | -------------------- | ------------ |
| domains | 是   | Array.&lt;String&gt; | 安全域名数组 |

### 3. 返回结果

| 字段      | 类型   | 说明    |
| --------- | ------ | ------- |
| RequestId | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { env } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const res = await env.createEnvDomain(['luke.com'])
  console.log(res)
}

test()
```

## deleteEnvDomain

### 1. 接口描述

接口功能：删除环境安全域名

接口声明：`deleteEnvDomain(domains: string[]): Promise<Object>`

### 2. 输入参数

| 字段    | 必填 | 类型                 | 说明         |
| ------- | ---- | -------------------- | ------------ |
| domains | 是   | Array.&lt;String&gt; | 安全域名数组 |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明             |
| --------- | ---- | ------ | ---------------- |
| RequestId | 是   | String | 请求 ID          |
| Deleted   | 是   | Number | 删除成功的域名数 |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { env } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const res = await env.deleteEnvDomain(['luke.com'])
  const { Deleted } = res
  console.log(Deleted) // 删除域名数
}

test()
```

## getEnvInfo

### 1. 接口描述

接口功能：获取环境信息

接口声明：`getEnvInfo(): Promise<Object>`

### 2. 输入参数

无

### 3. 返回结果

| 字段      | 必填 | 类型                | 说明     |
| --------- | ---- | ------------------- | -------- |
| RequestId | 是   | String              | 请求 ID  |
| EnvInfo   | 是   | [EnvItem](#EnvItem) | 环境信息 |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { env } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const res = await env.getEnvInfo()
  const { EnvInfo } = res
  console.log(EnvInfo)
}

test()
```

## updateEnvInfo

### 1. 接口描述

接口功能：修改环境别名

接口声明：`updateEnvInfo(alias: string): Promise<Object>`

### 2. 输入参数

| 字段  | 必填 | 类型   | 说明     |
| ----- | ---- | ------ | -------- |
| alias | 是   | String | 环境别名 |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { env } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const res = await env.updateEnvInfo('lukemodify')
  console.log(res)
}

test()
```

## getLoginConfigList

### 1. 接口描述

接口功能：拉取登录配置列表

接口声明：`getLoginConfigList(): Promise<Object>`

### 2. 输入参数

无

### 3. 返回结果

| 字段       | 必填 | 类型                     | 说明         |
| ---------- | ---- | ------------------------ | ------------ |
| RequestId  | 是   | String                   | 请求 ID      |
| ConfigList | 是   | Array.&lt;ConfigItem&gt; | 登录配置列表 |

#### ConfigItem

| 字段       | 必填 | 类型   | 说明         |
| ---------- | ---- | ------ | ------------ |
| Id         | 是   | String | 配置 ID      |
| Platform   | 是   | String | 平台类型     |
| PlatformId | 是   | String | 平台 ID      |
| Status     | 是   | String | 配置状态     |
| UpdateTime | 是   | String | 配置更新时间 |
| CreateTime | 是   | String | 配置创建时间 |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { env } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const res = await env.getLoginConfigList()
  const { ConfigList } = res
  for (let config in ConfigList) {
    console.log(config)
  }
}

test()
```

## createLoginConfig

### 1. 接口描述

接口功能：创建登录方式

接口声明：`createLoginConfig(platform, appId, appSecret): Promise<Object>`

### 2. 输入参数

| 字段      | 必填 | 类型   | 说明                                                                                    |
| --------- | ---- | ------ | --------------------------------------------------------------------------------------- |
| platform  | 是   | String | 平台 "WECHAT-OPEN" "WECHAT-PUBLIC" "QQ" "ANONYMOUS"                                     |
| appId     | 是   | String | 第三方平台的 AppID 注意:如果是匿名登录方式(platform:ANONYMOUS),appId 填: anonymous      |
| appSecret | 否   | String | 第三方平台的 AppSecret，注意:如果是 匿名登录方式(platform:ANONYMOUS)， appSecret 可不填 |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { env } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  await env.createLoginConfig('WECHAT-OPEN', 'appId', 'appSecret')
}

test()
```

## updateLoginConfig

### 1. 接口描述

接口功能：更新登录方式配置

接口声明：`updateLoginConfig(configId, status, appId, appSecret): Promise<Object>`

### 2. 输入参数

| 字段      | 必填 | 类型   | 说明                                                     |
| --------- | ---- | ------ | -------------------------------------------------------- |
| configId  | 是   | String | 配置的记录 ID                                            |
| status    | 是   | String | ”ENABLE”, “DISABLE”                                      |
| appId     | 是   | String | 第三方平台的 AppId，如果是匿名登录， appId 填: anonymous |
| appSecret | 否   | String | 第三方平台的 AppSecret，如果是匿名登录，可不填该字段     |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { env } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const loginConfigRes = await env.getLoginConfigList()
  await env.updateLoginConfig(
    loginConfigRes.ConfigList[0].Id,
    'ENABLE',
    'appId',
    'appSecret'
  )
}

test()
```

## createCustomLoginKeys

### 1. 接口描述

接口功能：创建自定义登录密钥

接口声明：`createCustomLoginKeys(): Promise<Object>`

### 2. 输入参数

无

### 3. 返回结果

| 字段       | 必填 | 类型   | 说明    |
| ---------- | ---- | ------ | ------- |
| RequestId  | 是   | String | 请求 ID |
| KeyID      | 是   | String | 密钥 ID |
| PrivateKey | 是   | String | 私钥    |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { env } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const res = await env.createCustomLoginKeys()
  const { KeyID, PrivateKey } = res
  console.log(KeyID, PrivateKey)
}

test()
```
