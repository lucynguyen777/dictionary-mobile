import type { SupabaseAuthConfig } from './authConfig';
import type { AuthSessionSnapshot } from './authSession';

export type FeatureAccessId =
  | 'lookup'
  | 'reader'
  | 'library'
  | 'flashcards'
  | 'local-import-export'
  | 'local-profile'
  | 'privacy-export-reset'
  | 'cloud-sync'
  | 'ai-tutor'
  | 'provider-translation'
  | 'feedback'
  | 'account-deletion'
  | 'cloud-backup';

export type FeatureAccessState = {
  allowed: boolean;
  label: string;
  blocker?: string;
};

const guestAllowedFeatures = new Set<FeatureAccessId>([
  'lookup',
  'reader',
  'library',
  'flashcards',
  'local-import-export',
  'local-profile',
  'privacy-export-reset',
]);

export function getFeatureAccess(
  authSnapshot: Pick<AuthSessionSnapshot, 'status'> | null | undefined,
  envState?: SupabaseAuthConfig
): Record<FeatureAccessId, FeatureAccessState> {
  const isSignedIn = authSnapshot?.status === 'authenticated' || authSnapshot?.status === 'needs_verification';
  const authConfigured = envState ? envState.status === 'configured' : true;

  return featureAccessIds.reduce((policy, feature) => {
    if (guestAllowedFeatures.has(feature)) {
      policy[feature] = {
        allowed: true,
        label: isSignedIn ? 'Signed in' : 'Guest local mode',
      };
      return policy;
    }

    if (!authConfigured) {
      policy[feature] = {
        allowed: false,
        blocker: 'Cần cấu hình Supabase Auth production.',
        label: 'Cần đăng nhập',
      };
      return policy;
    }

    policy[feature] = isSignedIn
      ? { allowed: true, label: 'Signed in' }
      : { allowed: false, blocker: 'Đăng nhập để dùng tính năng cloud/provider.', label: 'Cần đăng nhập' };

    return policy;
  }, {} as Record<FeatureAccessId, FeatureAccessState>);
}

export const featureAccessIds: FeatureAccessId[] = [
  'lookup',
  'reader',
  'library',
  'flashcards',
  'local-import-export',
  'local-profile',
  'privacy-export-reset',
  'cloud-sync',
  'ai-tutor',
  'provider-translation',
  'feedback',
  'account-deletion',
  'cloud-backup',
];
