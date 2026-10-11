// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    // Shared primitives keep press feedback and accessibility consistent (DESIGN.md, plan 3.5).
    files: ['app/**/*.tsx', 'components/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          importNames: ['TouchableOpacity', 'TouchableHighlight'],
          message: 'Use Touchable, AppButton or MotionPressable from components/app instead.',
          name: 'react-native',
        }],
      }],
    },
  },
]);
