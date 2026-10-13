// Text processing for the Reader: tokens are what users tap, sentences are what TTS reads.

const READER_WORD_PATTERN =
  /[A-Za-zÀ-ÿ\u0600-\u06FF\u0590-\u05FF\u1000-\u109F\u0F00-\u0FFF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/;

export function isReaderWordToken(token: string) {
  return READER_WORD_PATTERN.test(token);
}

// Splits on sentence punctuation followed by whitespace.
export function splitReaderSentences(content: string) {
  if (!content) return [];
  return content.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.trim().length > 0);
}

// Maps each document token to its sentence with the same boundary rule as splitReaderSentences,
// so token indexes and sentence indexes stay aligned for TTS highlighting.
export function buildTokenSentenceMap(tokens: string[], sentenceCount: number) {
  const mapping: number[] = [];
  let sentenceIndex = 0;
  tokens.forEach((token, index) => {
    mapping.push(sentenceIndex);
    const next = tokens[index + 1] ?? '';
    if (/[.!?]\s/.test(token) || (/[.!?]$/.test(token) && /^\s/.test(next))) {
      sentenceIndex = Math.min(sentenceIndex + 1, Math.max(0, sentenceCount - 1));
    }
  });
  return mapping;
}

export type ReaderParagraphRange = { end: number; sentenceIndexes: Set<number>; start: number };

// Groups tokens into newline-delimited paragraphs so a selection or TTS change re-renders only the
// paragraphs it touches.
export function groupReaderParagraphs(tokens: string[], tokenToSentenceMap: number[]): ReaderParagraphRange[] {
  const paragraphs: ReaderParagraphRange[] = [];
  let start = 0;
  tokens.forEach((token, index) => {
    if (token === '\n' || index === tokens.length - 1) {
      const sentenceIndexes = new Set<number>();
      for (let i = start; i <= index; i += 1) {
        if (tokens[i] !== '\n') sentenceIndexes.add(tokenToSentenceMap[i]);
      }
      paragraphs.push({ end: index, sentenceIndexes, start });
      start = index + 1;
    }
  });
  return paragraphs;
}

export function tokenizeReaderText(text: string): string[] {
  if (!text) return [];

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const hasCjkOrBurmeseOrTibetanOrTamilOrTeluguOrKannadaOrMalayalam = /[\u4e00-\u9fa5\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af\u1000-\u109F\u0F00-\u0FFF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/.test(text);
      if (hasCjkOrBurmeseOrTibetanOrTamilOrTeluguOrKannadaOrMalayalam) {
        let locale = 'zh';
        if (/[\u1000-\u109F]/.test(text)) {
          locale = 'my';
        } else if (/[\u0F00-\u0FFF]/.test(text)) {
          locale = 'bo';
        } else if (/[\u0B80-\u0BFF]/.test(text)) {
          locale = 'ta';
        } else if (/[\u0C00-\u0C7F]/.test(text)) {
          locale = 'te';
        } else if (/[\u0C80-\u0CFF]/.test(text)) {
          locale = 'kn';
        } else if (/[\u0D00-\u0D7F]/.test(text)) {
          locale = 'ml';
        }
        const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
        return splitLineBreaks(Array.from(segmenter.segment(text), (s) => s.segment));
      }
    } catch {
      // Fallback
    }
  }

  const regex = /[A-Za-zÀ-ÿ\u0600-\u06FF\u0590-\u05FF][A-Za-zÀ-ÿ\u0600-\u06FF\u0590-\u05FF'-]*|[\u4e00-\u9fa5\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af\u1000-\u109F]|[\u0B80-\u0BFF]+|[\u0C00-\u0C7F]+|[\u0C80-\u0CFF]+|[\u0D00-\u0D7F]+|[\u0F00-\u0F0A\u0F0C-\u0FFF]+\u0F0B?|[^A-Za-zÀ-ÿ\u0600-\u06FF\u0590-\u05FF\u4e00-\u9fa5\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af\u1000-\u109F\u0F00-\u0FFF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]+/g;
  // Collapse runs of spaces but keep line breaks, so paragraphs render as paragraphs.
  return splitLineBreaks(text.replace(/[^\S\n]+/g, ' ').replace(/ ?\n[\s]*/g, '\n').match(regex) ?? []);
}

// Each line break becomes its own token so paragraphs end exactly at the break.
function splitLineBreaks(tokens: string[]) {
  return tokens.flatMap((token) => (token.includes('\n') ? token.split(/(\n)/).filter(Boolean) : [token]));
}
