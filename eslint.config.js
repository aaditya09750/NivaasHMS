import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import n from 'eslint-plugin-n';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

const commonRules = {
  'array-callback-return': 'error',
  'consistent-return': 'off',
  curly: ['error', 'multi-line'],
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'import-x/no-duplicates': 'error',
  'no-alert': 'warn',
  'no-console': 'off',
  'no-duplicate-imports': 'error',
  'no-empty': ['error', { allowEmptyCatch: true }],
  'no-implicit-coercion': 'error',
  'no-return-await': 'error',
  'no-self-compare': 'error',
  'no-template-curly-in-string': 'error',
  'no-unneeded-ternary': 'error',
  'no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      varsIgnorePattern: '^(React|_)',
    },
  ],
  'object-shorthand': ['error', 'always'],
  'prefer-const': ['error', { destructuring: 'all' }],
  'prefer-template': 'error',
};

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '.git/**',
      '.husky/**',
      'client/public/**',
      'client/src/assets/**',
      '*.config.cjs',
      'package-lock.json',
      'client/package-lock.json',
      'server/package-lock.json',
    ],
  },
  js.configs.recommended,
  {
    files: ['client/**/*.{js,jsx}', 'server/**/*.js'],
    plugins: {
      'import-x': importX,
    },
    rules: commonRules,
  },
  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'react/boolean-prop-naming': 'off',
      'react/function-component-definition': 'off',
      'react/jsx-no-target-blank': 'error',
      'react/no-array-index-key': 'off',
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': [
        'error',
        {
          allowConstantExport: true,
          allowExportNames: ['useAppContext'],
        },
      ],
    },
  },
  {
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      sourceType: 'module',
    },
    plugins: {
      n,
    },
    rules: {
      'n/no-deprecated-api': 'error',
      'n/no-process-exit': 'error',
    },
  },
  prettier,
];
