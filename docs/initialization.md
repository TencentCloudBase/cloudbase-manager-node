# 初始化

通过腾讯云 API 密钥初始化，示例代码如下：

```javascript
import CloudBase from '@cloudbase/manager-node'
const app = CloudBase.init({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    token: 'Your SecretToken', // 使用临时凭证需要此字段
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})
```

初始化后得到一个 CloudBase 实例。（该实例是单例的，多次调用 CloudBase.init 只会初始化一次。）

> !需要提前开通云开发服务并创建环境，否则 SDK 无法使用。

> !服务端环境下（非云函数环境），需要用户传入 SecretId， SecretKey（腾讯云控制台获取）

您也可以通过 new CloudBase 创建实例，示例代码如下：

```javascript
const app = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    secretToken: 'Your SecretToken', // 使用临时凭证需要此字段
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})
```

每次初始化都会得到一个全新的 CloudBase 实例，如果需要管理多个腾讯云账号下的 云开发 服务，可通过此种方式创建多个 CloudBase 实例。

在云函数环境下，支持免密钥初始化，示例代码如下：

```javascript
const app = new CloudBase({
    envId: 'Your envId'
})
```

初始化完成之后，即可使用相关功能。

## 完整示例

```javascript
// 1. 初始化 CloudBase
const app = new CloudBase({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
})

// 2. 调用云函数管理下的getFunction
let result = app.functions.getFunctionDetail('test')

// 3. 打印结果
console.log(result)
```

### 输出示例

```json
{
    "ModTime": "2019-09-16 20:36:05",
    "CodeInfo": "'use strict'\n\nexports.main = (event, context, callback) : {\n    console.log('Hello World')\n    console.log(event)\n    console.log(context)\n    callback(null, event)\n}\n",
    "Triggers": [
        {
            "ModTime": "2019-09-16 20:36:05",
            "Type": "timer",
            "TriggerDesc": "{\"cron\": \"0 0 2 1 * * *\"}",
            "TriggerName": "myTrigger",
            "AddTime": "2019-09-16 20:36:05",
            "Enable": 1,
            "CustomArgument": ""
        }
    ],
    "Handler": "index.main",
    "CodeSize": 636,
    "Timeout": 5,
    "MemorySize": 256,
    "Runtime": "Nodejs8.9",
    "FunctionName": "app",
    "VpcConfig": { "VpcId": "", "SubnetId": "" },
    "Environment": { "Variables": [[Object], [Object]] },
    "Namespace": "luke-87pns",
    "Status": "Active"
}
```

## CloudBase - 入口类

同一腾讯云 云开发 账户对应一个类实例

构造方法：

### `new CloudBase(options)`

-   `options: object` - 【可选】初始化参数，如果 SDK 运行在云函数中，可省略，显式传递的参数优先级更高
    -   `secretId: string` - 腾讯云凭证 SecretId，`secretId` 与 `secretKey` 必须同时传递
    -   `secretKey: string` - 腾讯云凭证 SecretKey，`secretId` 与 `secretKey` 必须同时传递
    -   `secretToken: string` - 【可选】腾讯云临时凭证 `token`，传递此字段时意味着使用的是临时凭证，如果显式传递临时凭证，则此参数必传
    -   `envId: string` - 【可选】环境 Id，因为后续的很多接口依赖于环境，在未传递的情况下，需要通过 `addEnvironment()` 添加环境方可进行后续接口调用

静态方法：

### `static function init(options): CloudBase`

初始化默认 `CloudBase` 对象实例，单例的。

参数同构造方法参数相同

示例：

```javascript
const app = CloudBase.init({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    secretToken: 'Your SecretToken',
    envId: 'Your envId'
})
```

【推荐】使用默认实例并通过该方法进行初始化。

实例方法：

1.  环境相关：

    `CloudBase` 通过 `EnvironmentManager` 可管理多个 `Environment` 实例，存在一个当前环境的 `Environment`。

    -   `getEnvironmentManager(): EnvironmentManager` 获取环境管理器实例，可对多个 `Environment` 进行管理，存在一个当前的 `Environment` 对应于当前环境
    -   `addEnvironment(string envId): void` 增加环境的实例，如果不存在当前环境，新增加的环境实例自动成为当前环境。注意，该方法不会在腾讯云 云开发 服务中创建环境，所以 `envId` 对应的环境需要预先存在
    -   `currentEnvironment(): Environment` 获取当前环境 `Environment` 的实例

2.  能力相关：

    能力是与环境 `Environment` 相关联的，所以以下函数都是获取当前 `Environment` 环境下的资源管理对象。

    在没有切换当前环境的情况下，对应于初始化 `CloudbaseManager` 时的 `envId` 所对应的环境。

    ```javascript
    const app = new CloudBase({
        secretId: 'Your SecretId',
        secretKey: 'Your SecretKey',
        envId: 'Your envId' // 云开发环境ID，可在腾讯云云开发控制台获取
    })
    ```

    -   `app.functions` - 获取当前环境下的 `FunctionService` 对象实例，通过该对象实例可以管理云函数
    -   `app.database` - 获取当前环境下的 `DatabaseService` 对象实例，通过该对象实例可以管理数据库
    -   `app.storage` - 获取当前环境下的 `StorageService` 对象实例，通过该对象实例可以管理文件存储
    -   `app.env` - 获取当前环境下的 `EnvService` 对象实例，通过该对象实例可以管理环境
