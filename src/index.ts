import { EnvironmentManager } from './environmentManager'
import { Environment } from './environment'
import { getRuntime, getEnvVar } from './utils'
import { RUN_ENV, ENV_NAME, ERROR } from './constant'
import { FunctionService } from './function'
import { StorageService } from './storage'
import { DatabaseService } from './database'
import { EnvService } from './env'
import { CloudBaseContext } from './context'
import { CommonService } from './common'

interface CloudBaseConfig {
    secretId?: string
    secretKey?: string
    token?: string
    envId?: string
    proxy?: string
}

class CloudBase {
    private static cloudBase: CloudBase

    /**
     * init 初始化 为单例
     *
     * @static
     * @param {ManagerConfig} config
     * @returns {CloudBase}
     * @memberof CloudBase
     */
    public static init(config: CloudBaseConfig): CloudBase {
        if (!CloudBase.cloudBase) {
            CloudBase.cloudBase = new CloudBase(config)
        }

        return CloudBase.cloudBase
    }

    private context: CloudBaseContext
    private cloudBaseConfig: CloudBaseConfig = {}
    private environmentManager: EnvironmentManager

    public constructor(config: CloudBaseConfig) {
        // config 中传入的 secretid secretkey 必须同时存在
        if (config.secretId && config.secretKey) {
            this.cloudBaseConfig.secretId = config.secretId
            this.cloudBaseConfig.secretKey = config.secretKey
            if (config.token) {
                this.cloudBaseConfig.token = config.token
            }
        } else {
            if (getRuntime() === RUN_ENV.SCF) {
                // 需要在云函数运行环境
                const secretId = getEnvVar(ENV_NAME.ENV_SECRETID)
                const secretKey = getEnvVar(ENV_NAME.ENV_SECRETKEY)
                const token = getEnvVar(ENV_NAME.ENV_SESSIONTOKEN)

                if (!secretId || !secretKey) {
                    throw new Error(ERROR.MISS_SECRET_INFO_IN_ENV)
                }

                this.cloudBaseConfig = {
                    secretId,
                    secretKey,
                    token
                }
            } else {
                throw new Error(ERROR.MISS_SECRET_INFO_IN_ARGS) // todo
            }
        }

        if (config.envId) {
            this.cloudBaseConfig.envId = config.envId
        }

        if (config.proxy) {
            this.cloudBaseConfig.proxy = config.proxy
        }

        // 初始化 context
        this.context = new CloudBaseContext(this.cloudBaseConfig)

        this.environmentManager = new EnvironmentManager(this.context)
        this.environmentManager.add(config.envId || '')
    }

    public addEnvironment(envId: string): void {
        this.environmentManager.add(envId)
    }

    public currentEnvironment(): Environment {
        return this.environmentManager.getCurrentEnv()
    }

    public get functions(): FunctionService {
        return this.currentEnvironment().getFunctionService()
    }
    public get storage(): StorageService {
        return this.currentEnvironment().getStorageService()
    }
    public get database(): DatabaseService {
        return this.currentEnvironment().getDatabaseService()
    }

    public get commonService(): CommonService {
        return this.currentEnvironment().getCommonService()
    }

    public get env(): EnvService {
        return this.currentEnvironment().getEnvService()
    }

    public getEnvironmentManager(): EnvironmentManager {
        return this.environmentManager
    }

    public getManagerConfig(): CloudBaseConfig {
        return this.cloudBaseConfig
    }
}

export = CloudBase
