# 文档已迁移，请访问新的[文档站点](https://docs.cloudbase.net/api-reference/manager/node/introduction.html)查看详细的文档。

# 云函数

## listFunctions

### 1. 接口描述

接口功能：获取云函数列表

接口声明：`listFunctions(limit, offset): Promise<Object>`

### 2. 输入参数

| 字段   | 必填 | 类型   | 说明 |
| ------ | ---- | ------ | ---- |
| limit  | 否   | Number | 范围 |
| offset | 否   | Number | 偏移 |

### 3. 返回结果

| 字段                     | 必填 | 类型   | 说明         |
| ------------------------ | ---- | ------ | ------------ |
| RequestID                | 是   | String | 请求唯一标识 |
| TotalCount               | 是   | Number | 总数         |
| Functions                | 是   | Array  | 函数列表     |
| Functions[].FunctionId   | 是   | String | 函数 ID      |
| Functions[].FunctionName | 是   | String | 函数名称     |
| Functions[].Namespace    | 是   | String | 命名空间     |
| Functions[].Runtime      | 是   | String | 运行时间     |
| Functions[].AddTime      | 是   | String | 创建时间     |
| Functions[].ModTime      | 是   | String | 修改时间     |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    let res = await functions.listFunctions(20, 0)
    const { Functions } = res
    for(let function in Functions) {
        console.log(function)
    }
}

