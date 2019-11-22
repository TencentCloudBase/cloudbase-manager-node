module.exports = {
    extends: ['alloy', 'alloy/typescript'],
    rules: {
        indent: ['error', 4],
        'no-return-await': 'off',
        semi: ['error', 'never'],
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/no-useless-constructor': 'off',
        'no-useless-constructor': 'off',
        complexity: ['error', { max: 30 }]
    },
    env: {
        es6: true,
        node: true,
        jest: true
    },
    overrides: [
        {
            files: ['*.js'],
            rules: {
                '@typescript-eslint/no-var-requires': 'off'
            }
        }
    ]
}
