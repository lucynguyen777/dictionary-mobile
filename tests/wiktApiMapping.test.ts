import { readFileSync } from 'node:fs';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchWiktApiMonolingualMeaning, normalizeWiktionaryIpa } from '../data/dictionaryApi';

afterEach(() => {
  vi.restoreAllMocks();
});

function serve(body: unknown) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
}

describe('wiktapi.dev mapping', () => {
  it('maps the recorded French entry without a fake part of speech and with slash IPA', async () => {
    serve(JSON.parse(readFileSync('e2e/fixtures/wiktapi-fr-maison.json', 'utf8')));
    const result = await fetchWiktApiMonolingualMeaning('maison', 'fr');

    expect(result.ipa).toBe('/mɛ.zɔ̃/');
    expect(result.definitions.map((definition) => definition.partOfSpeech)).not.toContain('word');
    expect(result.definitions.map((definition) => definition.meaning)).toContain('Qui est fabriqué à la maison.');
  });

  it('picks a playable audio URL from any sound, never a bare file name', async () => {
    serve({
      entries: [{
        senses: [{ glosses: ['Edificación destinada a vivienda.'] }],
        sounds: [
          { ipa: '/ˈka.sa/' },
          { audio: 'Es-casa.ogg' },
          { audio: 'Es-casa.ogg', mp3_url: 'https://upload.wikimedia.org/es-casa.mp3', ogg_url: 'https://upload.wikimedia.org/es-casa.ogg' },
        ],
      }],
      word: 'casa',
    });
    const result = await fetchWiktApiMonolingualMeaning('casa', 'es');

    expect(result.ipa).toBe('/ˈka.sa/');
    expect(result.audio).toBe('https://upload.wikimedia.org/es-casa.mp3');
  });

  it.each([
    ['\\mɛ.zɔ̃\\', '/mɛ.zɔ̃/'],
    ['/ˈka.sa/', '/ˈka.sa/'],
    ['[ɛ̃.n‿a.kœj]', '[ɛ̃.n‿a.kœj]'],
    ['', ''],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeWiktionaryIpa(input)).toBe(expected);
  });
});
