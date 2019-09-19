"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
function camSafeUrlEncode(str) {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}
function getAuth(options) {
    const SecretId = options.secretId;
    const SecretKey = options.secretKey;
    const method = options.method.toLowerCase() || 'get';
    const queryParams = options.params || {};
    const headers = options.headers || {};
    let pathname = options.pathname || '/';
    pathname.indexOf('/') !== 0 && (pathname = '/' + pathname);
    if (!SecretId) {
        throw Error('missing param SecretId');
    }
    if (!SecretKey) {
        throw Error('missing param SecretKey');
    }
    const getObjectKeys = function (obj) {
        return Object.keys(obj)
            .filter(key => typeof obj[key] !== 'undefined')
            .sort();
    };
    const objectToString = function (obj) {
        const list = [];
        const keyList = getObjectKeys(obj);
        keyList.forEach(key => {
            let value = obj[key] === null || typeof obj[key] === 'undefined' ? '' : obj[key];
            if (typeof value !== 'string') {
                value = JSON.stringify(value);
            }
            list.push(`${camSafeUrlEncode(key.toLowerCase())}=${camSafeUrlEncode(value)}`);
        });
        return list.join('&');
    };
    const now = Math.floor(Date.now() / 1000) - 1;
    const exp = now + 900;
    const qSignAlgorithm = 'sha1';
    const qAk = SecretId;
    const qKeyTime = now + ';' + exp;
    const qHeaderList = getObjectKeys(headers)
        .join(';')
        .toLowerCase();
    const qUrlParamList = getObjectKeys(queryParams)
        .join(';')
        .toLowerCase();
    const signKey = crypto_1.default
        .createHmac('sha1', SecretKey)
        .update(qKeyTime)
        .digest('hex');
    const formatString = [
        method,
        pathname,
        objectToString(queryParams),
        objectToString(headers),
        ''
    ].join('\n');
    const sha1Algo = crypto_1.default.createHash('sha1');
    sha1Algo.update(Buffer.from(formatString));
    const res = sha1Algo.digest('hex');
    const stringToSign = ['sha1', qKeyTime, res, ''].join('\n');
    const qSignature = crypto_1.default
        .createHmac('sha1', signKey)
        .update(stringToSign)
        .digest('hex');
    const authorization = [
        'q-sign-algorithm=' + qSignAlgorithm,
        'q-ak=' + qAk,
        'q-sign-time=' + qKeyTime,
        'q-key-time=' + qKeyTime,
        'q-header-list=' + qHeaderList,
        'q-url-param-list=' + qUrlParamList,
        'q-signature=' + qSignature
    ].join('&');
    return authorization;
}
exports.getAuth = getAuth;
