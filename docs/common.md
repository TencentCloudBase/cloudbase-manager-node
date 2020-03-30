# 文档已迁移，请访问新的[文档站点](https://docs.cloudbase.net/api-reference/manager/node/introduction.html)查看详细的文档。

# 公共接口

### 1. 接口描述

接口功能：manager-node 针对 部分接口形式相对固定的功能， 提供了 commonService 的公共方法调用

接口声明：`manager.commonService(service, version).call(option): Promise<Object>`

> ⚠️ 本接口从 3.0.0 版本后，commonService 作为方法使用，请求参数为(service?:string, version?:string) ，属于不兼容变更

### 2. 输入参数

commonService 方法

| 字段    | 类型   | 必填 | 说明         |
| ------- | ------ | ---- | ------------ |
| service | string | 否   | 请求资源所属 |
| version | string | 否   | 接口版本     |

call 方法

| 字段 | 类型                    | 必填 | 说明         |
| ---- | ----------------------- | ---- | ------------ |
| -    | ICommonApiServiceOption | 是   | 公共接口传参 |

#### ICommonApiServiceOption 结构体

| 字段   | 类型   | 必填 | 说明                             |
| ------ | ------ | ---- | -------------------------------- |
| Action | String | 是   | 接口名                           |
| Param  | Object | 是   | 接口传参，具体形式参考各接口指引 |

### 3. 返回结果

| 字段 | 类型   | 必填 | 说明                            |
| ---- | ------ | ---- | ------------------------------- |
| -    | Object | 是   | 不同的 action，请求回包对象不同 |

### 4. 示例代码

```javascript
import CloudBase from '@cloudbase/manager-node'

const manager = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
    const res = await manager.commonService().call({
        Action: 'DescribeDatabaseACL',
        Param: {
            CollectionName: 'xxx',
            EnvId: 'xxx'
        }
    })
    console.log(res)
}

test()
```
