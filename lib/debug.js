"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
// import { cloudBaseConfig } from '../test/config'
// const app = new CloudBase(cloudBaseConfig)
const app = new index_1.default({});
async function test() {
    const res = await app.storage.deleteFileCustom(['test_dir/data.txt'], '6465-dev-97eb6c-1252710547', 'ap-shanghai');
    console.log(res);
}
test();
