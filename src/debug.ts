import CloudBase from './index'
// import { cloudBaseConfig } from '../test/config'

// const app = new CloudBase(cloudBaseConfig)
const app = new CloudBase({})

async function test() {
    const res = await app.storage.deleteFileCustom(['test_dir/data.txt'], '6465-dev-97eb6c-1252710547', 'ap-shanghai')
    console.log(res)
}
test()
