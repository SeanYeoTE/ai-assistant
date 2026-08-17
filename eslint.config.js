const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // eslint-plugin-import's TS resolver chokes on this TypeScript version;
    // `tsc --noEmit` already covers this ground with full type information.
    rules: {
      'import/namespace': 'off',
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'off',
    },
  },
];
