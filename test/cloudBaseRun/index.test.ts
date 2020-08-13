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

test('修改容器内版本流量配置', async () => {
    const res = await app.cloudApp.modifyServerFlow({
        serverName: 'cloud-app-test',
        versionFlowItems: [
            {
                versionName: 'cloud-app-test-001',
                flowRatio: 30
            },
            {
                versionName: 'cloud-app-test-002',
                flowRatio: 70
            }
        ]
    })

    expect(res.RequestId !== undefined && res.Result === 'succ').toBe(true)
})
