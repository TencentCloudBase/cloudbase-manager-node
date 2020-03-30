# 文档已迁移，请访问新的[文档站点](https://docs.cloudbase.net/api-reference/manager/node/introduction.html)查看详细的文档。

# 数据库

## createCollection

### 1. 接口描述

接口功能：该接口可创建集合

接口声明：

`createCollection(collectionName: string): Promise<Object>`

`createCollectionIfNotExists(collectionName: string): Promise<Object>`

### 2. 输入参数

| 字段           | 必填 | 类型   | 说明   |
| -------------- | ---- | ------ | ------ |
| CollectionName | 是   | String | 集合名 |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明         |
| --------- | ---- | ------ | ------------ |
| RequestId | 是   | String | 请求唯一标识 |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { database } = new CloudBase(cloudbaseConfig)

async function test() {
    let result = await database.createCollection('collectionName')
    console.log(result)
}

test()
```

## checkCollectionExists

### 1. 接口描述

接口功能：检查集合是否存在

接口声明：`checkCollectionExists(collectionName: string): Promise<Object>`

### 2. 输入参数

| 字段 | 必填 | 类型   | 说明   |
| ---- | ---- | ------ | ------ |
| -    | 是   | String | 集合名 |

### 3. 返回结果

| 字段      | 必填 | 类型    | 说明             |
| --------- | ---- | ------- | ---------------- |
| RequestId | 是   | String  | 请求唯一标识     |
| Msg       | 否   | String  | 错误信息         |
| Exists    | 是   | Boolean | 集合是否已经存在 |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { database } = new CloudBase(cloudbaseConfig)

async function test() {
    let result = await database.checkCollectionExists('collectionAlreadyExists')
    if (result.Exists) {
        // 集合存在
    } else {
        // 集合不存在
    }
}

test()
```

## deleteCollection

### 1. 接口描述

接口功能：删除集合

接口声明：`deleteCollection(collectionName: string): Promise<Object>`

### 2. 输入参数

| 字段           | 必填 | 类型   | 说明   |
| -------------- | ---- | ------ | ------ |
| CollectionName | 是   | String | 集合名 |

### 3. 返回结果

| 字段      | 必填 | 类型    | 说明                                 |
| --------- | ---- | ------- | ------------------------------------ |
| RequestId | 是   | String  | 请求唯一标识                         |
| Exists    | 否   | Boolean | 存在不返回该字段，不存在则返回 false |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { database } = new CloudBase(cloudbaseConfig)
async function test() {
    let result = await database.deleteCollection('collectionAlreadyExists')
    if (result.Exists === false) {
        // 集合不存在
    }
}

