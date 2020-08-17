"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upperCaseObjKey = exports.upperCaseStringFisrt = exports.sleep = exports.rsaEncrypt = exports.getEnvVar = exports.getRuntime = exports.compressToZip = void 0;
const fs_1 = __importDefault(require("fs"));
const archiver_1 = __importDefault(require("archiver"));
const crypto_1 = __importDefault(require("crypto"));
const constant_1 = require("../constant");
var uuid_1 = require("./uuid");
Object.defineProperty(exports, "guid6", { enumerable: true, get: function () { return uuid_1.guid6; } });
__exportStar(require("./cloud-api-request"), exports);
__exportStar(require("./auth"), exports);
__exportStar(require("./cloudbase-request"), exports);
__exportStar(require("./http-request"), exports);
__exportStar(require("./envLazy"), exports);
__exportStar(require("./fs"), exports);
async function compressToZip(option) {
    const { dirPath, outputPath, ignore, pattern = '**/*' } = option;
    return new Promise((resolve, reject) => {
        const output = fs_1.default.createWriteStream(outputPath);
        const archive = archiver_1.default('zip');
        output.on('close', function () {
            resolve({
                zipPath: outputPath,
                size: Math.ceil(archive.pointer() / 1024)
            });
        });
        archive.on('error', function (err) {
            reject(err);
        });
        archive.pipe(output);
        // append files from a glob pattern
        archive.glob(pattern, {
            // 目标路径
            cwd: dirPath,
            ignore: ignore,
            dot: true
        });
        archive.finalize();
    });
}
exports.compressToZip = compressToZip;
function getRuntime() {
    return process.env[constant_1.ENV_NAME.ENV_RUNENV];
}
exports.getRuntime = getRuntime;
function getEnvVar(envName) {
    return process.env[envName];
}
exports.getEnvVar = getEnvVar;
function rsaEncrypt(data) {
    const buffer = Buffer.from(data);
    const encrypted = crypto_1.default.publicEncrypt({
        key: constant_1.PUBLIC_RSA_KEY,
        padding: crypto_1.default.constants.RSA_PKCS1_PADDING
    }, buffer);
    return encrypted.toString('base64');
}
exports.rsaEncrypt = rsaEncrypt;
function sleep(time) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}
exports.sleep = sleep;
function upperCaseStringFisrt(str) {
    return str.slice(0, 1).toUpperCase().concat(str.slice(1));
}
exports.upperCaseStringFisrt = upperCaseStringFisrt;
function upperCaseObjKey(object) {
    const type = Object.prototype.toString.call(object).slice(8, -1);
    if (type === 'Object') {
        let newObj = {};
        // eslint-disable-next-line guard-for-in
        for (let key in object) {
            newObj[upperCaseStringFisrt(key)] = upperCaseObjKey(object[key]);
        }
        return newObj;
    }
    if (type === 'Array') {
        let newArr = [];
        for (let item of object) {
            newArr.push(upperCaseObjKey(item));
        }
        return newArr;
    }
    return object;
}
exports.upperCaseObjKey = upperCaseObjKey;
