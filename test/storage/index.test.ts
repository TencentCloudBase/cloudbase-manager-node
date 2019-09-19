import path from 'path'
import CloudBase from '../../src/index'

const { storage } = new CloudBase({
    secretId: '',
    secretKey: '',
    envId: ''
})

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

test('上传文件 storage.uploadFile', async () => {
    await storage.uploadFile(filePath, cloudFilePath)
    const info = await storage.getFileInfo(cloudFilePath)

    expect(info).toBeTruthy()
})

test('下载文件 storage.downloadFile', async () => {
    await storage.downloadFile(cloudFilePath, path.join(path.resolve(dirPath), 'download.txt'))
})

test('获取文件临时下载链接 storage.getTemporaryUrl', async () => {
    const res = await storage.getTemporaryUrl([cloudFilePath])

    expect(res.length).toBeGreaterThanOrEqual(1)
    expect(res[0].url).toBeTruthy()
})

test('获取文件信息 storage.getFileInfo', async () => {
    const info = await storage.getFileInfo(cloudFilePath)

    expect(info).toBeTruthy()
})

test('删除文件 storage.deleteFile', async () => {
    await storage.deleteFile([cloudFilePath])
})

test('获取已删除文件信息 storage.deleteFile getFileInfo', async () => {
    // 文件不存在
    expect(storage.getFileInfo(cloudFilePath)).rejects.toBeTruthy()
})

test('上传文件夹 storage.uploadDirectory', async () => {
    await storage.uploadDirectory(dirPath, cloudDirPath)
})

test('列出文件夹下的所有文件 storage.listDirectoryFiles', async () => {
    const res = await storage.listDirectoryFiles(cloudDirPath)

    expect(res.length).toBeGreaterThanOrEqual(1)
    expect(res[0].Key).toBeTruthy()
})

test('删除文件夹 storage.deleteDirectory', async () => {
    await storage.deleteDirectory(cloudDirPath)

    expect(storage.getFileInfo(`${cloudDirPath}/data.txt`)).rejects.toBeTruthy()
})
