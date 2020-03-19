"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
const config_1 = require("../test/config");
const app = new index_1.default(config_1.cloudBaseConfig);
// const app = new CloudBase({})
async function test() {
    const res = await app.functions.createFunction({
        func: {
            // functions 文件夹下函数文件夹的名称，即函数名
            name: 'big',
            timeout: 5,
            // 环境变量
            envVariables: {},
            // 运行时
            runtime: 'Nodejs8.9',
            // 安装依赖
            installDependency: false,
            ignore: []
        },
        functionRootPath: './test/functions/',
        force: true
    });
}
test();
