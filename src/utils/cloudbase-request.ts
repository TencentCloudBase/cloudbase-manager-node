import { getAuth } from './auth'
import { fetch } from './http-request'

const SUPPORT_REGIONS = ['ap-shanghai', 'ap-guangzhou']

export async function cloudBaseRequest(options: {
    config: {
        envId: string
        secretId: string
        secretKey: string
        token?: string
        timeout?: number
        proxy: string
        region: string
    }
    params: Record<string, any>
    method?: string
    headers?: Record<string, any>
}) {
    // const url = 'https://tcb-admin.tencentcloudapi.com/admin'
    const { config, params = {}, method = 'POST', headers = {} } = options
    const { region, envId } = config
    const isInScf = process.env.TENCENTCLOUD_RUNENV === 'SCF' // 是否scf环境内
    const protocol = isInScf ? 'http' : 'https'
    const isInContainer = !!process.env.KUBERNETES_SERVICE_HOST // 是否容器环境
    // region 优先级 本地mock 注入 > init region > 云函数环境变量region
    const finalRegion = process.env.TCB_REGION || region || process.env.TENCENTCLOUD_REGION || ''
    let internetRegionEndpoint = ''
    let internalRegionEndpoint = ''
    if (finalRegion) {
        if (SUPPORT_REGIONS.includes(finalRegion)) {
            internetRegionEndpoint = `${finalRegion}.tcb-api.tencentcloudapi.com`
            internalRegionEndpoint = `internal.${finalRegion}.tcb-api.tencentcloudapi.com`
        } else {
            console.warn('当前仅支持上海，广州地域，其他地域默认解析到固定域名(上海地域)')
            internetRegionEndpoint = `tcb-api.tencentcloudapi.com`
            internalRegionEndpoint = `internal.tcb-api.tencentcloudapi.com`
        }
    } else {
        internetRegionEndpoint = `tcb-api.tencentcloudapi.com`
        internalRegionEndpoint = `internal.tcb-api.tencentcloudapi.com`
    }

    // 有地域信息则访问地域级别域名，无地域信息则访问默认域名，默认域名固定解析到上海地域保持兼容
    // const internetRegionEndpoint = finalRegion
    //     ? `${finalRegion}.tcb-api.tencentcloudapi.com`
    //     : `tcb-api.tencentcloudapi.com`

    // const internalRegionEndpoint = finalRegion
    //     ? `internal.${finalRegion}.tcb-api.tencentcloudapi.com`
    //     : `internal.tcb-api.tencentcloudapi.com`

    // 同地域走内网，跨地域走公网
    const isSameRegionVisit = region ? region === process.env.TENCENTCLOUD_REGION : true

    // const endpoint = isInScf || isInContainer ? internalRegionEndpoint : internetRegionEndpoint
    const endpoint =
        isSameRegionVisit && (isInScf || isInContainer)
            ? internalRegionEndpoint
            : internetRegionEndpoint
    // const envpoint = envId ? `${envId}.${endpoint}` : endpoint
    const envpoint = endpoint

    const url = `${protocol}://${envpoint}/admin`

    const requestData: any = {
        ...params,
        envName: config.envId,
        timestamp: Date.now()
    }

    const requestHeaders = {
        ...headers,
        'content-type': 'application/json',
        'user-agent': `cloudbase-manager-node/0.1.0`,
        'x-tcb-source': 'cloudbase-manager-node, not-scf'
    }

    const { secretId, secretKey, token, proxy } = config

    const authData = {
        secretId,
        secretKey,
        method: method,
        pathname: '/admin',
        params: requestData,
        headers: requestHeaders
    }

    const authorization = getAuth(authData)

    const requestBody = {
        ...requestData,
        sessionToken: token,
        authorization
    }

    const res = await fetch(
        url,
        {
            method,
            body: JSON.stringify(requestBody),
            headers: requestHeaders
        },
        process.env.TCB_ADMIN_PROXY || proxy
    )

    return res
}
