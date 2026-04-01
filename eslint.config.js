const prettier = require('eslint-plugin-prettier');

module.exports = [
  {
    plugins: {
      prettier,
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'prettier/prettier': 'error',
    },
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
      },
    },
  },
];
