import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import {
  getCachedAppColorSchemePreference,
  loadAppColorSchemePreference,
  resolveAppColorScheme,
  subscribeAppColorSchemePreference,
} from '@/data/appThemePreference';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [preference, setPreference] = useState(getCachedAppColorSchemePreference);

  useEffect(() => {
    setHasHydrated(true);
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

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return resolveAppColorScheme(preference, colorScheme);
  }

  return 'light';
}
