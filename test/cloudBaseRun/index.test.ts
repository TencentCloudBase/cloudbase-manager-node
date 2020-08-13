import { cloudBaseConfig } from '../config'
import CloudBase from '../../src/index'

const app = new CloudBase(cloudBaseConfig)

// 每个测试用例间隔 500ms
beforeEach(() => {
    return new Promise(resolve => {
        setTimeout(async () => {
            resolve()
        }, 1000)
    })
})

test.skip('修改容器内版本流量配置', async () => {
    const res = await app.cloudBaseRun.modifyServerFlow({
        serverName: 'test',
        versionFlowItems: [
            {
                versionName: 'test-001',
                flowRatio: 30
            },
            {
                versionName: 'test-002',
                flowRatio: 70
            }
        ]
    })

    expect(res.RequestId !== undefined && res.Result === 'succ').toBe(true)
})
