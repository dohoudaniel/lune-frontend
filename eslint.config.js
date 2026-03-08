import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            'react-hooks': reactHooks,
        },
        rules: {
            // Prevent debug statements from creeping back into the codebase
            'no-console': ['warn', { allow: ['error'] }],

            // React hooks rules
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // Relax some TS rules for existing codebase
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        },
    },
    {
        ignores: ['dist/', 'node_modules/', 'backend/', 'public/sw.js'],
    }
);
