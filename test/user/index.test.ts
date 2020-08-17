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

test('创建用户，删除用户', async () => {
    const username = 'ts8324ndf9324j'
    const { User: newUser } = await app.user.createEndUser({
        username,
        password: '123hello'
    })

    const { Users: unDeleteUsers } = await app.user.getEndUserList({
        limit: 100,
        offset: 0
    })

    const user = unDeleteUsers.find(user => newUser.UUId === user.UUId)
    expect(user).toBeDefined()
    await app.user.deleteEndUsers({
        userList: [newUser.UUId]
    })

    const { Users: deletedUsers } = await app.user.getEndUserList({
        limit: 100,
        offset: 0
    })
    const isExist = deletedUsers.some(user => newUser.UUId === user.UUId)
    expect(isExist).toBeFalsy()
})

test('重复创建用户', async () => {
    const username = 'op59sdf08'
    const { User } = await app.user.createEndUser({
        username,
        password: '123hello'
    })

    const createAgain = app.user.createEndUser({
        username,
        password: '123hello'
    })
    await expect(createAgain).rejects.toThrow()

    await app.user.deleteEndUsers({
        userList: [User.UUId]
    })
})

test('创建用户，密码强度不符合要求', async () => {
    const username = 'a34kfsd9324ndf89rnmvfqp'
    const promise = app.user.createEndUser({
        username,
        password: '123'
    })
    await expect(promise).rejects.toThrow()
})

test('更新用户信息', async () => {
    const username = 'yxd59sdf00'
    const newUsername = 'yxd59sdf01'
    const { User } = await app.user.createEndUser({
        username,
        password: '123hello'
    })

    await app.user.modifyEndUser({
        uuid: User.UUId,
        username: newUsername
    })

    const { Users } = await app.user.getEndUserList({
        limit: 100,
        offset: 0
    })
    const found = Users.some(user => user.UserName === newUsername)
    expect(found).toBeTruthy()

    await app.user.deleteEndUsers({
        userList: [User.UUId]
    })
})
