export type MorphologyCandidate = {
  word: string;
  label: string;
  reason: string;
};

const irregularEnglishBaseForms: Record<string, string[]> = {
  ate: ['eat'],
  began: ['begin'],
  begun: ['begin'],
  better: ['good', 'well'],
  best: ['good', 'well'],
  bought: ['buy'],
  came: ['come'],
  children: ['child'],
  did: ['do'],
  done: ['do'],
  drove: ['drive'],
  driven: ['drive'],
  feet: ['foot'],
  found: ['find'],
  gave: ['give'],
  given: ['give'],
  gone: ['go'],
  got: ['get'],
  gotten: ['get'],
  had: ['have'],
  knew: ['know'],
  known: ['know'],
  left: ['leave'],
  made: ['make'],
  men: ['man'],
  ran: ['run'],
  saw: ['see'],
  seen: ['see'],
  spoke: ['speak'],
  spoken: ['speak'],
  took: ['take'],
  taken: ['take'],
  taught: ['teach'],
  thought: ['think'],
  went: ['go'],
  women: ['woman'],
  wrote: ['write'],
  written: ['write'],
};

export function getMorphologyCandidates(languageCode: string, input: string): MorphologyCandidate[] {
  if (languageCode !== 'en') return [];

  return getEnglishMorphologyCandidates(input);
}

function getEnglishMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = normalizeMorphologyInput(input);
  if (word.length < 3) return [];

  const candidates: MorphologyCandidate[] = [];
  const irregularBaseForms = irregularEnglishBaseForms[word] ?? [];

  irregularBaseForms.forEach((baseWord) => {
    candidates.push({
      word: baseWord,
      label: baseWord,
      reason: 'dạng bất quy tắc',
    });
  });

  if (word.endsWith('ies') && word.length > 4) {
    candidates.push(createCandidate(`${word.slice(0, -3)}y`, 'danh từ/động từ số nhiều'));
  }

  if (word.endsWith('ves') && word.length > 4) {
    candidates.push(createCandidate(`${word.slice(0, -3)}f`, 'dạng số nhiều'));
    candidates.push(createCandidate(`${word.slice(0, -3)}fe`, 'dạng số nhiều'));
  }

  if (word.endsWith('ing') && word.length > 5) {
    const stem = word.slice(0, -3);
    candidates.push(createCandidate(stem, 'dạng -ing'));
    candidates.push(createCandidate(`${stem}e`, 'dạng -ing'));

    const undoubled = removeDoubledFinalConsonant(stem);
    if (undoubled !== stem) {
      candidates.push(createCandidate(undoubled, 'dạng -ing'));
    }
  }

  if (word.endsWith('ed') && word.length > 4) {
    const stem = word.slice(0, -2);
    candidates.push(createCandidate(stem, 'quá khứ/phân từ'));
    candidates.push(createCandidate(`${stem}e`, 'quá khứ/phân từ'));

    const undoubled = removeDoubledFinalConsonant(stem);
    if (undoubled !== stem) {
      candidates.push(createCandidate(undoubled, 'quá khứ/phân từ'));
    }
  }

  if (word.endsWith('es') && word.length > 4) {
    candidates.push(createCandidate(word.slice(0, -2), 'dạng số nhiều/ngôi ba'));
  }

  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    candidates.push(createCandidate(word.slice(0, -1), 'dạng số nhiều/ngôi ba'));
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function createCandidate(word: string, reason: string): MorphologyCandidate {
  return {
    word,
    label: word,
    reason,
  };
}

function removeDoubledFinalConsonant(stem: string) {
  if (stem.length < 3) return stem;

  const last = stem.at(-1);
  const previous = stem.at(-2);

  if (last && previous && last === previous && !'aeiou'.includes(last)) {
    return stem.slice(0, -1);
  }

  return stem;
}

function uniqueCandidates(candidates: MorphologyCandidate[], originalWord: string) {
  const seenWords = new Set<string>();

  return candidates.filter((candidate) => {
    const normalizedWord = normalizeMorphologyInput(candidate.word);
    if (!normalizedWord || normalizedWord === originalWord || seenWords.has(normalizedWord)) return false;

    seenWords.add(normalizedWord);
    return true;
  });
}

function normalizeMorphologyInput(input: string) {
  return input.trim().toLocaleLowerCase();
}
