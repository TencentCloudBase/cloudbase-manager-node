import path from 'path'
import { cloudBaseConfig } from '../config'
import CloudBase from '../../src/index'

let manager = new CloudBase(cloudBaseConfig)

// 获取当前账户的角色列表
test('cam describe role list', async () => {
    let res
    try {
        res = await manager.database.createCollection('rooms51')
    } catch (err) {
        res = err
    } finally {
        expect(res.code).toBeFalsy()
    }
})
