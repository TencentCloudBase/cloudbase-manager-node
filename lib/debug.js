"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
const app = new index_1.default({
    secretId: '',
    secretKey: '',
    envId: ''
});
async function test() {
    const res1 = await app.database.createCollection('rooms1');
}
test();
