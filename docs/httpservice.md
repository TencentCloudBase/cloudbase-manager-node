# HTTP Service

HTTP Service 是云开发为开发者提供的 HTTP 访问服务，让开发者可以通过 HTTP 访问到自己的云开发资源。

HTTP Service 的如下接口，可通过 [commonService 实例](./common.md)来调用

获得当前环境下的 commonService 实例，示例代码如下：

```javascript
import CloudBase from '@cloudbase/manager-node'

const { commonService } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})
```

## 目录

-   [创建云函数 HTTP Service](#1)
-   [查询云函数 HTTP Service](#2)
-   [删除云函数 HTTP Service](#3)
-   [绑定 HTTP Service 自定义域名](#4)
-   [查询 HTTP Service 域名](#5)
-   [解绑 HTTP Service 域名](#6)

<h2 id="1">创建云函数 HTTPService</h2>

### Param 字段说明

| 参数名    | 是否必填 | 类型   | 描述                            |
| --------- | -------- | ------ | ------------------------------- |
| ServiceId | 是       | String | Service ID，该字段取值为环境 ID |
| Path      | 是       | String | 自定义路径                      |
| Type      | 是       | Number | service type ，云函数默认为 1   |
| Name      | 是       | String | 函数名                          |

### 调用示例

```javascript
const res = await commonService.call({
    Action: 'CreateCloudBaseGWAPI',
    Param: { ServiceId: envId, Path: '/sum', Type: 1, Name: 'sum' }
})
```

### 返回示例

```json
{
    "RequestId": "C563943B-3BEA-FE92-29FE-591EAEB7871F",
    "APIId": "xxxxx"
}
```

**返回字段描述**

| 参数名    | 类型   | 描述         |
| --------- | ------ | ------------ |
| RequestId | String | 请求唯一标识 |
| APIId     | String | APIId        |

<h2 id="2">查询云函数 HTTP Service</h2>

### Param 字段说明

| 参数名    | 是否必填 | 类型   | 描述                            |
| --------- | -------- | ------ | ------------------------------- |
| ServiceId | 否       | String | Service ID，该字段取值为环境 ID |
| Domain    | 否       | String | 绑定的域名                      |
| Path      | 否       | String | 自定义路径                      |
| APIId     | 否       | String | APIId                           |

> ServiceId 与 Domain 至少要设置其中一个字段！

### 调用示例

```javascript
const res = await commonService.call({
    Action: 'DescribeCloudBaseGWAPI',
    Param: {
        ServiceId: envId,
        Path: '/sum'
    }
})
```

### 返回示例

```json
{
    "APISet": [
        {
            "ServiceId": "xxx",
            "APIId": "722fb485-3455-4e43-a4ec-3e4f1862659b",
            "Path": "/sum",
            "Type": 1,
            "Name": "sum",
            "CreateTime": 1578807032,
            "EnvId": "xxx"
        }
    ],
    "RequestId": "4bad4948-fe8a-4aa3-ab22-0993eff32014"
}
```

**返回字段描述**

| 参数名    | 类型                         | 描述              |
| --------- | ---------------------------- | ----------------- |
| RequestId | String                       | 请求唯一标识      |
| APISet    | Array.&lt;CloudBaseGWAPI&gt; | HTTP service 列表 |

**CloudBaseGWAPI**
| 参数名 | 类型 | 描述 |
| --------- | ---------------------------- | ----------------- |
| ServiceId | String | 环境 ID |
| APIId | String | APIId|
| Path | String |自定义路径 |
| Type | Number | service type ，云函数默认为 1|
| Name | String | 云函数名|
| CreateTime | Number | service 创建时间|
| EnvId | String | 环境 ID|

<h2 id="3">删除云函数 HTTP Service</h2>

### Param 字段说明

| 参数名    | 是否必填 | 类型   | 描述                            |
| --------- | -------- | ------ | ------------------------------- |
| ServiceId | 是       | String | Service ID，该字段取值为环境 ID |
| Path      | 否       | String | 自定义路径                      |
| APIId     | 否       | String | APIId                           |

### 调用示例

```javascript
const res = await commonService.call({
    Action: 'DeleteCloudBaseGWAPI',
    Param: {
        ServiceId: envId,
        Path: '/sum'
        // APIId: apiId
    }
})
```

### 返回示例

```json
{
    "Count": 1,
    "RequestId": "4bad4948-fe8a-4aa3-ab22-0993eff32014"
}
```

**返回字段描述**

| 参数名    | 类型   | 描述                       |
| --------- | ------ | -------------------------- |
| RequestId | String | 请求唯一标识               |
| Count     | Number | 被删除的 HTTP Service 个数 |

<h2 id="4">绑定 HTTP Service 自定义域名</h2>

> 绑定自定义域名时，请务必在你的自定义域名厂商处 配置 CNAME 域名解析

### Param 字段说明

| 参数名    | 是否必填 | 类型   | 描述                            |
| --------- | -------- | ------ | ------------------------------- |
| ServiceId | 是       | String | Service ID，该字段取值为环境 ID |
| Domain    | 是       | String | 绑定的域名                      |

### 调用示例

```javascript
const res = await commonService.call({
    Action: 'BindCloudBaseGWDomain',
    Param: {
        ServiceId: envId,
        Domain: 'xxx.xxx.xxx'
    }
})
```

### 返回示例

```json
{
    "RequestId": "4bad4948-fe8a-4aa3-ab22-0993eff32014"
}
```

**返回字段描述**

| 参数名    | 类型   | 描述         |
| --------- | ------ | ------------ |
| RequestId | String | 请求唯一标识 |

<h2 id="5">查询 HTTP Service 域名</h2>

### Param 字段说明

| 参数名    | 是否必填 | 类型   | 描述                            |
| --------- | -------- | ------ | ------------------------------- |
| ServiceId | 否       | String | Service ID，该字段取值为环境 ID |
| Domain    | 否       | String | 绑定的域名                      |

> ServiceId 与 Domain 至少要设置其中一个字段！

### 调用示例

```javascript
const res = await commonService.call({
    Action: 'DescribeCloudBaseGWService',
    Param: {
        ServiceId: envId
    }
})
```

### 返回示例

```json
{
    "RequestId": "dee090f3-82de-4f39-a33d-2eb991b2d135",
    "ServiceSet": [
        { "ServiceId": "luke-87pns", "Domain": "test.valleywind.net", "OpenTime": 1578807034 }
    ]
}
```

**返回字段描述**

| 参数名     | 类型                             | 描述                  |
| ---------- | -------------------------------- | --------------------- |
| RequestId  | String                           | 请求唯一标识          |
| ServiceSet | Array.&lt;CloudBaseGWService&gt; | HTTP Service 域名信息 |

**CloudBaseGWService**
| 参数名 | 类型 | 描述 |
| ---------- | -------------------------------- | --------------------- |
| ServiceId | String | 请求唯一标识 |
| Domain | String | HTTP Service 域名信息 |
| OpenTime | Number | service 开启时间 |

<h2 id="6">解绑HTTP Service域名</h2>

### Param 字段说明

| 参数名    | 是否必填 | 类型   | 描述                            |
| --------- | -------- | ------ | ------------------------------- |
| ServiceId | 是       | String | Service ID，该字段取值为环境 ID |
| Domain    | 是       | String | 绑定的域名                      |

### 调用示例

```javascript
const res = await commonService.call({
    Action: 'DeleteCloudBaseGWDomain',
    Param: {
        ServiceId: envId,
        Domain: 'xxx.xxx.xxx'
    }
})
```

### 返回示例

```json
{
    "Count": 1,
    "RequestId": "4bad4948-fe8a-4aa3-ab22-0993eff32014"
}
```

**返回字段描述**

| 参数名    | 类型   | 描述                         |
| --------- | ------ | ---------------------------- |
| RequestId | String | 请求唯一标识                 |
| Count     | Number | 解绑的 HTTP Service 域名个数 |
