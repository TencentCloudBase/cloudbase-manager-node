"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const del_1 = __importDefault(require("del"));
const make_dir_1 = __importDefault(require("make-dir"));
const utils_1 = require("../utils");
const error_1 = require("../error");
var CodeType;
(function (CodeType) {
    CodeType[CodeType["File"] = 0] = "File";
    CodeType[CodeType["JavaFile"] = 1] = "JavaFile";
})(CodeType = exports.CodeType || (exports.CodeType = {}));
/**
 * 将函数代码转换成 Base64 编码
 * 普通文件：Node，PHP
 * Java 文件：Jar，ZIP
 */
class FunctionPacker {
    constructor(root, name, ignore) {
        this.name = name;
        this.root = root;
        this.ignore = ignore;
        this.funcPath = path_1.default.resolve(path_1.default.join(root, name));
    }
    validPath(path) {
        if (!fs_1.default.existsSync(path)) {
            throw new error_1.CloudBaseError('file not exist');
        }
    }
    async getFileCode() {
        this.validPath(this.funcPath);
        this.tmpPath = path_1.default.join(this.root, '.cloudbase_tmp');
        // 临时构建文件
        this.funcDistPath = path_1.default.join(this.tmpPath, this.name);
        // 清除原打包文件
        this.clean();
        // 生成 zip 文件
        await make_dir_1.default(this.funcDistPath);
        const zipPath = path_1.default.resolve(this.funcDistPath, 'dist.zip');
        await utils_1.zipDir(this.funcPath, zipPath, this.ignore);
        // 将 zip 文件转换成 base64
        const base64 = fs_1.default.readFileSync(zipPath).toString('base64');
        // 清除打包文件
        await this.clean();
        return base64;
    }
    // 获取 Java 代码
    getJavaFileCode() {
        const { funcPath } = this;
        // Java 代码为 jar 或 zip 包
        const jarExist = fs_1.default.existsSync(`${funcPath}.jar`);
        const zipExist = fs_1.default.existsSync(`${funcPath}.zip`);
        if (!jarExist && !zipExist) {
            return null;
        }
        const packagePath = jarExist ? `${funcPath}.jar` : `${funcPath}.zip`;
        return fs_1.default.readFileSync(packagePath).toString('base64');
    }
    async build(type) {
        if (type === CodeType.JavaFile) {
            try {
                const code = await this.getJavaFileCode();
                return code;
            }
            catch (error) {
                this.clean();
                throw new error_1.CloudBaseError(`函数代码打包失败：\n ${error.message}`);
            }
        }
        if (type === CodeType.File) {
            try {
                const code = await this.getFileCode();
                return code;
            }
            catch (error) {
                this.clean();
                throw new error_1.CloudBaseError(`函数代码打包失败：\n ${error.message}`);
            }
        }
    }
    async clean() {
        // allow deleting the current working directory and outside
        this.funcDistPath && del_1.default.sync([this.funcDistPath], { force: true });
        this.tmpPath && del_1.default.sync([this.tmpPath], { force: true });
        return;
    }
}
exports.FunctionPacker = FunctionPacker;
