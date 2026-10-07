const nodeGlobals = Object.fromEntries([
    'process', 'console', 'fetch', 'URL', 'URLSearchParams', 'AbortSignal',
].map(name => [name, 'readonly']));

export default [
    {
        files: ['**/*.js', '**/*.mjs'],
        ignores: ['node_modules/**', 'studies/**'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: nodeGlobals,
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
