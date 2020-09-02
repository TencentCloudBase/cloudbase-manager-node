"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudBaseContext = void 0;
class CloudBaseContext {
    constructor({ secretId = '', secretKey = '', token = '', proxy = '', region = '' }) {
        this.secretId = secretId;
        this.secretKey = secretKey;
        this.token = token;
        this.proxy = proxy;
        this.region = region;
    }
}
exports.CloudBaseContext = CloudBaseContext;
