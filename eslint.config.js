// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', '.claude/*'],
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
  {
    // DESIGN.md: screens take colors from constants/theme.ts (useToken) or other constants, never
    // hex literals.
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', {
        message: 'Use a theme token (useToken) or a named color in constants/ instead of a hex literal.',
        selector: 'Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
      }],
    },
  },
]);
