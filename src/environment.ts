import { DatabaseService } from './database'
import { FunctionService } from './function'
import { StorageService } from './storage'

import { EnvService } from './env'
import { CloudBaseContext } from './context'

export class Environment {
    public inited = false
    public cloudBaseContext: CloudBaseContext
    public lazyEnvironmentConfig: any
    private envId: string

    private functionService: FunctionService
    private databaseService: DatabaseService
    private storageService: StorageService
    private envService: EnvService

    constructor(context: CloudBaseContext, envId: string) {
        this.envId = envId
        this.cloudBaseContext = context

        // 拉取当前环境 的环境信息 todo
        this.functionService = new FunctionService(this)
        this.databaseService = new DatabaseService(this)
        this.storageService = new StorageService(this)
        this.envService = new EnvService(this)
    }

    async lazyInit(): Promise<any> {
        if (!this.inited) {
            const envConfig = this.envService
            return envConfig.getEnvInfo().then(envInfo => {
                this.lazyEnvironmentConfig = envInfo.EnvInfo

                this.inited = true
                return this.lazyEnvironmentConfig
            })
        } else {
            return this.lazyEnvironmentConfig
        }
    }

    public getEnvId(): string {
        return this.envId
    }

    public getStorageService(): StorageService {
        return this.storageService
    }

    public getDatabaseService(): DatabaseService {
        return this.databaseService
    }

    public getFunctionService(): FunctionService {
        return this.functionService
    }

    public getEnvService(): EnvService {
        return this.envService
    }

    public getServicesEnvInfo(): Promise<any> {
        const envConfig = this.envService
        return envConfig.getEnvInfo().then(envInfo => {
            return envInfo.EnvInfo
        })
    }
}
