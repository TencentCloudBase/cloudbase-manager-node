"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CloudBaseContext {
    constructor({ secretId = '', secretKey = '', token = '' }) {
        this.secretId = secretId;
        this.secretKey = secretKey;
        this.token = token;
    }
}
exports.CloudBaseContext = CloudBaseContext;
