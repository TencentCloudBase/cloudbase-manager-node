"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudBaseRequest = void 0;
const auth_1 = require("./auth");
const http_request_1 = require("./http-request");
async function cloudBaseRequest(options) {
    // const url = 'https://tcb-admin.tencentcloudapi.com/admin'
    const { config, params = {}, method = 'POST', headers = {} } = options;
    const { region, envId } = config;
    const isInScf = process.env.TENCENTCLOUD_RUNENV === 'SCF'; // 是否scf环境内
    const protocol = isInScf ? 'http' : 'https';
    const isInContainer = !!process.env.KUBERNETES_SERVICE_HOST; // 是否容器环境
    // region 优先级 本地mock 注入 > init region > 云函数环境变量region
    const finalRegion = process.env.TCB_REGION || region || process.env.TENCENTCLOUD_REGION || '';
    // 有地域信息则访问地域级别域名，无地域信息则访问默认域名，默认域名固定解析到上海地域保持兼容
    const internetRegionEndpoint = finalRegion
        ? `${region}.tcb-api.tencentcloudapi.com`
        : `tcb-api.tencentcloudapi.com`;
    const internalRegionEndpoint = finalRegion
        ? `internal.${region}.tcb-api.tencentcloudapi.com`
        : `internal.tcb-api.tencentcloudapi.com`;
    const endpoint = isInScf || isInContainer ? internalRegionEndpoint : internetRegionEndpoint;
    // const envpoint = envId ? `${envId}.${endpoint}` : endpoint
    const envpoint = endpoint;
    const url = `${protocol}://${envpoint}/admin`;
    const requestData = Object.assign(Object.assign({}, params), { envName: config.envId, timestamp: Date.now() });
    const requestHeaders = Object.assign(Object.assign({}, headers), { 'content-type': 'application/json', 'user-agent': `cloudbase-manager-node/0.1.0`, 'x-tcb-source': 'cloudbase-manager-node, not-scf' });
    const { secretId, secretKey, token, proxy } = config;
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
    const res = await http_request_1.fetch(url, {
        method,
        body: JSON.stringify(requestBody),
        headers: requestHeaders
    }, process.env.TCB_ADMIN_PROXY || proxy);
    return res;
}
exports.cloudBaseRequest = cloudBaseRequest;
