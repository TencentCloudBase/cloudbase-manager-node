"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const https_proxy_agent_1 = __importDefault(require("https-proxy-agent"));
const auth_1 = require("./auth");
class CloudBaseRequest {
    constructor(config) {
        this.config = config;
    }
    async send(api, data) {
        const params = Object.assign(Object.assign({}, data), { action: api });
        return await cloudBaseRequest({
            config: this.config,
            params,
            method: 'post',
            headers: {
                'content-type': 'application/json'
            }
        });
    }
}
exports.CloudBaseRequest = CloudBaseRequest;
async function cloudBaseRequest(options) {
    const url = 'https://tcb-admin.tencentcloudapi.com/admin';
    const { config, params = {}, method = 'POST', headers = {} } = options;
    const requestData = Object.assign(Object.assign({}, params), { envName: config.envId, timestamp: Date.now() });
    const requestHeaders = Object.assign(Object.assign({}, headers), { 'content-type': 'application/json', 'user-agent': `cloudbase-manager-node/0.1.0`, 'x-tcb-source': 'cloudbase-manager-node, not-scf' });
    const { secretId, secretKey, token } = config;
    const authData = {
        secretId,
        secretKey,
        method: method,
        pathname: '/admin',
        params: requestData,
        headers: requestHeaders
    };
    const authorization = auth_1.getAuth(authData);
    const requestBody = Object.assign(Object.assign({}, requestData), { sessionToken: token, authorization });
    let agent;
    if (process.env.http_proxy) {
        agent = new https_proxy_agent_1.default(process.env.http_proxy);
    }
    const res = await node_fetch_1.default(url, {
        method,
        body: JSON.stringify(requestBody),
        agent,
        headers: requestHeaders
    });
    return await res.json();
}
exports.cloudBaseRequest = cloudBaseRequest;
