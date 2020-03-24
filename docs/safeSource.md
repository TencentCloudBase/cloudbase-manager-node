# 文档已迁移，请访问新的[文档站点](https://docs.cloudbase.net/api-reference/manager/node/introduction.html)查看详细的文档。

# 安全来源

安全规则的接口，可通过 [commonService ](./common.md)来调用

## 新增安全来源

### 1. 接口描述

接口功能：新增安全来源

接口声明：`commonService.call({ Action: 'CreateSafetySource', Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段    | 必填 | 类型   | 说明     |
| ------- | ---- | ------ | -------- |
| EnvId   | 是   | String | 环境 ID  |
| AppName | 是   | String | 应用标识 |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明         |
| --------- | ---- | ------ | ------------ |
| RequestId | 是   | String | 请求唯一标识 |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { commonService } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    await commonService.call({
        Action: 'CreateSafetySource',
        Param: { EnvId: 'Your envId', AppName: 'xxx' }
    })
}

test()
```

## 获取安全来源列表

### 1. 接口描述

接口功能：获取安全来源列表

接口声明：`commonService.call({ Action: 'DescribeSafetySource', Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| EnvId  | 是   | String | 环境 ID  |
| Offset | 是   | Number | 偏移量   |
| Limit  | 是   | Number | 限制数目 |

### 3. 返回结果

| 字段       | 必填 | 类型                           | 说明         |
| ---------- | ---- | ------------------------------ | ------------ |
| TotalCount | 是   | Number                         | 总数         |
| Data       | 是   | Array.&lt;SafetySourceItem&gt; | 安全来源列表 |
| RequestId  | 是   | String                         | 请求唯一标识 |

#### SafetySourceItem 字段说明

| 字段             | 必填 | 类型   | 说明     |
| ---------------- | ---- | ------ | -------- |
| Id               | 是   | String | 记录 ID  |
| AppName          | 是   | String | 应用标识 |
| AppSecretVersion | 是   | String | 密钥版本 |
| CreateTime       | 是   | String | 创建时间 |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { commonService } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    const res = await commonService.call({
        Action: 'DescribeSafetySource',
        Param: {
            EnvId: 'Your envId',
            Offset: 0,
            Limit: 20
        }
    })
    const { Data } = res
    for (let item in Data) {
        console.log(item)
    }
}

test()
```

## 查看安全来源的密钥

### 1. 接口描述

接口功能：查看安全来源的密钥

接口声明：`commonService.call({ Action: 'DescribeSafetySourceSecretKey', Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明                              |
| ------ | ---- | ------ | --------------------------------- |
| EnvId  | 是   | String | 环境 ID                           |
| ItemId | 是   | Object | 记录 ID，从列表接口的返回数据里看 |

### 3. 返回结果

| 字段         | 必填 | 类型   | 说明         |
| ------------ | ---- | ------ | ------------ |
| RequestId    | 是   | String | 请求唯一标识 |
| AppSecretKey | 是   | String | 凭证         |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { commonService } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    const res = await commonService.call({
        Action: 'DescribeSafetySource',
        Param: { EnvId: envId, Offset: 0, Limit: 20 }
    })

    const res1 = await commonService.call({
        Action: 'DescribeSafetySourceSecretKey',
        Param: {
            EnvId: envId,
            ItemId: res.Data[0].Id
            // APIId: apiId
        }
    })
    console.log(res1.AppSecretKey)
}

test()
```

## 删除安全来源

### 1. 接口描述

接口功能：删除安全来源

接口声明：`commonService.call({ Action: 'DeleteSafetySource', Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明                              |
| ------ | ---- | ------ | --------------------------------- |
| EnvId  | 是   | String | 环境 ID                           |
| ItemId | 是   | Object | 记录 ID，从列表接口的返回数据里看 |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明         |
| --------- | ---- | ------ | ------------ |
| RequestId | 是   | String | 请求唯一标识 |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { commonService } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    const res = await commonService.call({
        Action: 'DescribeSafetySource',
        Param: { EnvId: envId, Offset: 0, Limit: 20 }
    })

    // 删除第一个安全来源
    await commonService.call({
        Action: 'DeleteSafetySource',
        Param: { EnvId: envId, ItemId: res.Data[0].Id }
    })
}

test()
```
