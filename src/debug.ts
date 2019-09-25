import CloudBase from './index'

const app = new CloudBase({
    secretId: '',
    secretKey: '',
    envId: ''
})

async function test() {
    const res = await app.storage.setStorageAcl('READONLY')
    console.log(res)
}
test()
