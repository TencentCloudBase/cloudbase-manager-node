import { cloudBaseConfig } from '../config'
import CloudBase from '../../src'
import { sleep } from '../../src/utils/index'
import { SCF_STATUS } from '../../src/constant'
import { assert } from 'console'
import { version } from 'cos-nodejs-sdk-v5'

const { functions } = new CloudBase(cloudBaseConfig)

// 每个测试用例间隔 2000ms
beforeEach(() => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            resolve()
        }, 2000)
    })
})

test('列出所有函数: functions.listFunctions', async () => {
    const data = await functions.listFunctions()

    expect(data.length).toBeGreaterThanOrEqual(1)
})

test('列出所有函数(新): functions.getFunctionList', async () => {
    const res = await functions.getFunctionList()
    console.log('data:', res)

    expect(res.Functions.length).toBeGreaterThanOrEqual(1)
})

test('列出所有函数: functions.listFunctions(10, 1)', async () => {
    const data = await functions.listFunctions(10, 1)

    expect(data.length).toBeGreaterThanOrEqual(0)
})

test('列出所有函数: functions.list(1)', async () => {
    const data = await functions.listFunctions(1)

    expect(data.length).toBe(1)
})

test('创建云函数-本地文件上传：functions.createFunction', async () => {
    const res = await functions.createFunction({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'sumFunction',
            timeout: 5,
            // 环境变量
            envVariables: {},
            // 运行时
            runtime: 'Nodejs8.9',
            // 内存 128 M
            memorySize: 128,
            // 安装依赖
            installDependency: true,

            // 函数触发器，说明见文档: https://cloud.tencent.com/document/product/876/32314
            triggers: [
                // {
                //     // name: 触发器的名字
                //     name: 'myTrigger',
                //     // type: 触发器类型，目前仅支持 timer （即定时触发器）
                //     type: 'timer',
                //     // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式
                //     config: '0 0 2 1 * * *'
                // }
            ],
            ignore: [],
            isWaitInstall: true
        },
        functionRootPath: './test/functions/',
        force: true
    })

    expect(res).toBeTruthy()
}, 30000)

test('创建 Node 10 云函数 - 本地文件上传：functions.createFunction', async () => {
    const res = await functions.createFunction({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'node10',
            timeout: 5,
            // 环境变量
            envVariables: {},
            // 运行时
            runtime: 'Nodejs10.15',
            // 内存 512 M
            memorySize: 512,
            // 安装依赖
            installDependency: true,
            ignore: [],
            isWaitInstall: false
        },
        functionRootPath: './test/functions/',
        force: true
    })

    expect(res).toBeTruthy()
}, 10000)

test('创建云函数-本地文件上传-通过 functionPath：functions.createFunction', async () => {
    const res = await functions.createFunction({
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

    expect(res).toBeTruthy()
}, 30000)

test('获取函数代码的下载链接: functions.getFunctionDownloadUrl', async () => {
    const res = await functions.getFunctionDownloadUrl('sumFunction')
    expect(res.Url !== undefined).toBe(true)
})

test('创建云函数-本地文件上传 加代码保护 验证getFunctionDetail，getFunctionDownloadUrl', async () => {
    const res = await functions.createFunction({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'sumWithCodeSecret',
            // 超时时间
            timeout: 5,
            // 环境变量
            envVariables: {},
            // 运行时
            runtime: 'Nodejs8.9',
            // 安装依赖
            installDependency: true,
            isWaitInstall: true,

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
            ],
            ignore: []
        },
        functionRootPath: './test/functions/',
        force: true,
        base64Code: '',
        codeSecret: 'lukekke'
    })

    // 检查函数状态
    let status
    do {
        const { Status } = await functions.getFunctionDetail('sumWithCodeSecret', 'lukekke')
        await sleep(1000)
        status = Status
        console.log(status)
    } while (status !== SCF_STATUS.ACTIVE)

    expect(res).toBeTruthy()

    // 验证不加code 调用 getFunctionDetail
    try {
        const res = await functions.getFunctionDetail('sumWithCodeSecret')
    } catch (err) {
        expect(err.code).toBe('UnauthorizedOperation.CodeSecret')
    }

    // 验证不加code 调用 getFunctionDownloadUrl
    try {
        const res = await functions.getFunctionDownloadUrl('sumWithCodeSecret')
    } catch (err) {
        expect(!!err).toBe(true) // 这里报错未返回错误码
        // expect(err.code).toBe('UnauthorizedOperation.CodeSecret')
    }

    // 验证加code调用 getFunctionDetail
    const res1 = await functions.getFunctionDetail('sumWithCodeSecret', 'lukekke')
    expect(res1.FunctionName).toEqual('sumWithCodeSecret')

    // 验证加code调用 getFunctionDownloadUrl
    const res2 = await functions.getFunctionDownloadUrl('sumWithCodeSecret', 'lukekke')
    expect(res2.Url !== undefined).toBe(true)
}, 30000)

