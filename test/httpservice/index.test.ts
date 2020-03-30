import { cloudBaseConfig } from '../config'
import CloudBase from '../../src/index'

const { envId } = cloudBaseConfig

let manager = new CloudBase(cloudBaseConfig)

test('创建云函数HTTP Service', async () => {
    const res = await manager.commonService().call({
        Action: 'CreateCloudBaseGWAPI',
        Param: { ServiceId: envId, Path: '/sum', Type: 1, Name: 'sum' }
    })

    // const res = await httpService.createFunctionHttpService({
    //     name: 'sum',
    //     servicePath: '/sum'
    // })

    console.log('创建云函数HTTP Service', res)

    expect(res.RequestId !== undefined).toBe(true)
})

test('获取云函数HTTP Service', async () => {
    const res = await manager.commonService().call({
        Action: 'DescribeCloudBaseGWAPI',
        Param: {
            ServiceId: envId,
            // Domain: domain,
            Path: '/sum'
            // APIId: apiId
        }
    })

    // const res = await httpService.getHttpService({
    //     // name: 'sum'
    //     path: '/sum'
    // })
    console.log('获取云函数HTTP Service', res)
    expect(res.RequestId !== undefined).toBe(true)
})

test('删除云函数HTTP Service', async () => {
    const res = await manager.commonService().call({
        Action: 'DeleteCloudBaseGWAPI',
        Param: {
            ServiceId: envId,
            Path: '/sum'
            // APIId: apiId
        }
    })
    console.log('删除云函数HTTP Service', res)
    expect(res.RequestId !== undefined).toBe(true)
})

test('绑定网关自定义域名', async () => {
    // 检查当前是否绑定域名
    const { ServiceSet } = await manager.commonService().call({
        Action: 'DescribeCloudBaseGWService',
        Param: {
            ServiceId: envId
            // Domain: ''
        }
    })

    if (
        ServiceSet.length === 0 ||
        (ServiceSet.length > 0 && ServiceSet[0].Domain !== 'ci-test.devtoken.club')
    ) {
        const res = await manager.commonService().call({
            Action: 'BindCloudBaseGWDomain',
            Param: {
                ServiceId: envId,
                Domain: 'ci-test.devtoken.club'
            }
        })

        console.log('绑定网关自定义域名', res)
        expect(res.RequestId !== undefined).toBe(true)
    }
})

test('查询网关域名', async () => {
    const res = await manager.commonService().call({
        Action: 'DescribeCloudBaseGWService',
        Param: {
            ServiceId: envId
        }
    })
    console.log('查询网关域名', res)
    expect(res.RequestId !== undefined).toBe(true)
})

test('解绑网关域名', async () => {
    const res = await manager.commonService().call({
        Action: 'DeleteCloudBaseGWDomain',
        Param: {
            ServiceId: envId,
            Domain: 'ci-test.devtoken.club'
        }
    })
    console.log('解绑网关域名', res)
    expect(res.RequestId !== undefined).toBe(true)
})
