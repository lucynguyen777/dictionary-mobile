/**
 * Etymology Adapter Contract
 *
 * Defines the contract for etymology data integration following the accepted
 * decision in `.docs/decisions/etymology-conjugation-source.md`.
 *
 * Source: Wiktionary-derived live data with visible attribution.
 * License: CC BY-SA 4.0 / GFDL (dual-licensed Wiktionary content).
 */

export type EtymologySource = {
  name: string;
  url?: string;
  license: 'CC-BY-SA-4.0' | 'GFDL' | 'CC-BY-SA-4.0/GFDL' | 'Local educational fixture';
  attribution: string;
};

export type EtymologyData = {
  text: string;
  source: EtymologySource;
  language?: string; // Etymology language if different from headword language
  timestamp?: string; // When the etymology was fetched/cached
};

export type EtymologyResult = {
  etymology: EtymologyData | null;
  fallbackMessage: string;
  hasData: boolean;
};

export type EtymologyDisplayContext = {
  localEtymology?: string | null;
  sourceLanguageLabel: string;
  targetLanguageLabel?: string;
  isBilingualLookup: boolean;
  hasConfiguredSource: boolean;
  sourceName?: string | null;
};

/**
 * Build etymology result with proper attribution and fallback handling.
 *
 * @param etymologyText - Raw etymology text from source
 * @param sourceName - Source name (e.g., "English Wiktionary", "jawiktionary")
 * @param sourceUrl - Optional URL to the source entry
 * @param license - License type
 * @returns EtymologyResult with attribution or fallback message
 */
export function buildEtymologyResult(
  etymologyText: string | null | undefined,
  sourceName: string,
  sourceUrl?: string,
  license: EtymologySource['license'] = 'CC-BY-SA-4.0/GFDL'
): EtymologyResult {
  if (!etymologyText || etymologyText.trim() === '') {
    return {
      etymology: null,
      fallbackMessage: `Etymology data not available from ${sourceName}. Source: ${sourceName} (${license}).`,
      hasData: false,
    };
  }

  const source: EtymologySource = {
    name: sourceName,
    url: sourceUrl,
    license,
    attribution: `Source: ${sourceName} (${license})`,
  };

  return {
    etymology: {
      text: etymologyText.trim(),
      source,
      timestamp: new Date().toISOString(),
    },
    fallbackMessage: '',
    hasData: true,
  };
}

/**
 * Build fallback etymology result for monolingual-only restriction.
 * Used when etymology is requested for bilingual dictionary entries.
 */
export function buildMonolingualOnlyFallback(sourceLanguageLabel: string, targetLanguageLabel: string): EtymologyResult {
  return {
    etymology: null,
    fallbackMessage: `Etymology is available for monolingual entries only. Bilingual ${sourceLanguageLabel}→${targetLanguageLabel} lookup does not include etymology data.`,
    hasData: false,
  };
}

/**
 * Build fallback etymology result for languages with no configured source yet.
 */
export function buildUnavailableSourceFallback(languageLabel: string): EtymologyResult {
  return {
    etymology: null,
    fallbackMessage: `Etymology needs a selected production resource for ${languageLabel}. No etymology source is currently configured for this language.`,
    hasData: false,
  };
}

/**
 * Build fallback etymology result for a configured source that returns no etymology.
 */
export function buildMissingSourceFallback(languageLabel: string, sourceName: string): EtymologyResult {
  return {
    etymology: null,
    fallbackMessage: `Etymology source is selected for ${languageLabel}, but structured etymology is not available for this entry yet. Source: ${sourceName} (CC-BY-SA-4.0/GFDL).`,
    hasData: false,
  };
}

/**
 * Build etymology result for local preview fixtures.
 */
export function buildLocalFixtureResult(etymologyText: string | null | undefined): EtymologyResult {
  if (!etymologyText || etymologyText.trim() === '') {
    return buildLocalFixtureFallback();
  }

  return {
    etymology: {
      text: etymologyText.trim(),
      source: {
        name: 'Local educational fixture',
        license: 'Local educational fixture',
        attribution: 'Source: local educational fixture (not production lexical data)',
      },
    },
    fallbackMessage: '',
    hasData: true,
  };
}

/**
 * Build fallback etymology result for local fixture entries without text.
 */
export function buildLocalFixtureFallback(): EtymologyResult {
  return {
    etymology: null,
    fallbackMessage: 'Etymology data is not included in local fixture entries. Source attribution: local educational fixture (not a production lexical source).',
    hasData: false,
  };
}

/**
 * Pick the etymology display result for the current UI state.
 */
export function resolveEtymologyDisplay(context: EtymologyDisplayContext): EtymologyResult {
  if (context.isBilingualLookup) {
    return buildMonolingualOnlyFallback(
      context.sourceLanguageLabel,
      context.targetLanguageLabel ?? context.sourceLanguageLabel
    );
  }

  if (context.localEtymology?.trim()) {
    return buildLocalFixtureResult(context.localEtymology);
  }

  if (context.hasConfiguredSource) {
    return buildMissingSourceFallback(
      context.sourceLanguageLabel,
      context.sourceName ?? `${context.sourceLanguageLabel} Wiktionary`
    );
  }

  return buildUnavailableSourceFallback(context.sourceLanguageLabel);
}

/**
 * Format etymology attribution for UI display.
 * Returns a short attribution string suitable for inline display.
 */
export function formatEtymologyAttribution(etymology: EtymologyData | null): string {
  if (!etymology) {
    return 'Source attribution: unavailable (fallback mode)';
  }

  return etymology.source.attribution;
}

/**
 * Format etymology text with attribution for full display.
 * Returns formatted text with source attribution appended.
 */
export function formatEtymologyWithAttribution(result: EtymologyResult): string {
  if (!result.hasData || !result.etymology) {
    return result.fallbackMessage;
  }

  return `${result.etymology.text}\n\n${result.etymology.source.attribution}`;
}