test('增量更新云函数代码 新增文件夹: functions.updateFunctionIncrementalCode', async () => {
    const res = await functions.updateFunctionIncrementalCode({
        func: {
            name: 'sumFunction',
            runtime: 'Nodejs8.9'
        },
        functionRootPath: './test/functions',
        addFiles: 'test/*'
    })

    expect(res.RequestId !== undefined).toBe(true)
})

test('增量更新云函数代码 删除文件夹: functions.updateFunctionIncrementalCode', async () => {
    const res = await functions.updateFunctionIncrementalCode({
        func: {
            name: 'sumFunction',
            runtime: 'Nodejs8.9'
        },
        functionRootPath: './test/functions',
        deleteFiles: ['test/']
    })

    expect(res.RequestId !== undefined).toBe(true)
})

test('创建云函数-本地文件上传-通过 functionPath：functions.createFunction', async () => {
    const res = await functions.createFunction({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'app',
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

    expect(res).toBeTruthy()
}, 30000)

test('更新云函数代码：functions.updateFunctionCode 加代码保护 验证 getFunctionDeatil getFunctionDownloadUrl', async () => {
    const res = await functions.updateFunctionCode({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'sumWithCodeSecret',
            isWaitInstall: true
        },
        functionRootPath: '',
        base64Code:
            'UEsDBAoAAAAAAOdCBU8AAAAAAAAAAAAAAAAFAAAAZGlzdC9QSwMEFAAIAAgAkhkBTwAAAAAAAAAAAAAAAAgAAABpbmRleC5qc2WNMQrDMBRDd59Cmx0IuUEy9wadXfdTQlT/Yv+UQMndmxZv0ST0kOTXKqhW5mTeOdleWqwOzzhnjAjylmw9kmaT7WcieYtp6TBO+DgcOlhVykB9BH8RUnHVwrvvTvi/do7begPtIeSV7NEqu/sCUEsHCLKdLCxuAAAAqAAAAFBLAwQUAAgACADnQgVPAAAAAAAAAAAAAAAADQAAAGRpc3QvZGlzdC56aXAL8GZm4WIAgedOrP5gBpRgBdIpmcUl+gFAJSIMHEA4SZIRRQkHUElmXkpqhV5WcWqvIddhAxHn8vlOs2U5djoafWebG/s92Cnkf9L/KQ4n784Wy7+o8mXCk+taK8KepdyzvBkXtYbvvEV6D8enaTm2k9Imv01XquzOfGng98NCxioi9JRDLUu9YFDh1UO73/v92F/Wd7uK+a3ik6lvLmrt/s0U4M3OsWmujk4e0AUrgBjhRnRv8MK8AfKLXlVmAQBQSwcITXynOsAAAADyAAAAUEsBAi0DCgAAAAAA50IFTwAAAAAAAAAAAAAAAAUAAAAAAAAAAAAQAO1BAAAAAGRpc3QvUEsBAi0DFAAIAAgAkhkBT7KdLCxuAAAAqAAAAAgAAAAAAAAAAAAgAKSBIwAAAGluZGV4LmpzUEsBAi0DFAAIAAgA50IFT018pzrAAAAA8gAAAA0AAAAAAAAAAAAgAKSBxwAAAGRpc3QvZGlzdC56aXBQSwUGAAAAAAMAAwCkAAAAwgEAAAAA',
        codeSecret: 'lukekke'
    })

    expect(res.RequestId).toBeTruthy()

    // 验证不加code 调用 getFunctionDetail
    try {
        const res = await functions.getFunctionDetail('sumWithCodeSecret')
    } catch (err) {
        expect(err.code).toBe('UnauthorizedOperation.CodeSecret')
    }

    // 验证不加code 调用 getFunctionDownloadUrl
    try {
        const res = await functions.getFunctionDownloadUrl('sumWithCodeSecret')
    } catch (err) {
        expect(!!err).toBe(true) // 这里报错未返回错误码
        // expect(err.code).toBe('UnauthorizedOperation.CodeSecret')
    }

    // 验证加code调用 getFunctionDetail
    const res1 = await functions.getFunctionDetail('sumWithCodeSecret', 'lukekke')
    expect(res1.FunctionName).toEqual('sumWithCodeSecret')

    // 验证加code调用 getFunctionDownloadUrl
    const res2 = await functions.getFunctionDownloadUrl('sumWithCodeSecret', 'lukekke')
    expect(res2.Url !== undefined).toBe(true)
}, 10000)

test('创建云函数-本地文件上传：functions.createFunction', async () => {
    const res = await functions.createFunction({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'sumFunction',
            // 超时时间
            timeout: 5,
            // 环境变量
            envVariables: {},
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
        functionRootPath: __dirname,
        force: true,
        base64Code: ''
    })

    expect(res).toBeTruthy()
}, 20000)

test('创建云函数：functions.createFunction', async () => {
    const res = await functions.createFunction({
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
    expect(res).toBeTruthy()
}, 20000)

test('批量创建云函数：create multi function', async () => {
    const createFunction = async name =>
        functions.createFunction({
            func: {
                // functions 文件夹下函数文件夹的名称，即函数名
                name,
                // 超时时间
                timeout: 5,
                isWaitInstall: true
            },
            functionRootPath: './test/functions',
            force: true
        })

    const promises = await Promise.all([
        createFunction('big'),
        createFunction('sum'),
        createFunction('app')
    ])

    expect(promises).toBeTruthy()
}, 20000)

test('更新云函数代码：functions.updateFunctionCode', async () => {
    const res = await functions.updateFunctionCode({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'app'
        },
        functionRootPath: '',
        base64Code:
            'UEsDBAoAAAAAAOdCBU8AAAAAAAAAAAAAAAAFAAAAZGlzdC9QSwMEFAAIAAgAkhkBTwAAAAAAAAAAAAAAAAgAAABpbmRleC5qc2WNMQrDMBRDd59Cmx0IuUEy9wadXfdTQlT/Yv+UQMndmxZv0ST0kOTXKqhW5mTeOdleWqwOzzhnjAjylmw9kmaT7WcieYtp6TBO+DgcOlhVykB9BH8RUnHVwrvvTvi/do7begPtIeSV7NEqu/sCUEsHCLKdLCxuAAAAqAAAAFBLAwQUAAgACADnQgVPAAAAAAAAAAAAAAAADQAAAGRpc3QvZGlzdC56aXAL8GZm4WIAgedOrP5gBpRgBdIpmcUl+gFAJSIMHEA4SZIRRQkHUElmXkpqhV5WcWqvIddhAxHn8vlOs2U5djoafWebG/s92Cnkf9L/KQ4n784Wy7+o8mXCk+taK8KepdyzvBkXtYbvvEV6D8enaTm2k9Imv01XquzOfGng98NCxioi9JRDLUu9YFDh1UO73/v92F/Wd7uK+a3ik6lvLmrt/s0U4M3OsWmujk4e0AUrgBjhRnRv8MK8AfKLXlVmAQBQSwcITXynOsAAAADyAAAAUEsBAi0DCgAAAAAA50IFTwAAAAAAAAAAAAAAAAUAAAAAAAAAAAAQAO1BAAAAAGRpc3QvUEsBAi0DFAAIAAgAkhkBT7KdLCxuAAAAqAAAAAgAAAAAAAAAAAAgAKSBIwAAAGluZGV4LmpzUEsBAi0DFAAIAAgA50IFT018pzrAAAAA8gAAAA0AAAAAAAAAAAAgAKSBxwAAAGRpc3QvZGlzdC56aXBQSwUGAAAAAAMAAwCkAAAAwgEAAAAA'
    })

    expect(res.RequestId).toBeTruthy()
})

test('获取函数详情: functions.getFunctionDetail', async () => {
    const detail = await functions.getFunctionDetail('app')

    expect(detail.FunctionName).toEqual('app')
    expect(detail.MemorySize).toEqual(256)
})

test('获取函数日志: functions.getFunctionLog', async () => {
    // const logs = await functions.getFunctionLogs({ name: 'app' })
    const logs = await functions.getFunctionLogs({
        name: 'app',
        requestId: 'b87d3ad6-3447-11ea-8ec5-525400e4521d'
    })

    expect(logs.Data.length).toBeGreaterThanOrEqual(0)
})

test('更新函数配置: functions.updateFunctionConfig', async () => {
    const res = await functions.updateFunctionConfig({
        name: 'app',
        timeout: 6,
        memorySize: 512
    })
    expect(res.RequestId).toBeTruthy()
    const detail = await functions.getFunctionDetail('app')

    expect(detail.Timeout).toEqual(6)
    expect(detail.MemorySize).toEqual(512)
})

test.skip('连续更新动作 updateFunctionConfig + createFunctionTriggers', async () => {
    const updateFunctionConfigRes = await functions.updateFunctionConfig({
        name: 'app',
        timeout: 10,
        memorySize: 256
    })
    expect(updateFunctionConfigRes.RequestId).toBeTruthy()
    const detail = await functions.getFunctionDetail('app')

    expect(detail.Timeout).toEqual(10)
    expect(detail.MemorySize).toEqual(256)

    const createTriggerRes = await functions.createFunctionTriggers('app', [
        {
            // name: 触发器的名字
            name: 'newTrigger',
            // type: 触发器类型，目前仅支持 timer （即定时触发器）
            type: 'timer',
            // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式
            config: '0 0 3 1 * * *'
        }
    ])
    expect(createTriggerRes.RequestId).toBeTruthy()

    const detail1 = await functions.getFunctionDetail('app')

    expect(detail1.Triggers.length).toBeGreaterThan(0)
})

test('创建触发器: functions.createFunctionTriggers', async () => {
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
    expect(res.RequestId).toBeTruthy()

    const detail = await functions.getFunctionDetail('app')

    expect(detail.Triggers.length).toBeGreaterThan(0)
})

test('删除触发器: functions.deleteFunctionTrigger', async () => {
    const res = await functions.deleteFunctionTrigger('app', 'newTrigger')

    expect(res.RequestId).toBeTruthy()

    const detail = await functions.getFunctionDetail('app')

    expect(detail.Triggers.length).toEqual(0)
})

test('触发函数: functions.invokeFunction', async () => {
    const res = await functions.invokeFunction('app', {
        a: 1
    })

    expect(res.RetMsg).toEqual(
        JSON.stringify({
            a: 1
        })
    )
})

test('复制云函数：functions.copyFunction', async () => {
    const res = await functions.copyFunction('app', 'app-copy')
    expect(res.RequestId).toBeTruthy()
})

test('设置函数预置并发，查询，删除', async () => {
    // 针对 app 函数创建新版本
    const createNewVersionRes = await functions.publishVersion({
        functionName: 'sum',
        description: 'test'
    })

    console.log('createNewVersionRes', createNewVersionRes)

    const latestVersion = createNewVersionRes.FunctionVersion

    // 查询版本详情，等待版本状态为Active
    let versionStatus
    while (versionStatus !== 'Active') {
        const functionVersions = await functions.listVersionByFunction({
            functionName: 'sum'
        })
        console.log('functionVersions', functionVersions)
        const curVersion = functionVersions.Versions[functionVersions.TotalCount - 1]
        versionStatus = curVersion.Status
    }

    // 设置新版本预置并发
    const setProvisionedConcurrencyConfigRes = await functions.setProvisionedConcurrencyConfig({
        functionName: 'sum',
        qualifier: latestVersion,
        // qualifier: '1',
        versionProvisionedConcurrencyNum: 10 // 设置10并发
    })

    console.log('setProvisionedConcurrencyConfigRes', setProvisionedConcurrencyConfigRes)

    const getProvisionedConcurrencyConfigRes = await functions.getProvisionedConcurrencyConfig({
        functionName: 'sum',
        qualifier: latestVersion
        // qualifier: '1'
    })

    console.log('getProvisionedConcurrencyConfigRes', getProvisionedConcurrencyConfigRes)
    assert(getProvisionedConcurrencyConfigRes.Allocated.length === 1)

    // 分配流量
    const updateVersionConfigRes = await functions.updateFunctionAliasConfig({
        functionName: 'sum',
        name: '$DEFAULT',
        functionVersion: '$LATEST',
        routingConfig: {
            AddtionVersionMatchs: [{
                Expression: "[0,3)",
                Key: "invoke.headers.X-Tcb-Route-Key",
                Method: "range",
                Version: latestVersion
                // Version: '1'
            }]
        }
    })
    console.log('updateVersionConfigRes', updateVersionConfigRes)

    // 查询流量配置比例
    const getVersionConfigRes = await functions.getFunctionAlias({
        name: '$DEFAULT',
        functionName: 'sum'
    })

    console.log('getVersionConfigRes', JSON.stringify(getVersionConfigRes))
    assert(getVersionConfigRes.RoutingConfig.AddtionVersionMatchs[0].Version === latestVersion)
})

test('删除函数: functions.deleteFunction', async () => {
    await functions.deleteFunction('app')
    const res = await functions.deleteFunction('app-copy')

    expect(res.RequestId).toBeTruthy()

    // 抛出资源不存在错误
    expect(
        (async () => {
            await functions.getFunctionDetail('app')
        })()
    ).rejects.toThrowError()
})



