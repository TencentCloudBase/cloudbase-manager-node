# 文件存储

## uploadFile

### 1. 接口描述

接口功能：上传文件

接口声明：

2.x 版本

> `uploadFile(options)`

1.x 版本

> `uploadFile(localPath: string, cloudPath: string)`

注意事项: v2.x 与 v1.x 不兼容

### 2. 输入参数

| 字段       | 必填 | 类型     | 说明                           |
| ---------- | ---- | -------- | ------------------------------ |
| localPath  | 是   | String   | 本地文件路径，建议传入绝对路径 |
| cloudPath  | 是   | String   | 云端文件路径：`dir/data.txt`   |
| onProgress | 是   | Function | 上传进度回调函数               |

注：当 localPath 为文件夹时，SDK 会尝试在此文件夹下（一级目录，不深度遍历）寻找和 cloudPath 中所存在文件同名的文件，如 cloudPath 为 `dir/data.txt`，则会寻找 'data.txt'。

### 3. 返回结果

无

### 4. 示例代码

```js
import path from 'path'

import CloudBase from '@cloudbase/manager-node'

const { storage } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  await storage.upload({
    localPath: path.resolve('./data.txt'),
    cloudPath: 'files/data.txt',
    onProgress: data => {}
  })
}

test()
```

## uploadDirectory

### 1. 接口描述

接口功能：上传文件夹

接口声明：

2.x 版本

> `uploadDirectory(options)`

1.x 版本

> `uploadDirectory(source: string, cloudPath: string)`

注意事项: v2.x 与 v1.x 不兼容

此接口会遍历目标文件夹下所有的文件并上传，同时保持文件夹结构。

### 2. 输入参数

| 字段       | 必填 | 类型     | 说明             |
| ---------- | ---- | -------- | ---------------- |
| localPath  | 是   | String   | 本地文件夹路径   |
| cloudPath  | 是   | String   | 云端文件夹路径   |
| onProgress | 是   | Function | 上传进度回调函数 |

### 3. 返回结果

无

### 4. 示例代码

```js
import path from 'path'

import CloudBase from '@cloudbase/manager-node'

const { storage } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  await storage.uploadDirectory({
    localPath: path.resolve('./files'),
    cloudPath: '',
    onProgress: data => {}
  })
}

test()
```

## downloadFile

### 1. 接口描述

接口功能：下载文件

接口声明：

2.x 版本

> `downloadFile(options)`

1.x 版本

> `downloadFile(cloudPath: string, localPath)`

注意事项: v2.x 与 v1.x 不兼容

### 2. 输入参数

| 字段      | 必填 | 类型   | 说明                                 |
| --------- | ---- | ------ | ------------------------------------ |
| cloudPath | 是   | String | 云端文件路径：`dir/data.txt`         |
| localPath | 是   | String | 本地文件存储路径，文件需指定文件名称 |

### 3. 返回结果

无(undefined)

### 4. 示例代码

```js
import path from 'path'

import CloudBase from '@cloudbase/manager-node'

const { storage } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  await storage.downloadFile({
    cloudPath: 'files/data.txt',
    localPath: path.resolve('./data.txt')
  })
}

test()
```

## downloadDirectory

### 1. 接口描述

接口功能：下载文件夹

接口声明：

2.x 版本

> `downloadDirectory(options)`

1.x 版本

> `downloadDirectory(cloudPath: string, localPath: string)`

注意事项: v2.x 与 v1.x 不兼容

### 2. 输入参数

| 字段      | 必填 | 类型   | 说明                                 |
| --------- | ---- | ------ | ------------------------------------ |
| cloudPath | 是   | String | 云端文件夹                           |
| localPath | 是   | String | 本地文件存储路径，文件需指定文件名称 |

### 3. 返回结果

无

### 4. 示例代码

```js
import path from 'path'

import CloudBase from '@cloudbase/manager-node'

const { storage } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  await storage.downloadDirectory({
    cloudPath: 'files/music',
    localPath: path.resolve('./music')
  })
}

test()
```

**NOTE：**

- 此操作会遍历文件夹下的所有文件，如果文件数量过多，可能会造成执行失败。
- 当 cloudPath 不存在时，SDK 不会下载文件，也不会抛出错误。

## listDirectoryFiles

### 1. 接口描述

接口功能：列出文件夹下的所有文件

接口声明：`listDirectoryFiles(cloudPath: string): Promise<IListFileInfo[]>`

### 2. 输入参数

| 字段      | 必填 | 类型   | 说明                        |
| --------- | ---- | ------ | --------------------------- |
| cloudPath | 是   | String | 云端文件夹路径：`dir/data/` |

### 3. 返回结果

| 字段 | 必填 | 类型                   | 说明     |
| ---- | ---- | ---------------------- | -------- |
| -    | 是   | Array.&lt;FileItem&gt; | 文件数组 |

#### FileItem

| 字段         | 必填 | 类型   | 说明                                                                                                 |
| ------------ | ---- | ------ | ---------------------------------------------------------------------------------------------------- |
| Key          | 是   | String | 对象键                                                                                               |
| LastModified | 是   | String | 对象最后修改时间，为 ISO8601 格式，如 2019-05-24T10:56:40Z date                                      |
| ETag         | 是   | String | 对象的实体标签（Entity Tag），是对象被创建时标识对象内容的信息标签，可用于检查对象的内容是否发生变化 |
| Size         | 是   | String | 对象大小，单位为 Byte                                                                                |
| Owner        | 是   | String | 对象持有者信息                                                                                       |
| StorageClass | 是   | String | 对象存储类型，标准存储 STANDARD                                                                      |

