import { cloudBaseConfig } from '../config'
import CloudBase from '../../src'

const { functions } = new CloudBase(cloudBaseConfig)
const layerName = 'luke' + Date.now()

// 文件层
test('创建文件层: functions.createLayer', async () => {
    const res = await functions.createLayer({
        name: layerName,
        contentPath: './test/functions/layertest/',
        runtimes: ['Nodejs8.9']
    })
    expect(res.LayerVersion).toBeTruthy()
})

test('查询文件层版本列表: functions.listLayerVersions', async () => {
    const res = await functions.createLayer({
        name: layerName,
        contentPath: './test/functions/layertest/',
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

// test('创建云函数-本地文件上传 设置文件层：functions.createFunction', async () => {
//     // 获取当前账户下文件层
//     const layersRes = await functions.listLayers({})

//     console.log('layersRes', layersRes)

//     const layers = [
//         {
//             version: layersRes.Layers[0].LayerVersion,
//             name: layersRes.Layers[0].LayerName
//         }
//     ]

//     const res = await functions.createFunction({
//         func: {
//             // functions 文件夹下函数文件夹的名称，即函数名
//             name: 'app',
//             layers,
//             timeout: 5,
//             // 环境变量
//             envVariables: {},
//             // 运行时
//             runtime: 'Nodejs8.9',
//             // 安装依赖
//             installDependency: true,

//             // 函数触发器，说明见文档: https://cloud.tencent.com/document/product/876/32314
//             triggers: [
//                 // {
//                 //     // name: 触发器的名字
//                 //     name: 'myTrigger',
//                 //     // type: 触发器类型，目前仅支持 timer （即定时触发器）
//                 //     type: 'timer',
//                 //     // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式
//                 //     config: '0 0 2 1 * * *'
//                 // }
//             ],
//             ignore: [],
//             isWaitInstall: true
//         },
//         functionRootPath: './test/functions/',
//         force: true,
//         base64Code: ''
//     })

//     console.log('res', res)

//     // expect(res).toBeTruthy()

//     // 查询函数详情
//     // const detail = await functions.getFunctionDetail('sumFunction')
//     // console.log('detail', detail)
//     // 更新函数配置 设置layers
// }, 10000)


test('更新云函数-设置文件层：functions.updateFunctionConfig', async () => {
    // 获取当前账户下文件层
    const layersRes = await functions.listLayers({})

    const layers = [
        {
            version: layersRes.Layers[0].LayerVersion,
            name: layersRes.Layers[0].LayerName
        }
    ]

    const res = await functions.updateFunctionConfig({
        // functions 文件夹下函数文件夹的名称，即函数名
        name: 'sumFunction',
        layers
    })

    expect(res).toBeTruthy()

    // 查询函数详情
    const detail = await functions.getFunctionDetail('sumFunction')
    // 更新函数配置 设置layers
}, 10000)

test('删除文件层版本: functions.deleteLayerVersion', async () => {
    const res = await functions.deleteLayerVersion({
        name: layerName,
        version: 1
    })
    expect(res.RequestId).toBeTruthy()
})
