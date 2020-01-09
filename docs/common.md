## 公共接口方法

manager-node 针对 部分接口形式相对固定的功能， 提供了 commonService 实例来调用

获得当前环境下的 commonService 实例，示例代码如下：

```javascript
import CloudBase from '@cloudbase/manager-node'

const { commonService } = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})
```

### 公共接口定义

```js
commonService.call((option: ICommonApiServiceOption)): Promise<any>
```

### 参数说明

| 参数名 | 类型                    | 描述         |
| ------ | ----------------------- | ------------ |
| option | ICommonApiServiceOption | 公共接口传参 |

### ICommonApiServiceOption 结构体

| 参数名 | 类型   | 描述                             |
| ------ | ------ | -------------------------------- |
| Action | string | 接口名                           |
| Param  | Object | 接口传参，具体形式参考各接口指引 |

### 响应结果：any
