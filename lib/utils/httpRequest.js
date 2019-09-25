"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const node_fetch_1 = __importDefault(require("node-fetch"));
const https_proxy_agent_1 = __importDefault(require("https-proxy-agent"));
// 使用 fetch + 代理
async function fetch(url, config = {}) {
    if (process.env.http_proxy) {
        config.agent = new https_proxy_agent_1.default(process.env.http_proxy);
    }
    // 解决中文编码问题
    const escapeUrl = new url_1.URL(url).toString();
    const res = await node_fetch_1.default(escapeUrl, config);
    return res.json();
}
exports.fetch = fetch;
async function fetchStream(url, config = {}) {
    if (process.env.http_proxy) {
        config.agent = new https_proxy_agent_1.default(process.env.http_proxy);
    }
    // 解决中文编码问题
    const escapeUrl = new url_1.URL(url).toString();
    return node_fetch_1.default(escapeUrl, config);
}
exports.fetchStream = fetchStream;
