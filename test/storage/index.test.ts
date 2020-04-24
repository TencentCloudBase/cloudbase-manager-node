import fs from 'fs'
import path from 'path'
import { cloudBaseConfig } from '../config'
import CloudBase from '../../src/index'

const { storage } = new CloudBase(cloudBaseConfig)

const filePath = 'test/storage/test_data/data.txt'
const dirPath = 'test/storage/test_data/test_dir'
const downloadLocalPath = 'test/storage/test_data/download_dir'
const cloudFilePath = 'test/data.txt'
const cloudDirPath = 'test'

// 每个测试用例间隔 500ms
beforeEach(() => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            resolve()
        }, 500)
    })
})

test('获取上传 uploadmetadata:', async () => {
    const res = await storage.getUploadMetadata(cloudFilePath)
    expect(res).toBeTruthy()
})

test('上传文件 storage.uploadFile', async () => {
    await storage.uploadFile({
        localPath: filePath,
        cloudPath: cloudFilePath
    })
    const info = await storage.getFileInfo(cloudFilePath)

    expect(info).toBeTruthy()
}, 10000)

test('下载文件 storage.downloadFile', async () => {
    await storage.downloadFile({
        cloudPath: cloudFilePath,
        localPath: path.join(path.resolve(dirPath), 'data.txt')
    })
}, 10000)

test('下载文件 - 流 storage.downloadFile', async () => {
    const res = (await storage.downloadFile({
        cloudPath: cloudFilePath,
        localPath: ''
    })) as NodeJS.ReadableStream

    const write = fs.createWriteStream(path.join(path.resolve(dirPath), 'data-stream.txt'))
    res.pipe(write)

    return new Promise((resolve, reject) => {
        write.on('close', err => {
            if (err) {
                reject(err)
            }
            resolve()
        })
    })
}, 10000)

test('上传文件夹 storage.uploadDirectory', async () => {
    await storage.uploadDirectory({
        localPath: dirPath,
        cloudPath: cloudDirPath
    })
}, 10000)

test('下载文件夹 storage.downloadDirectory', async () => {
    await storage.downloadDirectory({
        cloudPath: cloudDirPath,
        localPath: downloadLocalPath
    })
}, 10000)

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

test('列出文件夹下的所有文件 storage.listDirectoryFiles', async () => {
    const res = await storage.listDirectoryFiles(cloudDirPath)

    expect(res.length).toBeGreaterThanOrEqual(1)
    expect(res[0].Key).toBeTruthy()
})

test('批量上传文件 storage.uploadFiles', async () => {
    await storage.uploadFiles({
        files: [
            {
                localPath: 'test/storage/test_data/data.txt',
                cloudPath: 'test/storage/test_data/data.txt'
            },
            {
                localPath: 'test/storage/test_data/download.txt',
                cloudPath: 'test/storage/test_data/download.txt'
            }
        ]
    })
})

test('删除文件夹 storage.deleteDirectory', async () => {
    await storage.deleteDirectory(cloudDirPath)

    expect(storage.getFileInfo(`${cloudDirPath}/data.txt`)).rejects.toBeTruthy()
})
