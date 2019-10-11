import { cloudBaseConfig } from '../config'
import CloudBase from '../../src'

const { functions } = new CloudBase(cloudBaseConfig)

test('列出所有函数: functions.listFunction', async () => {
    const data = await functions.listFunction()

    expect(data.length).toBeGreaterThanOrEqual(1)
})

test('列出所有函数: functions.listFunction(10, 1)', async () => {
    const data = await functions.listFunction(10, 1)

    expect(data.length).toBeGreaterThanOrEqual(0)
})

test('列出所有函数: functions.list(1)', async () => {
    const data = await functions.listFunction(1)

    expect(data.length).toBe(1)
})

test('创建云函数-本地文件上传：functions.createFunction', async () => {
    const res = await functions.createFunction(
        {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'sum',
            // 函数配置
            config: {
                // 超时时间
                timeout: 5,
                // 环境变量
                envVariables: {}
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
        './test/functions/',
        true,
        ''
    )

    expect(res).toBe(undefined)
})

test('创建云函数-本地文件上传：functions.createFunction', async () => {
    const res = await functions.createFunction(
        {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'sum',
            // 函数配置
            config: {
                // 超时时间
                timeout: 5,
                // 环境变量
                envVariables: {}
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
        '/Users/hengechang/Desktop/work/cloudbase-manager-node/test/functions',
        true,
        ''
    )

    expect(res).toBe(undefined)
})

test('创建云函数：functions.createFunction', async () => {
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

    expect(res).toBe(undefined)
})

test('更新云函数代码：functions.updateFunctionCode', async () => {
    const res = await functions.updateFunctionCode(
        {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'app'
        },
        '',
        'UEsDBAoAAAAAAOdCBU8AAAAAAAAAAAAAAAAFAAAAZGlzdC9QSwMEFAAIAAgAkhkBTwAAAAAAAAAAAAAAAAgAAABpbmRleC5qc2WNMQrDMBRDd59Cmx0IuUEy9wadXfdTQlT/Yv+UQMndmxZv0ST0kOTXKqhW5mTeOdleWqwOzzhnjAjylmw9kmaT7WcieYtp6TBO+DgcOlhVykB9BH8RUnHVwrvvTvi/do7begPtIeSV7NEqu/sCUEsHCLKdLCxuAAAAqAAAAFBLAwQUAAgACADnQgVPAAAAAAAAAAAAAAAADQAAAGRpc3QvZGlzdC56aXAL8GZm4WIAgedOrP5gBpRgBdIpmcUl+gFAJSIMHEA4SZIRRQkHUElmXkpqhV5WcWqvIddhAxHn8vlOs2U5djoafWebG/s92Cnkf9L/KQ4n784Wy7+o8mXCk+taK8KepdyzvBkXtYbvvEV6D8enaTm2k9Imv01XquzOfGng98NCxioi9JRDLUu9YFDh1UO73/v92F/Wd7uK+a3ik6lvLmrt/s0U4M3OsWmujk4e0AUrgBjhRnRv8MK8AfKLXlVmAQBQSwcITXynOsAAAADyAAAAUEsBAi0DCgAAAAAA50IFTwAAAAAAAAAAAAAAAAUAAAAAAAAAAAAQAO1BAAAAAGRpc3QvUEsBAi0DFAAIAAgAkhkBT7KdLCxuAAAAqAAAAAgAAAAAAAAAAAAgAKSBIwAAAGluZGV4LmpzUEsBAi0DFAAIAAgA50IFT018pzrAAAAA8gAAAA0AAAAAAAAAAAAgAKSBxwAAAGRpc3QvZGlzdC56aXBQSwUGAAAAAAMAAwCkAAAAwgEAAAAA'
    )

    expect(res.RequestId).toBeTruthy()
})

test('获取函数详情: functions.getFunctionDetail', async () => {
    const detail = await functions.getFunctionDetail('app')

    expect(detail.FunctionName).toEqual('app')
    expect(detail.MemorySize).toEqual(256)
})

test('获取函数日志: functions.getFunctionLog', async () => {
    const logs = await functions.getFunctionLogs({ name: 'app' })

    expect(logs.length).toBeGreaterThanOrEqual(0)
})

test('更新函数配置: functions.updateFunctionConfig', async () => {
    const res = await functions.updateFunctionConfig('app', {
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
