import { Platform } from 'react-native';

const ignoredWebWarnings = ['props.pointerEvents is deprecated. Use style.pointerEvents'];

let didInstallWarningFilter = false;

export function installDevelopmentWarningFilter() {
  if (didInstallWarningFilter || !__DEV__ || Platform.OS !== 'web') return;

  didInstallWarningFilter = true;
  const originalWarn = console.warn;

  console.warn = (...args: unknown[]) => {
    const message = args.map(String).join(' ');
    if (ignoredWebWarnings.some((warning) => message.includes(warning))) return;

    originalWarn(...args);
  };
}
