/** @type {import('eslint').Linter.Config} */
module.exports = {
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'no-nested-ternary': 'warn',
    'no-duplicate-imports': 'error',
  },
};
