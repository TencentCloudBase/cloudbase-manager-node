"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const crypto_1 = __importDefault(require("crypto"));
const query_string_1 = __importDefault(require("query-string"));
const https_proxy_agent_1 = __importDefault(require("https-proxy-agent"));
const error_1 = require("../error");
function isObject(x) {
    return typeof x === 'object' && !Array.isArray(x) && x !== null;
}
function deepRemoveVoid(obj) {
    if (Array.isArray(obj)) {
        return obj.map(deepRemoveVoid);
    }
    else if (isObject(obj)) {
        let result = {};
        for (let key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                if (typeof value !== 'undefined' && value !== null) {
                    result[key] = deepRemoveVoid(value);
                }
            }
        }
        return result;
    }
    else {
        return obj;
    }
}
function sha256(message, secret, encoding) {
    const hmac = crypto_1.default.createHmac('sha256', secret);
    return hmac.update(message).digest(encoding);
}
function getHash(message) {
    const hash = crypto_1.default.createHash('sha256');
    return hash.update(message).digest('hex');
}
function getDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}
class CloudService {
    constructor(context, service, version, baseParams) {
        this.service = service;
        this.version = version;
        this.timeout = 60000;
        this.baseParams = baseParams || {};
        this.cloudBaseContext = context;
    }
    getUrl() {
        const urlMap = {
            tcb: 'https://tcb.tencentcloudapi.com',
            scf: 'https://scf.tencentcloudapi.com',
            flexdb: 'https://flexdb.ap-shanghai.tencentcloudapi.com'
        };
        return urlMap[this.service];
    }
    async request(action, data = {}, method = 'POST') {
        this.action = action;
        this.data = deepRemoveVoid(Object.assign(Object.assign({}, data), this.baseParams));
        this.method = method;
        this.url = this.getUrl();
        const { secretId, secretKey, token } = this.cloudBaseContext;
        this.secretId = secretId;
        this.secretKey = secretKey;
        this.token = token;
        try {
            const res = await this.requestWithSign();
            if (res.status !== 200) {
                const tcError = new error_1.CloudBaseError(res.statusText, {
                    code: res.status
                });
                throw tcError;
            }
            else {
                const data = await res.json();
                if (data.Response.Error) {
                    const tcError = new error_1.CloudBaseError(data.Response.Error.Message, {
                        requestId: data.Response.RequestId,
                        code: data.Response.Error.Code
                    });
                    throw tcError;
                }
                else {
                    return data.Response;
                }
            }
        }
        catch (e) {
            throw new error_1.CloudBaseError(e.message, {
                action,
                code: e.code
            });
        }
    }
    async requestWithSign() {
        const timestamp = Math.floor(Date.now() / 1000);
        const { method, timeout, data = {} } = this;
        if (method === 'GET') {
            this.url += '?' + query_string_1.default.stringify(data);
        }
        if (method === 'POST') {
            this.payload = data;
        }
        const config = {
            method,
            timeout,
            headers: {
                Host: new URL(this.url).host,
                'X-TC-Action': this.action,
                'X-TC-Region': 'ap-shanghai',
                'X-TC-Timestamp': timestamp,
                'X-TC-Version': this.version
            }
        };
        if (this.token) {
            config.headers['X-TC-Token'] = this.token;
        }
        if (method === 'GET') {
            config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        if (method === 'POST') {
            config.body = JSON.stringify(data);
            config.headers['Content-Type'] = 'application/json';
        }
        const sign = this.getRequestSign(timestamp);
        config.headers['Authorization'] = sign;
        if (!config.agent && process.env.http_proxy) {
            config.agent = new https_proxy_agent_1.default(process.env.http_proxy);
        }
        const res = await node_fetch_1.default(this.url, config);
        return res;
    }
    getRequestSign(timestamp) {
        const { method = 'POST', url, service, secretId, secretKey } = this;
        const urlObj = new URL(url);
        let headers = '';
        const signedHeaders = 'content-type;host';
        if (method === 'GET') {
            headers = 'content-type:application/x-www-form-urlencoded\n';
        }
        else if (method === 'POST') {
            headers = 'content-type:application/json\n';
        }
        headers += `host:${urlObj.hostname}\n`;
        const path = urlObj.pathname;
        const querystring = urlObj.search.slice(1);
        const payloadHash = this.payload ? getHash(JSON.stringify(this.payload)) : getHash('');
        const canonicalRequest = `${method}\n${path}\n${querystring}\n${headers}\n${signedHeaders}\n${payloadHash}`;
        const date = getDate(timestamp);
        const StringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${date}/${service}/tc3_request\n${getHash(canonicalRequest)}`;
        const kDate = sha256(date, `TC3${secretKey}`);
        const kService = sha256(service, kDate);
        const kSigning = sha256('tc3_request', kService);
        const signature = sha256(StringToSign, kSigning, 'hex');
        return `TC3-HMAC-SHA256 Credential=${secretId}/${date}/${service}/tc3_request, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    }
}
exports.CloudService = CloudService;
