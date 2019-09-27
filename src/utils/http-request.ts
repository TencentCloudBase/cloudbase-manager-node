import { URL } from 'url'
import _fetch from 'node-fetch'
import HttpsProxyAgent from 'https-proxy-agent'

// 使用 fetch + 代理
export async function fetch(url: string, config: Record<string, any> = {}, proxy) {
    if (proxy || process.env.http_proxy) {
        config.agent = new HttpsProxyAgent(proxy || process.env.http_proxy)
    }
    // 解决中文编码问题
    const escapeUrl = new URL(url).toString()
    const res = await _fetch(escapeUrl, config)
    return res.json()
}

export async function fetchStream(url: string, config: Record<string, any> = {}, proxy) {
    if (proxy || process.env.http_proxy) {
        config.agent = new HttpsProxyAgent(proxy || process.env.http_proxy)
    }
    // 解决中文编码问题
    const escapeUrl = new URL(url).toString()
    return _fetch(escapeUrl, config)
}