test()
```

## createFunction

### 1. 接口描述

接口功能：创建函数

接口声明：`createFunction(funcParam: ICreateFunctionParam): Promise<Object>`

> ⚠️ 本接口从 2.0.0 版本后，请求参数由( func: ICloudFunction, functionRootPath: string, force: boolean, base64Code: string ) 转换为 (funcParam: ICreateFunctionParam)，属于不兼容变更

### 2. 输入参数

#### ICreateFunctionParam

| 字段             | 必填 | 类型           | 说明                   |
| ---------------- | ---- | -------------- | ---------------------- |
| func             | 是   | ICloudFunction | 函数配置               |
| functionRootPath | 否   | String         | 用户本地函数文件目录   |
| force            | 是   | Boolean        | 是否覆盖同名函数       |
| base64Code       | 否   | String         | 函数文件的 base64 编码 |
| codeSecret       | 否   | String         | 代码保护密钥           |

**注：如果只更新函数代码，请使用 `updateFunctionCode` 接口。**

**注：如果存在同名云函数，并设置了 force 选项为 true，SDK 将会自动更新函数代码，更新函数配置并创建触发器。**

**注：createFunction 支持两种方式创建函数，1. 用户指定本地的函数文件根目录(绝对地址); 2. 用户将函数代码包压缩为 zip 文件后进行 base64 转码，传入 base64Code 参数**

**注：`ICloudFunctionConfig` 为旧参数结构体**

#### ICloudFunctionConfig

| 字段              | 必填 | 类型                          | 说明                                              |
| ----------------- | ---- | ----------------------------- | ------------------------------------------------- |
| timeout           | 否   | Number                        | 函数超时时间                                      |
| envVariables      | 否   | Object                        | 包含环境变量的键值对对象                          |
| vpc               | 否   | [IFunctionVPC](#ifunctionvpc) | 私有网络配置                                      |
| runtime           | 否   | String                        | 运行时环境配置，可选值： `Nodejs8.9, Php7, Java8` |
| installDependency | 否   | Boolean                       | 是否安装依赖，仅 Node 有效                        |

#### ICloudFunction

| 字段              | 必填 | 类型                                                     | 说明                                              |
| ----------------- | ---- | -------------------------------------------------------- | ------------------------------------------------- |
| name              | 是   | String                                                   | 函数名称                                          |
| timeout           | 否   | Number                                                   | 函数超时时间                                      |
| envVariables      | 否   | Object                                                   | 包含环境变量的键值对对象                          |
| vpc               | 否   | [IFunctionVPC](#IFunctionVPC)                            | 私有网络配置                                      |
| runtime           | 否   | String                                                   | 运行时环境配置，可选值： `Nodejs8.9, Php7, Java8` |
| installDependency | 否   | Boolean                                                  | 是否安装依赖，仅 Node 有效                        |
| triggers          | 否   | Array of [ICloudFunctionTrigger](#ICloudFunctionTrigger) |                                                   |
| handler           | 否   | String                                                   | 函数入口                                          |
| ignore            | 否   | String 或 Array.&lt;String&gt;                           | 上传函数代码时忽略的文件，以 Glob 模式匹配        |
| isWaitInstall     | 否   | Boolean                                                  | 是否等待依赖安装完成                              |

**注：`handler` 函数处理入口，Node 项目默认值为 index.main，入口文件只能在根目录，如 node 项目的 index.main，指向的是 index.js 文件的 main 方法**

**注：如果使用在线安装依赖 Node 运行时 `runtime` 必须设置为 `Nodejs8.9`，且必须在入口文件同级目录设置 package.json，在线安装依赖暂不支持其他运行时**
**如果不使用在线安装依赖，Node 运行时无需填 `runtime` （默认`Nodejs8.9`），但使用 Php 和 Java 则必填`runtime` 。**

#### ICloudFunctionTrigger

| 字段   | 必填 | 类型   | 说明                                                  |
| ------ | ---- | ------ | ----------------------------------------------------- |
| name   | 是   | String | 触发器名称                                            |
| type   | 是   | String | 触发器类型，可选值：timer                             |
| config | 是   | String | 触发器配置，在定时触发器下，config 格式为 cron 表达式 |

#### IFunctionVPC

| 字段     | 必填 | 类型   | 说明        |
| -------- | ---- | ------ | ----------- |
| vpcId    | 是   | String | VPC Id      |
| subnetId | 是   | String | VPC 子网 Id |

> ⚠️ 请在测试时在云开发控制台确认函数创建并部署成功，有可能创建成功，`createFunction` 成功返回，但是部署失败，部署失败的原因通常为 `handler` 参数与源码包不对应。

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    await functions.createFunction({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'app',
            // 超时时间
            timeout: 5,
            // 环境变量
            envVariables: {
                key: 'value',
                akey: 'c'
            },
            runtime: 'Nodejs8.9',
            // 函数触发器，说明见文档: https://cloud.tencent.com/document/product/876/32314
            triggers: [
                {
                    // name: 触发器的名字
                    name: 'myTrigger',
                    // type: 触发器类型，目前仅支持 timer （即定时触发器）
                    type: 'timer',
                    // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式
                    config: '0 0 2 1 * * *'
                }
            ]
        },
        functionRootPath: '',
        force: true,
        base64Code:
            'UEsDBAoAAAAAAOdCBU8AAAAAAAAAAAAAAAAFAAAAZGlzdC9QSwMEFAAIAAgAkhkBTwAAAAAAAAAAAAAAAAgAAABpbmRleC5qc2WNMQrDMBRDd59Cmx0IuUEy9wadXfdTQlT/Yv+UQMndmxZv0ST0kOTXKqhW5mTeOdleWqwOzzhnjAjylmw9kmaT7WcieYtp6TBO+DgcOlhVykB9BH8RUnHVwrvvTvi/do7begPtIeSV7NEqu/sCUEsHCLKdLCxuAAAAqAAAAFBLAwQUAAgACADnQgVPAAAAAAAAAAAAAAAADQAAAGRpc3QvZGlzdC56aXAL8GZm4WIAgedOrP5gBpRgBdIpmcUl+gFAJSIMHEA4SZIRRQkHUElmXkpqhV5WcWqvIddhAxHn8vlOs2U5djoafWebG/s92Cnkf9L/KQ4n784Wy7+o8mXCk+taK8KepdyzvBkXtYbvvEV6D8enaTm2k9Imv01XquzOfGng98NCxioi9JRDLUu9YFDh1UO73/v92F/Wd7uK+a3ik6lvLmrt/s0U4M3OsWmujk4e0AUrgBjhRnRv8MK8AfKLXlVmAQBQSwcITXynOsAAAADyAAAAUEsBAi0DCgAAAAAA50IFTwAAAAAAAAAAAAAAAAUAAAAAAAAAAAAQAO1BAAAAAGRpc3QvUEsBAi0DFAAIAAgAkhkBT7KdLCxuAAAAqAAAAAgAAAAAAAAAAAAgAKSBIwAAAGluZGV4LmpzUEsBAi0DFAAIAAgA50IFT018pzrAAAAA8gAAAA0AAAAAAAAAAAAgAKSBxwAAAGRpc3QvZGlzdC56aXBQSwUGAAAAAAMAAwCkAAAAwgEAAAAA'
    })
}

test()
```

