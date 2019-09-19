# 文件存储

文件存储 storage 可以对文件进行管理

获得 storage 实例

```js
import CloudBase from '@cloudbase/admin-node'

const { storage } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})
```

## 上传文件

### 接口定义

```js
uploadFile(localPath: string, cloudPath: string): Promise<void>
```

### 参数说明

| 参数名    | 类型   | 描述                           |
| --------- | ------ | ------------------------------ |
| localPath | string | 本地文件路径，建议传入绝对路径 |
| cloudPath | string | 云端文件路径：`dir/data.txt`   |

### 响应结果：void

### 调用示例

```js
import path from 'path'

await storage.upload(path.resolve('./data.txt'), 'files/data.txt')
```

## 下载文件

### 接口定义

```js
downloadFile(cloudPath: string, localPath): Promise<void>
```

### 参数说明

| 参数名    | 类型   | 描述                           |
| --------- | ------ | ------------------------------ |
| cloudPath | string | 云端文件路径：`dir/data.txt`   |
| localPath | string | 本地文件存储路径，文件需指定文件名称 |

### 响应结果：void

### 调用示例

```js
import path from 'path'
await storage.downloadFile('files/data.txt', path.resolve('./data.txt'))
```

## 列出文件夹下的所有文件

### 接口定义

```js
listDirectoryFiles(cloudDirectory: string, max = 20, marker = ''): Promise<IListFileInfo[]>
```

### 参数说明

| 参数名    | 类型   | 描述                                                                              |
| --------- | ------ | --------------------------------------------------------------------------------- |
| cloudDirectory | string | 云端文件夹路径：`dir/data/`                                                       |
| max       | number | 每次传输数据的最大条数，默认为 20，最大值为 1000                                  |
| marker    | string | 起始文件/文件夹路径，从该文件/文件夹路径之后（不含）按照 UTF-8 字典序返回文件信息 |

### 响应结果

```js
[
    {
        Key: 'string' // 对象键
        LastModified: 'string' // 对象最后修改时间，为 ISO8601 格式，如2019-05-24T10:56:40Z	date
        ETag: 'string' // 对象的实体标签（Entity Tag），是对象被创建时标识对象内容的信息标签，可用于检查对象的内容是否发生变化
        Size: 'number' // 对象大小，单位为 Byte
        Owner: 'string' // 对象持有者信息
        StorageClass: 'string' // 对象存储类型，标准存储 STANDARD
    }
]
```

### 调用示例

```js
const res1 = await storage.listDirectoryFiles('dir/data')

const res2 = await storage.listDirectoryFiles('dir/data', 20)

const res3 = await storage.listDirectoryFiles('dir/data', 20, 'dir/dat')
```

## 获取文件信息

### 接口定义

```js
getFileInfo(cloudPath: string): Promise<IFileInfo>
```

### 参数说明

| 参数名    | 类型   | 描述                        |
| --------- | ------ | --------------------------- |
| cloudPath | string | 云端文件路径 `dir/data.txt` |

### 响应结果

```js
{
    Size: 'string' // 文件大小 KB
    Type: 'string' // 文件类型
    Date: 'string' // 修改时间
    ETag: 'string' // 对象的实体标签（Entity Tag）
}
```

### 调用示例

```js
const info = await storage.getFileInfo('files/data.txt')
```

## 批量删除文件

### 接口定义

```js
deleteFile(cloudPathList: string[]): Promise<void>
```

### 参数说明

| 参数名        | 类型            | 描述                                            |
| ------------- | --------------- | ----------------------------------------------- |
| cloudPathList | `Array<string>` | 云端文件路径组成的字符串数组 `['dir/data.txt']` |

### 响应结果：void

### 调用示例

```js
await storage.deleteFile(['files/data.txt'])
```

## 删除文件夹

### 接口定义

```js
deleteDirectory(cloudDirectory: string): Promise<void>
```

### 参数说明

| 参数名         | 类型   | 描述           |
| -------------- | ------ | -------------- |
| cloudDirectory | string | 云端文件夹路径 |

### 响应结果：void

### 调用示例

```js
await storage.deleteDirectory('files/')
```

## 上传文件夹

此接口会遍历目标文件夹下所有的文件并上传，同时保持文件夹结构。

```js
uploadDirectory(source: string, cloudDirectory: string): Promise<void>
```

### 参数说明

| 参数名         | 类型   | 描述           |
| -------------- | ------ | -------------- |
| source         | string | 本地文件夹路径 |
| cloudDirectory | string | 云端文件夹路径 |

### 响应结果：void

### 调用示例

```js
import path from 'path'
await storage.uploadDirectory(path.resolve('./files'))
```

## 获取文件临时下载链接

### 接口定义

```js
getTemporaryUrl(fileList: (string | TempUrlInfo)[])
```

### 参数说明

| 参数名   | 类型                          | 描述                                |
| -------- | ----------------------------- | ----------------------------------- |
| fileList | `string | Array<TempUrlInfo>` | 云端文件路径数组或 TempUrlInfo 数组 |

TempUrlInfo

| 参数名    | 类型   | 描述                           |
| --------- | ------ | ------------------------------ |
| cloudPath | string | 云端文件路径                   |
| maxAge    | number | 临时下载链接有效时间，单位：秒 |

### 响应结果

```js
;[
    {
        fileId: '', // 文件 Id
        url: '' // 下载链接
    }
]
```

### 调用示例

```js
const urls = await storage.getTemporaryUrl(['files/data.txt'])

const urls2 = await storage.getTemporaryUrl([
    {
        cloudPath: 'files/data.txt',
        maxAge: 86400
    }
])
```
