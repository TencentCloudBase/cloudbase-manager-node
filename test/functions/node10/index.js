// 异步函数
exports.main = async (event, context) => {
    const { a, b } = event || { a: 1, b: 2 }

    return {
        sum: a + b
    }
}