## updateFunctionCode

### 1. 接口描述

接口功能：更新云函数代码

接口声明：`updateFunctionCode(funcParam: IUpdateFunctionCodeParam): Promise<Object>`

> ⚠️ 本接口从 2.0.0 版本后，请求参数由( func: ICloudFunction, functionRootPath: string, base64Code: string ) 转换为 (funcParam: IUpdateFunctionCodeParam)，属于不兼容变更

### 2. 输入参数

#### IUpdateFunctionCodeParam

| 字段             | 必填 | 类型           | 说明                   |
| ---------------- | ---- | -------------- | ---------------------- |
| func             | 是   | ICloudFunction | 函数配置               |
| functionRootPath | 否   | String         | 用户本地函数文件目录   |
| base64Code       | 否   | String         | 函数文件的 base64 编码 |
| codeSecret       | 否   | String         | 函数文件的 base64 编码 |

[ICloudFunction 结构体](#ICloudFunction)

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    let res = await functions.updateFunctionCode({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'app'
        },
        functionRootPath: '',
        base64Code:
            'UEsDBAoAAAAAAOdCBU8AAAAAAAAAAAAAAAAFAAAAZGlzdC9QSwMEFAAIAAgAkhkBTwAAAAAAAAAAAAAAAAgAAABpbmRleC5qc2WNMQrDMBRDd59Cmx0IuUEy9wadXfdTQlT/Yv+UQMndmxZv0ST0kOTXKqhW5mTeOdleWqwOzzhnjAjylmw9kmaT7WcieYtp6TBO+DgcOlhVykB9BH8RUnHVwrvvTvi/do7begPtIeSV7NEqu/sCUEsHCLKdLCxuAAAAqAAAAFBLAwQUAAgACADnQgVPAAAAAAAAAAAAAAAADQAAAGRpc3QvZGlzdC56aXAL8GZm4WIAgedOrP5gBpRgBdIpmcUl+gFAJSIMHEA4SZIRRQkHUElmXkpqhV5WcWqvIddhAxHn8vlOs2U5djoafWebG/s92Cnkf9L/KQ4n784Wy7+o8mXCk+taK8KepdyzvBkXtYbvvEV6D8enaTm2k9Imv01XquzOfGng98NCxioi9JRDLUu9YFDh1UO73/v92F/Wd7uK+a3ik6lvLmrt/s0U4M3OsWmujk4e0AUrgBjhRnRv8MK8AfKLXlVmAQBQSwcITXynOsAAAADyAAAAUEsBAi0DCgAAAAAA50IFTwAAAAAAAAAAAAAAAAUAAAAAAAAAAAAQAO1BAAAAAGRpc3QvUEsBAi0DFAAIAAgAkhkBT7KdLCxuAAAAqAAAAAgAAAAAAAAAAAAgAKSBIwAAAGluZGV4LmpzUEsBAi0DFAAIAAgA50IFT018pzrAAAAA8gAAAA0AAAAAAAAAAAAgAKSBxwAAAGRpc3QvZGlzdC56aXBQSwUGAAAAAAMAAwCkAAAAwgEAAAAA'
    })
    console.log(res)
}

test()
```

## updateFunctionConfig

### 1. 接口描述

接口功能：更新云函数配置

接口声明：`updateFunctionConfig(funcParam: ICloudFunction): Promise<Object>`

> ⚠️ 本接口从 2.0.0 版本后，请求参数由( name: string, config: ICloudFunctionConfig ) 转换为 (funcParam: ICloudFunction)，属于不兼容变更

### 2. 输入参数

| 字段      | 必填 | 类型           | 说明     |
| --------- | ---- | -------------- | -------- |
| funcParam | 是   | ICloudFunction | 函数配置 |

[ICloudFunction 结构体](#ICloudFunction)

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    let res = await functions.updateFunctionConfig({
        name: 'app',
        timeout: 6
    })
    console.log(res)
}

test()
```

