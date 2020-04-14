import { cloudBaseConfig } from '../config'
import CloudBase from '../../src/index'

const { hosting } = new CloudBase(cloudBaseConfig)

const filePath = 'test/storage/test_data/data.txt'
const dirPath = 'test/storage/test_data/test_dir'
const cloudFilePath = 'test_data/data.txt'
const cloudDirPath = 'test_dir'

// 每个测试用例间隔 500ms
beforeEach(() => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            resolve()
        }, 500)
    })
})

test('上传文件 hosting.uploadFile', async () => {
    await hosting.uploadFiles({
        localPath: filePath,
        cloudPath: cloudFilePath
    })
}, 10000)

test('上传文件夹 hosting.uploadDirectory', async () => {
    await hosting.uploadFiles({
        localPath: dirPath,
        cloudPath: cloudDirPath
    })
}, 10000)


test('列出文件夹下的所有文件 hosting.listFiles', async () => {
    const res = await hosting.listFiles()

    expect(res.length).toBeGreaterThanOrEqual(1)
    expect(res[0].Key).toBeTruthy()
})


test('删除文件 hosting.deleteFile', async () => {
    await hosting.deleteFiles({
        cloudPath: cloudFilePath,
        isDir: false
    })
})

test('删除文件夹 hosting.deleteDirectory', async () => {
    await hosting.deleteFiles({
        cloudPath: cloudDirPath,
        isDir: true
    })
})
