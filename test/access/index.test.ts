import { cloudBaseConfig } from '../config'
import CloudBase from '../../src/index'

const app = new CloudBase(cloudBaseConfig)

// 每个测试用例间隔 500ms
beforeEach(() => {
    return new Promise((resolve) => {
        setTimeout(async () => {
            resolve()
        }, 1000)
    })
})

test('删除云接入', async () => {
    const res = await app.access.deleteAccess({
        name: 'sum'
    })

    expect(res.RequestId !== undefined).toBe(true)
})

test('创建云接入', async () => {
    const res = await app.access.createAccess({
        path: '/sum',
        type: 1,
        name: 'sum'
    })

    expect(res.RequestId !== undefined).toBe(true)
})

test('获取云接入', async () => {
    const res = await app.access.getAccessList()

    console.log(res)

    expect(res.RequestId !== undefined).toBe(true)
})

test('获取云接入域名列表', async () => {
    const res = await app.access.getAccessDomainList()
    console.log('删除云接入', res)
    expect(res.RequestId !== undefined).toBe(true)
})

test('切换鉴权', async () => {
    const res = await app.access.switchAuth(false)
    console.log('切换鉴权', res)
    expect(res.RequestId !== undefined).toBe(true)
})

test('切换路径鉴权', async () => {
    const { APISet } = await app.access.getAccessList()
    const apiIds = APISet.map(item => item.APIId)

    const res = await app.access.switchPathAuth({
        apiIds: apiIds,
        auth: false
    })
    console.log('switchAccessService', res)
    expect(res.RequestId !== undefined).toBe(true)
})
