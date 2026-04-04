export default [
    {
        files: ['**/*.js', '**/*.mjs'],
        ignores: ['node_modules/**', 'studies/**'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single', { avoidEscape: true }],
            'comma-dangle': ['error', 'always-multiline'],
            'no-console': 'off',
        },
    },
];
