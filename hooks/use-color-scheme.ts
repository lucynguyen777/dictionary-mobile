import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import {
  getCachedAppColorSchemePreference,
  loadAppColorSchemePreference,
  resolveAppColorScheme,
  subscribeAppColorSchemePreference,
} from '@/data/appThemePreference';

export function useColorScheme() {
  const systemScheme = useRNColorScheme();
  const [preference, setPreference] = useState(getCachedAppColorSchemePreference);

  useEffect(() => {
    let isMounted = true;

    loadAppColorSchemePreference().then((nextPreference) => {
      if (isMounted) setPreference(nextPreference);
    });

    const unsubscribe = subscribeAppColorSchemePreference(() => {
      if (isMounted) setPreference(getCachedAppColorSchemePreference());
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return resolveAppColorScheme(preference, systemScheme);
}
