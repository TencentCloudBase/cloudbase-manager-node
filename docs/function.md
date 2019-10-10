# 云函数

functions 实例可以对云函数进行管理，包括创建、删除、更新、调用等云函数管理功能。

获得当前环境下的 functions 实例，示例代码如下：

```javascript
import CloudBase from '@cloudbase/manager-node'

const { functions } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})
```

## 目录

- [获取云函数列表](#获取云函数列表)
- [创建函数](#创建函数)
- [更新云函数代码](#更新云函数代码)
- [更新云函数配置](#更新云函数配置)
- [删除云函数](#删除云函数)
- [获取云函数详情](#获取云函数详情)
- [调用云函数](#调用云函数)
- [获取云函数调用日志](#获取云函数调用日志)
- [拷贝云函数](#拷贝云函数)
- [创建云函数触发器](#创建云函数触发器)
- [删除云函数触发器](#删除云函数触发器)

## 获取云函数列表

### 接口定义

```javascript
listFunctions(limit: number, offset: number) // limit 默认20 offset 默认0
```

### 参数说明

| 参数名 | 类型   | 描述 |
| ------ | ------ | ---- |
| limit  | number | 范围 |
| offset | number | 偏移 |

**调用示例**

```javascript
let res = await functions.listFunctions(20, 0)
```

**返回示例**

```json
{
    "Functions": [
        {
            "FunctionId": "lam-hyjplgyy",
            "FunctionName": "openid",
            "Runtime": "Nodejs8.9",
            "AddTime": "2019-08-02 22:53:19",
            "ModTime": "2019-08-02 23:38:15",
            "Status": "Active"
        }
    ],
    "TotalCount": 1,
    "RequestID": "3c140219-cfe9-470e-b241-907877d6fb03"
}
```

**返回字段描述**

| 参数名                   | 类型   | 描述         |
| ------------------------ | ------ | ------------ |
| RequestID                | String | 请求唯一标识 |
| TotalCount               | Number | 总数         |
| Functions                | Array  | 函数列表     |
| Functions[].FunctionId   | String | 函数 ID      |
| Functions[].FunctionName | String | 函数名称     |
| Functions[].Namespace    | String | 命名空间     |
| Functions[].Runtime      | String | 运行时间     |
| Functions[].AddTime      | String | 创建时间     |
| Functions[].ModTime      | String | 修改时间     |

## 创建函数

### 接口定义

```javascript
createFunction(func: ICloudFunction, functionRootPath: string, force: boolean, base64Code: string)
```

### 参数说明

| 参数名           | 类型           | 描述                   |
| ---------------- | -------------- | ---------------------- |
| func             | ICloudFunction | 函数配置               |
| functionRootPath | string         | 用户本地函数文件目录   |
| force            | boolean        | 是否覆盖同名函数       |
| base64Code       | string         | 函数文件的 base64 编码 |

**注：createFunction 支持两种方式创建函数，1. 用户指定本地的函数文件根目录(绝对地址); 2. 用户将函数代码包压缩为 zip 文件后进行 base64 转码，传入 base64Code 参数**

### ICloudFunction

|   名称   | 是否必填 |                          类型                          |               描述                |
| :------: | :------: | :----------------------------------------------------: | :-------------------------------: |
|   name   |    是    |                         String                         |             函数名称              |
|  config  |    是    |      [CloudFunctionConfig](#icloudfunctionconfig)       |           函数配置对象            |
| triggers |    否    | Array of [ICloudFunctionTrigger](#icloudfunctiontrigger) |                                   |
| handler  |    否    |                         String                         |             函数入口              |
|  params  |    否    |                         Object                         | invoke 触发函数时，传入函数的参数 |

**注：`handler` 函数处理入口，Node 项目默认值为 index.main，入口文件只能在根目录，如 node 项目的 index.main，指向的是 index.js 文件的 main 方法**

### ICloudFunctionConfig

|     名称     | 是否必填 |    类型     |                       描述                        |
| :----------: | :------: | :---------: | :-----------------------------------------------: |
|   timeout    |    否    |   Number    |                   函数超时时间                    |
| envVariables |    否    |   Object    |             包含环境变量的键值对对象              |
|     vpc      |    否    | [IFunctionVPC](#ifunctionvpc) |                   私有网络配置                    |
|   runtime    |    否    |   String    | 运行时环境配置，可选值： `Nodejs8.9, Php7, Java8` |

**注：`runtime` 默认为 `Nodejs8.9`，使用 Node 运行时可不填，使用 Php 和 Java 则必填。**

### ICloudFunctionTrigger

|  名称  | 是否必填 |  类型  |                         描述                          |
| :----: | :------: | :----: | :---------------------------------------------------: |
|  name  |    是    | String |                      触发器名称                       |
|  type  |    是    | String |               触发器类型，可选值：timer               |
| config |    是    | String | 触发器配置，在定时触发器下，config 格式为 cron 表达式 |

### IFunctionVPC

|   名称   | 是否必填 |  类型  |    描述     |
| :------: | :------: | :----: | :---------: |
|  vpcId   |    是    | String |   VPC Id    |
| subnetId |    是    | String | VPC 子网 Id |

> ⚠️请在测试时在云开发控制台确认函数创建并部署成功，有可能创建成功，`createFunction` 成功返回，但是部署失败，部署失败的原因通常为 `handler` 参数与源码包不对应。

**调用示例**

```javascript
const res = await functions.createFunction(
    {
        // functions 文件夹下函数文件夹的名称，即函数名
        name: 'app',
        // 函数配置
        config: {
            // 超时时间
            timeout: 5,
            // 环境变量
            envVariables: {
                key: 'value',
                akey: 'c'
            }
        },
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
    '',
    true,
    'UEsDBAoAAAAAAOdCBU8AAAAAAAAAAAAAAAAFAAAAZGlzdC9QSwMEFAAIAAgAkhkBTwAAAAAAAAAAAAAAAAgAAABpbmRleC5qc2WNMQrDMBRDd59Cmx0IuUEy9wadXfdTQlT/Yv+UQMndmxZv0ST0kOTXKqhW5mTeOdleWqwOzzhnjAjylmw9kmaT7WcieYtp6TBO+DgcOlhVykB9BH8RUnHVwrvvTvi/do7begPtIeSV7NEqu/sCUEsHCLKdLCxuAAAAqAAAAFBLAwQUAAgACADnQgVPAAAAAAAAAAAAAAAADQAAAGRpc3QvZGlzdC56aXAL8GZm4WIAgedOrP5gBpRgBdIpmcUl+gFAJSIMHEA4SZIRRQkHUElmXkpqhV5WcWqvIddhAxHn8vlOs2U5djoafWebG/s92Cnkf9L/KQ4n784Wy7+o8mXCk+taK8KepdyzvBkXtYbvvEV6D8enaTm2k9Imv01XquzOfGng98NCxioi9JRDLUu9YFDh1UO73/v92F/Wd7uK+a3ik6lvLmrt/s0U4M3OsWmujk4e0AUrgBjhRnRv8MK8AfKLXlVmAQBQSwcITXynOsAAAADyAAAAUEsBAi0DCgAAAAAA50IFTwAAAAAAAAAAAAAAAAUAAAAAAAAAAAAQAO1BAAAAAGRpc3QvUEsBAi0DFAAIAAgAkhkBT7KdLCxuAAAAqAAAAAgAAAAAAAAAAAAgAKSBIwAAAGluZGV4LmpzUEsBAi0DFAAIAAgA50IFT018pzrAAAAA8gAAAA0AAAAAAAAAAAAgAKSBxwAAAGRpc3QvZGlzdC56aXBQSwUGAAAAAAMAAwCkAAAAwgEAAAAA'
)
```

**返回示例**

```json
{
    "RequestId": "eac6b301-a322-493a-8e36-83b295459397"
}
```

**返回字段描述**

| 参数名    | 类型   | 描述         |
| --------- | ------ | ------------ |
| RequestID | String | 请求唯一标识 |

以 JSON 对象描述，在 javascript 中为对应的数组结构，其他函数返回格式相同。

## 更新云函数代码

### 接口定义

```javascript
updateFunctionCode(func: ICloudFunction, functionRootPath: string, base64Code: string)
```

### 参数说明

| 参数名           | 类型           | 描述                   |
| ---------------- | -------------- | ---------------------- |
| func             | ICloudFunction | 函数配置               |
| functionRootPath | string         | 用户本地函数文件目录   |
| base64Code       | string         | 函数文件的 base64 编码 |

[ICloudFunction 结构体](#ICloudFunction)

**调用示例**

```javascript
let res = await functions.updateFunctionCode(
    {
        // functions 文件夹下函数文件夹的名称，即函数名
        name: 'app'
    },
    '',
    'UEsDBAoAAAAAAOdCBU8AAAAAAAAAAAAAAAAFAAAAZGlzdC9QSwMEFAAIAAgAkhkBTwAAAAAAAAAAAAAAAAgAAABpbmRleC5qc2WNMQrDMBRDd59Cmx0IuUEy9wadXfdTQlT/Yv+UQMndmxZv0ST0kOTXKqhW5mTeOdleWqwOzzhnjAjylmw9kmaT7WcieYtp6TBO+DgcOlhVykB9BH8RUnHVwrvvTvi/do7begPtIeSV7NEqu/sCUEsHCLKdLCxuAAAAqAAAAFBLAwQUAAgACADnQgVPAAAAAAAAAAAAAAAADQAAAGRpc3QvZGlzdC56aXAL8GZm4WIAgedOrP5gBpRgBdIpmcUl+gFAJSIMHEA4SZIRRQkHUElmXkpqhV5WcWqvIddhAxHn8vlOs2U5djoafWebG/s92Cnkf9L/KQ4n784Wy7+o8mXCk+taK8KepdyzvBkXtYbvvEV6D8enaTm2k9Imv01XquzOfGng98NCxioi9JRDLUu9YFDh1UO73/v92F/Wd7uK+a3ik6lvLmrt/s0U4M3OsWmujk4e0AUrgBjhRnRv8MK8AfKLXlVmAQBQSwcITXynOsAAAADyAAAAUEsBAi0DCgAAAAAA50IFTwAAAAAAAAAAAAAAAAUAAAAAAAAAAAAQAO1BAAAAAGRpc3QvUEsBAi0DFAAIAAgAkhkBT7KdLCxuAAAAqAAAAAgAAAAAAAAAAAAgAKSBIwAAAGluZGV4LmpzUEsBAi0DFAAIAAgA50IFT018pzrAAAAA8gAAAA0AAAAAAAAAAAAgAKSBxwAAAGRpc3QvZGlzdC56aXBQSwUGAAAAAAMAAwCkAAAAwgEAAAAA'
)
```

**返回示例**

```json
{
    "RequestId": "eac6b301-a322-493a-8e36-83b295459397"
}
```

**返回字段描述**

| 参数名    | 类型   | 描述         |
| --------- | ------ | ------------ |
| RequestID | String | 请求唯一标识 |

## 更新云函数配置

### 接口定义

```javascript
updateFunctionConfig(name: string, config: ICloudFunctionConfig)
```

### 参数说明

| 参数名 | 类型                 | 描述           |
| ------ | -------------------- | -------------- |
| name   | String               | 函数名称       |
| config | ICloudFunctionConfig | 云函数配置子项 |

[ICloudFunctionConfig 结构体](#ICloudFunctionConfig)

**调用示例**

```javascript
let res = await functions.updateFunctionConfig('app', {
    timeout: 6
})
```

**返回示例**

```json
{
    "RequestId": "eac6b301-a322-493a-8e36-83b295459397"
}
```

**返回字段描述**

| 参数名    | 类型   | 描述         |
| --------- | ------ | ------------ |
| RequestID | String | 请求唯一标识 |

## 删除云函数

### 接口定义

```javascript
deleteFunction(name: string)
```

### 参数说明

| 参数名 | 类型   | 描述     |
| ------ | ------ | -------- |
| name   | String | 函数名称 |

**调用示例**

```javascript
let res = await functions.deleteFunction('functionName')
```

**返回示例**

```json
{
    "RequestId": "eac6b301-a322-493a-8e36-83b295459397"
}
```

**返回字段描述**

| 参数名    | 类型   | 描述         |
| --------- | ------ | ------------ |
| RequestID | String | 请求唯一标识 |

## 获取云函数详情

### 接口定义

```javascript
getFunctionDetail(name: string)
```

### 参数说明

| 参数名 | 类型   | 描述     |
| ------ | ------ | -------- |
| name   | String | 函数名称 |

**调用示例**

```javascript
let res = await functions.getFunctionDetail('functionName')
```

**返回示例**

```json
{
    "RequestId": "a1ffbba5-5489-45bc-89c5-453e50d5386e",
    "FunctionName": "ledDummyAPITest",
    "FunctionVersion": "LATEST",
    "Namespace": "default",
    "Runtime": "Python2.7",
    "Handler": "scfredis.main_handler",
    "Description": "",
    "ModTime": "2018-06-07 09:52:23",
    "Environment": {
        "Variables": []
    },
    "VpcConfig": {
        "SubnetId": "",
        "VpcId": ""
    },
    "Triggers": [],
    "ErrNo": 0,
    "UseGpu": "FALSE",
    "MemorySize": 128,
    "Timeout": 3,
    "CodeSize": 0,
    "CodeResult": "failed",
    "CodeInfo": "",
    "CodeError": "",
    "Role": ""
}
```

**返回字段描述**

| 参数名                        | 类型   | 描述               |
| ----------------------------- | ------ | ------------------ |
| RequestId                     | String | 请求唯一标识       |
| FunctionName                  | String | 函数名称           |
| Namespace                     | String | 命名空间           |
| Runtime                       | String | 运行时             |
| Handler                       | String | 函数入口           |
| Description                   | String | 函数的描述信息     |
| ModTime                       | String | 函数修改时间       |
| Environment                   | Object | 函数的环境变量     |
| Environment.Variables         | Array  | 环境变量数组       |
| Environment.Variables[].Key   | String | 变量的 Key         |
| Environment.Variables[].Value | String | 变量的 Value       |
| MemorySize                    | Number | 函数的最大可用内存 |
| Timeout                       | Number | 函数的超时时间     |

## 调用云函数

### 接口定义

```javascript
invokeFunction(name: string, params: object)
```

### 参数说明

| 参数名       | 类型   | 描述                          |
| ------------ | ------ | ----------------------------- |
| functionName | String | 函数名称                      |
| params       | Object | 可选参数 用户调用函数时的入参 |

**调用示例**

```javascript
const res = await functions.invokeFunction('app', {
    a: 1
})
```

**返回示例**

```json
{
    "Result": {
        "MemUsage": 3207168,
        "Log": "",
        "RetMsg": "hello from scf",
        "BillDuration": 100,
        "FunctionRequestId": "6add56fa-58f1-11e8-89a9-5254005d5fdb",
        "Duration": 0.826,
        "ErrMsg": "",
        "InvokeResult": 0
    },
    "RequestId": "c2af8a64-c922-4d55-aee0-bd86a5c2cd12"
}
```

**返回字段描述**

| 参数名                   | 类型   | 描述                                                |
| ------------------------ | ------ | --------------------------------------------------- |
| RequestId                | String | 请求唯一标识                                        |
| Result                   | Object | 运行函数的返回                                      |
| Result.FunctionRequestId | String | 此次函数执行的 ID                                   |
| Result.Duration          | Number | 表示执行函数的耗时，单位是毫秒，异步调用返回为空    |
| Result.BillDuration      | Number | 表示函数的计费耗时，单位是毫秒，异步调用返回为空    |
| Result.MemUsage          | Number | 执行函数时的内存大小，单位为 Byte，异步调用返回为空 |
| Result.InvokeResult      | Number | 0 为正确，异步调用返回为空                          |
| Result.RetMsg            | String | 表示执行函数的返回，异步调用返回为空                |
| Result.ErrMsg            | String | 表示执行函数的错误返回信息，异步调用返回为空        |
| Result.Log               | String | 表示执行过程中的日志输出，异步调用返回为空          |

## 获取云函数调用日志

### 接口定义

```javascript
getFunctionLogs(options: IFunctionLogOptions)
```

### 参数说明

| 参数名  | 类型                | 描述         |
| ------- | ------------------- | ------------ |
| options | [IFunctionLogOptions](#ifunctionlogoptions) | 日志查询选项 |

### IFunctionLogOptions

|   名称    | 是否必填 |  类型  |                                       描述                                        |
| :-------: | :------: | :----: | :-------------------------------------------------------------------------------: |
|   name    |    是    | String |                                     函数名词                                      |
|  offset   |    否    | Number |                     数据的偏移量，Offset+Limit 不能大于 10000                     |
|   limit   |    否    | Number |                    返回数据的长度，Offset+Limit 不能大于 10000                    |
|   order   |    否    | String |              以升序还是降序的方式对日志进行排序，可选值 desc 和 asc               |
|  orderBy  |    否    | String | 根据某个字段排序日志,支持以下字段：function_name, duration, mem_usage, start_time |
| startTime |    否    | String |    查询的具体日期，例如：2017 - 05 - 16 20:00:00，只能与 EndTime 相差一天之内     |
|  endTime  |    否    | String |   查询的具体日期，例如：2017 - 05 - 16 20:59:59，只能与 StartTime 相差一天之内    |
| requestId |    否    | String |                            执行该函数对应的 requestId                             |

**调用示例**

```javascript
const logs = await functions.getFunctionLogs({ name: 'app' })
```

**返回示例**

```json
{
    "TotalCount": 1,
    "Data": [
        {
            "MemUsage": 3174400,
            "RetCode": 1,
            "RetMsg": "Success",
            "Log": "",
            "BillDuration": 100,
            "InvokeFinished": 1,
            "RequestId": "bc309eaa-6d64-11e8-a7fe-5254000b4175",
            "StartTime": "2018-06-11 18:46:45",
            "Duration": 0.532,
            "FunctionName": "APITest"
        }
    ],
    "RequestId": "e2571ff3-da04-4c53-8438-f58bf057ce4a"
}
```

**返回字段描述**

| 参数名                | 类型   | 描述                                                        |
| --------------------- | ------ | ----------------------------------------------------------- |
| RequestId             | String | 请求唯一标识                                                |
| TotalCount            | String | 函数日志的总数                                              |
| Data[]                | Array  | 运行函数的返回                                              |
| Data[].RequestId      | String | 执行该函数对应的 requestId                                  |
| Data[].FunctionName   | String | 函数的名称                                                  |
| Data[].RetCode        | Number | 函数执行结果，如果是 0 表示执行成功，其他值表示失败         |
| Data[].InvokeFinished | Number | 函数调用是否结束，如果是 1 表示执行结束，其他值表示调用异常 |
| Data[].StartTime      | String | 函数开始执行时的时间点                                      |
| Data[].Duration       | Number | 表示执行函数的耗时，单位是毫秒，异步调用返回为空            |
| Data[].BillDuration   | Number | 表示函数的计费耗时，单位是毫秒，异步调用返回为空            |
| Data[].MemUsage       | Number | 执行函数时的内存大小，单位为 Byte，异步调用返回为空         |
| Data[].RetMsg         | String | 表示执行函数的返回，异步调用返回为空                        |
| Data[].Log            | String | 表示执行过程中的日志输出，异步调用返回为空                  |

## 拷贝云函数

### 接口定义

```javascript
copyFunction(name: string, newFunctionName: string, targetEnvId: string, force = false)
```

### 参数说明

| 参数名          | 类型    | 描述                              |
| --------------- | ------- | --------------------------------- |
| name            | String  | 原函数名                          |
| newFunctionName | String  | 新函数名                          |
| targetEnvId     | String  | 新环境 ID（跨环境拷贝函数时填写） |
| force           | boolean | 是否覆盖同名函数                  |

**调用示例**

```javascript
const logs = await functions.copyFunction()
```

**返回示例**

```json
{
    "RequestId": "e2571ff3-da04-4c53-8438-f58bf057ce4a"
}
```

## 创建云函数触发器

### 接口定义

```javascript
createFunctionTriggers(name: string, triggers: ICloudFunctionTrigger[])
```

### 参数说明

| 参数名   | 类型                    | 描述           |
| -------- | ----------------------- | -------------- |
| name     | String                  | 函数名         |
| triggers | [ICloudFunctionTrigger](#icloudfunctiontrigger) | 触发器配置数组 |

**调用示例**

```javascript
const res = await functions.createFunctionTriggers('app', [
    {
        // name: 触发器的名字
        name: 'newTrigger',
        // type: 触发器类型，目前仅支持 timer （即定时触发器）
        type: 'timer',
        // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式
        config: '0 0 2 1 * * *'
    }
])
```

**返回示例**

```json
{
    "RequestId": "e2571ff3-da04-4c53-8438-f58bf057ce4a"
}
```

## 删除云函数触发器

### 接口定义

```javascript
deleteFunctionTrigger(name: string, triggerName: string)
```

### 参数说明

| 参数名      | 类型   | 描述     |
| ----------- | ------ | -------- |
| name        | String | 函数名   |
| triggerName | String | 触发器名 |

**调用示例**

```javascript
const res = await functions.deleteFunctionTrigger('app', 'newTrigger')
```

**返回示例**

```json
{
    "RequestId": "e2571ff3-da04-4c53-8438-f58bf057ce4a"
}
```
