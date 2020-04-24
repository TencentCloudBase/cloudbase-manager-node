import { cloudBaseConfig } from '../config'
import CloudBase from '../../src/index'

const { hosting } = new CloudBase(cloudBaseConfig)

const filePath = 'test/storage/test_data/data.txt'
const dirPath = 'test/storage/test_data/test_dir'
const cloudFilePath = 'hosting/data.txt'
const cloudDirPath = 'hosting'

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
        cloudPath: cloudDirPath,
        ignore: ['**/ignore.*']
    })
}, 10000)

test('上传多个文件 hosting.uploadFiles', async () => {
    let fileCount = 0
    await hosting.uploadFiles({
        files: [
            {
                localPath: 'test/storage/test_data/data.txt',
                cloudPath: 'hosting/test_data/data.txt'
            },
            {
                localPath: 'test/storage/test_data/download.txt',
                cloudPath: 'hosting/test_data/download.txt'
            },
            {
                localPath: 'test/storage/test_data/download.txt',
                cloudPath: 'hosting/download.txt'
            },
            {
                localPath: 'test/storage/test_data/download.txt',
                cloudPath: 'hosting/index.txt'
            },
            {
                localPath: 'test/storage/test_data/download.txt',
                cloudPath: 'hosting/a.txt'
            },
            {
                localPath: 'test/storage/test_data/ignore.txt',
                cloudPath: 'hosting/ignore.txt'
            }
        ],
        ignore: ['**/ignore.*'],
        onFileFinish: () => {
            fileCount++
        }
    })

    const files = await hosting.listFiles()
    const ignoreFile = files.find(file => file.Key.includes('ignore.txt'))
    expect(fileCount).toEqual(5)
    expect(ignoreFile).toBeFalsy()
}, 20000)

test('文件搜索 find', async () => {
    const res = await hosting.findFiles({ prefix: 'hosting/', marker: '/' })
    expect(res.Contents.length > 0).toBeTruthy()
})

test('配置错误文档 索引文档', async () => {
    await hosting.setWebsiteDocument({
        errorDocument: 'error.html',
        indexDocument: 'success.html'
    })
})

test.skip('绑定自定义域名', async () => {
    const res = await hosting.CreateHostingDomain({
        domain: 'cms.devtoken.club',
        certId: 'ZNciCmHp'
    })
    console.log(res)
})

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
