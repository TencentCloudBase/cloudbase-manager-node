import CloudBase from './index'

// const app = new CloudBase(cloudBaseConfig)
const app = new CloudBase({})

async function test() {
    const res = await app.functions.createFunction({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'sum',
            timeout: 5,
            // 环境变量
            envVariables: {},
            // 运行时
            runtime: 'Nodejs8.9',
            // 安装依赖
            installDependency: true,
            ignore: ['ignore.js'],
            isWaitInstall: true
        },
        functionPath: './test/functions/sum',
        force: true
    })
}
test()