test()
```

## updateCollection

### 1. 接口描述

接口功能：更新集合

接口声明：`updateCollection(collectionName: string, options: array): Promise<Object>`

该接口可更新集合，但目前支持更新索引。

> ⚠️ 目前该接口只能更新索引，包括创建和删除。

-   索引创建时如果已经存在，则会先删除再创建索引。
-   因为一次接口调用可同时创建多个索引，所以可能部分索引创建失败，部分创建成功，接口报异常。

### 2. 输入参数

| 字段           | 必填 | 类型                 | 说明     |
| -------------- | ---- | -------------------- | -------- |
| collectionName | 是   | String               | 集合名   |
| options        | 是   | Array.&lt;Option&gt; | 配置选项 |

**Option**

| 字段          | 必填 | 类型                      | 说明               |
| ------------- | ---- | ------------------------- | ------------------ |
| CreateIndexes | 否   | Array.&lt;CreateIndex&gt; | 需要创建的索引列表 |
| DropIndexes   | 否   | Array.&lt;DropIndex&gt;   | 需要删除的索引列表 |

**CreateIndex**

| 字段         | 必填 | 类型                       | 说明     |
| ------------ | ---- | -------------------------- | -------- |
| IndexName    | 是   | String                     | 索引名称 |
| MgoKeySchema | 是   | Array.&lt;MgoKeySchema&gt; | 索引规则 |

**MgoKeySchema**

| 字段         | 必填 | 类型                      | 说明               |
| ------------ | ---- | ------------------------- | ------------------ |
| MgoIsUnique  | 是   | boolean                   | 是否唯一           |
| MgoIndexKeys | 是   | Array.&lt;MgoIndexKey&gt; | 索引包含的字段列表 |

**MgoIndexKey**

| 字段      | 必填 | 类型   | 说明                                                                                                     |
| --------- | ---- | ------ | -------------------------------------------------------------------------------------------------------- |
| Name      | 是   | String | 索引名称                                                                                                 |
| Direction | 是   | String | 索引方向，1：ASC，-1：DESC，2d：双向，如果有 2d，2d 必须放最前面,注：地理位置索引应设置该值为 "2dsphere" |

**DropIndex**

| 字段      | 必填 | 类型   | 说明     |
| --------- | ---- | ------ | -------- |
| IndexName | 是   | String | 索引名称 |

> 更新索引支持的两种方式，创建与删除，相互独立，不可在 options 同时传入 CreateIndexes，DropIndexes

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明         |
| --------- | ---- | ------ | ------------ |
| RequestId | 是   | String | 请求唯一标识 |

### 4. 示例代码

创建新索引

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { database } = new CloudBase(cloudbaseConfig)
async function test() {
    let result = await database.updateCollection('collectionAlreadyExists', {
        CreateIndexes: [
            {
                IndexName: 'index_a',
                MgoKeySchema: {
                    MgoIndexKeys: [
                        // 2d要放最前面
                        { Name: 'a_2d', Direction: '2d' },
                        { Name: 'a_1', Direction: '1' },
                        { Name: 'a_-1', Direction: '-1' }
                    ],
                    MgoIsUnique: false
                }
            },
            {
                IndexName: 'index_b',
                MgoKeySchema: {
                    MgoIndexKeys: [{ Name: 'b_1', Direction: '2d' }],
                    MgoIsUnique: true
                }
            },
            {
                IndexName: 'index_to_be_delete',
                MgoKeySchema: {
                    MgoIndexKeys: [{ Name: 'xxx', Direction: '2d' }],
                    MgoIsUnique: true
                }
            }
        ]
    })
    console.log(result)
}

test()
```

删除索引

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { database } = new CloudBase(cloudbaseConfig)

async function test() {
    let result = await database.updateCollection('collectionAlreadyExists', {
        DropIndexes: [{ IndexName: 'index_to_be_delete' }]
    })
    console.log(result)
}

test()
```

## describeCollection

### 1. 接口描述

接口功能：查询集合详细信息

接口声明：`describeCollection(collectionName: string): Promise<Object>`

### 2. 输入参数

| 字段           | 必填 | 类型   | 说明   |
| -------------- | ---- | ------ | ------ |
| CollectionName | 是   | String | 集合名 |

### 3. 返回结果

| 字段                         | 必填 | 类型   | 说明                                     |
| ---------------------------- | ---- | ------ | ---------------------------------------- |
| RequestId                    | 是   | String | 请求唯一标识                             |
| IndexNum                     | 是   | Number | 索引个数                                 |
| Indexes                      | 是   | Array  | 索引列表                                 |
| Indexes[N].Name              | 是   | String | 索引名称                                 |
| Indexes[N].Size              | 是   | String | 索引大小，单位: 字节                     |
| Indexes[N].Unique            | 是   | String | 是否为唯一索引                           |
| Indexes[N].Keys              | 是   | Array  | 索引键值                                 |
| Indexes[N].Keys[N].Name      | 是   | String | 键名                                     |
| Indexes[N].Keys[N].Direction | 是   | String | 索引方向，1： ASC， -1： DESC， 2d：双向 |
| Indexes[N].Accesses          | 是   | Array  | 索引使用信息                             |
| Indexes[N].Accesses[N].Ops   | 是   | Number | 索引命中次数                             |
| Indexes[N].Accesses[N].Since | 是   | String | 命中次数从何时开始计数                   |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { database } = new CloudBase(cloudbaseConfig)

async function test() {
    let result = await database.describeCollection('collectionAlreadyExists')
    const { Indexes } = result
    for (let index in Indexes) {
        console.log(index) // 遍历全部索引
    }
}

test()
```

