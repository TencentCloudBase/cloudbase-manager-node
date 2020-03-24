# 文档已迁移，请访问新的[文档站点](https://docs.cloudbase.net/api-reference/manager/node/introduction.html)查看详细的文档。

# HTTP Service

HTTP Service 是云开发为开发者提供的 HTTP 访问服务，让开发者可以通过 HTTP 访问到自己的云开发资源。

HTTP Service 的接口，可通过 [commonService ](./common.md)来调用

## 创建云函数 HTTPService

### 1. 接口描述

接口功能：创建云函数 HTTPService

接口声明：`commonService.call({ Action: 'CreateCloudBaseGWAPI', Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段      | 必填 | 类型   | 说明                            |
| --------- | ---- | ------ | ------------------------------- |
| ServiceId | 是   | String | Service ID，该字段取值为环境 ID |
| Path      | 是   | String | 自定义路径                      |
| Type      | 是   | Number | service type ，云函数默认为 1   |
| Name      | 是   | String | 函数名                          |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明         |
| --------- | ---- | ------ | ------------ |
| RequestId | 是   | String | 请求唯一标识 |
| APIId     | 是   | String | APIId        |

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
        Action: 'CreateCloudBaseGWAPI',
        Param: { ServiceId: envId, Path: '/sum', Type: 1, Name: 'sum' }
    })
    const { APIId } = res
    console.log(APIId)
}

test()
```

## 查询云函数 HTTP Service

### 1. 接口描述

接口功能：查询云函数 HTTP Service

接口声明：`commonService.call({ Action: 'DescribeCloudBaseGWAPI', Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段      | 必填 | 类型   | 说明                            |
| --------- | ---- | ------ | ------------------------------- |
| ServiceId | 否   | String | Service ID，该字段取值为环境 ID |
| Domain    | 否   | String | 绑定的域名                      |
| Path      | 否   | String | 自定义路径                      |
| APIId     | 否   | String | APIId                           |

> ServiceId 与 Domain 至少要设置其中一个字段！

### 3. 返回结果

| 字段      | 必填 | 类型                         | 说明              |
| --------- | ---- | ---------------------------- | ----------------- |
| RequestId | 是   | String                       | 请求唯一标识      |
| APISet    | 是   | Array.&lt;CloudBaseGWAPI&gt; | HTTP service 列表 |

**CloudBaseGWAPI**

| 字段       | 必填 | 类型   | 说明                          |
| ---------- | ---- | ------ | ----------------------------- |
| ServiceId  | 是   | String | 环境 ID                       |
| APIId      | 是   | String | APIId                         |
| Path       | 是   | String | 自定义路径                    |
| Type       | 是   | Number | service type ，云函数默认为 1 |
| Name       | 是   | String | 云函数名                      |
| CreateTime | 是   | Number | service 创建时间              |
| EnvId      | 是   | String | 环境 ID                       |

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
        Action: 'DescribeCloudBaseGWAPI',
        Param: {
            ServiceId: envId,
            Path: '/sum'
        }
    })
    const { APISet } = res
    for (let api in APISet) {
        console.log(api)
    }
}

test()
```

## 删除云函数 HTTP Service

### 1. 接口描述

接口功能：删除云函数 HTTP Service

接口声明：`commonService.call({ Action: 'DeleteCloudBaseGWAPI', Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段      | 必填 | 类型   | 说明                            |
| --------- | ---- | ------ | ------------------------------- |
| ServiceId | 是   | String | Service ID，该字段取值为环境 ID |
| Path      | 否   | String | 自定义路径                      |
| APIId     | 否   | String | APIId                           |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明                       |
| --------- | ---- | ------ | -------------------------- |
| RequestId | 是   | String | 请求唯一标识               |
| Count     | 是   | Number | 被删除的 HTTP Service 个数 |

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
        Action: 'DeleteCloudBaseGWAPI',
        Param: {
            ServiceId: envId,
            Path: '/sum'
            // APIId: apiId
        }
    })
    console.log(res.Count)
}

test()
```

## 绑定 HTTP Service 自定义域名

### 1. 接口描述

接口功能：绑定 HTTP Service 自定义域名

接口声明：`commonService.call({ Action: 'BindCloudBaseGWDomain', Param: {}}): Promise<Object>`

> 绑定自定义域名时，请务必在你的自定义域名厂商处 配置 CNAME 域名解析

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段      | 必填 | 类型   | 说明                            |
| --------- | ---- | ------ | ------------------------------- |
| ServiceId | 是   | String | Service ID，该字段取值为环境 ID |
| Domain    | 是   | String | 绑定的域名                      |
| CertId    | 否   | String | 证书 ID                         |

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
        Action: 'BindCloudBaseGWDomain',
        Param: {
            ServiceId: envId,
            Domain: 'xxx.xxx.xxx'
        }
    })
}

test()
```

## 查询 HTTP Service 域名

### 1. 接口描述

接口功能：查询 HTTP Service 域名

接口声明：`commonService.call({ Action: 'DescribeCloudBaseGWService', Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段      | 必填 | 类型   | 说明                            |
| --------- | ---- | ------ | ------------------------------- |
| ServiceId | 否   | String | Service ID，该字段取值为环境 ID |
| Domain    | 否   | String | 绑定的域名                      |

> ServiceId 与 Domain 至少要设置其中一个字段！

### 3. 返回结果

| 字段       | 必填 | 类型                             | 说明                  |
| ---------- | ---- | -------------------------------- | --------------------- |
| RequestId  | 是   | String                           | 请求唯一标识          |
| ServiceSet | 是   | Array.&lt;CloudBaseGWService&gt; | HTTP Service 域名信息 |

**CloudBaseGWService**

| 字段                                          | 必填 | 类型   | 说明                                       |
| --------------------------------------------- | ---- | ------ | ------------------------------------------ |
| ServiceId                                     | 是   | String | 请求唯一标识                               |
| Domain                                        | 是   | String | HTTP Service 域名信息                      |
| OpenTime                                      | 是   | Number | service 开启时间                           |
| Status                                        | 是   | Number | 绑定状态，1 绑定中；2 绑定失败；3 绑定成功 |
| 注意：此字段可能返回 null，表示取不到有效值。 |

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
        Action: 'DescribeCloudBaseGWService',
        Param: {
            ServiceId: envId
        }
    })
    const { Domain } = res
    console.log(Domain)
}
test()
```

## 解绑 HTTP Service 域名

### 1. 接口描述

接口功能：解绑 HTTP Service 域名

接口声明：`commonService.call({ Action: 'DeleteCloudBaseGWDomain', Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段      | 必填 | 类型   | 说明                            |
| --------- | ---- | ------ | ------------------------------- |
| ServiceId | 是   | String | Service ID，该字段取值为环境 ID |
| Domain    | 是   | String | 绑定的域名                      |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明                         |
| --------- | ---- | ------ | ---------------------------- |
| RequestId | 是   | String | 请求唯一标识                 |
| Count     | 是   | Number | 解绑的 HTTP Service 域名个数 |

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
        Action: 'DeleteCloudBaseGWDomain',
        Param: {
            ServiceId: envId,
            Domain: 'xxx.xxx.xxx'
        }
    })
    console.log(res.Count)
}

test()
```
