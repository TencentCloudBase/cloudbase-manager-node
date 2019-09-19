import crypto from 'crypto'

function camSafeUrlEncode(str) {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A')
}

export function getAuth(options: {
    secretId: string
    secretKey: string
    method: string
    pathname?: string
    params?: Record<string, any>
    headers?: Record<string, any>
}) {
    const SecretId = options.secretId
    const SecretKey = options.secretKey
    const method = options.method.toLowerCase() || 'get'
    const queryParams = options.params || {}
    const headers = options.headers || {}
    let pathname = options.pathname || '/'
    pathname.indexOf('/') !== 0 && (pathname = '/' + pathname)

    if (!SecretId) {
        throw Error('missing param SecretId')
    }

    if (!SecretKey) {
        throw Error('missing param SecretKey')
    }

    const getObjectKeys = function(obj) {
        return Object.keys(obj)
            .filter(key => typeof obj[key] !== 'undefined')
            .sort()
    }

    const objectToString = function(obj) {
        const list = []
        const keyList = getObjectKeys(obj)
        keyList.forEach(key => {
            let value = obj[key] === null || typeof obj[key] === 'undefined' ? '' : obj[key]
            if (typeof value !== 'string') {
                value = JSON.stringify(value)
            }
            list.push(`${camSafeUrlEncode(key.toLowerCase())}=${camSafeUrlEncode(value)}`)
        })
        return list.join('&')
    }

    // 签名有效起止时间
    const now = Math.floor(Date.now() / 1000) - 1
    // 签名过期时间为当前 + 900s
    const exp = now + 900

    // 要用到的 Authorization 参数列表
    const qSignAlgorithm = 'sha1'
    const qAk = SecretId
    const qKeyTime = now + ';' + exp
    const qHeaderList = getObjectKeys(headers)
        .join(';')
        .toLowerCase()

    const qUrlParamList = getObjectKeys(queryParams)
        .join(';')
        .toLowerCase()

    // 签名算法说明文档：https://www.qcloud.com/document/product/436/7778
    // 步骤一：计算 SignKey
    const signKey = crypto
        .createHmac('sha1', SecretKey)
        .update(qKeyTime)
        .digest('hex')

    // 步骤二：构成 FormatString
    const formatString = [
        method,
        pathname,
        objectToString(queryParams),
        objectToString(headers),
        ''
    ].join('\n')

    // 步骤三：计算 StringToSign
    const sha1Algo = crypto.createHash('sha1')
    sha1Algo.update(Buffer.from(formatString))
    const res = sha1Algo.digest('hex')
    const stringToSign = ['sha1', qKeyTime, res, ''].join('\n')

    // 步骤四：计算 Signature
    const qSignature = crypto
        .createHmac('sha1', signKey)
        .update(stringToSign)
        .digest('hex')

    // 步骤五：构造 Authorization
    const authorization = [
        'q-sign-algorithm=' + qSignAlgorithm,
        'q-ak=' + qAk,
        'q-sign-time=' + qKeyTime,
        'q-key-time=' + qKeyTime,
        'q-header-list=' + qHeaderList,
        'q-url-param-list=' + qUrlParamList,
        'q-signature=' + qSignature
    ].join('&')

    return authorization
}