## listCollections

### 1. 接口描述

接口功能：查询集合详细信息

接口声明：`listCollections(options: object): Promise<Object>`

### 2. 输入参数

| 字段      | 必填 | 类型   | 说明           |
| --------- | ---- | ------ | -------------- |
| MgoOffset | 否   | Number | 可选，偏移量   |
| MgoLimit  | 否   | Number | 可选，数量限制 |

### 3. 返回结果

| 字段                          | 必填 | 类型   | 说明                         |
| ----------------------------- | ---- | ------ | ---------------------------- |
| RequestId                     | 是   | String | 请求唯一标识                 |
| Collections                   | 是   | Array  | 集合列表                     |
| Collections[N].CollectionName | 是   | String | 集合名称                     |
| Collections[N].Count          | 是   | Number | 集合中文档数量               |
| Collections[N].Size           | 是   | Number | 集合占用空间大小，字节       |
| Collections[N].IndexCount     | 是   | Number | 集合中索引个数               |
| Collections[N].IndexSize      | 是   | Number | 集合中索引占用空间大小，字节 |
| Pager                         | 是   | Object | 本次查询分页信息             |
| Pager.Offset                  | 是   | Number | 偏移量                       |
| Pager.Limit                   | 是   | Number | 限制数量                     |
| Pager.Total                   | 是   | Number | 集合数量                     |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { database } = new CloudBase(cloudbaseConfig)

async function test() {
    let result = await database.listCollections({
        MgoOffset: 100,
        MgoLimit: 10
    })
    const { Collections } = result
    for (let collection in Collections) {
        console.log(collection) // 遍历全部collection
    }
}
```

## checkIndexExists

### 1. 接口描述

接口功能：检查索引是否存在

接口声明：`checkIndexExists(collectionName: string, indexName: string): Promise<Object>`

### 2. 输入参数

| 字段           | 必填 | 类型   | 说明   |
| -------------- | ---- | ------ | ------ |
| collectionName | 是   | String | 集合名 |
| indexName      | 是   | String | 索引名 |

### 3. 返回结果

| 字段      | 必填 | 类型    | 说明         |
| --------- | ---- | ------- | ------------ |
| RequestId | 是   | String  | 请求唯一标识 |
| Exists    | 是   | Boolean | 索引是否存在 |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { database } = new CloudBase(cloudbaseConfig)
async function test() {
    let result = await database.checkIndexExists('collectionAlreadyExists', 'index_to_be_delete')
    const { Exists } = result
    if (Exists === true) {
        //索引存在
    }
}
test()
```

## import

### 1. 接口描述

接口功能：导入数据

接口声明：`import(collectionName: string, file: object, options: object): Promise<Object>`

注意：

-   该接口立即返回，迁移状态（成功|失败）可通过 migrateStatus 查询。
-   导入数据需要先将文件上传到该环境（同一个 EnvId）下的对象存储中，所以会在对象存储中创建对象。
-   因为该函数成功返回只意味着上传成功，导入操作在上传后开始，该接口无法判断导入是否完成，所以该对象用完后需要手动删除。

### 2. 输入参数

