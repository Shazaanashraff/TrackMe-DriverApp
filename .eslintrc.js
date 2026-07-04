module.exports = {
  root: true,
  extends: ['expo', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  env: {
    jest: true,
    browser: true,
  },
  rules: {
    // Pre-existing code predates this config; downgraded to warn so `lint` stays green
    // without silently masking new violations. Screen migration todos convert JS → TS.
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-require-imports': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/immutability': 'warn',
    'react-hooks/preserve-manual-memoization': 'warn',
  },
  overrides: [
    {
      files: ['src/screens/**', 'src/features/**'],
      rules: {
        'no-restricted-imports': [
          'warn',
          {
            patterns: ['**/services/api*', '**/services/socket*', '**/services/location*'],
          },
        ],
        'no-restricted-syntax': [
          'warn',
          {
            selector: "CallExpression[callee.name='fetch']",
            message: 'Screens must not call fetch() directly — use a hook backed by the api transport.',
          },
          {
            selector: "CallExpression[callee.property.name='watchPositionAsync']",
            message: 'Screens must not call watchPositionAsync() directly — use a location/tracking hook.',
          },
        ],
      },
    },
  ],
};
