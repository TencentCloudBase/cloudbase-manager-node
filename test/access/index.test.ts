import { cloudBaseConfig } from '../config'
import CloudBase from '../../src/index'

let { commonService, env } = new CloudBase(cloudBaseConfig)
const { envId } = cloudBaseConfig

test('数据库简易权限获取', async () => {
    const res = await commonService.call({
        Action: 'DescribeDatabaseACL',
        Param: {
            CollectionName: 'coll-1',
            EnvId: envId
        }
    })
    console.log(res)
    expect(res.RequestId !== undefined).toBe(true)
})

test('数据库简易权限修改', async () => {
    const res = await commonService.call({
        Action: 'ModifyDatabaseACL',
        Param: {
            CollectionName: 'coll-1',
            AclTag: 'PRIVATE',
            EnvId: envId
        }
    })
    console.log(res)
    expect(res.RequestId !== undefined).toBe(true)
})

test('数据库安全规则设置', async () => {
    const res = await commonService.call({
        Action: 'ModifySafeRule',
        Param: {
            CollectionName: 'coll-1',
            AclTag: 'PRIVATE',
            EnvId: envId
            // Rule: JSON.stringify({
            //     read: true,
            //     write: 'doc._openid == auth.openid'
            // })
        }
    })
    console.log(res)
    expect(res.RequestId !== undefined).toBe(true)
})

test('查询数据库安全规则', async () => {
    const res = await commonService.call({
        Action: 'DescribeSafeRule',
        Param: {
            CollectionName: 'coll-1',
            EnvId: envId
        }
    })
    console.log(res)
    expect(res.RequestId !== undefined).toBe(true)
})

test('设置存储安全规则', async () => {
    // 获取环境信息 取bucket
    const {
        EnvInfo: { Storages }
    } = await env.getEnvInfo()
    console.log(Storages)
    const { Bucket } = Storages[0]
    const res = await commonService.call({
        Action: 'ModifyStorageSafeRule',
        Param: {
            Bucket,
            AclTag: 'CUSTOM',
            EnvId: envId,
            Rule: JSON.stringify({
                read: true,
                write: 'resource.openid == auth.uid'
            })
        }
    })
    console.log(res)
    expect(res.RequestId !== undefined).toBe(true)

    let status = ''
    do {
        status = (
            await commonService.call({
                Action: 'DescribeCDNChainTask',
                Param: {
                    Bucket,
                    EnvId: envId
                }
            })
        ).Status
        console.log(status)
    } while (status !== 'FINISHED' && status !== 'ERROR')
}, 10000)

test('查询存储安全规则', async () => {
    // 获取环境信息 取bucket
    const {
        EnvInfo: { Storages }
    } = await env.getEnvInfo()
    console.log(Storages)
    const { Bucket } = Storages[0]
    const res = await commonService.call({
        Action: 'DescribeStorageSafeRule',
        Param: {
            Bucket,
            EnvId: envId
        }
    })
    console.log(res)
    expect(res.RequestId !== undefined).toBe(true)
})

test('获取CDN防盗链任务状态', async () => {
    // 获取环境信息 取bucket
    const {
        EnvInfo: { Storages }
    } = await env.getEnvInfo()
    console.log(Storages)
    const { Bucket } = Storages[0]
    const res = await commonService.call({
        Action: 'DescribeCDNChainTask',
        Param: {
            Bucket,
            EnvId: envId
        }
    })
    console.log(res)
    expect(res.RequestId !== undefined).toBe(true)
})