| 字段              | 必填 | 类型    | 说明                                                                              |
| ----------------- | ---- | ------- | --------------------------------------------------------------------------------- |
| collectionName    | 是   | String  | 集合名                                                                            |
| file              | 是   | Array   | 数据，以下方式必选一种                                                            |
| ⁃ FilePath        | 是   | String  | 本地数据文件路径                                                                  |
| ⁃ ObjectKey       | 是   | String  | 本环境下对象存储 Key                                                              |
| options           | 否   | Array   | 可选参数                                                                          |
| ⁃ ObjectKeyPrefix | 否   | String  | 对象存储 Key 前缀，默认 tmp/db-imports/                                           |
| ⁃ FileType        | 否   | String  | 文件类型：csv 或 json，如果为传递此参数，默认为文件后缀名，注意使用正确的后缀名。 |
| ⁃ StopOnError     | 否   | Boolean | 遇到错误时是否停止导入。                                                          |
| ⁃ ConflictMode    | 否   | String  | 冲突处理方式：insert 或 upsert                                                    |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明                                           |
| --------- | ---- | ------ | ---------------------------------------------- |
| RequestId | 是   | String | 请求唯一标识                                   |
| JobId     | 是   | Number | 任务 ID，用于在 migrateStatus 接口查询迁移状态 |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { database } = new CloudBase(cloudbaseConfig)

async function test() {
    let res = await database.import(
        'collectionAlreadyExists',
        {
            ObjectKey: 'data.csv'
        },
        {
            // "FileType" : "csv",
            StopOnError: true,
            ConflictMode: 'upsert'
        }
    )

    const { JobId } = res
    console.log(JobId)
}

test()
```

## export

### 1. 接口描述

接口功能：导出数据，迁移状态（成功|失败）可通过 migrateStatus 查询。

接口声明：`export(collectionName: string, file: object, options: object): Promise<Object>`

### 2. 输入参数

| 字段           | 必填 | 类型   | 说明                                                                             |
| -------------- | ---- | ------ | -------------------------------------------------------------------------------- |
| collectionName | 是   | String | 集合名                                                                           |
| file           | 是   | Array  | 数据，以下方式必选一种                                                           |
| ⁃ ObjectKey    | 是   | String | 本环境下对象存储 Key                                                             |
| options        | 否   | Array  | 可选参数                                                                         |
| ⁃ FileType     | 否   | String | 文件类型：csv 或 json，如果为传递此参数，默认为文件后缀名，注意使用正确的后缀名  |
| ⁃ Query        | 否   | String | JSON 字符串，支持 mongo 指令。例如：'{ a: { gte: 3 } }'。与 mongodb 查询语法兼容 |
| ⁃ Skip         | 否   | Number | 偏移量                                                                           |
| ⁃ Limit        | 否   | Number | 限制数目                                                                         |
| ⁃ Sort         | 否   | Number | JSON 字符串，如果有索引则不支持排序，数据集的长度必须少于 32 兆                  |
| ⁃ Fields       | 否   | String | 字符串，字段以逗号分割。FileType=csv 时必填                                      |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明                                           |
| --------- | ---- | ------ | ---------------------------------------------- |
| RequestId | 是   | String | 请求唯一标识                                   |
| JobId     | 是   | Number | 任务 ID，用于在 migrateStatus 接口查询迁移状态 |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { database } = new CloudBase(cloudbaseConfig)

async function test() {
    let result = await database.export(
        'users',
        {
            ObjectKey: 'users.json'
        },
        {
            Fields: '_id,name',
            Query: '{"name":{"$exists":true}}',
            Sort: '{"name": -1}',
            Skip: 0,
            Limit: 1000
        }
    )
    const { JobId } = res
    console.log(JobId)
}

test()
```

## migrateStatus

### 1. 接口描述

接口功能：该接口可查询迁移（导入|导出）状态。

接口声明：`migrateStatus(jobId: number): Promise<Object>`

### 2. 输入参数

| 字段  | 必填 | 类型    | 说明                                       |
| ----- | ---- | ------- | ------------------------------------------ |
| jobId | 是   | Integer | 任务 ID，import 和 export 接口返回的 JobId |

### 3. 返回结果

| 字段          | 必填 | 类型    | 说明                                                                                                      |
| ------------- | ---- | ------- | --------------------------------------------------------------------------------------------------------- |
| RequestId     | 是   | String  | 请求唯一标识                                                                                              |
| Status        | 是   | String  | 任务状态。可能值：waiting：等待中，reading：读，writing：写，migrating：转移中，success：成功，fail：失败 |
| RecordSuccess | 是   | Integer | 迁移成功的数据条数                                                                                        |
| RecordFail    | 是   | Integer | 迁移失败的数据条数                                                                                        |
| ErrorMsg      | 是   | String  | 迁移失败的原因                                                                                            |
| FileUrl       | 是   | String  | 文件下载链接，仅在数据库导出中有效                                                                        |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}

