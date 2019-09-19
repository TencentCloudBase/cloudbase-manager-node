import fetch from 'node-fetch'
import HttpsProxyAgent from 'https-proxy-agent'
import { getAuth } from './auth'

export class CloudBaseRequest {
    private config: any
    constructor(config: {
        envId: string
        secretId: string
        secretKey: string
        token?: string
        timeout?: number
    }) {
        this.config = config
    }

    async send(api, data) {
        const params = { ...data, action: api}

        return await cloudBaseRequest({
            config: this.config,
            params,
            method: 'post',
            headers: {
                'content-type': 'application/json'
            }
        })
    }
}

export async function cloudBaseRequest(options: {
    config: { envId: string; secretId: string; secretKey: string; token?: string; timeout?: number }
    params: Record<string, any>
    method?: string
    headers?: Record<string, any>
}) {
    const url = 'https://tcb-admin.tencentcloudapi.com/admin'
    const { config, params = {}, method = 'POST', headers = {} } = options

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

    const { secretId, secretKey, token } = config

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

    let agent
    if (process.env.http_proxy) {
        agent = new HttpsProxyAgent(process.env.http_proxy)
    }

    const res = await fetch(url, {
        method,
        body: JSON.stringify(requestBody),
        agent,
        headers: requestHeaders
    })

    return await res.json()
}
