import { BaseService } from '../baseService'
import CloudBase from '../index'
import { IServiceVersion } from '../interfaces'
export declare class ManageService extends BaseService {
    static manageServiceVersion: IServiceVersion
    constructor(cloudBaseManager: CloudBase)
    listEnvs(): Promise<any>
    createEnv({ alias }: { alias: any }): Promise<any>
    initTcb(skey: string): Promise<any>
}
