import CloudBase from '../src'

const { functions } = new CloudBase({
    secretId: '',
    secretKey: '',
    envId: ''
})

module.exports = async () => {
    await functions.createFunction(
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
    console.log('创建函数成功 \n')
}
