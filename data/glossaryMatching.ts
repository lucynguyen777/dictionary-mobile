// Finds which glossary terms occur in a text. Shared by the Specialized Translation panel
// (highlighting) and the backend proxy (which terms go into the translation prompt).
export type GlossaryTerm = { sourceTerm: string; targetTerm: string };

export type GlossaryMatch = GlossaryTerm & { end: number; start: number };

// Scripts written without spaces between words: a term can sit inside a longer run of letters.
const UNSPACED_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Tibetan}]/u;
const WORD_CHARACTER = /[\p{L}\p{N}\p{M}]/u;

function isBoundary(text: string, index: number) {
  return index < 0 || index >= text.length || !WORD_CHARACTER.test(text[index]);
}

// Longest terms win and matches never overlap, so "CT scan" is preferred over "CT".
export function findGlossaryMatches(text: string, terms: GlossaryTerm[]): GlossaryMatch[] {
  if (!text || !terms.length) return [];

  const haystack = text.toLocaleLowerCase();
  const covered: boolean[] = new Array(text.length).fill(false);
  const matches: GlossaryMatch[] = [];
  const ordered = [...terms].sort((a, b) => b.sourceTerm.length - a.sourceTerm.length);

  for (const term of ordered) {
    const needle = term.sourceTerm.trim().toLocaleLowerCase();
    // Lower-casing can change length for a few characters; skip such terms rather than misalign spans.
    if (!needle || needle.length !== term.sourceTerm.trim().length) continue;
    const needsBoundary = !UNSPACED_SCRIPT.test(needle);

    for (let start = haystack.indexOf(needle); start !== -1; start = haystack.indexOf(needle, start + 1)) {
      const end = start + needle.length;
      if (needsBoundary && (!isBoundary(text, start - 1) || !isBoundary(text, end))) continue;
      if (covered.slice(start, end).some(Boolean)) continue;
      covered.fill(true, start, end);
      matches.push({ end, sourceTerm: term.sourceTerm.trim(), start, targetTerm: term.targetTerm.trim() });
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}

// Distinct terms that occur in the text, in order of first appearance.
export function selectAppliedGlossaryTerms(text: string, terms: GlossaryTerm[], limit = 100): GlossaryTerm[] {
  const seen = new Set<string>();
  const applied: GlossaryTerm[] = [];
  for (const match of findGlossaryMatches(text, terms)) {
    const key = match.sourceTerm.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    applied.push({ sourceTerm: match.sourceTerm, targetTerm: match.targetTerm });
    if (applied.length >= limit) break;
  }
  return applied;
}

// Parses the panel's glossary editor: one entry per line as "term → translation", "term -> translation"
// or tab-separated (pasted from a spreadsheet). Lines without a translation are reported, not guessed.
export function parseGlossaryText(value: string) {
  const terms: GlossaryTerm[] = [];
  const invalidLines: number[] = [];
  const seen = new Set<string>();

  value.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;
    const parts = line.split(/\s*(?:→|->|\t)\s*/);
    const sourceTerm = parts[0]?.trim() ?? '';
    const targetTerm = parts.slice(1).join(' ').trim();
    if (!sourceTerm || !targetTerm || parts.length !== 2) {
      invalidLines.push(index + 1);
      return;
    }
    const key = sourceTerm.toLocaleLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    terms.push({ sourceTerm, targetTerm });
  });

  return { invalidLines, terms };
}
