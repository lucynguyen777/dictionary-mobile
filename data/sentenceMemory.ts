// Sentence memory for Specialized Translation (plan 4.5 "sentence datasets"): the user's own
// source/target sentence pairs per domain. The pairs most similar to the text being translated go
// with the request as reference translations. Shared by the panel and the backend proxy.
import { parseGlossaryText } from './glossaryMatching';

export type SentencePair = { source: string; target: string };

export const MAX_SENTENCE_EXAMPLES = 5;
export const MAX_SENTENCE_EXAMPLE_CHARS = 500;

// Same line format as glossaries: "source → target", "source -> target" or tab-separated.
export function parseSentenceMemoryText(value: string) {
  const { invalidLines, terms } = parseGlossaryText(value);
  return { invalidLines, pairs: terms.map((term) => ({ source: term.sourceTerm, target: term.targetTerm })) };
}

const UNSPACED_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Tibetan}]/u;

// Function words of the supported pairs (English, Vietnamese). They match almost any sentence, so
// on their own they must not make two sentences look alike, even in a small memory.
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from', 'has', 'have', 'in', 'is', 'it', 'its', 'of',
  'on', 'or', 'that', 'the', 'this', 'to', 'was', 'were', 'will', 'with',
  'các', 'cho', 'có', 'của', 'là', 'mà', 'một', 'này', 'những', 'thì', 'trong', 'và', 'với', 'để', 'đã', 'được',
]);

// Words for spaced scripts; character bigrams for scripts written without spaces.
export function sentenceTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const run of text.normalize('NFC').toLocaleLowerCase().match(/[\p{L}\p{N}\p{M}]+/gu) ?? []) {
    if (UNSPACED_SCRIPT.test(run)) {
      const chars = Array.from(run);
      if (chars.length === 1) tokens.add(run);
      for (let index = 0; index + 1 < chars.length; index += 1) tokens.add(chars[index] + chars[index + 1]);
    } else if (!STOPWORDS.has(run)) {
      tokens.add(run);
    }
  }
  return tokens;
}

function splitSentences(text: string) {
  return text.replace(/([.!?。！？])\s+/g, '$1\n').split(/\n+/).map((part) => part.trim()).filter(Boolean);
}

// Ranks pairs by weighted token overlap with the closest sentence of the text. Words that occur in
// many pairs ("the", "của") weigh less, so a match has to share meaningful words.
export function selectSimilarSentencePairs(
  text: string,
  pairs: SentencePair[],
  { limit = MAX_SENTENCE_EXAMPLES, minScore = 0.25 }: { limit?: number; minScore?: number } = {}
): SentencePair[] {
  if (!text.trim() || !pairs.length || limit <= 0) return [];
  const pairTokens = pairs.map((pair) => sentenceTokens(pair.source));
  const documentFrequency = new Map<string, number>();
  pairTokens.forEach((tokens) => tokens.forEach((token) => documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1)));
  const weight = (token: string) => Math.log(1 + (pairs.length + 1) / ((documentFrequency.get(token) ?? 0) + 1));
  const total = (tokens: Set<string>) => Array.from(tokens).reduce((sum, token) => sum + weight(token), 0);

  const sentences = splitSentences(text).map(sentenceTokens).filter((tokens) => tokens.size);
  const sentenceTotals = sentences.map(total);
  const seen = new Set<string>();
  const scored: { index: number; score: number }[] = [];

  pairTokens.forEach((tokens, index) => {
    const key = pairs[index].source.trim().toLocaleLowerCase();
    if (!tokens.size || seen.has(key)) return;
    seen.add(key);
    const pairTotal = total(tokens);
    let best = 0;
    sentences.forEach((sentence, sentenceIndex) => {
      let shared = 0;
      tokens.forEach((token) => {
        if (sentence.has(token)) shared += weight(token);
      });
      if (shared) best = Math.max(best, shared / Math.sqrt(pairTotal * sentenceTotals[sentenceIndex]));
    });
    if (best >= minScore) scored.push({ index, score: best });
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ index }) => pairs[index]);
}