## deleteFunction

### 1. 接口描述

接口功能：删除云函数

接口声明：`deleteFunction(name: string): Promise<Object>`

### 2. 输入参数

| 字段 | 必填 | 类型   | 说明     |
| ---- | ---- | ------ | -------- |
| name | 是   | String | 函数名称 |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    await functions.deleteFunction('functionName')
}

test()
```

## getFunctionDetail

### 1. 接口描述

接口功能：获取云函数详情

接口声明：`getFunctionDetail(name: string, codeSecret?: string): Promise<Object>`

### 2. 输入参数

| 字段       | 必填 | 类型   | 说明         |
| ---------- | ---- | ------ | ------------ |
| name       | 是   | String | 函数名称     |
| codeSecret | 否   | String | 代码保护密钥 |

### 3. 返回结果

| 字段                          | 必填 | 类型   | 说明               |
| ----------------------------- | ---- | ------ | ------------------ |
| RequestId                     | 是   | String | 请求唯一标识       |
| FunctionName                  | 是   | String | 函数名称           |
| Namespace                     | 是   | String | 命名空间           |
| Runtime                       | 是   | String | 运行时             |
| Handler                       | 是   | String | 函数入口           |
| Description                   | 是   | String | 函数的描述信息     |
| ModTime                       | 是   | String | 函数修改时间       |
| Environment                   | 是   | Object | 函数的环境变量     |
| Environment.Variables         | 是   | Array  | 环境变量数组       |
| Environment.Variables[].Key   | 是   | String | 变量的 Key         |
| Environment.Variables[].Value | 是   | String | 变量的 Value       |
| MemorySize                    | 是   | Number | 函数的最大可用内存 |
| Timeout                       | 是   | Number | 函数的超时时间     |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    let res = await functions.getFunctionDetail('functionName')
    console.log(res) // 输出云函数详情
}

test()
```

## invokeFunction

### 1. 接口描述

接口功能：调用云函数

接口声明：`invokeFunction(name: string, params: object): Promise<Object>`

### 2. 输入参数

| 字段         | 必填 | 类型   | 说明                          |
| ------------ | ---- | ------ | ----------------------------- |
| functionName | 是   | String | 函数名称                      |
| params       | 否   | Object | 可选参数 用户调用函数时的入参 |

### 3. 返回结果

| 字段              | 必填 | 类型   | 说明                                                |
| ----------------- | ---- | ------ | --------------------------------------------------- |
| RequestId         | 是   | String | 请求唯一标识                                        |
| FunctionRequestId | 是   | String | 此次函数执行的 ID                                   |
| Duration          | 是   | Number | 表示执行函数的耗时，单位是毫秒，异步调用返回为空    |
| BillDuration      | 是   | Number | 表示函数的计费耗时，单位是毫秒，异步调用返回为空    |
| MemUsage          | 是   | Number | 执行函数时的内存大小，单位为 Byte，异步调用返回为空 |
| InvokeResult      | 是   | Number | 0 为正确，异步调用返回为空                          |
| RetMsg            | 是   | String | 表示执行函数的返回，异步调用返回为空                |
| ErrMsg            | 是   | String | 表示执行函数的错误返回信息，异步调用返回为空        |
| Log               | 是   | String | 表示执行过程中的日志输出，异步调用返回为空          |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    const res = await functions.invokeFunction('app', {
        a: 1
    })
    console.log(res.RetMsg)
}

