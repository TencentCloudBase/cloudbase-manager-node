import { cloudBaseConfig } from '../config'
import CloudBase from '../../src/index'

const app = new CloudBase(cloudBaseConfig)
const { user } = app

// 检查查询云开发用户信息列表
test('user getEndUserList', async () => {
    const { Total, Users } = await user.getEndUserList({
        limit: 20,
        offset: 0
    })

    expect(Total).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(Users)).toBeTruthy()
})

// 检查停用云开发用户API
test('test disableEndUser', async () => {
    const { Users } = await user.getEndUserList({
        limit: 20,
        offset: 0
    })

    if (!Users.length) {
        return
    }

    const { UUId: uuid } = Users[0]
    const { RequestId } = await user.disableEndUser({ uuid })
    expect(typeof RequestId).toEqual('string')
})

// 检查批量删除云开发用户API
test('test deleteEndUsers', async () => {
    const { Users: unDeleteUsers } = await user.getEndUserList({
        limit: 20,
        offset: 0
    })

    if (!unDeleteUsers.length) {
        return
    }

    const toDeleteUser = unDeleteUsers[0]
    await user.deleteEndUsers({
        userList: [toDeleteUser.UUId]
    })

    const { Users: deletedUsers } = await user.getEndUserList({
        limit: 20,
        offset: 0
    })
    const foundDeletedUser = deletedUsers.some((deleteUser) => deleteUser.UUId === toDeleteUser.UUId)
    expect(foundDeletedUser).toBeFalsy()
})
