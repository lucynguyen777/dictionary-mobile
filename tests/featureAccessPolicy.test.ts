import { describe, expect, it } from 'vitest';

import { getFeatureAccess } from '../data/featureAccessPolicy';

describe('getFeatureAccess', () => {
  it('allows guest local-first features and blocks cloud/provider features', () => {
    const policy = getFeatureAccess({ status: 'unauthenticated' }, { status: 'configured', url: 'https://example.supabase.co', publishableKey: 'anon' });

    expect(policy.lookup.allowed).toBe(true);
    expect(policy.reader.allowed).toBe(true);
    expect(policy.library.allowed).toBe(true);
    expect(policy.flashcards.allowed).toBe(true);
    expect(policy['cloud-sync']).toMatchObject({ allowed: false, label: 'Cần đăng nhập' });
    expect(policy['ai-tutor'].blocker).toContain('Đăng nhập');
  });

  it('keeps provider features blocked when auth env is unconfigured', () => {
    const policy = getFeatureAccess(
      { status: 'authenticated' },
      { status: 'unconfigured', missingKeys: ['EXPO_PUBLIC_SUPABASE_URL'] }
    );

    expect(policy.lookup.allowed).toBe(true);
    expect(policy.feedback.allowed).toBe(false);
    expect(policy.feedback.blocker).toContain('Supabase');
  });

  it('allows auth-owned features for signed-in users when configured', () => {
    const policy = getFeatureAccess({ status: 'authenticated' }, { status: 'configured', url: 'https://example.supabase.co', publishableKey: 'anon' });

    expect(policy['cloud-sync'].allowed).toBe(true);
    expect(policy['provider-translation'].allowed).toBe(true);
    expect(policy['account-deletion'].allowed).toBe(true);
  });
});