test()
```

## getFunctionLogs

### 1. 接口描述

接口功能：获取云函数调用日志

接口声明：`getFunctionLogs(options: IFunctionLogOptions): Promise<Object>`

### 2. 输入参数

| 字段    | 必填 | 类型                                        | 说明         |
| ------- | ---- | ------------------------------------------- | ------------ |
| options | 是   | [IFunctionLogOptions](#ifunctionlogoptions) | 日志查询选项 |

#### IFunctionLogOptions

| 字段      | 必填 | 类型   | 说明                                                                              |
| --------- | ---- | ------ | --------------------------------------------------------------------------------- |
| name      | 是   | String | 函数名词                                                                          |
| offset    | 否   | Number | 数据的偏移量，Offset+Limit 不能大于 10000                                         |
| limit     | 否   | Number | 返回数据的长度，Offset+Limit 不能大于 10000                                       |
| order     | 否   | String | 以升序还是降序的方式对日志进行排序，可选值 desc 和 asc                            |
| orderBy   | 否   | String | 根据某个字段排序日志,支持以下字段：function_name, duration, mem_usage, start_time |
| startTime | 否   | String | 查询的具体日期，例如：2017 - 05 - 16 20:00:00，只能与 EndTime 相差一天之内        |
| endTime   | 否   | String | 查询的具体日期，例如：2017 - 05 - 16 20:59:59，只能与 StartTime 相差一天之内      |
| requestId | 否   | String | 执行该函数对应的 requestId                                                        |

### 3. 返回结果

| 字段                  | 必填 | 类型   | 说明                                                        |
| --------------------- | ---- | ------ | ----------------------------------------------------------- |
| RequestId             | 是   | String | 请求唯一标识                                                |
| TotalCount            | 是   | String | 函数日志的总数                                              |
| Data[]                | 是   | Array  | 运行函数的返回                                              |
| Data[].RequestId      | 是   | String | 执行该函数对应的 requestId                                  |
| Data[].FunctionName   | 是   | String | 函数的名称                                                  |
| Data[].RetCode        | 是   | Number | 函数执行结果，如果是 0 表示执行成功，其他值表示失败         |
| Data[].InvokeFinished | 是   | Number | 函数调用是否结束，如果是 1 表示执行结束，其他值表示调用异常 |
| Data[].StartTime      | 是   | String | 函数开始执行时的时间点                                      |
| Data[].Duration       | 是   | Number | 表示执行函数的耗时，单位是毫秒，异步调用返回为空            |
| Data[].BillDuration   | 是   | Number | 表示函数的计费耗时，单位是毫秒，异步调用返回为空            |
| Data[].MemUsage       | 是   | Number | 执行函数时的内存大小，单位为 Byte，异步调用返回为空         |
| Data[].RetMsg         | 是   | String | 表示执行函数的返回，异步调用返回为空                        |
| Data[].Log            | 是   | String | 表示执行过程中的日志输出，异步调用返回为空                  |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    const logs = await functions.getFunctionLogs({ name: 'app' })
    const { Data } = logs
    for (let item in Data) {
        console.log(item)
    }
}

test()
```

## copyFunction

### 1. 接口描述

接口功能：拷贝云函数

接口声明：`copyFunction(name, newFunctionName, targetEnvId, force): Promise<Object>`

### 2. 输入参数

| 字段            | 必填 | 类型    | 说明                              |
| --------------- | ---- | ------- | --------------------------------- |
| name            | 是   | String  | 原函数名                          |
| newFunctionName | 是   | String  | 新函数名                          |
| targetEnvId     | 是   | String  | 新环境 ID（跨环境拷贝函数时填写） |
| force           | 否   | Boolean | 是否覆盖同名函数                  |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    await functions.copyFunction()
}
test()
```

## createFunctionTriggers

### 1. 接口描述

接口功能：创建云函数触发器

接口声明：`createFunctionTriggers(name: string, triggers: ICloudFunctionTrigger[]): Promise<Object>`

### 2. 输入参数

| 字段     | 必填 | 类型                                            | 说明           |
| -------- | ---- | ----------------------------------------------- | -------------- |
| name     | 是   | String                                          | 函数名         |
| triggers | 是   | [ICloudFunctionTrigger](#icloudfunctiontrigger) | 触发器配置数组 |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    await functions.createFunctionTriggers('app', [
        {
            // name: 触发器的名字
            name: 'newTrigger',
            // type: 触发器类型，目前仅支持 timer （即定时触发器）
            type: 'timer',
            // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式
            config: '0 0 2 1 * * *'
        }
    ])
}

test()
```

## deleteFunctionTrigger

### 1. 接口描述

