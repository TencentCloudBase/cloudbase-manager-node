"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const error_1 = require("../error");
const del_1 = __importDefault(require("del"));
function checkPathExist(dest, throwError = false) {
    const exist = fs_1.default.existsSync(dest);
    if (!exist && throwError) {
        throw new error_1.CloudBaseError(`路径不存在：${dest}`);
    }
    return exist;
}
exports.checkPathExist = checkPathExist;
function isDirectory(dest) {
    checkPathExist(dest, true);
    return fs_1.default.statSync(dest).isDirectory();
}
exports.isDirectory = isDirectory;
function formateFileSize(size, unit) {
    const unitMap = {
        KB: 1024,
        MB: Math.pow(1024, 2),
        GB: Math.pow(1024, 3)
    };
    return Number(size / unitMap[unit]).toFixed(2);
}
exports.formateFileSize = formateFileSize;
function delSync(patterns) {
    del_1.default.sync(patterns, { force: true });
}
exports.delSync = delSync;
