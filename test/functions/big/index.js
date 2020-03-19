exports.main = (event, context, callback) => {
    const { a, b } = event
    // more
    return {
        sum: a + b
    }
}
