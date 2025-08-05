// @ts-check

import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    rules: {
      'no-trailing-spaces': 'error',
      'no-multi-spaces': 'error',
      'no-multiple-empty-lines': ['error', { 'max': 1 }],
      'indent': ['error', 4],
    }
  }
);