### 4. 示例代码

```js
import CloudBase from '@cloudbase/manager-node'

const { storage } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const res1 = await storage.listDirectoryFiles('dir/data')

  const res2 = await storage.listDirectoryFiles('dir/data', 20)

  const res3 = await storage.listDirectoryFiles('dir/data', 20, 'dir/dat')

  for (let item in res1) {
    console.log(item)
  }
}
test()
```

## getFileInfo

### 1. 接口描述

接口功能：获取文件信息

接口声明：`getFileInfo(cloudPath: string): Promise<IFileInfo>`

### 2. 输入参数

| 字段      | 必填 | 类型   | 说明                        |
| --------- | ---- | ------ | --------------------------- |
| cloudPath | 是   | String | 云端文件路径 `dir/data.txt` |

### 3. 返回结果

| 字段 | 必填 | 类型   | 说明                         |
| ---- | ---- | ------ | ---------------------------- |
| Size | 是   | String | 文件大小 KB                  |
| Type | 是   | String | 文件类型                     |
| Date | 是   | String | 修改时间                     |
| ETag | 是   | String | 对象的实体标签（Entity Tag） |

### 4. 示例代码

```js
import CloudBase from '@cloudbase/manager-node'

const { storage } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const info = await storage.getFileInfo('files/data.txt')
  console.log(info)
}

test()
```

## deleteFile

### 1. 接口描述

接口功能：批量删除文件

接口声明：`deleteFile(cloudPathList: string[])`

### 2. 输入参数

| 字段          | 必填 | 类型             | 说明                                            |
| ------------- | ---- | ---------------- | ----------------------------------------------- |
| cloudPathList | 是   | `Array.<string>` | 云端文件路径组成的字符串数组 `['dir/data.txt']` |

### 3. 返回结果

无

### 4. 示例代码

```js
import CloudBase from '@cloudbase/manager-node'

const { storage } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  await storage.deleteFile(['files/data.txt'])
}

test()
```

## deleteDirectory

### 1. 接口描述

接口功能：删除文件夹

接口声明：`deleteDirectory(cloudPath: string)`

### 2. 输入参数

| 字段      | 必填 | 类型   | 说明           |
| --------- | ---- | ------ | -------------- |
| cloudPath | 是   | String | 云端文件夹路径 |

**注意：** 当 cloudPath 不存在时，SDK 不会抛出错误。

### 3. 返回结果

无

### 4. 示例代码

```js
import CloudBase from '@cloudbase/manager-node'

const { storage } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  await storage.deleteDirectory('files/')
}

test()
```

## getTemporaryUrl

### 1. 接口描述

接口功能：获取文件临时下载链接

接口声明：`getTemporaryUrl(fileList: (string | TempUrlInfo)[]):Promise<Array.<FileUrlItem>>`

### 2. 输入参数

| 字段     | 必填 | 类型                           | 说明                                |
| -------- | ---- | ------------------------------ | ----------------------------------- |
| fileList | 是   | `String | Array.<TempUrlInfo>` | 云端文件路径数组或 TempUrlInfo 数组 |

#### TempUrlInfo

| 字段      | 必填 | 类型   | 说明                           |
| --------- | ---- | ------ | ------------------------------ |
| cloudPath | 是   | String | 云端文件路径                   |
| maxAge    | 是   | Number | 临时下载链接有效时间，单位：秒 |

### 3. 返回结果

| 字段 | 必填 | 类型                  | 说明             |
| ---- | ---- | --------------------- | ---------------- |
| -    | 是   | `Array.<FileUrlItem>` | 文件下载链接列表 |

#### FileUrlItem

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| fileId | 是   | String | 文件 Id  |
| url    | 是   | String | 下载链接 |

### 4. 示例代码

```js
import CloudBase from '@cloudbase/manager-node'

const { storage } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const urls = await storage.getTemporaryUrl(['files/data.txt'])

  const urls2 = await storage.getTemporaryUrl([
    {
      cloudPath: 'files/data.txt',
      maxAge: 86400
    }
  ])

  for (let item in urls) {
    console.log(item.url)
  }
}

test()
```

## getStorageAcl

### 1. 接口描述

接口功能：获取文件存储权限

接口声明：`getStorageAcl(): Promise<string>`

### 2. 输入参数

空

### 3. 返回结果

| 字段 | 必填 | 类型   | 说明     |
| ---- | ---- | ------ | -------- |
| -    | 是   | String | 权限类型 |

所有权限类型：

- READONLY：所有用户可读，仅创建者和管理员可写
- PRIVATE：仅创建者及管理员可读写
- ADMINWRITE：所有用户可读，仅管理员可写
- ADMINONLY：仅管理员可读写

### 4. 示例代码

```js
import CloudBase from '@cloudbase/manager-node'

const { storage } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const acl = await storage.getStorageAcl()
  console.log(acl)
}

test()
```

## setStorageAcl

### 1. 接口描述

接口功能：设置文件存储权限

接口声明：`setStorageAcl(acl: string):Promise<Object>`

### 2. 输入参数

| 字段 | 必填 | 类型     | 说明             |
| ---- | ---- | -------- | ---------------- |
| acl  | 是   | `String` | 文件存储权限描述 |

acl 支持选项：

- READONLY：所有用户可读，仅创建者和管理员可写
- PRIVATE：仅创建者及管理员可读写
- ADMINWRITE：所有用户可读，仅管理员可写
- ADMINONLY：仅管理员可读写

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```js
import CloudBase from '@cloudbase/manager-node'

const { storage } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  await storage.setStorageAcl('READONLY')
}

test()
```
