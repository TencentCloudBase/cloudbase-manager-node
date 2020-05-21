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

test('删除静态托管域名:', async () => {
    // const info = await hosting.getInfo()
    // console.log('info:', info)
    const domain = 'cms.devtoken.club'

    const deleteRes = await hosting.deleteHostingDomain({ domain })
    console.log('deleteRes res:', deleteRes.RequestId)
    expect(deleteRes.RequestId !== undefined).toBeTruthy()
})

test('获取静态网站配置', async () => {
    const getConfig = await hosting.getWebsiteConfig()
    console.log('getConfig :', getConfig)
    expect(getConfig.WebsiteConfiguration !== undefined).toBeTruthy()
})

test('配置重定向规则 ', async () => {
    const res = await hosting.setWebsiteDocument({
        indexDocument: 'index.html',
        routingRules: [
            {
                keyPrefixEquals: 'test.html',
                replaceKeyWith: 'testtest.html'
            },
            {
                httpErrorCodeReturnedEquals: '400',
                replaceKeyWith: 'error.html'
            }
        ]
    })
    console.log(res)
    expect(res.statusCode === 200).toBeTruthy()
})

test('设置静态托管 缓存配置 防盗链配置 黑名单配置 IP访问限频配置', async () => {
    const info = await hosting.getInfo()
    console.log('info:', info)

    const domain = info[0].CdnDomain
    const res = await hosting.tcbCheckResource({
        domains: [domain]
    })
    console.log('res:', res)
    const domainId = res[0].DomainId

    const setRes = await hosting.tcbModifyAttribute({
        domain,
        domainId,
        domainConfig: {
            Refer: {
                Switch: 'on',
                RefererRules: [
                    {
                        AllowEmpty: false,
                        RefererType: 'blacklist',
                        Referers: ['www.test11.com']
                    }
                ]
            },
            IpFilter: {
                Switch: 'on',
                FilterType: 'blacklist',
                Filters: ['10.10.10.10']
            },
            IpFreqLimit: {
                Switch: 'on',
                Qps: 100
            },
            Cache: [
                {
                    RuleType: 'suffix',
                    RuleValue: '.jpg',
                    CacheTtl: 60
                }
            ]
        }
    })

    console.log('setRes:', setRes)

    const checkResourceRes = await hosting.tcbCheckResource({
        domains: [domain]
    })

    console.log('checkResourceRes:', JSON.stringify(checkResourceRes))
    expect(checkResourceRes[0]?.DomainConfig?.Refer?.RefererRules !== undefined).toBeTruthy()
})
