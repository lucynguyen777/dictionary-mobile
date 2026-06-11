import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('French corpus candidate tooling', () => {
  it('keeps candidate extraction bounded, attributed, and outside committed artifacts', () => {
    const extractor = readFileSync(resolve(process.cwd(), 'scripts/extract-kaikki-candidate.mjs'), 'utf8');
    const builder = readFileSync(resolve(process.cwd(), 'scripts/build-offline-pack.mjs'), 'utf8');
    const gitignore = readFileSync(resolve(process.cwd(), '.gitignore'), 'utf8');

    expect(extractor).toContain("const limit = Number(args.limit ?? 5_000)");
    expect(extractor).toContain("license: 'CC-BY-SA-4.0/GFDL'");
    expect(extractor).toContain("sourceLastModified: response.headers.get('last-modified')");
    expect(builder).toContain("sourceRevision: args.sourceRevision ?? ''");
    expect(builder).toContain('senses.flatMap((sense) => sense.synonyms ?? [])');
    expect(gitignore).toContain('tmp/language-candidates/');
    expect(gitignore).toContain('tmp/offline-packs/');
  });
});
