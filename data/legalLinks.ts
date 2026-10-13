// Public pages for the Privacy Policy, Terms and help center (owner decision D5: drafted in
// docs/legal/, hosted on the owner's own website). Set the URLs at build time; until then the
// rows show a short in-app summary instead of a broken link.
// Expo inlines EXPO_PUBLIC_* only for direct property access.
const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() ?? '';
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL?.trim() ?? '';
const HELP_CENTER_URL = process.env.EXPO_PUBLIC_HELP_CENTER_URL?.trim() ?? '';

export function safeExternalUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

export const legalUrls = {
  helpCenter: safeExternalUrl(HELP_CENTER_URL),
  privacyPolicy: safeExternalUrl(PRIVACY_POLICY_URL),
  terms: safeExternalUrl(TERMS_URL),
};
