import pluginVue from 'eslint-plugin-vue'
export default [
    ...pluginVue.configs['flat/recommended'],
    {
        rules: {
            // override/add rules settings here, such as:
            'vue/no-unused-vars': 'warn',
            'semi': [1, 'never'],
            "indent": ["error", 4],
            "no-trailing-spaces": "error",
            "no-multi-spaces": "error",
            'space-infix-ops': 'error',
            'keyword-spacing': ['error', { 'before': true, 'after': true }],
            'comma-spacing': ['error', { 'before': false, 'after': true }],
            'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
        }
    }
]