let { database } = new CloudBase(cloudbaseConfig)

async function test() {
    let result = await database.migrateStatus(100093275)
    console.log(result.Status) // 打印迁移状态
}

test()
```

## distribution

### 1. 接口描述

接口功能：查询数据分布

接口声明：`distribution(): Promise<Object>`

### 2. 输入参数

无

### 3. 返回结果

| 字段                          | 必填 | 类型   | 说明         |
| ----------------------------- | ---- | ------ | ------------ |
| RequestId                     | 是   | String | 请求唯一标识 |
| Collections                   | 是   | Array  | 集合列表     |
| Collections[N].CollectionName | 是   | String | 集合名称     |
| Collections[N].DocCount       | 是   | Number | 文档数量     |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}
let { database } = new CloudBase(cloudbaseConfig)

async function test() {
    let result = await database.distribution()
    const { Collections } = result
    for (let collection in Collections) {
        console.log(collection)
    }
}

test()
```

## 数据库插入文档

### 1. 接口描述

接口功能：该接口用于向数据库中插入数据

接口声明：`manager.commonService('flexdb').call(option): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段      | 必填 | 类型                 | 说明                                    |
| --------- | ---- | -------------------- | --------------------------------------- |
| TableName | 是   | String               | 表名                                    |
| MgoDocs   | 是   | Array.&lt;String&gt; | 待插入文档                              |
| Tag       | 是   | String               | mongo 实例 ID， 可通过 envInfo 接口获取 |

### 3. 返回结果

| 字段        | 必填 | 类型                 | 说明                       |
| ----------- | ---- | -------------------- | -------------------------- |
| RequestId   | 是   | String               | 请求唯一标识               |
| InsertedIds | 是   | Array.&lt;String&gt; | 插入成功的数据集合主键\_id |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}
const manager = new CloudBase(cloudBaseConfig)

const data = JSON.stringify({
    a: 1
})

// 获取数据库实例ID
const { EnvInfo } = await manager.env.getEnvInfo()

const { Databases } = EnvInfo
console.log('Databases:', Databases)
const { InsertedIds } = await manager.commonService('flexdb').call({
    Action: 'PutItem',
    Param: {
        TableName: 'coll-1',
        MgoDocs: [data],
        Tag: Databases[0].InstanceId
    }
})
console.log('InsertedIds:', InsertedIds)
```

## 数据库查询文档

### 1. 接口描述

接口功能：该接口用于查询数据库文档

接口声明：`manager.commonService('flexdb').call(option): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段          | 必填 | 类型   | 说明                                                                                                                 |
| ------------- | ---- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| TableName     | 是   | String | 表名                                                                                                                 |
| MgoLimit      | 是   | Number | 查询返回结果 limit 数                                                                                                |
| MgoProjection | 否   | String | 投影条件，为一个 json 串，如{ item: 1, status: 1 }表示结果中返回 item 和 status 两个列；{ item: 0}表示不返回 item 列 |
| Tag           | 是   | String | mongo 实例 ID， 可通过 envInfo 接口获取                                                                              |
| MgoQuery      | 否   | String | 查询条件，查询条件为一个 json 串，如{"test":1}                                                                       |
| MgoOffset     | 否   | Number | 查询结果从 offset 条开始返回                                                                                         |
| MgoSort       | 否   | String | 排序条件，排序条件为一个 json 串                                                                                     |

### 3. 返回结果

| 字段      | 必填 | 类型                 | 说明                   |
| --------- | ---- | -------------------- | ---------------------- |
| RequestId | 是   | String               | 请求唯一标识           |
| Pager     | 是   | Pager                | 分页信息               |
| Data      | 是   | Array.&lt;String&gt; | 满足查询条件的数据集合 |

| 字段   | 必填 | 类型   | 说明           |
| ------ | ---- | ------ | -------------- |
| Offset | 是   | Number | 分页偏移量     |
| Limit  | 是   | Number | 每页返回记录数 |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}
const manager = new CloudBase(cloudBaseConfig)

// 获取数据库实例ID
const { EnvInfo } = await manager.env.getEnvInfo()

const { Databases } = EnvInfo
console.log('Databases:', Databases)
const { Data } = await manager.commonService('flexdb').call({
    Action: 'Query',
    Param: {
        TableName: 'coll-1',
        MgoQuery: JSON.stringify({ a: 1 }),
        Tag: Databases[0].InstanceId,
        MgoLimit: 20
    }
})
console.log('Data:', Data)
```

