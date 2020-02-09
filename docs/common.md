# 公共接口

### 1. 接口描述

接口功能：manager-node 针对 部分接口形式相对固定的功能， 提供了 commonService 的公共方法调用

接口声明：`commonService.call(option): Promise<Object>`

### 2. 输入参数

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

const { commonService } = new CloudBase({
  secretId: 'Your SecretId',
  secretKey: 'Your SecretKey',
  envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

async function test() {
  const res = await commonService.call({
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
