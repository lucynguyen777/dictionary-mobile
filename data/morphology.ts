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
  if (languageCode === 'en') return getEnglishMorphologyCandidates(input);
  if (languageCode === 'es') return getSpanishMorphologyCandidates(input);
  if (languageCode === 'ms') return getMalayMorphologyCandidates(input);

  return [];
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

function getSpanishMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = normalizeMorphologyInput(input);
  if (word.length < 3) return [];

  const candidates: MorphologyCandidate[] = [];

  // Plural → singular: -ces → -z (e.g. lápices → lápiz, voces → voz)
  if (word.endsWith('ces') && word.length > 4) {
    candidates.push(createCandidate(`${word.slice(0, -3)}z`, 'forma plural'));
  }

  // Plural → singular: -es (e.g. ciudades → ciudad, canciones → canción)
  if (word.endsWith('es') && word.length > 4) {
    candidates.push(createCandidate(word.slice(0, -2), 'forma plural'));
    // words ending in consonant + es, add accent on last vowel for -ión pattern
    if (word.endsWith('iones')) {
      candidates.push(createCandidate(`${word.slice(0, -4)}ón`, 'forma plural'));
    }
  }

  // Plural → singular: -s (e.g. casas → casa, libros → libro)
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    candidates.push(createCandidate(word.slice(0, -1), 'forma plural'));
  }

  // Feminine → masculine: -a → -o (e.g. pequeña → pequeño, bonita → bonito)
  if (word.endsWith('a') && word.length > 3) {
    candidates.push(createCandidate(`${word.slice(0, -1)}o`, 'forma femenina'));
  }

  // Diminutive: -ito/-ita → base (e.g. casita → casa, librito → libro)
  if (word.endsWith('ito') && word.length > 5) {
    candidates.push(createCandidate(`${word.slice(0, -3)}o`, 'diminutivo'));
    candidates.push(createCandidate(word.slice(0, -3), 'diminutivo'));
  }
  if (word.endsWith('ita') && word.length > 5) {
    candidates.push(createCandidate(`${word.slice(0, -3)}a`, 'diminutivo'));
    candidates.push(createCandidate(word.slice(0, -3), 'diminutivo'));
  }

  // Regular -ar verb conjugation: present indicative stems
  // canto, cantas, canta, cantamos, cantáis, cantan → cantar
  if (word.endsWith('ando') && word.length > 5) {
    candidates.push(createCandidate(`${word.slice(0, -4)}ar`, 'gerundio -ar'));
  }
  if (word.endsWith('ado') && word.length > 4) {
    candidates.push(createCandidate(`${word.slice(0, -3)}ar`, 'participio -ar'));
  }
  if (word.endsWith('amos') && word.length > 5) {
    candidates.push(createCandidate(`${word.slice(0, -4)}ar`, 'conjugación -ar'));
  }
  if (word.endsWith('an') && word.length > 4) {
    candidates.push(createCandidate(`${word.slice(0, -2)}ar`, 'conjugación -ar'));
  }

  // Regular -er verb conjugation
  if (word.endsWith('iendo') && word.length > 6) {
    candidates.push(createCandidate(`${word.slice(0, -5)}er`, 'gerundio -er'));
    candidates.push(createCandidate(`${word.slice(0, -5)}ir`, 'gerundio -ir'));
  }
  if (word.endsWith('ido') && word.length > 4) {
    candidates.push(createCandidate(`${word.slice(0, -3)}er`, 'participio -er'));
    candidates.push(createCandidate(`${word.slice(0, -3)}ir`, 'participio -ir'));
  }
  if (word.endsWith('emos') && word.length > 5) {
    candidates.push(createCandidate(`${word.slice(0, -4)}er`, 'conjugación -er'));
  }
  if (word.endsWith('imos') && word.length > 5) {
    candidates.push(createCandidate(`${word.slice(0, -4)}ir`, 'conjugación -ir'));
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getMalayMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = normalizeMorphologyInput(input);
  if (word.length < 3) return [];

  const candidates: MorphologyCandidate[] = [];

  // Reduplication (kata ganda) - e.g., buku-buku -> buku
  if (word.includes('-')) {
    const parts = word.split('-');
    if (parts.length === 2 && parts[0] === parts[1]) {
      candidates.push(createCandidate(parts[0], 'kata ganda'));
    }
  }

  // Safe Suffixes (akhiran)
  if (word.endsWith('kan') && word.length > 6) {
    candidates.push(createCandidate(word.slice(0, -3), 'akhiran -kan'));
  }
  if (word.endsWith('an') && word.length > 5) {
    candidates.push(createCandidate(word.slice(0, -2), 'akhiran -an'));
  }
  if (word.endsWith('i') && word.length > 4 && !word.endsWith('ai')) { // avoid matching raw 'ai' endings
    candidates.push(createCandidate(word.slice(0, -1), 'akhiran -i'));
  }

  // Safe Prefixes (awalan) - skipping meN-/peN- allomorphs as they modify the root
  if (word.startsWith('ber') && word.length > 6) {
    candidates.push(createCandidate(word.slice(3), 'awalan ber-'));
  }
  if (word.startsWith('ter') && word.length > 6) {
    candidates.push(createCandidate(word.slice(3), 'awalan ter-'));
  }
  if (word.startsWith('di') && word.length > 4) {
    candidates.push(createCandidate(word.slice(2), 'awalan di-'));
  }
  if (word.startsWith('ke') && word.length > 4) {
    candidates.push(createCandidate(word.slice(2), 'awalan ke-'));
  }
  if (word.startsWith('se') && word.length > 4) {
    candidates.push(createCandidate(word.slice(2), 'awalan se-'));
  }

  // Simple circumfixes (apitan)
  if (word.startsWith('di') && word.endsWith('kan') && word.length > 8) {
    candidates.push(createCandidate(word.slice(2, -3), 'apitan di-...-kan'));
  }
  if (word.startsWith('ke') && word.endsWith('an') && word.length > 7) {
    candidates.push(createCandidate(word.slice(2, -2), 'apitan ke-...-an'));
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}
