import { DatabaseService } from './database'
import { FunctionService } from './function'
import { StorageService } from './storage'

import { EnvService } from './env'
import { CommonService } from './common'

import { CloudBaseContext } from './context'
import { CloudBaseError } from './error'
import { RUN_ENV, ENV_NAME, ERROR } from './constant'
import { getRuntime, getEnvVar } from './utils'
import { HostingService } from './hosting'
import { ThirdService } from './third'
import { AccessService } from './access'
import { UserService } from './user'
import { CloudBaseRunService } from './cloudBaseRun'
import { EnvInfo } from './interfaces'

export class Environment {
    public inited = false
    public cloudBaseContext: CloudBaseContext
    public lazyEnvironmentConfig: EnvInfo
    private envId: string
    private envType?: string

    private functionService: FunctionService
    private databaseService: DatabaseService
    private storageService: StorageService
    private envService: EnvService
    private hostingService: HostingService
    private thirdService: ThirdService
    private accessService: AccessService
    private userService: UserService
    private cloudBaseRunService: CloudBaseRunService

    constructor(context: CloudBaseContext, envId: string) {
        this.envId = envId
        this.cloudBaseContext = context
        this.envType = context.envType

        // 拉取当前环境 的环境信息 todo
        this.functionService = new FunctionService(this)
        this.databaseService = new DatabaseService(this)
        this.storageService = new StorageService(this)
        this.envService = new EnvService(this)
        this.hostingService = new HostingService(this)
        this.thirdService = new ThirdService(this)
        this.accessService = new AccessService(this)
        this.userService = new UserService(this)
        this.cloudBaseRunService = new CloudBaseRunService(this)
    }

    async lazyInit(): Promise<any> {
        if (!this.inited) {
            const envConfig = this.envService
            return envConfig.getEnvInfo().then(envInfo => {
                this.lazyEnvironmentConfig = envInfo.EnvInfo
                if (!this.lazyEnvironmentConfig.EnvId) {
                    throw new CloudBaseError(`Environment ${this.envId} not found`)
                }

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

    public getEnvType(): string {
        return this.envType
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

    public getHostingService(): HostingService {
        return this.hostingService
    }

    public getThirdService(): ThirdService {
        return this.thirdService
    }

    public getAccessService(): AccessService {
        return this.accessService
    }

    public getUserService(): UserService {
        return this.userService
    }

    public getCloudBaseRunService(): CloudBaseRunService {
        return this.cloudBaseRunService
    }

    public getCommonService(serviceType = 'tcb', serviceVersion): CommonService {
        return new CommonService(this, serviceType, serviceVersion)
    }

    public getServicesEnvInfo(): Promise<any> {
        const envConfig = this.envService
        return envConfig.getEnvInfo().then(envInfo => {
            return envInfo.EnvInfo
        })
    }

    public getAuthConfig() {
        let { secretId, secretKey, token, proxy, region } = this.cloudBaseContext
        const envId = this.getEnvId()

        if (!secretId || !secretKey) {
            // 未主动传入密钥，从环境变量中读取
            const envSecretId = getEnvVar(ENV_NAME.ENV_SECRETID)
            const envSecretKey = getEnvVar(ENV_NAME.ENV_SECRETKEY)
            const envToken = getEnvVar(ENV_NAME.ENV_SESSIONTOKEN)
            if (!envSecretId || !envSecretKey) {
                if (getRuntime() === RUN_ENV.SCF) {
                    throw new Error('missing authoration key, redeploy the function')
                } else {
                    throw new Error('missing secretId or secretKey of tencent cloud')
                }
            } else {
                secretId = envSecretId
                secretKey = envSecretKey
                token = envToken
            }
        }

        return {
            envId,
            secretId,
            secretKey,
            token,
            proxy,
            region
        }
    }
}