## 数据库更新文档

### 1. 接口描述

接口功能：该接口用于更新数据库文档

接口声明：`manager.commonService('flexdb').call(option): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段       | 必填 | 类型    | 说明                                           |
| ---------- | ---- | ------- | ---------------------------------------------- |
| Tag        | 是   | String  | mongo 实例 ID， 可通过 envInfo 接口获取        |
| MgoQuery   | 否   | String  | 查询条件，查询条件为一个 json 串，如{"test":1} |
| MgoUpdate  | 是   | String  | 更新内容                                       |
| TableName  | 是   | String  | 表名                                           |
| MgoIsMulti | 否   | Boolean | 是否更新多条                                   |
| MgoUpsert  | 否   | Boolean | 是否使用 upsert 模式                           |

### 3. 返回结果

| 字段        | 必填 | 类型   | 说明                   |
| ----------- | ---- | ------ | ---------------------- |
| RequestId   | 是   | String | 请求唯一标识           |
| UpsertedId  | 是   | String | 插入的数据\_id         |
| ModifiedNum | 是   | Number | 已经修改的行数         |
| MatchedNum  | 是   | Number | 更新条件匹配到的结果数 |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}
const manager = new CloudBase(cloudBaseConfig)

// 获取数据库实例ID
const { EnvInfo } = await manager.env.getEnvInfo()

const { Databases } = EnvInfo
console.log('Databases:', Databases)
const { ModifiedNum } = await manager.commonService('flexdb').call({
    Action: 'UpdateItem',
    Param: {
        TableName: 'coll-1',
        MgoUpdate: JSON.stringify({ a: 2 }),
        MgoQuery: JSON.stringify({ a: 1 }),
        Tag: Databases[0].InstanceId
    }
})
console.log('ModifiedNum:', ModifiedNum)
```

## 数据库删除文档

### 1. 接口描述

接口功能：该接口用于删除数据库文档

接口声明：`manager.commonService('flexdb').call(option): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| Action | 是   | String | 接口名称 |
| Param  | 是   | Object | 接口参数 |

#### Param 字段说明

| 字段       | 必填 | 类型    | 说明                                           |
| ---------- | ---- | ------- | ---------------------------------------------- |
| Tag        | 是   | String  | mongo 实例 ID， 可通过 envInfo 接口获取        |
| MgoQuery   | 否   | String  | 查询条件，查询条件为一个 json 串，如{"test":1} |
| TableName  | 是   | String  | 表名                                           |
| MgoIsMulti | 否   | Boolean | 是否更新多条                                   |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明           |
| --------- | ---- | ------ | -------------- |
| RequestId | 是   | String | 请求唯一标识   |
| Deleted   | 是   | Number | 删除数据的条数 |

### 4. 示例代码

```javascript
const cloudbaseConfig = {
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
}
const manager = new CloudBase(cloudBaseConfig)

// 获取数据库实例ID
const { EnvInfo } = await manager.env.getEnvInfo()

const { Databases } = EnvInfo
console.log('Databases:', Databases)
const { Deleted } = await manager.commonService('flexdb').call({
    Action: 'DeleteItem',
    Param: {
        TableName: 'coll-1',
        MgoQuery: JSON.stringify({ a: 2 }),
        Tag: Databases[0].InstanceId
    }
})
console.log('Deleted:', Deleted)
```
