import { describe, expect, it } from 'vitest';
import {
  buildEtymologyResult,
  buildLocalFixtureFallback,
  buildLocalFixtureResult,
  buildMissingSourceFallback,
  buildMonolingualOnlyFallback,
  buildUnavailableSourceFallback,
  formatEtymologyAttribution,
  formatEtymologyWithAttribution,
  resolveEtymologyDisplay,
} from '../data/etymologyAdapter';

describe('etymologyAdapter', () => {
  describe('buildEtymologyResult', () => {
    it('returns etymology data with attribution when text is provided', () => {
      const result = buildEtymologyResult(
        'From Latin articulare, meaning to divide into distinct parts.',
        'English Wiktionary',
        'https://en.wiktionary.org/wiki/articulate'
      );

      expect(result.hasData).toBe(true);
      expect(result.etymology).not.toBeNull();
      expect(result.etymology?.text).toBe('From Latin articulare, meaning to divide into distinct parts.');
      expect(result.etymology?.source.name).toBe('English Wiktionary');
      expect(result.etymology?.source.url).toBe('https://en.wiktionary.org/wiki/articulate');
      expect(result.etymology?.source.license).toBe('CC-BY-SA-4.0/GFDL');
      expect(result.etymology?.source.attribution).toContain('English Wiktionary');
      expect(result.fallbackMessage).toBe('');
    });

    it('returns fallback when etymology text is null', () => {
      const result = buildEtymologyResult(null, 'English Wiktionary');

      expect(result.hasData).toBe(false);
      expect(result.etymology).toBeNull();
      expect(result.fallbackMessage).toContain('Etymology data not available');
      expect(result.fallbackMessage).toContain('English Wiktionary');
    });

    it('returns fallback when etymology text is empty string', () => {
      const result = buildEtymologyResult('', 'English Wiktionary');

      expect(result.hasData).toBe(false);
      expect(result.etymology).toBeNull();
      expect(result.fallbackMessage).toContain('Etymology data not available');
    });

    it('returns fallback when etymology text is whitespace only', () => {
      const result = buildEtymologyResult('   ', 'English Wiktionary');

      expect(result.hasData).toBe(false);
      expect(result.etymology).toBeNull();
    });

    it('trims etymology text', () => {
      const result = buildEtymologyResult('  From Latin  ', 'English Wiktionary');

      expect(result.hasData).toBe(true);
      expect(result.etymology?.text).toBe('From Latin');
    });

    it('accepts custom license type', () => {
      const result = buildEtymologyResult('From Latin', 'Source', undefined, 'CC-BY-SA-4.0');

      expect(result.etymology?.source.license).toBe('CC-BY-SA-4.0');
    });

    it('includes timestamp', () => {
      const result = buildEtymologyResult('From Latin', 'English Wiktionary');

      expect(result.etymology?.timestamp).toBeDefined();
      expect(typeof result.etymology?.timestamp).toBe('string');
    });
  });

  describe('buildMonolingualOnlyFallback', () => {
    it('returns fallback message for bilingual lookup', () => {
      const result = buildMonolingualOnlyFallback('English', 'Vietnamese');

      expect(result.hasData).toBe(false);
      expect(result.etymology).toBeNull();
      expect(result.fallbackMessage).toContain('Etymology is available for monolingual entries only');
      expect(result.fallbackMessage).toContain('English');
      expect(result.fallbackMessage).toContain('Vietnamese');
    });
  });

  describe('buildUnavailableSourceFallback', () => {
    it('returns fallback message for unavailable source', () => {
      const result = buildUnavailableSourceFallback('Spanish');

      expect(result.hasData).toBe(false);
      expect(result.etymology).toBeNull();
      expect(result.fallbackMessage).toContain('Etymology needs a selected production resource');
      expect(result.fallbackMessage).toContain('Spanish');
    });
  });

  describe('buildMissingSourceFallback', () => {
    it('returns source-aware fallback for configured Wiktionary source with no etymology', () => {
      const result = buildMissingSourceFallback('Finnish', 'fiwiktionary');

      expect(result.hasData).toBe(false);
      expect(result.etymology).toBeNull();
      expect(result.fallbackMessage).toContain('Etymology source is selected for Finnish');
      expect(result.fallbackMessage).toContain('fiwiktionary');
      expect(result.fallbackMessage).toContain('CC-BY-SA-4.0/GFDL');
    });
  });

  describe('buildLocalFixtureResult', () => {
    it('returns local preview etymology with non-production attribution', () => {
      const result = buildLocalFixtureResult('From Latin articulare.');

      expect(result.hasData).toBe(true);
      expect(result.etymology?.text).toBe('From Latin articulare.');
      expect(result.etymology?.source.name).toBe('Local educational fixture');
      expect(result.etymology?.source.license).toBe('Local educational fixture');
      expect(result.etymology?.source.attribution).toContain('not production lexical data');
    });
  });

  describe('buildLocalFixtureFallback', () => {
    it('returns fallback message for local fixture entries', () => {
      const result = buildLocalFixtureFallback();

      expect(result.hasData).toBe(false);
      expect(result.etymology).toBeNull();
      expect(result.fallbackMessage).toContain('Etymology data is not included in local fixture entries');
      expect(result.fallbackMessage).toContain('local educational fixture');
    });
  });

  describe('formatEtymologyAttribution', () => {
    it('returns attribution string when etymology data exists', () => {
      const result = buildEtymologyResult('From Latin', 'English Wiktionary');
      const attribution = formatEtymologyAttribution(result.etymology);

      expect(attribution).toContain('English Wiktionary');
      expect(attribution).toContain('CC-BY-SA-4.0/GFDL');
    });

    it('returns fallback attribution when etymology is null', () => {
      const attribution = formatEtymologyAttribution(null);

      expect(attribution).toContain('unavailable');
      expect(attribution).toContain('fallback mode');
    });
  });

  describe('formatEtymologyWithAttribution', () => {
    it('returns formatted text with attribution when data exists', () => {
      const result = buildEtymologyResult('From Latin articulare', 'English Wiktionary');
      const formatted = formatEtymologyWithAttribution(result);

      expect(formatted).toContain('From Latin articulare');
      expect(formatted).toContain('English Wiktionary');
      expect(formatted).toContain('CC-BY-SA-4.0/GFDL');
    });

    it('returns fallback message when no data exists', () => {
      const result = buildUnavailableSourceFallback('French');
      const formatted = formatEtymologyWithAttribution(result);

      expect(formatted).toBe(result.fallbackMessage);
      expect(formatted).toContain('Etymology needs a selected production resource');
    });

    it('returns fallback message for empty etymology', () => {
      const result = buildEtymologyResult('', 'English Wiktionary');
      const formatted = formatEtymologyWithAttribution(result);

      expect(formatted).toBe(result.fallbackMessage);
      expect(formatted).toContain('Etymology data not available');
    });
  });

  describe('resolveEtymologyDisplay', () => {
    it('uses monolingual-only fallback before local fixtures for bilingual lookups', () => {
      const result = resolveEtymologyDisplay({
        localEtymology: 'From Latin articulare.',
        sourceLanguageLabel: 'English',
        targetLanguageLabel: 'Vietnamese',
        isBilingualLookup: true,
        hasConfiguredSource: true,
        sourceName: 'English Wiktionary',
      });

      expect(result.hasData).toBe(false);
      expect(result.fallbackMessage).toContain('monolingual entries only');
      expect(result.fallbackMessage).toContain('English');
      expect(result.fallbackMessage).toContain('Vietnamese');
    });

    it('uses local fixture attribution for monolingual preview entries', () => {
      const result = resolveEtymologyDisplay({
        localEtymology: 'From Greek pragmatikos.',
        sourceLanguageLabel: 'English',
        isBilingualLookup: false,
        hasConfiguredSource: true,
        sourceName: 'English Wiktionary',
      });

      expect(result.hasData).toBe(true);
      expect(formatEtymologyWithAttribution(result)).toContain('Source: local educational fixture');
    });

    it('uses selected source fallback when source is configured but entry has no etymology', () => {
      const result = resolveEtymologyDisplay({
        sourceLanguageLabel: 'Japanese',
        isBilingualLookup: false,
        hasConfiguredSource: true,
        sourceName: 'jawiktionary',
      });

      expect(result.hasData).toBe(false);
      expect(result.fallbackMessage).toContain('source is selected for Japanese');
      expect(result.fallbackMessage).toContain('jawiktionary');
    });

    it('uses unavailable-source fallback when no source is configured', () => {
      const result = resolveEtymologyDisplay({
        sourceLanguageLabel: 'Cantonese',
        isBilingualLookup: false,
        hasConfiguredSource: false,
      });

      expect(result.hasData).toBe(false);
      expect(result.fallbackMessage).toContain('No etymology source is currently configured');
      expect(result.fallbackMessage).toContain('Cantonese');
    });
  });
});