接口功能：删除云函数触发器

接口声明：`deleteFunctionTrigger(name: string, triggerName: string): Promise<Object>`

### 2. 输入参数

| 字段        | 必填 | 类型   | 说明     |
| ----------- | ---- | ------ | -------- |
| name        | 是   | String | 函数名   |
| triggerName | 是   | String | 触发器名 |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    await functions.deleteFunctionTrigger('app', 'newTrigger')
}

test()
```

## getFunctionDownloadUrl

### 1. 接口描述

接口功能：获取云函数代码下载链接

接口声明：`getFunctionDownloadUrl(functionName:string, codeSecret?: string）: Promise<Object>`

### 2. 输入参数

| 字段         | 必填 | 类型   | 说明         |
| ------------ | ---- | ------ | ------------ |
| functionName | 是   | String | 函数名       |
| codeSecret   | 否   | String | 代码保护密钥 |

### 3. 返回结果

| 字段       | 必填 | 类型   | 说明             |
| ---------- | ---- | ------ | ---------------- |
| RequestID  | 是   | String | 请求唯一标识     |
| Url        | 是   | String | 函数代码下载链接 |
| CodeSha256 | 是   | String | 函数的 SHA256 编 |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    const res = await functions.getFunctionDownloadUrl('sum')
    const { Url } = res
    console.log(Url)
}

test()
```

## updateFunctionIncrementalCode

### 1. 接口描述

接口功能：增量上传云函数代码

接口声明：`updateFunctionIncrementalCode(funcParam: IUpdateFunctionIncrementalCodeParam): Promise<Object>`

### 2. 输入参数

| 字段      | 必填 | 类型                                       | 说明           |
| --------- | ---- | ------------------------------------------ | -------------- |
| funcParam | 是   | IUpdateFunctionIncrementalCodeParam 结构体 | 增量更新函数项 |

#### IUpdateFunctionIncrementalCodeParam 结构体

| 字段             | 必填 | 类型                 | 说明                                                                                       |
| ---------------- | ---- | -------------------- | ------------------------------------------------------------------------------------------ |
| func             | 是   | ICloudFunction       | 函数配置项，针对增量更新，目前只支持 name，runTime 字段设置(runTime 目前 仅支持 Nodejs8.9) |
| functionRootPath | 是   | String               | 用户本地函数文件目录                                                                       |
| deleteFiles      | 否   | Array.&lt;String&gt; | 要删除的文件，目录的列表，使用相对路径， 删除目录时必须以/结尾                             |
| addFiles         | 否   | String               | 新增或修改的文件/目录 对应的 glob 匹配模式，目前支持 新增或修改 单个文件 或单个文件夹      |

> ⚠️ 填写路径时请注意 Linux 及 Windows 下的区别（'/'与'\\'）
> ⚠️ 增量更新 package.json 并不会触发依赖安装

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    // 本地存在sum 函数文件夹，新增test/index.js 文件 (index.js相对路径为 sum/test/index.js)
    await functions.updateFunctionIncrementalCode({
        func: {
            name: 'sum',
            runTime: 'Nodejs8.9'
        },
        addFiles: 'test/index.js'
    })

    // 本地存在sum 函数文件夹，新增test/目录 (test相对路径为 sum/test/)
    await functions.updateFunctionIncrementalCode({
        func: {
            name: 'sum',
            runTime: 'Nodejs8.9'
        },
        addFiles: 'test/*' // 匹配test目录下所有文件, 这里采用 glob 匹配模式 而非相对路径
    })

    // 本地存在sum 函数文件夹，删除test/index.js (index.js相对路径为 sum/test/index.js)
    await functions.updateFunctionIncrementalCode({
        func: {
            name: 'sum',
            runTime: 'Nodejs8.9'
        },
        deleteFiles: ['test/index.js']
    })

    // 本地存在sum 函数文件夹，删除test/ 目录 (test相对路径为 sum/test/)
    await functions.updateFunctionIncrementalCode({
        func: {
            name: 'sum',
            runTime: 'Nodejs8.9'
        },
        deleteFiles: ['test/'] // 删除目录时必须以 /结尾
    })
}

