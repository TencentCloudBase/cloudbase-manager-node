# 安全规则

安全规则的接口，可通过 [commonService ](./common.md)来调用

### 权限类别(以下前 4 种属于简易权限，CUSTOM 属于安全规则特有)

- READONLY：所有用户可读，仅创建者和管理员可写
- PRIVATE：仅创建者及管理员可读写
- ADMINWRITE：所有用户可读，仅管理员可写
- ADMINONLY：仅管理员可读写
- CUSTOM: 自定义安全规则

## 获取数据库简易权限

### 1. 接口描述

接口功能：获取数据库简易权限

接口声明：`commonService.call({Action: 'DescribeDatabaseACL',Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段           | 必填 | 类型   | 说明    |
| -------------- | ---- | ------ | ------- |
| CollectionName | 是   | String | 集合名  |
| EnvId          | 是   | String | 环境 ID |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明         |
| --------- | ---- | ------ | ------------ |
| RequestId | 是   | String | 请求唯一标识 |
| AclTag    | 否   | String | 权限类别     |

### 4. 示例代码

```js
const cloudbaseConfig = {
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { commonService } = new CloudBase(cloudbaseConfig)

async function test() {
  const res = await commonService.call({
    Action: 'DescribeDatabaseACL',
    Param: {
      CollectionName: 'xxx',
      EnvId: cloudbaseConfig.envId
    }
  })

  console.log(res.AclTag) // 打印权限类别
}

test()
```

## 修改数据库简易权限

### 1. 接口描述

接口功能：修改数据库简易权限

接口声明：`commonService.call({Action: 'ModifyDatabaseACL',Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段           | 必填 | 类型   | 说明                                                 |
| -------------- | ---- | ------ | ---------------------------------------------------- |
| CollectionName | 是   | String | 集合名                                               |
| AclTag         | 是   | String | 数据库简易权限 READONLY PRIVATE ADMINWRITE ADMINONLY |
| EnvId          | 是   | String | 环境 ID                                              |

### 3. 返回结果

| 字段      | 必填   | 类型 | 说明         |
| --------- | ------ | ---- | ------------ |
| RequestId | String | 是   | 请求唯一标识 |

### 4. 示例代码

```js
const cloudbaseConfig = {
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { commonService } = new CloudBase(cloudBaseConfig)

async function test() {
  const res = await commonService.call({
    Action: 'ModifyDatabaseACL',
    Param: {
      CollectionName: 'xxx',
      EnvId: cloudbaseConfig.envId,
      AclTag: 'PRIVATE'
    }
  })
  console.log(res)
}

test()
```

## 设置数据库安全规则

### 1. 接口描述

接口功能：设置数据库安全规则

接口声明：`commonService.call({Action: 'ModifySafeRule',Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段           | 必填 | 类型   | 说明                                                                                                                   |
| -------------- | ---- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| CollectionName | 是   | String | 集合名                                                                                                                 |
| EnvId          | 是   | String | 环境 ID                                                                                                                |
| AclTag         | 是   | String | 权限类别                                                                                                               |
| Rule           | 否   | String | 权限类别设置为 CUSTOM 时，需要设置该字段（[数据库安全规则文档](https://cloud.tencent.com/document/product/876/36414)） |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明         |
| --------- | ---- | ------ | ------------ |
| RequestId | 是   | String | 请求唯一标识 |

### 4. 示例代码

```js
const cloudbaseConfig = {
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { commonService } = new CloudBase(cloudBaseConfig)

async function test() {
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
  console.log(res)
}

test()
```

## 查询数据库安全规则

### 1. 接口描述

接口功能：查询数据库安全规则

接口声明：`commonService.call({Action: 'DescribeSafeRule',Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段           | 必填 | 类型   | 说明    |
| -------------- | ---- | ------ | ------- |
| CollectionName | 是   | String | 集合名  |
| EnvId          | 是   | String | 环境 ID |

### 3. 返回结果

| 字段      | 必填 | 类型           | 说明         |
| --------- | ---- | -------------- | ------------ |
| RequestId | 是   | String         | 请求唯一标识 |
| AclTag    | 是   | String         | 权限类别     |
| Rule      | 是   | String or null | 安全规则     |

### 4. 示例代码

```js
const cloudbaseConfig = {
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { commonService } = new CloudBase(cloudBaseConfig)

async function test() {
  const res = await commonService.call({
    Action: 'DescribeSafeRule',
    Param: {
      CollectionName: 'coll-1',
      EnvId: cloudbaseConfig.envId
    }
  })
  console.log(res.AclTag)
  console.log(res.Rule)
}
test()
```

## 设置存储安全规则

### 1. 接口描述

接口功能：设置存储安全规则

接口声明：`commonService.call({Action: 'ModifyStorageSafeRule',Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段   | 必填 | 类型   | 说明                                                                                                                        |
| ------ | ---- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Bucket | 是   | String | 桶名                                                                                                                        |
| AclTag | 是   | String | [权限类别](#权限类别)                                                                                                       |
| EnvId  | 是   | String | 环境 ID                                                                                                                     |
| Rule   | 否   | String | 权限类别为 CUSTOM 时，设置该字段，[存储安全规则文档](https://tencentcloudbase.github.io/2020-01-09-storage-security-rules/) |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明         |
| --------- | ---- | ------ | ------------ |
| RequestId | 是   | String | 请求唯一标识 |

### 4. 示例代码

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

async function test() {
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
  console.log(res)
}
test()
```

## 查询存储安全规则

### 1. 接口描述

接口功能：查询存储安全规则

接口声明：`commonService.call({Action: 'DescribeStorageSafeRule',Param: {}}): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段   | 必填 | 类型   | 说明    |
| ------ | ---- | ------ | ------- |
| Bucket | 是   | String | 桶名称  |
| EnvId  | 是   | String | 环境 ID |

### 3. 返回结果

| 字段      | 必填 | 类型           | 说明         |
| --------- | ---- | -------------- | ------------ |
| RequestId | 是   | String         | 请求唯一标识 |
| AclTag    | 是   | String         | 权限类别     |
| Rule      | 是   | String or null | 安全规则     |

### 4. 示例代码

```js
const cloudbaseConfig = {
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { commonService } = new CloudBase(cloudBaseConfig)

async function test() {
  const res = await commonService.call({
    Action: 'DescribeStorageSafeRule',
    Param: {
      Bucket: 'xxx',
      EnvId: cloudBaseConfig.envId
    }
  })
  console.log(res.AclTag)
  console.log(res.Rule)
}

test()
```
