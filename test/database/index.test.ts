import CloudBase from '../../src/index'
import path from 'path'

let manager = new CloudBase({
    secretId: '',
    secretKey: '',
    envId: ''
})

async function recreateCollection(collName: string) {
    await manager.database.deleteCollection(collName)
    await manager.database.createCollection(collName)
}

// 检查当前环境下某集合是否存在
test('database checkCollectionExists', async () => {
    const res = await manager.database.checkCollectionExists('rooms')

    expect(res.Exists).toBe(true)
})

// 当前环境下创建集合
test('database createCollection', async () => {
    let res
    try {
        res = await manager.database.createCollection('rooms51')
    } catch (err) {
        res = err
    } finally {
        expect(!res.code).toBe(true)
    }
})

// 删除当前环境的集合
test('database deleteCollection', async () => {
    let res
    try {
        res = await manager.database.deleteCollection('rooms51')
    } catch (err) {
        res = err
    } finally {
        expect(!res.code && res.Exists !== false).toBe(true)
    }
})

// 更新集合索引
test('database updateCollection', async () => {
    let res
    try {
        res = await manager.database.updateCollection('tcb_collection_need_update', {
            CreateIndexes: [
                {
                    IndexName: 'index_a',
                    MgoKeySchema: {
                        MgoIndexKeys: [
                            // 2d要放最前面
                            { Name: 'a_2d', Direction: '2d' },
                            { Name: 'a_1', Direction: '1' },
                            { Name: 'a_-1', Direction: '-1' }
                        ],
                        MgoIsUnique: false
                    }
                },
                {
                    IndexName: 'index_b',
                    MgoKeySchema: {
                        MgoIndexKeys: [{ Name: 'b_1', Direction: '2d' }],
                        MgoIsUnique: true
                    }
                },
                {
                    IndexName: 'index_to_be_delete',
                    MgoKeySchema: {
                        MgoIndexKeys: [{ Name: 'xxx', Direction: '2d' }],
                        MgoIsUnique: true
                    }
                }
            ]
        })
    } catch (err) {
        res = err
    } finally {
        expect(!res.code).toBe(true)
    }
})

// 查询集合详细信息
test('database describe collection', async () => {
    let res
    try {
        res = await manager.database.describeCollection('rooms')
    } catch (err) {
        res = err
    } finally {
        expect(!res.code).toBe(true)
    }
})

// 查询所有集合信息
test('database listCollection', async () => {
    let res
    try {
        res = await manager.database.listCollections({ MgoOffset: 0, MgoLimit: 20 })
    } catch (err) {
        res = err
    } finally {
        expect(!res.code).toBe(true)
    }
})

// 导入数据 并且查看迁移进度
test('database import and query migrateStatus', async () => {
    let res
    try {
        await recreateCollection('tcb_collection_need_import')
        res = await manager.database.import(
            'tcb_collection_need_import',
            {
                FilePath: path.join(__dirname, 'data.csv')
            },
            {
                ObjectKeyPrefix: 'db-imports',
                FileType: 'csv',
                StopOnError: true,
                ConflictMode: 'upsert'
            }
        )

        res = await manager.database.migrateStatus(res.JobId)
    } catch (err) {
        res = err
    } finally {
        expect(!res.code && !!res.Status).toBe(true)
    }
}, 10000)

// 导出数据 并查看迁移进度

test('database export and query migrateStatus', async () => {
    let res
    try {
        await recreateCollection('tcb_collection_need_export')
        res = await manager.database.export(
            'tcb_collection_need_export',
            {
                ObjectKey: 'tcb_collection_need_export.json'
            },
            {
                Fields: '_id,name',
                Query: '{"name":{"$exists":true}}',
                Sort: '{"name": -1}',
                Skip: 0,
                Limit: 1000
            }
        )
        res = await manager.database.migrateStatus(res.JobId)
    } catch (err) {
        res = err
    } finally {
        expect(!res.code && !!res.Status).toBe(true)
    }
})

test('database createCollectionIfNotExists', async () => {
    const res1 = await manager.database.createCollectionIfNotExists('rooms1')
    expect(!!res1).toBe(true)
})

test('database checkIndexExists', async () => {
    const res1 = await manager.database.checkIndexExists('tcb_collection_need_update', 'index_b_1')
    expect(!!res1).toBe(true)
})

// db coll query document
test('database query document', async () => {
    const res = await manager.database
        .collection('coll-1')
        .where({ name: 'aaa' })
        .get()
    expect(res.data.length).toBeGreaterThanOrEqual(0)
})
