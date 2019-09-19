import CloudBase from './index'

const app = new CloudBase({
    secretId: '',
    secretKey: '',
    envId: ''
})

async function test() {
    const res1 = await app.database.createCollection('rooms1')
}

test()