test()
```

## createLayer

### 1. 接口描述

接口功能：发布层版本

接口声明：`createLayer(options: IFunctionLayerOptions): Promise<Object>`

### 2. 输入参数

| 字段    | 必填 | 类型                         | 说明   |
| ------- | ---- | ---------------------------- | ------ |
| options | 是   | IFunctionLayerOptions 结构体 | 请求项 |

#### IFunctionLayerOptions 结构体

| 字段          | 必填 | 类型                 | 说明                                                                                                                                |
| ------------- | ---- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| contentPath   | 否   | String               | 可以指定 contentPath 为文件夹 或者 ZIP 文件路径                                                                                     |
| base64Content | 否   | String               | 文件的 base64 编码                                                                                                                  |
| name          | 是   | String               | 层名称，支持 26 个英文字母大小写、数字、连接符和下划线，第一个字符只能以字母开头，最后一个字符不能为连接符或者下划线，名称长度 1-64 |
| runtimes      | 是   | Array.&lt;String&gt; | 层适用的运行时，可多选，可选的值对应函数的 Runtime 可选值。                                                                         |
| description   | 否   | String               | 层版本描述                                                                                                                          |
| licenseInfo   | 否   | String               | 层的软件许可证                                                                                                                      |

### 3. 返回结果

| 字段         | 必填 | 类型   | 说明     |
| ------------ | ---- | ------ | -------- |
| RequestId    | 是   | String | 请求 ID  |
| LayerVersion | 是   | Number | 层版本号 |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    const res = await functions.createLayer({
        name: layerName,
        contentPath: './test/functions/luke/',
        runtimes: ['Nodejs8.9']
    })
    console.log(res.LayerVersion)
}

test()
```

## deleteLayerVersion

### 1. 接口描述

接口功能：删除层版本

接口声明：`deleteLayerVersion(options: ILayerOptions): Promise<Object>`

### 2. 输入参数

| 字段    | 必填 | 类型                 | 说明   |
| ------- | ---- | -------------------- | ------ |
| options | 是   | ILayerOptions 结构体 | 请求项 |

#### ILayerOptions 结构体

| 字段    | 必填 | 类型   | 说明   |
| ------- | ---- | ------ | ------ |
| name    | 是   | String | 层名称 |
| version | 是   | Number | 版本号 |

### 3. 返回结果

| 字段      | 必填 | 类型   | 说明    |
| --------- | ---- | ------ | ------- |
| RequestId | 是   | String | 请求 ID |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    const res = await functions.deleteLayerVersion({
        name: layerName,
        version: 1
    })
    console.log(res.RequestId)
}

test()
```

## listLayerVersions

### 1. 接口描述

接口功能：获取层版本列表

接口声明：`listLayerVersions(options: IVersionListOptions): Promise<Object>`

### 2. 输入参数

| 字段    | 必填 | 类型                       | 说明   |
| ------- | ---- | -------------------------- | ------ |
| options | 是   | IVersionListOptions 结构体 | 请求项 |

#### IVersionListOptions 结构体

| 字段     | 必填 | 类型                 | 说明   |
| -------- | ---- | -------------------- | ------ |
| name     | 是   | String               | 层名称 |
| runtimes | 否   | Array.&lt;String&gt; | 版本号 |

### 3. 返回结果

| 字段          | 必填 | 类型                            | 说明       |
| ------------- | ---- | ------------------------------- | ---------- |
| RequestId     | 是   | String                          | 请求 ID    |
| LayerVersions | 是   | Array.&lt;ILayerVersionInfo&gt; | 文件层详情 |

#### ILayerVersionInfo 结构体

| 字段               | 必填 | 类型                 | 说明                                                                                        |
| ------------------ | ---- | -------------------- | ------------------------------------------------------------------------------------------- |
| CompatibleRuntimes | 是   | Array.&lt;String&gt; | 版本适用的运行时                                                                            |
| AddTime            | 是   | String               | 创建时间                                                                                    |
| Description        | 是   | String               | 版本描述                                                                                    |
| LicenseInfo        | 是   | String               | 许可证信息                                                                                  |
| LayerVersion       | 是   | Number               | 版本号                                                                                      |
| LayerName          | 是   | String               | 层名称                                                                                      |
| Status             | 是   | String               | 层的具体版本当前状态， Active 正常, Publishing 发布中,PublishFailed 发布失败,Deleted 已删除 |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    const res = await functions.listLayerVersions({
        name: layerName
    })
    console.log(res.LayerVersions)
}

test()
```

