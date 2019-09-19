# cloudbase-node

云开发 admin-node SDK 支持开发者通过接口形式对云开发提供的云函数、数据库、文件存储等资源进行创建、管理、配置等操作。更多源码内容请参见 [cloudbase-node SDK]()。

## 安装

npm

```bash
npm install @cloudbase/admin-node
```

yarn

```bash
yarn add @cloudbase/admin-node
```

## 使用

要在你的代码内使用该模块：

```js
const CloudBase = require('@cloudbase/admin-node')
```

或

```js
import CloudBase from '@cloudbase/admin-node'
```


初始化

```js
const app = CloudBase.init({
    secretId: 'Your SecretId',
    secretKey: 'Your SecretKey',
    token: 'Your SecretToken', // 使用临时凭证需要此字段
    envId: 'Your envId' // 云环境 ID，可在腾讯云-云开发控制台获取
})
```

## 目录

- [初始化](./docs/initialization.md)
- [云函数](./docs/function.md)
- [数据库](./docs/database.md)
- [文件存储](./docs/storage.md)
