import { cloudBaseConfig } from '../config'
import CloudBase from '../../src/index'

let manager = new CloudBase(cloudBaseConfig)

const { envId } = cloudBaseConfig

test('获取所有环境 env.listEnvs', async () => {
    const res = await manager.env.listEnvs()
    expect(res.EnvList.length).toBeGreaterThanOrEqual(1)
})

// 拉取当前环境的安全域名列表
test('拉取当前环境的安全域名列表 env.getEnvAuthDomains', async () => {
    const res = await manager.env.getEnvAuthDomains()
    expect(res.Domains.length).toBeGreaterThanOrEqual(0)
})

// 添加安全域名到当前环境
test('添加安全域名到当前环境 env.createEnvDomain', async () => {
    const res = await manager.env.createEnvDomain(['luke.com'])
    expect(res.RequestId).toBeTruthy()
})

// 查看当前环境资源信息
test('查看当前环境信息 env.getEnvInfo', async () => {
    const res = await manager.env.getEnvInfo()
    expect(res.EnvInfo.EnvId).toBe(manager.getManagerConfig().envId)
})

// 修改环境信息
test('修改环境信息 env.updateEnvInfo', async () => {
    const res = await manager.env.updateEnvInfo('lukemodify')
    expect(res.RequestId).toBeTruthy()
})

// 拉取当前环境的登录配置列表
test('拉取当前环境的登录配置列表 env.getLoginConfigList', async () => {
    const res = await manager.env.getLoginConfigList()
    console.log(res)
    expect(res.ConfigList.length).toBeGreaterThanOrEqual(0)
})

// 删除当前环境的安全域名
test('删除当前环境的安全域名 env.deleteEnvDomain', async () => {
    const deleteRes = await manager.env.deleteEnvDomain(['luke.com'])
    expect(deleteRes.Deleted).toBe(1)
})

// 创建登录方式
test('env CreateLoginConfig', async () => {
    expect(manager.env.createLoginConfig('WECHAT-OPEN', '', '')).rejects.toThrowError()
})

// 创建匿名登录方式
test('env anonymous CreateLoginConfig', async () => {
    const { ConfigList } = await manager.env.getLoginConfigList()
    const hasAnonymousConfig = ConfigList.some(item => item.Platform === 'ANONYMOUS')
    if (!hasAnonymousConfig) {
        const res = await manager.env.createLoginConfig('ANONYMOUS', 'anonymous')
        expect(res.RequestId).toBeTruthy()
    }
})

// 更新匿名登录方式
test('env anonymous CreateLoginConfig', async () => {
    const { ConfigList } = await manager.env.getLoginConfigList()
    const anonymousConfig: any = ConfigList.find(item => item.Platform === 'ANONYMOUS')
    if (anonymousConfig) {
        const res = await manager.env.updateLoginConfig(anonymousConfig.Id, 'ENABLE', 'anonymous')
        console.log(res)
        // expect(res.RequestId).toBeTruthy()
    } else {
        throw Error('请先创建匿名登录方式')
    }
})

// 更新登录方式 待验证
test('env UpdateLoginConfig', async () => {
    expect(manager.env.updateLoginConfig('')).rejects.toThrowError()
})

// 创建新环境
// test('env createEnv', async () => {
//     // 忽略此方法
//     try {
//         const res = await manager.env.createEnv({
//             name: 'aaaluke',
//             paymentMode: 'postpay',
//             channel: 'dcloud'
//         })
//         console.log('createEnv ', res)
//         expect(res.envId !== undefined).toBe(true)
//     } catch (err) {
//         console.log(err)
//     }
// })

// 拉取环境列表信息
test('env listEnvs', async () => {
    const res = await manager.env.listEnvs()
    expect(res.EnvList.length).toBeGreaterThanOrEqual(0)
})

test('创建自定义登录密钥', async () => {
    const res = await manager.env.createCustomLoginKeys()

    console.log(res)

    expect(res.RequestId !== undefined).toBe(true)
})
