import { cloudBaseConfig } from '../config'
import CloudBase from '../../src'
import { sleep } from '../../src/utils/index'
import { SCF_STATUS } from '../../src/constant'

const { functions } = new CloudBase(cloudBaseConfig)
const layerName = 'luke' + Date.now()

test('列出所有函数: functions.listFunctions', async () => {
    const data = await functions.listFunctions()

    expect(data.length).toBeGreaterThanOrEqual(1)
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
        force: true,
        base64Code: ''
    })

    expect(res).toBeTruthy()
})

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
})

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

test('更新云函数代码：functions.updateFunctionCode 加代码保护 验证 getFunctionDeatil getFunctionDownloadUrl', async () => {
    const res = await functions.updateFunctionCode({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'app'
        },
        functionRootPath: '',
        base64Code:
            'UEsDBAoAAAAAAOdCBU8AAAAAAAAAAAAAAAAFAAAAZGlzdC9QSwMEFAAIAAgAkhkBTwAAAAAAAAAAAAAAAAgAAABpbmRleC5qc2WNMQrDMBRDd59Cmx0IuUEy9wadXfdTQlT/Yv+UQMndmxZv0ST0kOTXKqhW5mTeOdleWqwOzzhnjAjylmw9kmaT7WcieYtp6TBO+DgcOlhVykB9BH8RUnHVwrvvTvi/do7begPtIeSV7NEqu/sCUEsHCLKdLCxuAAAAqAAAAFBLAwQUAAgACADnQgVPAAAAAAAAAAAAAAAADQAAAGRpc3QvZGlzdC56aXAL8GZm4WIAgedOrP5gBpRgBdIpmcUl+gFAJSIMHEA4SZIRRQkHUElmXkpqhV5WcWqvIddhAxHn8vlOs2U5djoafWebG/s92Cnkf9L/KQ4n784Wy7+o8mXCk+taK8KepdyzvBkXtYbvvEV6D8enaTm2k9Imv01XquzOfGng98NCxioi9JRDLUu9YFDh1UO73/v92F/Wd7uK+a3ik6lvLmrt/s0U4M3OsWmujk4e0AUrgBjhRnRv8MK8AfKLXlVmAQBQSwcITXynOsAAAADyAAAAUEsBAi0DCgAAAAAA50IFTwAAAAAAAAAAAAAAAAUAAAAAAAAAAAAQAO1BAAAAAGRpc3QvUEsBAi0DFAAIAAgAkhkBT7KdLCxuAAAAqAAAAAgAAAAAAAAAAAAgAKSBIwAAAGluZGV4LmpzUEsBAi0DFAAIAAgA50IFT018pzrAAAAA8gAAAA0AAAAAAAAAAAAgAKSBxwAAAGRpc3QvZGlzdC56aXBQSwUGAAAAAAMAAwCkAAAAwgEAAAAA',
        codeSecret: 'llluke'
    })

    expect(res.RequestId).toBeTruthy()

    // 验证不加code 调用 getFunctionDetail
    try {
        const res = await functions.getFunctionDetail('app')
    } catch (err) {
        expect(err.code).toBe('UnauthorizedOperation.CodeSecret')
    }

    // 验证不加code 调用 getFunctionDownloadUrl
    try {
        const res = await functions.getFunctionDownloadUrl('app')
    } catch (err) {
        expect(!!err).toBe(true) // 这里报错未返回错误码
        // expect(err.code).toBe('UnauthorizedOperation.CodeSecret')
    }

    // 验证加code调用 getFunctionDetail
    const res1 = await functions.getFunctionDetail('app', 'llluke')
    expect(res1.FunctionName).toEqual('app')

    // 验证加code调用 getFunctionDownloadUrl
    const res2 = await functions.getFunctionDownloadUrl('app', 'llluke')
    expect(res2.Url !== undefined).toBe(true)
})

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
})

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
})

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
        timeout: 6
    })
    expect(res.RequestId).toBeTruthy()
    const detail = await functions.getFunctionDetail('app')

    expect(detail.Timeout).toEqual(6)
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

// 文件层
test('创建文件层: functions.createLayer', async () => {
    const res = await functions.createLayer({
        name: layerName,
        contentPath: './test/functions/gongshu/',
        runtimes: ['Nodejs8.9']
    })
    expect(res.LayerVersion).toBeTruthy()
})

test('删除文件层版本: functions.deleteLayerVersion', async () => {
    const res = await functions.deleteLayerVersion({
        name: layerName,
        version: 1
    })
    expect(res.RequestId).toBeTruthy()
})

test('查询文件层版本列表: functions.listLayerVersions', async () => {
    const res = await functions.createLayer({
        name: layerName,
        contentPath: './test/functions/gongshu/',
        runtimes: ['Nodejs8.9']
    })
    expect(res.LayerVersion).toBeTruthy()
    const res1 = await functions.listLayerVersions({
        name: layerName
    })
    expect(res1.LayerVersions.length).toBeTruthy()
})

test('查询文件层列表: functions.listLayers', async () => {
    const res = await functions.listLayers({})
    expect(res.Layers.length).toBeTruthy()
})

test('获取层版本详细信息: functions.GetLayerVersion', async () => {
    const res = await functions.getLayerVersion({
        name: layerName,
        version: 2
    })
    expect(res.LayerVersion).toBe(2)
})

test('创建云函数-本地文件上传 设置文件层：functions.createFunction', async () => {
    // 获取当前账户下文件层
    const layersRes = await functions.listLayers({})

    const layers = [
        {
            LayerVersion: layersRes.Layers[0].LayerVersion,
            LayerName: layersRes.Layers[0].LayerName
        }
    ]

    const res = await functions.createFunction({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'sumFunction',
            layers,
            timeout: 5,
            // 环境变量
            envVariables: {},
            // 运行时
            runtime: 'Nodejs8.9',
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
        force: true,
        base64Code: ''
    })

    // expect(res).toBeTruthy()

    // 查询函数详情
    const detail = await functions.getFunctionDetail('sumFunction')

    // 更新函数配置 设置layers
})
