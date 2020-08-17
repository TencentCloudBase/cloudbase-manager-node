"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preLazy = void 0;
function preLazy() {
    return function (target, propertyKey, descriptor) {
        let oldFunc = descriptor.value;
        descriptor.value = async function () {
            // 检查当前环境对象上是否已加载好环境信息
            const currentEnvironment = this.environment;
            if (!currentEnvironment.inited) {
                await currentEnvironment.lazyInit();
            }
            let result = await oldFunc.apply(this, arguments);
            return result;
        };
    };
}
exports.preLazy = preLazy;
