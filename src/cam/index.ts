import { CloudService } from '../utils'
import { CloudBaseContext } from '../context'
import {
    IServiceVersion,
    IRoleListRes,
    ICreateRoleRes,
    IResponseInfo,
    IGetRoleRes
} from '../interfaces'

export class CamService {
    static camServiceVersion: IServiceVersion = {
        service: 'cam',
        version: '2019-01-16'
    }
    private camService: CloudService

    constructor(context: CloudBaseContext) {
        this.camService = new CloudService(
            context,
            CamService.camServiceVersion.service,
            CamService.camServiceVersion.version
        )
    }

    /**
     * 查询账户角色列表
     * @param {number} page
     * @param {number} rp
     * @returns {Promise<IRoleListRes>}
     * @memberof CamService
     */
    public async describeRoleList(page: number, rp: number): Promise<IRoleListRes> {
        return this.camService.request<IRoleListRes>('DescribeRoleList', {
            Page: page,
            Rp: rp
        })
    }

    /**
     * 获取角色详情
     * @param {string} roleName
     * @returns {Promise<IGetRoleRes>}
     * @memberof CamService
     */
    public async getRole(roleName: string): Promise<IGetRoleRes> {
        return this.camService.request<IGetRoleRes>('GetRole', {
            RoleName: roleName
        })
    }

    /**
     * 创建角色
     * @param {{
     *         RoleName: string
     *         PolicyDocument: string
     *         Description: string
     *     }} param
     * @returns {Promise<ICreateRoleRes>}
     * @memberof CamService
     */
    public async createRole(param: {
        RoleName: string
        PolicyDocument: string
        Description: string
    }): Promise<ICreateRoleRes> {
        return this.camService.request<ICreateRoleRes>('CreateRole', param)
    }

    /**
     * 绑定角色策略
     * @param {{
     *         PolicyId: number
     *         AttachRoleName: string
     *     }} param
     * @returns {Promise<IResponseInfo>}
     * @memberof CamService
     */
    public async attachRolePolicy(param: {
        PolicyId: number
        AttachRoleName: string
    }): Promise<IResponseInfo> {
        return this.camService.request<IResponseInfo>('AttachRolePolicy', param)
    }

    public async attachRolePolicies(param: {
        RoleId?: number
        RoleName?: string
        PolicyId?: number[]
        PolicyName?: string[]
    }): Promise<IResponseInfo> {
        return this.camService.request<IResponseInfo>('AttachRolePolicies', param)
    }

    /**
     * 删除角色
     * @param {string} roleName
     * @returns {Promise<IResponseInfo>}
     * @memberof CamService
     */
    public async deleteRole(roleName: string): Promise<IResponseInfo> {
        return this.camService.request<IResponseInfo>('DeleteRole', {
            RoleName: roleName
        })
    }
}
