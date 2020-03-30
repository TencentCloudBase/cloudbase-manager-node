import { cloudBaseConfig } from '../config'
import CloudBase from '../../src/index'

const { envId } = cloudBaseConfig

let manager = new CloudBase(cloudBaseConfig)

test('新增安全来源', async () => {
    const res = await manager.commonService().call({
        Action: 'CreateSafetySource',
        Param: { EnvId: envId, AppName: 'test' }
    })

    console.log('新增安全来源', res)

    expect(res.RequestId !== undefined).toBe(true)
})

test('获取安全来源列表  并查询一项的密钥 最后删除', async () => {
    const res = await manager.commonService().call({
        Action: 'DescribeSafetySource',
        Param: { EnvId: envId, Offset: 0, Limit: 20 }
    })

    // const res = await httpService.createFunctionHttpService({
    //     name: 'sum',
    //     servicePath: '/sum'
    // })

    console.log('获取安全来源列表', res)

    expect(res.TotalCount > 0).toBe(true)

    // 查看安全来源的密钥
    const res1 = await manager.commonService().call({
        Action: 'DescribeSafetySourceSecretKey',
        Param: { EnvId: envId, ItemId: res.Data[0].Id }
    })
    console.log('查看安全来源的密钥', res1)

    expect(res1.AppSecretKey !== undefined).toBe(true)

    // 删除安全来源
    const res2 = await manager.commonService().call({
        Action: 'DeleteSafetySource',
        Param: { EnvId: envId, ItemId: res.Data[0].Id }
    })
    console.log('删除安全来源', res2)

    expect(res2.RequestId !== undefined).toBe(true)
})
