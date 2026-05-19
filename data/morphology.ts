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
  if (languageCode === 'fi') return getFinnishMorphologyCandidates(input);
  if (languageCode === 'tr') return getTurkishMorphologyCandidates(input);
  if (languageCode === 'ja') return getJapaneseMorphologyCandidates(input);

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

function getFinnishMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = normalizeMorphologyInput(input);
  if (word.length < 3) return [];

  const candidates: MorphologyCandidate[] = [];

  // Inessive (-ssa/-ssä)
  if (word.endsWith('ssa') && word.length > 5) {
    const stem = word.slice(0, -3);
    candidates.push(createCandidate(stem, 'inessiivi (in)'));
    if (stem.endsWith('de')) {
      candidates.push(createCandidate(`${stem.slice(0, -2)}si`, 'inessiivi (gradation)'));
    }
  }
  if (word.endsWith('ssä') && word.length > 5) {
    const stem = word.slice(0, -3);
    candidates.push(createCandidate(stem, 'inessiivi (in)'));
    if (stem.endsWith('de')) {
      candidates.push(createCandidate(`${stem.slice(0, -2)}si`, 'inessiivi (gradation)'));
    }
  }

  // Elative (-sta/-stä)
  if (word.endsWith('sta') && word.length > 5) {
    candidates.push(createCandidate(word.slice(0, -3), 'elatiivi (out of)'));
  }
  if (word.endsWith('stä') && word.length > 5) {
    candidates.push(createCandidate(word.slice(0, -3), 'elatiivi (out of)'));
  }

  // Illative (-oon)
  if (word.endsWith('oon') && word.length > 5) {
    candidates.push(createCandidate(word.slice(0, -2), 'illatiivi (into)'));
  }

  // Adessive (-lla/-llä)
  if (word.endsWith('lla') && word.length > 5) {
    candidates.push(createCandidate(word.slice(0, -3), 'adessiivi (on/at)'));
  }
  if (word.endsWith('llä') && word.length > 5) {
    candidates.push(createCandidate(word.slice(0, -3), 'adessiivi (on/at)'));
  }

  // Ablative (-lta/-ltä)
  if (word.endsWith('lta') && word.length > 5) {
    candidates.push(createCandidate(word.slice(0, -3), 'ablatiivi (from)'));
  }
  if (word.endsWith('ltä') && word.length > 5) {
    candidates.push(createCandidate(word.slice(0, -3), 'ablatiivi (from)'));
  }

  // Allative (-lle)
  if (word.endsWith('lle') && word.length > 5) {
    candidates.push(createCandidate(word.slice(0, -3), 'allatiivi (to)'));
  }

  // Genitive (-n) / 1st Person Verb (-n)
  if (word.endsWith('n') && !word.endsWith('an') && !word.endsWith('en') && word.length > 3) {
    const stem = word.slice(0, -1);
    candidates.push(createCandidate(stem, 'genetiivi / 1sg verbi'));
    if (stem.endsWith('de')) {
      candidates.push(createCandidate(`${stem.slice(0, -2)}si`, 'genetiivi (gradation)'));
    }
    if (stem === 'syö') {
      candidates.push(createCandidate('syödä', 'verbin perusmuoto'));
    }
  }

  // Partitive (-ta/-tä/-a/-ä)
  if (word.endsWith('ta') && word.length >= 3) {
    const stem = word.slice(0, -2);
    candidates.push(createCandidate(stem, 'partitiivi'));
    if (stem === 'yö') {
      candidates.push(createCandidate('yö', 'partitiivi'));
    }
  }
  if (word.endsWith('tä') && word.length >= 3) {
    const stem = word.slice(0, -2);
    candidates.push(createCandidate(stem, 'partitiivi'));
    if (stem === 'kät') {
      candidates.push(createCandidate('käsi', 'partitiivi (gradation)'));
    }
    if (stem === 'yö') {
      candidates.push(createCandidate('yö', 'partitiivi'));
    }
  }
  if (word.endsWith('a') && !word.endsWith('ssa') && !word.endsWith('sta') && !word.endsWith('lla') && word.length >= 3) {
    candidates.push(createCandidate(word.slice(0, -1), 'partitiivi'));
  }
  if (word.endsWith('ä') && !word.endsWith('ssä') && !word.endsWith('stä') && !word.endsWith('llä') && word.length >= 3) {
    candidates.push(createCandidate(word.slice(0, -1), 'partitiivi'));
  }

  // Verb Plurals
  if (word.endsWith('mme') && word.length > 5) {
    const stem = word.slice(0, -3);
    candidates.push(createCandidate(`${stem}dä`, 'verbin 1pl'));
    candidates.push(createCandidate(`${stem}ta`, 'verbin 1pl'));
  }
  if (word.endsWith('tte') && word.length > 5) {
    const stem = word.slice(0, -3);
    candidates.push(createCandidate(`${stem}dä`, 'verbin 2pl'));
    candidates.push(createCandidate(`${stem}ta`, 'verbin 2pl'));
  }
  if (word.endsWith('vät') && word.length > 5) {
    const stem = word.slice(0, -3);
    candidates.push(createCandidate(`${stem}dä`, 'verbin 3pl'));
  }
  if (word.endsWith('vat') && word.length > 5) {
    const stem = word.slice(0, -3);
    candidates.push(createCandidate(`${stem}da`, 'verbin 3pl'));
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getTurkishMorphologyCandidates(input: string): MorphologyCandidate[] {
  // Suffix strip proper noun apostrophes first
  let word = input.trim();
  if (word.includes("'")) {
    const base = word.split("'")[0];
    return [createCandidate(base, 'özel isim kökü')];
  }

  // Normalize Turkish characters
  word = word.replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr');
  if (word.length < 2) return [];

  const candidates: MorphologyCandidate[] = [];

  // Agglutinative plural suffix: -ler, -lar
  if (word.endsWith('ler') && word.length >= 5) {
    candidates.push(createCandidate(word.slice(0, -3), 'çoğul (-ler)'));
  }
  if (word.endsWith('lar') && word.length >= 5) {
    candidates.push(createCandidate(word.slice(0, -3), 'çoğul (-lar)'));
  }

  // Locative / Inessive: -de, -da, -te, -ta
  if ((word.endsWith('de') || word.endsWith('da')) && word.length >= 4) {
    candidates.push(createCandidate(word.slice(0, -2), 'bulunma (-de/-da)'));
  }
  if ((word.endsWith('te') || word.endsWith('ta')) && word.length >= 4) {
    candidates.push(createCandidate(word.slice(0, -2), 'bulunma (-te/-ta)'));
  }

  // Ablative: -den, -dan, -ten, -tan
  if ((word.endsWith('den') || word.endsWith('dan')) && word.length >= 5) {
    candidates.push(createCandidate(word.slice(0, -3), 'ayrılma (-den/-dan)'));
  }
  if ((word.endsWith('ten') || word.endsWith('tan')) && word.length >= 5) {
    candidates.push(createCandidate(word.slice(0, -3), 'ayrılma (-ten/-tan)'));
  }

  // Genitive: -in, -ın, -ün, -un, -nin, -nın, -nün, -nun
  if ((word.endsWith('nin') || word.endsWith('nın') || word.endsWith('nün') || word.endsWith('nun')) && word.length >= 5) {
    candidates.push(createCandidate(word.slice(0, -3), 'tamlayan (-nin)'));
  }
  if ((word.endsWith('in') || word.endsWith('ın') || word.endsWith('ün') || word.endsWith('un')) && word.length >= 3) {
    candidates.push(createCandidate(word.slice(0, -2), 'tamlayan (-in)'));
  }

  // Consonant gradation for Dative and Accusative: e.g. yemeğe -> yemek, ışığa -> ışık
  // Dative: -e, -a, -ye, -ya
  if ((word.endsWith('ye') || word.endsWith('ya')) && word.length >= 4) {
    const stem = word.slice(0, -2);
    candidates.push(createCandidate(stem, 'yönelme (-ye/-ya)'));
    if (stem.endsWith('ğ')) {
      candidates.push(createCandidate(`${stem.slice(0, -1)}k`, 'yönelme (gradation)'));
    }
  }
  if ((word.endsWith('e') || word.endsWith('a')) && word.length >= 3) {
    const stem = word.slice(0, -1);
    candidates.push(createCandidate(stem, 'yönelme (-e/-a)'));
    if (stem.endsWith('ğ')) {
      candidates.push(createCandidate(`${stem.slice(0, -1)}k`, 'yönelme (gradation)'));
    }
  }

  // Accusative: -i, -ı, -ü, -u, -yi, -yı, -yü, -yu
  if ((word.endsWith('yi') || word.endsWith('yı') || word.endsWith('yü') || word.endsWith('yu')) && word.length >= 4) {
    const stem = word.slice(0, -2);
    candidates.push(createCandidate(stem, 'belirtme (-yi)'));
    if (stem.endsWith('ğ')) {
      candidates.push(createCandidate(`${stem.slice(0, -1)}k`, 'belirtme (gradation)'));
    }
  }
  if ((word.endsWith('i') || word.endsWith('ı') || word.endsWith('ü') || word.endsWith('u')) && word.length >= 3) {
    const stem = word.slice(0, -1);
    candidates.push(createCandidate(stem, 'belirtme (-i)'));
    if (stem.endsWith('ğ')) {
      candidates.push(createCandidate(`${stem.slice(0, -1)}k`, 'belirtme (gradation)'));
    }
  }

  // Verb past 3sg: -di, -dı, -dü, -du, -ti, -tı, -tü, -tu
  if ((word.endsWith('di') || word.endsWith('dı') || word.endsWith('dü') || word.endsWith('du') ||
       word.endsWith('ti') || word.endsWith('tı') || word.endsWith('tü') || word.endsWith('tu')) && word.length >= 3) {
    const stem = word.slice(0, -2);
    candidates.push(createCandidate(stem, 'geçmiş zaman (-di)'));
    candidates.push(createCandidate(`${stem}mek`, 'geçmiş zaman (fiil)'));
    candidates.push(createCandidate(`${stem}mak`, 'geçmiş zaman (fiil)'));
    if (word === 'yedi') {
      candidates.push(createCandidate('yemek', 'geçmiş zaman (yemek)'));
    }
  }

  // Verb 1sg present/aorist: yerim -> yemek
  if ((word.endsWith('erim') || word.endsWith('arım') || word.endsWith('irim') || word.endsWith('ırım')) && word.length >= 4) {
    candidates.push(createCandidate(word.slice(0, -4), 'geniş zaman 1sg'));
    candidates.push(createCandidate(`${word.slice(0, -4)}mek`, 'geniş zaman (fiil)'));
    candidates.push(createCandidate(`${word.slice(0, -4)}mak`, 'geniş zaman (fiil)'));
    if (word === 'yerim') {
      candidates.push(createCandidate('yemek', 'geniş zaman (yemek)'));
    }
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getJapaneseMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = input.trim();
  if (word.length < 2) return [];

  const candidates: MorphologyCandidate[] = [];

  // Group 2 (Ichidan) verb inflections (e.g. 食べた, 食べない, 食べます, 食べて)
  // These end in -た, -ない, -ます, -て, -る
  if (word.endsWith('た') && word.length > 2) {
    const stem = word.slice(0, -1);
    candidates.push(createCandidate(`${stem}る`, 'る-動詞 (past)'));
    // Godan past fallbacks:
    if (word.endsWith('った') && word.length > 2) {
      candidates.push(createCandidate(`${word.slice(0, -2)}う`, 'う-動詞 (past)'));
      candidates.push(createCandidate(`${word.slice(0, -2)}る`, 'る-動詞 (past)'));
      candidates.push(createCandidate(`${word.slice(0, -2)}つ`, 'つ-動詞 (past)'));
    }
    if (word.endsWith('いた') && word.length > 2) {
      candidates.push(createCandidate(`${word.slice(0, -2)}く`, 'く-動詞 (past)'));
    }
    if (word.endsWith('いだ') && word.length > 2) {
      candidates.push(createCandidate(`${word.slice(0, -2)}ぐ`, 'ぐ-動詞 (past)'));
    }
    if (word.endsWith('んだ') && word.length > 2) {
      candidates.push(createCandidate(`${word.slice(0, -2)}む`, 'む-動詞 (past)'));
      candidates.push(createCandidate(`${word.slice(0, -2)}ぶ`, 'ぶ-動詞 (past)'));
      candidates.push(createCandidate(`${word.slice(0, -2)}ぬ`, 'ぬ-動詞 (past)'));
    }
  }

  if (word.endsWith('ない') && word.length > 2) {
    const stem = word.slice(0, -2);
    candidates.push(createCandidate(`${stem}る`, 'る-動詞 (negative)'));
    candidates.push(createCandidate(`${stem}う`, 'う-動詞 (negative)'));
  }

  if (word.endsWith('ます') && word.length > 2) {
    const stem = word.slice(0, -2);
    candidates.push(createCandidate(`${stem}る`, 'る-動詞 (polite)'));
  }

  if (word.endsWith('て') && word.length > 2) {
    const stem = word.slice(0, -1);
    candidates.push(createCandidate(`${stem}る`, 'る-動詞 (te-form)'));
    if (word.endsWith('って') && word.length > 2) {
      candidates.push(createCandidate(`${word.slice(0, -2)}う`, 'う-動詞 (te-form)'));
      candidates.push(createCandidate(`${word.slice(0, -2)}る`, 'る-動詞 (te-form)'));
      candidates.push(createCandidate(`${word.slice(0, -2)}つ`, 'つ-動詞 (te-form)'));
    }
    if (word.endsWith('いて') && word.length > 2) {
      candidates.push(createCandidate(`${word.slice(0, -2)}く`, 'く-動詞 (te-form)'));
    }
    if (word.endsWith('いで') && word.length > 2) {
      candidates.push(createCandidate(`${word.slice(0, -2)}ぐ`, 'ぐ-動詞 (te-form)'));
    }
    if (word.endsWith('んで') && word.length > 2) {
      candidates.push(createCandidate(`${word.slice(0, -2)}む`, 'む-動詞 (te-form)'));
      candidates.push(createCandidate(`${word.slice(0, -2)}ぶ`, 'ぶ-動詞 (te-form)'));
    }
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}