## listLayers

### 1. 接口描述

接口功能：获取层列表

接口声明：`listLayers(options: ILayerListOptions): Promise<Object>`

### 2. 输入参数

| 字段    | 必填 | 类型                     | 说明   |
| ------- | ---- | ------------------------ | ------ |
| options | 是   | ILayerListOptions 结构体 | 请求项 |

#### ILayerListOptions 结构体

| 字段      | 必填 | 类型   | 说明                   |
| --------- | ---- | ------ | ---------------------- |
| offset    | 否   | Number | 偏移                   |
| limit     | 否   | Number | 限制数                 |
| runtime   | 否   | String | 适配的运行时           |
| searchKey | 否   | String | 查询 key，模糊匹配名称 |

### 3. 返回结果

| 字段       | 必填 | 类型                            | 说明       |
| ---------- | ---- | ------------------------------- | ---------- |
| RequestId  | 是   | String                          | 请求 ID    |
| TotalCount | 是   | Number                          | 层总数     |
| Layers     | 是   | Array.&lt;ILayerVersionInfo&gt; | 文件层详情 |

#### ILayerVersionInfo 结构体

| 字段               | 必填 | 类型                 | 说明                                                                                        |
| ------------------ | ---- | -------------------- | ------------------------------------------------------------------------------------------- |
| CompatibleRuntimes | 是   | Array.&lt;String&gt; | 版本适用的运行时                                                                            |
| AddTime            | 是   | String               | 创建时间                                                                                    |
| Description        | 是   | String               | 版本描述                                                                                    |
| LicenseInfo        | 是   | String               | 许可证信息                                                                                  |
| LayerVersion       | 是   | Number               | 版本号                                                                                      |
| LayerName          | 是   | String               | 层名称                                                                                      |
| Status             | 是   | String               | 层的具体版本当前状态， Active 正常, Publishing 发布中,PublishFailed 发布失败,Deleted 已删除 |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    const res = await functions.listLayers({})
    console.log(res.Layers)
}

test()
```

## getLayerVersion

### 1. 接口描述

接口功能：获取层版本详细信息

接口声明：`getLayerVersion(options: ILayerOptions): Promise<Object>`

### 2. 输入参数

| 字段    | 必填 | 类型                 | 说明   |
| ------- | ---- | -------------------- | ------ |
| options | 是   | ILayerOptions 结构体 | 请求项 |

#### ILayerOptions 结构体

| 字段    | 必填 | 类型   | 说明   |
| ------- | ---- | ------ | ------ |
| name    | 是   | String | 层名称 |
| version | 是   | Number | 版本号 |

### 3. 返回结果

| 字段               | 必填 | 类型                 | 说明                                                                                        |
| ------------------ | ---- | -------------------- | ------------------------------------------------------------------------------------------- |
| RequestId          | 是   | String               | 请求 ID                                                                                     |
| CompatibleRuntimes | 是   | Array.&lt;String&gt; | 适配的运行时                                                                                |
| CodeSha256         | 是   | String               | 层中版本文件的 SHA256 编码                                                                  |
| Location           | 是   | String               | 层中版本文件的下载地址                                                                      |
| AddTime            | 是   | String               | 版本的创建时间                                                                              |
| Description        | 是   | String               | 版本的描述                                                                                  |
| LicenseInfo        | 是   | String               | 许可证信息                                                                                  |
| LayerVersion       | 是   | Number               | 版本号                                                                                      |
| LayerName          | 是   | String               | 层名称                                                                                      |
| Status             | 是   | String               | 层的具体版本当前状态， Active 正常, Publishing 发布中,PublishFailed 发布失败,Deleted 已删除 |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    const res = await functions.getLayerVersion({ name: layerName, version: 2 })
    console.log(res.LayerVersion)
}

test()
```
