# 安全规则

安全规则的如下接口，可通过 [commonService 实例](./common.md)来调用

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

-   [获取数据库简易权限](#获取数据库简易权限)
-   [修改数据库简易权限](#修改数据库简易权限)
-   [设置数据库安全规则](#设置数据库安全规则)
-   [查询数据库安全规则](#查询数据库安全规则)
-   [设置存储安全规则](#查询数据库安全规则)
-   [查询存储安全规则](#查询数据库安全规则)

#### 权限类别(以下前 4 种属于简易权限，CUSTOM 属于安全规则特有)

-   READONLY：所有用户可读，仅创建者和管理员可写
-   PRIVATE：仅创建者及管理员可读写
-   ADMINWRITE：所有用户可读，仅管理员可写
-   ADMINONLY：仅管理员可读写
-   CUSTOM: 自定义安全规则

## 获取数据库简易权限

### Param 字段说明

| 参数名         | 是否必填 | 类型   | 描述    |
| -------------- | -------- | ------ | ------- |
| CollectionName | 是       | String | 集合名  |
| EnvId          | 是       | String | 环境 ID |

### 调用示例

```js
const res = await commonService.call({
    Action: 'DescribeDatabaseACL',
    Param: {
        CollectionName: 'xxx',
        EnvId: 'xxx'
    }
})
```

### 返回示例

```json
{
    "RequestId": "C563943B-3BEA-FE92-29FE-591EAEB7871F",
    "AclTag": "PRIVATE"
}
```

**返回字段描述**

| 参数名    | 类型   | 描述         |
| --------- | ------ | ------------ |
| RequestId | String | 请求唯一标识 |
| AclTag    | String | 权限类别     |

## 修改数据库简易权限

### Param 字段说明

| 参数名         | 是否必填 | 类型   | 描述                                                 |
| -------------- | -------- | ------ | ---------------------------------------------------- |
| CollectionName | 是       | String | 集合名                                               |
| AclTag         | 是       | String | 数据库简易权限 READONLY PRIVATE ADMINWRITE ADMINONLY |
| EnvId          | 是       | String | 环境 ID                                              |

### 调用示例

```js
const res = await commonService.call({
    Action: 'ModifyDatabaseACL',
    Param: {
        CollectionName: 'xxx',
        AclTag: 'PRIVATE',
        EnvId: 'xxx'
    }
})
```

### 返回示例

```json
{
    "RequestId": "C563943B-3BEA-FE92-29FE-591EAEB7871F"
}
```

**返回字段描述**

| 参数名    | 类型   | 描述         |
| --------- | ------ | ------------ |
| RequestId | String | 请求唯一标识 |

## 设置数据库安全规则

### Param 字段说明

| 参数名         | 是否必填 | 类型   | 描述                                                                                                                   |
| -------------- | -------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| CollectionName | 是       | String | 集合名                                                                                                                 |
| EnvId          | 是       | String | 环境 ID                                                                                                                |
| AclTag         | 是       | String | 权限类别                                                                                                               |
| Rule           | 否       | String | 权限类别设置为 CUSTOM 时，需要设置该字段（[数据库安全规则文档](https://cloud.tencent.com/document/product/876/36414)） |

### 调用示例

```js
const res = await commonService.call({
    Action: 'ModifySafeRule',
    Param: {
        CollectionName: 'coll-1',
        AclTag: 'CUSTOM',
        EnvId: 'xxx',
        Rule: JSON.stringify({
            read: true,
            write: 'doc._openid == auth.openid'
        })
    }
})
```

### 返回示例

```json
{
    "RequestId": "C563943B-3BEA-FE92-29FE-591EAEB7871F"
}
```

**返回字段描述**

| 参数名    | 类型   | 描述         |
| --------- | ------ | ------------ |
| RequestId | String | 请求唯一标识 |

## 查询数据库安全规则

### Param 字段说明

| 参数名         | 是否必填 | 类型   | 描述    |
| -------------- | -------- | ------ | ------- |
| CollectionName | 是       | String | 集合名  |
| EnvId          | 是       | String | 环境 ID |

### 调用示例

```js
const res = await commonService.call({
    Action: 'DescribeSafeRule',
    Param: {
        CollectionName: 'coll-1',
        EnvId: envId
    }
})
```

### 返回示例

```json
{
    "RequestId": "C563943B-3BEA-FE92-29FE-591EAEB7871F",
    "AclTag": "CUSTOM",
    "Rule": "xxxx"
}
```

**返回字段描述**

| 参数名    | 类型           | 描述         |
| --------- | -------------- | ------------ |
| RequestId | String         | 请求唯一标识 |
| AclTag    | String         | 权限类别     |
| Rule      | String or null | 安全规则     |

## 设置存储安全规则

### Param 字段说明

| 参数名 | 是否必填 | 类型   | 描述                                                                                                                        |
| ------ | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Bucket | 是       | String | 桶名                                                                                                                        |
| AclTag | 是       | String | [权限类别](#权限类别)                                                                                                       |
| EnvId  | 是       | String | 环境 ID                                                                                                                     |
| Rule   | 否       | String | 权限类别为 CUSTOM 时，设置该字段，[存储安全规则文档](https://tencentcloudbase.github.io/2020-01-09-storage-security-rules/) |

### 调用示例

```js
const { commonService, env } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})
// 先获取桶名
const {
    EnvInfo: { Storages }
} = await env.getEnvInfo()
const { Bucket } = Storages[0]

const res = await commonService.call({
    Action: 'ModifyStorageSafeRule',
    Param: {
        Bucket,
        AclTag: 'CUSTOM',
        EnvId: envId,
        Rule: JSON.stringify({
            read: true,
            write: 'resource.openid == auth.uid'
        })
    }
})
```

### 返回示例

```json
{
    "RequestId": "C563943B-3BEA-FE92-29FE-591EAEB7871F"
}
```

**返回字段描述**

| 参数名    | 类型   | 描述         |
| --------- | ------ | ------------ |
| RequestId | String | 请求唯一标识 |

## 查询存储安全规则

### Param 字段说明

| 参数名 | 是否必填 | 类型   | 描述    |
| ------ | -------- | ------ | ------- |
| Bucket | 是       | String | 桶名称  |
| EnvId  | 是       | String | 环境 ID |

### 调用示例

```js
const res = await commonService.call({
    Action: 'DescribeStorageSafeRule',
    Param: {
        Bucket: 'xxx',
        EnvId: envId
    }
})
```

### 返回示例

```json
{
    "RequestId": "C563943B-3BEA-FE92-29FE-591EAEB7871F",
    "AclTag": "CUSTOM",
    "Rule": "xxxx"
}
```

**返回字段描述**

| 参数名    | 类型           | 描述         |
| --------- | -------------- | ------------ |
| RequestId | String         | 请求唯一标识 |
| AclTag    | String         | 权限类别     |
| Rule      | String or null | 安全规则     |
