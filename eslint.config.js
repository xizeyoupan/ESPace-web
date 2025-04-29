import pluginVue from 'eslint-plugin-vue'
export default [
    ...pluginVue.configs['flat/recommended'],
    {
        rules: {
            // override/add rules settings here, such as:
            // 'vue/no-unused-vars': 'error'
            'semi': [1, 'never'],
            "indent": ["error", 4],
            "no-trailing-spaces": "error",
            "no-multi-spaces": "error",
        }
    }
]
