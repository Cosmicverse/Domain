import eslintPlugin from '@typescript-eslint/eslint-plugin'
import eslintParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'

export default [
    {
        files: [ '**/*.{js,ts}' ], // Apply to JavaScript and TypeScript files
        ignores: [ 'node_modules', 'dist' ], // Replace .eslintignore contents
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            parser: eslintParser,
        },
        plugins: {
            '@typescript-eslint': eslintPlugin,
            import: importPlugin,
        },
        settings: {
            'import/resolver': {
                typescript: {
                    // Resolve using tsconfig.json
                    project: './tsconfig.json',
                },
            },
        },
        rules: {
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-empty-interface': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-module-boundary-types': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                }
            ],
            eqeqeq: 'error',
            camelcase: 'error',
            'no-console': 'error',
            'no-lonely-if': 'error',
            'comma-dangle': [
                'error',
                {
                    arrays: 'never',
                    objects: 'always-multiline',
                    imports: 'always-multiline',
                    exports: 'always-multiline',
                    functions: 'never',
                }
            ],
            indent: [ 'error', 4, { SwitchCase: 1 } ],
            'no-tabs': 'error',
            'object-curly-spacing': [ 'error', 'always' ],
            'array-bracket-spacing': [ 'error', 'always' ],
            curly: [ 'error', 'all' ],
            'template-curly-spacing': 'error',
            'no-trailing-spaces': 'error',
            'space-before-blocks': 'error',
            semi: [ 'error', 'never' ],
            quotes: [ 'error', 'single', { avoidEscape: true } ],
            'object-curly-newline': [
                'error',
                {
                    multiline: true,
                    minProperties: 2,
                    consistent: true,
                }
            ],
            'object-property-newline': [
                'error',
                {
                    allowAllPropertiesOnSameLine: true,
                }
            ],
            'object-shorthand': 'error',
            'no-param-reassign': [ 'error', { props: false } ],
            'no-extra-parens': 'error',
            'no-return-await': 'error',
            'no-self-compare': 'error',
            'no-template-curly-in-string': 'error',
            'no-throw-literal': 'error',
            'no-undef-init': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unneeded-ternary': 'error',
            'no-unreachable-loop': 'error',
            'no-unsafe-optional-chaining': 'error',
            'no-unused-expressions': 'error',
            'no-use-before-define': [
                'error',
                {
                    functions: false, classes: true, variables: true,
                }
            ],
            'no-useless-backreference': 'error',
            'no-useless-call': 'error',
            'no-useless-computed-key': 'error',
            'no-useless-concat': 'error',
            'no-useless-constructor': 'error',
            'no-useless-rename': 'error',
            'no-useless-return': 'error',
            'no-var': 'error',
            'nonblock-statement-body-position': 'error',
            'one-var-declaration-per-line': 'error',
            'prefer-arrow-callback': 'error',
            'prefer-const': 'error',
            'prefer-exponentiation-operator': 'error',
            'prefer-numeric-literals': 'error',
            'prefer-object-spread': 'error',
            'prefer-promise-reject-errors': 'error',
            'prefer-template': 'error',
            'prefer-rest-params': 'error',
            'rest-spread-spacing': 'error',
            'require-atomic-updates': 'error',
            'require-await': 'error',
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index'
                    ],
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                }
            ],
        },
    }
]
