// Remote catalog of hosted offline dictionary packs (plan 6.3). Owner decision D9: packs live in the
// public Supabase Storage bucket `offline-packs`, so the catalog URL follows from the Supabase project
// URL; EXPO_PUBLIC_OFFLINE_PACK_CATALOG_URL overrides it. Profile refreshes the catalog, and the last
// valid copy is cached so installed packs keep working offline.
// The catalog is built by scripts/build-pack-catalog.mjs from builder output.
import { languageOptions, type LanguageCode } from './languages';
import { offlineDictionaryPacks, type OfflineDictionaryPack } from './offlineDictionaryPacks';
import { getStoredItem, setStoredItem } from './storageAdapter';

export const OFFLINE_PACK_CATALOG_STORAGE_KEY = 'dictionary-mobile.offline-pack-catalog.v1';
// Expo inlines EXPO_PUBLIC_* only for direct property access.
export function resolveOfflinePackCatalogUrl(configuredUrl: string | undefined, supabaseUrl: string | undefined) {
  const configured = configuredUrl?.trim();
  if (configured) return configured;
  const project = supabaseUrl?.trim().replace(/\/+$/, '');
  return project ? `${project}/storage/v1/object/public/offline-packs/catalog.json` : '';
}

export const OFFLINE_PACK_CATALOG_URL = resolveOfflinePackCatalogUrl(
  process.env.EXPO_PUBLIC_OFFLINE_PACK_CATALOG_URL,
  process.env.EXPO_PUBLIC_SUPABASE_URL
);

const MD5 = /^[a-f0-9]{32}$/;
const KNOWN_LANGUAGES = new Set<string>(languageOptions.map((language) => language.code));

function resolveUrl(value: unknown, catalogUrl: string) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim(), catalogUrl);
    // Packs travel over HTTPS only (plain HTTP is allowed for local development hosts).
    if (url.protocol === 'https:' || /^(localhost|127\.0\.0\.1|10\.0\.2\.2)$/.test(url.hostname)) return url.toString();
  } catch {
    // Invalid URLs drop the pack below.
  }
  return null;
}

// Invalid packs are skipped rather than failing the whole catalog.
export function parseOfflinePackCatalog(value: unknown, catalogUrl: string): OfflineDictionaryPack[] {
  const catalog = (value ?? {}) as { packs?: unknown; schemaVersion?: unknown };
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.packs)) return [];

  return catalog.packs.flatMap((item): OfflineDictionaryPack[] => {
    const raw = (item ?? {}) as Record<string, unknown>;
    const entriesUrl = resolveUrl(raw.entriesUrl, catalogUrl);
    const manifestUrl = resolveUrl(raw.manifestUrl, catalogUrl);
    const entryCount = Number(raw.entryCount);
    const sizeBytes = Number(raw.compressedSizeBytes);
    if (
      typeof raw.id !== 'string' || !raw.id.trim()
      || typeof raw.languageCode !== 'string' || !KNOWN_LANGUAGES.has(raw.languageCode)
      || typeof raw.sourceName !== 'string' || !raw.sourceName.trim()
      || typeof raw.attribution !== 'string' || !raw.attribution.trim()
      || raw.license !== 'CC-BY-SA-4.0/GFDL'
      || !entriesUrl || typeof raw.entriesMd5 !== 'string' || !MD5.test(raw.entriesMd5)
      || !Number.isInteger(entryCount) || entryCount <= 0
      || (raw.manifestUrl !== undefined && (!manifestUrl || typeof raw.manifestMd5 !== 'string' || !MD5.test(raw.manifestMd5)))
    ) {
      return [];
    }
    const sizeMb = Number.isFinite(sizeBytes) && sizeBytes > 0 ? Math.max(1, Math.round(sizeBytes / 1_000_000)) : 1;
    return [{
      attribution: raw.attribution.trim(),
      downloadSource: {
        entriesMd5: raw.entriesMd5,
        entriesUrl,
        entryCount,
        ...(manifestUrl ? { manifestMd5: raw.manifestMd5 as string, manifestUrl } : {}),
      },
      estimatedCompressedSizeMb: { max: sizeMb, min: sizeMb },
      id: raw.id.trim(),
      languageCode: raw.languageCode as LanguageCode,
      license: 'CC-BY-SA-4.0/GFDL',
      sourceName: raw.sourceName.trim(),
      status: 'builder_ready',
    }];
  });
}

// A hosted pack replaces the bundled pack of the same language (e.g. the English sample pack).
export function mergeOfflinePacks(base: OfflineDictionaryPack[], catalogPacks: OfflineDictionaryPack[]) {
  const hostedLanguages = new Set(catalogPacks.map((pack) => pack.languageCode));
  return [...base.filter((pack) => !hostedLanguages.has(pack.languageCode)), ...catalogPacks];
}

type CachedCatalog = { catalog: unknown; catalogUrl: string };

async function readCachedCatalog(): Promise<CachedCatalog | null> {
  try {
    const cached = JSON.parse((await getStoredItem(OFFLINE_PACK_CATALOG_STORAGE_KEY)) ?? 'null') as CachedCatalog | null;
    return cached && typeof cached.catalogUrl === 'string' ? cached : null;
  } catch {
    return null;
  }
}

// No network: bundled packs plus the last catalog that validated.
export async function loadCachedOfflinePacks(base: OfflineDictionaryPack[] = offlineDictionaryPacks) {
  const cached = await readCachedCatalog();
  return cached ? mergeOfflinePacks(base, parseOfflinePackCatalog(cached.catalog, cached.catalogUrl)) : base;
}

// Fetches the catalog; on any failure keeps the cached list so the screen still works offline.
export async function refreshOfflinePacks({
  base = offlineDictionaryPacks,
  catalogUrl = OFFLINE_PACK_CATALOG_URL,
  fetchImpl = fetch,
}: { base?: OfflineDictionaryPack[]; catalogUrl?: string; fetchImpl?: typeof fetch } = {}) {
  if (!catalogUrl) return base;
  try {
    const response = await fetchImpl(catalogUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`catalog ${response.status}`);
    const catalog = await response.json() as unknown;
    const packs = parseOfflinePackCatalog(catalog, catalogUrl);
    if (!packs.length) throw new Error('catalog has no valid packs');
    await setStoredItem(OFFLINE_PACK_CATALOG_STORAGE_KEY, JSON.stringify({ catalog, catalogUrl } satisfies CachedCatalog));
    return mergeOfflinePacks(base, packs);
  } catch {
    return loadCachedOfflinePacks(base);
  }
}
