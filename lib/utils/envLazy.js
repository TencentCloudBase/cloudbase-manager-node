"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function preLazy() {
    return function (target, propertyKey, descriptor) {
        let oldFunc = descriptor.value;
        descriptor.value = async function () {
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
