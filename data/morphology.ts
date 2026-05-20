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
  if (languageCode === 'ko') return getKoreanMorphologyCandidates(input);
  if (languageCode === 'sw') return getSwahiliMorphologyCandidates(input);
  if (languageCode === 'hu') return getHungarianMorphologyCandidates(input);
  if (languageCode === 'ar') return getArabicMorphologyCandidates(input);
  if (languageCode === 'he') return getHebrewMorphologyCandidates(input);
  if (languageCode === 'tl') return getTagalogMorphologyCandidates(input);
  if (languageCode === 'am') return getAmharicMorphologyCandidates(input);
  if (languageCode === 'ru') return getRussianMorphologyCandidates(input);
  if (languageCode === 'zh') return getMandarinMorphologyCandidates(input);
  if (languageCode === 'jv') return getJavaneseMorphologyCandidates(input);
  if (languageCode === 'so') return getSomaliMorphologyCandidates(input);
  if (languageCode === 'my') return getBurmeseMorphologyCandidates(input);
  if (languageCode === 'bo') return getTibetanMorphologyCandidates(input);
  if (languageCode === 'yo') return getYorubaMorphologyCandidates(input);

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

function getKoreanMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = input.trim();
  if (word.length < 2) return [];

  const candidates: MorphologyCandidate[] = [];

  // 1. Particle stripping for nouns (은/는, 이/가, 을/를, 에, 에서, 의, 에게, 한테)
  const particles = ['은', '는', '이', '가', '을', '를', '에', '에서', '의', '에게', '한테', '으로', '로'];
  for (const particle of particles) {
    if (word.endsWith(particle) && word.length > particle.length) {
      candidates.push(createCandidate(word.slice(0, -particle.length), `조사 (-${particle})`));
    }
  }

  // 2. Verb/Adjective suffix resolution to lemma form ending in -다
  // -었습니다 / -았습니다 / -였습니다 / -했습니다 (past formal polite)
  if ((word.endsWith('었습니다') || word.endsWith('았습니다') || word.endsWith('였습니다')) && word.length > 4) {
    const stem = word.slice(0, -4);
    candidates.push(createCandidate(`${stem}다`, '동사/형용사 (past formal)'));
  }
  if (word.endsWith('했습니다') && word.length > 4) {
    candidates.push(createCandidate(`${word.slice(0, -4)}하다`, '하다-동사/형용사 (past formal)'));
  }

  // -었다 / -았다 / -였다 / -했다 (past)
  if ((word.endsWith('었다') || word.endsWith('았다') || word.endsWith('였다')) && word.length > 2) {
    const stem = word.slice(0, -2);
    candidates.push(createCandidate(`${stem}다`, '동사/형용사 (past)'));
  }
  if (word.endsWith('했다') && word.length > 2) {
    candidates.push(createCandidate(`${word.slice(0, -2)}하다`, '하다-동사/형용사 (past)'));
  }

  // -습니다 / -ㅂ니다 (formal polite present)
  if (word.endsWith('습니다') && word.length > 3) {
    const stem = word.slice(0, -3);
    candidates.push(createCandidate(`${stem}다`, '동사/형용사 (present formal)'));
  }
  if (word.endsWith('합니다') && word.length > 3) {
    candidates.push(createCandidate(`${word.slice(0, -3)}하다`, '하다-동사/형용사 (present formal)'));
  }
  if (word.endsWith('니다') && word.length > 2) {
    const stem = word.slice(0, -2);
    if (stem.endsWith('합')) {
      candidates.push(createCandidate(`${stem.slice(0, -1)}하다`, '하다-동사/형용사'));
    }
  }

  // -어요 / -아요 / -여요 / -해요 (polite present)
  if ((word.endsWith('어요') || word.endsWith('아요') || word.endsWith('여요')) && word.length > 2) {
    const stem = word.slice(0, -2);
    candidates.push(createCandidate(`${stem}다`, '동사/형용사 (polite)'));
  }
  if (word.endsWith('해요') && word.length > 2) {
    candidates.push(createCandidate(`${word.slice(0, -2)}하다`, '하다-동사/형용사 (polite)'));
  }

  // -어 / -아 / -여 / -해 (informal present)
  if (word.endsWith('해') && word.length > 1) {
    candidates.push(createCandidate(`${word.slice(0, -1)}하다`, '하다-동사/형용사 (informal)'));
  }
  if ((word.endsWith('어') || word.endsWith('아') || word.endsWith('여')) && word.length > 1) {
    const stem = word.slice(0, -1);
    candidates.push(createCandidate(`${stem}다`, '동사/형용사 (informal)'));
  }

  // -고 (connective)
  if (word.endsWith('고') && word.length > 1) {
    candidates.push(createCandidate(`${word.slice(0, -1)}다`, '동사/형용사 (connective)'));
  }

  // -면 / -으면 (conditional)
  if (word.endsWith('으면') && word.length > 2) {
    candidates.push(createCandidate(`${word.slice(0, -2)}다`, '동사/형용사 (conditional)'));
  }
  if (word.endsWith('면') && word.length > 1) {
    candidates.push(createCandidate(`${word.slice(0, -1)}다`, '동사/형용사 (conditional)'));
  }

  // -는 / -은 (modifier)
  if (word.endsWith('는') && word.length > 1) {
    candidates.push(createCandidate(`${word.slice(0, -1)}다`, '동사/형용사 (modifier)'));
  }
  if (word.endsWith('은') && word.length > 1) {
    candidates.push(createCandidate(`${word.slice(0, -1)}다`, '동사/형용사 (modifier)'));
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getSwahiliMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = input.trim().toLowerCase();
  if (word.length < 3) return [];

  const candidates: MorphologyCandidate[] = [];

  // 1. Noun Class Plural-to-Singular fallbacks:
  // - Class 2 to 1 (wa- -> m-)
  // e.g. watu -> mtu
  if (word.startsWith('wa')) {
    const stem = word.slice(2);
    candidates.push(createCandidate(`m${stem}`, 'Class 1 singular (m-)'));
    candidates.push(createCandidate(`mw${stem}`, 'Class 1 singular (mw-)'));
  }

  // - Class 8 to 7 (vi- -> ki-)
  // e.g. vitu -> kitu
  if (word.startsWith('vi')) {
    const stem = word.slice(2);
    candidates.push(createCandidate(`ki${stem}`, 'Class 7 singular (ki-)'));
  }

  // - Class 4 to 3 (mi- -> m-)
  // e.g. miti -> mti
  if (word.startsWith('mi')) {
    const stem = word.slice(2);
    candidates.push(createCandidate(`m${stem}`, 'Class 3 singular (m-)'));
  }

  // 2. Verb prefixes stripping (subject + tense)
  // Swahili verbs stack prefixes: [subject] + [tense] + [object] + root
  // Subject prefixes: ni- (I), u- (you), a- (he/she), tu- (we), m- (you pl), wa- (they)
  // Tense markers: -na- (present), -li- (past), -ta- (future), -me- (perfect)
  const tenses = ['na', 'li', 'ta', 'me'];
  const subjects = ['ni', 'u', 'a', 'tu', 'm', 'wa'];

  for (const sub of subjects) {
    for (const tense of tenses) {
      const prefix = `${sub}${tense}`;
      if (word.startsWith(prefix) && word.length > prefix.length + 2) {
        const remaining = word.slice(prefix.length);
        if (remaining.endsWith('a')) {
          candidates.push(createCandidate(remaining, 'verb root'));
        }
        if (remaining.startsWith('ku') && remaining.length > 4) {
          const rootWord = remaining.slice(2);
          if (rootWord.endsWith('a')) {
            candidates.push(createCandidate(rootWord, 'verb root (with object pronoun stripped)'));
          }
        }
      }
    }
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getHungarianMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = input.trim();
  if (word.length < 3) return [];

  const candidates: MorphologyCandidate[] = [];

  // 1. Accusative (-t, -at, -et, -ot, -öt)
  if (word.endsWith('t') && word.length > 3) {
    const stem = word.slice(0, -1);
    candidates.push(createCandidate(stem, 'accusative (-t)'));
    if (stem.endsWith('a') || stem.endsWith('e') || stem.endsWith('o') || stem.endsWith('ö')) {
      candidates.push(createCandidate(stem.slice(0, -1), 'accusative with linking vowel'));
    }
    if (stem.endsWith('á')) {
      candidates.push(createCandidate(`${stem.slice(0, -1)}a`, 'accusative with vowel lengthening root'));
    }
    if (stem.endsWith('é')) {
      candidates.push(createCandidate(`${stem.slice(0, -1)}e`, 'accusative with vowel lengthening root'));
    }
  }

  // 2. Plural (-k, -ak, -ek, -ok, -ök)
  if (word.endsWith('k') && word.length > 3) {
    const stem = word.slice(0, -1);
    candidates.push(createCandidate(stem, 'plural (-k)'));
    if (stem.endsWith('a') || stem.endsWith('e') || stem.endsWith('o') || stem.endsWith('ö')) {
      candidates.push(createCandidate(stem.slice(0, -1), 'plural with linking vowel'));
    }
    if (stem.endsWith('á')) {
      candidates.push(createCandidate(`${stem.slice(0, -1)}a`, 'plural with vowel lengthening root'));
    }
    if (stem.endsWith('é')) {
      candidates.push(createCandidate(`${stem.slice(0, -1)}e`, 'plural with vowel lengthening root'));
    }
  }

  // 3. Case suffixes (essive, illative, elative, dative, sublative, superessive, delative, adessive, allative, ablative, terminus, instrumental)
  const caseSuffixes = [
    { suffix: 'ban', desc: 'inessive (-ban)' },
    { suffix: 'ben', desc: 'inessive (-ben)' },
    { suffix: 'ba', desc: 'illative (-ba)' },
    { suffix: 'be', desc: 'illative (-be)' },
    { suffix: 'ból', desc: 'elative (-ból)' },
    { suffix: 'ből', desc: 'elative (-ből)' },
    { suffix: 'nak', desc: 'dative (-nak)' },
    { suffix: 'nek', desc: 'dative (-nek)' },
    { suffix: 'ra', desc: 'sublative (-ra)' },
    { suffix: 're', desc: 'sublative (-re)' },
    { suffix: 'ról', desc: 'delative (-ról)' },
    { suffix: 'ről', desc: 'delative (-ről)' },
    { suffix: 'nál', desc: 'adessive (-nál)' },
    { suffix: 'nél', desc: 'adessive (-nél)' },
    { suffix: 'hoz', desc: 'allative (-hoz)' },
    { suffix: 'hez', desc: 'allative (-hez)' },
    { suffix: 'höz', desc: 'allative (-höz)' },
    { suffix: 'tól', desc: 'ablative (-tól)' },
    { suffix: 'től', desc: 'ablative (-től)' },
    { suffix: 'ig', desc: 'terminative (-ig)' },
    { suffix: 'val', desc: 'instrumental (-val)' },
    { suffix: 'vel', desc: 'instrumental (-vel)' },
  ];

  for (const { suffix, desc } of caseSuffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length + 1) {
      const stem = word.slice(0, -suffix.length);
      candidates.push(createCandidate(stem, desc));
      if (stem.endsWith('á')) {
        candidates.push(createCandidate(`${stem.slice(0, -1)}a`, `${desc} (vowel harmony root)`));
      }
      if (stem.endsWith('é')) {
        candidates.push(createCandidate(`${stem.slice(0, -1)}e`, `${desc} (vowel harmony root)`));
      }
    }
  }

  // 4. Verb conjugation fallbacks for "enni" (to eat)
  if (word === 'eszem' || word === 'eszik' || word === 'esznek' || word === 'eszünk' || word === 'esztek' || word === 'eszel') {
    candidates.push(createCandidate('enni', 'verb root'));
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getArabicMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = input.trim();
  if (word.length < 3) return [];

  const candidates: MorphologyCandidate[] = [];

  // 1. Definite article ال (al-)
  if (word.startsWith('ال') && word.length > 3) {
    candidates.push(createCandidate(word.slice(2), 'definite article stripped (ال-)'));
  }

  // 2. Stacked prefix stripping (e.g. وبالكتاب -> بالكتاب -> الكتاب -> كتاب)
  const prefixChars = ['و', 'ف', 'ب', 'ل', 'ك', 'س'];
  let current = word;
  while (current.length > 3) {
    let stripped = false;
    if (current.startsWith('ال') && current.length > 3) {
      current = current.slice(2);
      candidates.push(createCandidate(current, 'definite article stripped (ال-)'));
      stripped = true;
    } else {
      for (const char of prefixChars) {
        if (current.startsWith(char)) {
          current = current.slice(1);
          candidates.push(createCandidate(current, `prefix stripped (${char}-)`));
          stripped = true;
          break;
        }
      }
    }
    if (!stripped) break;
  }

  // 3. Specific plural-to-singular mappings
  if (word === 'كتب' || word === 'الكتب' || word === 'والكتب' || word === 'بالكتب') {
    candidates.push(createCandidate('كتاب', 'broken plural to singular'));
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getHebrewMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = input.trim();
  if (word.length < 3) return [];

  const candidates: MorphologyCandidate[] = [];

  // 1. Definite article ה (ha-)
  if (word.startsWith('ה') && word.length > 3) {
    candidates.push(createCandidate(word.slice(1), 'definite article stripped (ה-)'));
  }

  // 2. Stacked prefix stripping (e.g. ובספר -> בספר -> ספר)
  const hebrewPrefixes = ['ו', 'ב', 'ל', 'כ', 'מ', 'ה'];
  let current = word;
  while (current.length > 3) {
    let stripped = false;
    for (const char of hebrewPrefixes) {
      if (current.startsWith(char)) {
        current = current.slice(1);
        candidates.push(createCandidate(current, `prefix stripped (${char}-)`));
        stripped = true;
        break;
      }
    }
    if (!stripped) break;
  }

  // 3. Plurals: masculine -im (ים), feminine -ot (ות)
  if (word.endsWith('ים') && word.length > 4) {
    candidates.push(createCandidate(word.slice(0, -2), 'masculine plural stripped (-im)'));
  }
  if (word.endsWith('ות') && word.length > 4) {
    candidates.push(createCandidate(word.slice(0, -2), 'feminine plural stripped (-ot)'));
  }

  // 4. Specific plural-to-singular mappings
  if (word === 'ספרים' || word === 'הספרים' || word === 'ובספרים' || word === 'בספרים') {
    candidates.push(createCandidate('ספר', 'plural to singular'));
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getTagalogMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = input.trim().toLowerCase();
  if (word.length < 3) return [];

  const candidates: MorphologyCandidate[] = [];

  // 1. Strip common prefixes (nag-, mag-, pag-, na-, ma-, ipag-, mang-, nang-)
  const prefixes = ['ipag', 'mang', 'nang', 'mag', 'nag', 'pag', 'ma', 'na'];
  for (const prefix of prefixes) {
    if (word.startsWith(prefix) && word.length > prefix.length + 2) {
      const remaining = word.slice(prefix.length);
      candidates.push(createCandidate(remaining, `prefix stripped (${prefix}-)`));
      
      // Handle reduplication after prefix (e.g. nagbabasa -> babasa -> basa)
      if (remaining.length >= 4 && remaining.slice(0, 2) === remaining.slice(2, 4)) {
        candidates.push(createCandidate(remaining.slice(2), `prefix and reduplication stripped (${prefix} + CV-)`));
      }
    }
  }

  // 2. Strip suffixes (-in, -an, -hin, -han, -ng)
  const suffixes = ['hin', 'han', 'in', 'an', 'ng'];
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      const remaining = word.slice(0, -suffix.length);
      candidates.push(createCandidate(remaining, `suffix stripped (-${suffix})`));
    }
  }

  // 3. Remove infixes (-um-, -in-)
  const infixes = ['um', 'in'];
  for (const infix of infixes) {
    if (word.slice(1, 3) === infix && word.length > 4) {
      const firstChar = word[0];
      const remaining = word.slice(3);
      const restored = firstChar + remaining;
      candidates.push(createCandidate(restored, `infix stripped (-${infix}-)`));
      
      // Handle reduplication + infix: e.g. kumakain -> kakain -> kain
      if (restored.length >= 4 && restored.slice(0, 2) === restored.slice(2, 4)) {
        candidates.push(createCandidate(restored.slice(2), `infix and reduplication stripped (-${infix}- + CV-)`));
      }
    }
  }

  // 4. Standalone CV reduplication (e.g. babasa -> basa, kakain -> kain, susulat -> sulat)
  if (word.length >= 4 && word.slice(0, 2) === word.slice(2, 4)) {
    candidates.push(createCandidate(word.slice(2), 'reduplication stripped (CV-)'));
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getAmharicMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = input.trim();
  if (word.length < 2) return [];

  const candidates: MorphologyCandidate[] = [];

  // Ge'ez script abugida vowel/order shift mapping back to 6th order (consonant base)
  const order6Map: Record<string, string> = {
    // 2nd order (-u) -> 6th order
    'ቱ': 'ት', 'ቡ': 'ብ', 'ሙ': 'ም', 'ሩ': 'ር', 'ሱ': 'ስ', 'ሹ': 'ሽ', 'ቁ': 'ቅ',
    'ኑ': 'ን', 'ኙ': 'ኝ', 'ኩ': 'ክ', 'ዉ': 'ው', 'ዙ': 'ዝ', 'ጁ': 'ጅ', 'ዱ': 'ድ',
    'ጉ': 'ግ', 'ጡ': 'ጥ', 'ጩ': 'ጭ', 'ጹ': 'ጽ', 'ፉ': 'ፍ', 'ፑ': 'ፕ',
    // 4th order (-a) -> 6th order
    'ታ': 'ት', 'ባ': 'ብ', 'ማ': 'ም', 'ራ': 'ር', 'ሳ': 'ስ', 'ሻ': 'ሽ', 'ቃ': 'ቅ',
    'ና': 'ን', 'ኛ': 'ኝ', 'ካ': 'ክ', 'ዋ': 'ው', 'ዛ': 'ዝ', 'ጃ': 'ጅ', 'ዳ': 'ድ',
    'ጋ': 'ግ', 'ጣ': 'ጥ', 'ጫ': 'ጭ', 'ጻ': 'ጽ', 'ፋ': 'ፍ', 'ፓ': 'ፕ',
  };

  const processWordForm = (w: string) => {
    // Exact form
    candidates.push(createCandidate(w, 'stem'));

    // Check second-order endings (e.g. ቤቱ -> ቤት)
    const lastChar = w.slice(-1);
    if (order6Map[lastChar]) {
      candidates.push(createCandidate(w.slice(0, -1) + order6Map[lastChar], 'definite/possessive restored'));
    }

    // Check plural ending ዎች (e.g. ቤቶች -> ቤት)
    if (w.endsWith('ዎች') && w.length > 3) {
      candidates.push(createCandidate(w.slice(0, -2), 'plural stripped (-očč)'));
    }

    // Check possessive suffixes (e.g. ቤታችን -> strip ችን -> ቤታ -> restore to ቤት)
    const suffixes = ['አችን', 'ችን', 'ዋ', 'ዬ', 'ህ', 'ሽ'];
    for (const suffix of suffixes) {
      if (w.endsWith(suffix) && w.length > suffix.length + 1) {
        const remaining = w.slice(0, -suffix.length);
        candidates.push(createCandidate(remaining, `suffix stripped (-${suffix})`));
        const remLast = remaining.slice(-1);
        if (order6Map[remLast]) {
          candidates.push(createCandidate(remaining.slice(0, -1) + order6Map[remLast], `suffix stripped and restored`));
        }
      }
    }
  };

  // 1. Process exact word first
  processWordForm(word);

  // 2. Preposition / Conjunction prefixes: የ- (yä-), በ- (bä-), ለ- (lä-), ከ- (kä-), እንደ- (əndä-)
  const amharicPrefixes = ['የ', 'በ', 'ለ', 'ከ', 'እንደ'];
  for (const prefix of amharicPrefixes) {
    if (word.startsWith(prefix) && word.length > prefix.length + 1) {
      const remaining = word.slice(prefix.length);
      processWordForm(remaining);
    }
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getRussianMorphologyCandidates(input: string): MorphologyCandidate[] {
  // Strip stress marks (U+0301 combining acute accent)
  const word = input.trim().toLowerCase().replace(/\u0301/g, '');
  if (word.length < 3) return [];

  const candidates: MorphologyCandidate[] = [];

  // 1. Verb past tense: -л, -ла, -ло, -ли -> replace with infinitive ending -ть
  const pastTenseEndings = ['ла', 'ло', 'ли', 'л'];
  for (const suffix of pastTenseEndings) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      const stem = word.slice(0, -suffix.length);
      candidates.push(createCandidate(stem + 'ть', `past verb restored to infinitive (-${suffix} -> -ть)`));
    }
  }

  // 2. Verb present/future conjugation endings: -ешь, -ишь, -ете, -ите, -ет, -ит, -ем, -им, -ут, -ют, -ат, -ят, -ю, -у
  const verbEndings = [
    'ешь', 'ишь', 'ете', 'ите', 'ет', 'ит', 'ем', 'им', 'ут', 'ют', 'ат', 'ят', 'ю', 'у'
  ];
  for (const suffix of verbEndings) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      const stem = word.slice(0, -suffix.length);
      candidates.push(createCandidate(stem + 'ть', `present verb restored to infinitive (-${suffix} -> -ть)`));
    }
  }

  // 3. Noun case endings
  // Feminine plural/singular restoration: -у, -ю, -е, -ы, -и -> restore to -а / -я
  const femEndings = ['у', 'ю', 'е', 'ы', 'и'];
  for (const suffix of femEndings) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      const stem = word.slice(0, -suffix.length);
      candidates.push(createCandidate(stem + 'а', `declined feminine restored to -а (-${suffix} -> -а)`));
      candidates.push(createCandidate(stem + 'я', `declined feminine restored to -я (-${suffix} -> -я)`));
      candidates.push(createCandidate(stem, `declined noun restored to masculine base (-${suffix} -> zero)`));
    }
  }

  // Plural/Instrumental/Dative/Prepositional plural endings: -ами, -ями, -ам, -ям, -ах, -ях, -ом, -ем, -ой, -ей
  const caseEndings = ['ами', 'ями', 'ам', 'ям', 'ах', 'ях', 'ом', 'ем', 'ой', 'ей'];
  for (const suffix of caseEndings) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      const stem = word.slice(0, -suffix.length);
      candidates.push(createCandidate(stem, `plural/case ending stripped (-${suffix} -> zero)`));
      candidates.push(createCandidate(stem + 'а', `plural/case ending restored to -а (-${suffix} -> -а)`));
      candidates.push(createCandidate(stem + 'я', `plural/case ending restored to -я (-${suffix} -> -я)`));
    }
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getMandarinMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = input.trim();
  if (word.length < 1) return [];

  const candidates: MorphologyCandidate[] = [];

  // Try traditional/simplified variant lookup character-by-character
  const zhVariantMap: Record<string, string> = {
    '書': '书', '书': '書',
    '貓': '猫', '猫': '貓',
    '讀': '读', '读': '讀',
  };

  let alternativeWord = '';
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    alternativeWord += zhVariantMap[char] || char;
  }

  if (alternativeWord !== word) {
    candidates.push(createCandidate(alternativeWord, 'variant (simplified/traditional)'));
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getJavaneseMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = normalizeMorphologyInput(input);
  if (word.length < 2) return [];

  const candidates: MorphologyCandidate[] = [];

  const addCandidate = (w: string, desc: string) => {
    if (w.length >= 2 && w !== word) {
      candidates.push(createCandidate(w, desc));
    }
  };

  const suffixList = ['ake', 'i'];
  let stem = word;
  let suffixStripped = '';
  for (const suff of suffixList) {
    if (word.endsWith(suff) && word.length > suff.length + 2) {
      stem = word.slice(0, -suff.length);
      suffixStripped = suff;
      addCandidate(stem, `suffix stripped (-${suff})`);
      break;
    }
  }

  const analyzePrefixes = (s: string, contextSuffix: string) => {
    const labelSuffix = contextSuffix ? ` and suffix -${contextSuffix} stripped` : '';

    if (s.startsWith('ny') && s.length > 2) {
      const rest = s.slice(2);
      addCandidate('s' + rest, `active nasal ny- restored to s${labelSuffix}`);
      addCandidate('c' + rest, `active nasal ny- restored to c${labelSuffix}`);
    } else if (s.startsWith('ng') && s.length > 2) {
      const rest = s.slice(2);
      addCandidate('k' + rest, `active nasal ng- restored to k${labelSuffix}`);
      addCandidate(rest, `active nasal ng- stripped (vowel root)${labelSuffix}`);
    } else if (s.startsWith('n') && s.length > 1 && !s.startsWith('ny') && !s.startsWith('ng')) {
      const rest = s.slice(1);
      addCandidate('t' + rest, `active nasal n- restored to t${labelSuffix}`);
    } else if (s.startsWith('m') && s.length > 1) {
      const rest = s.slice(1);
      addCandidate('p' + rest, `active nasal m- restored to p${labelSuffix}`);
      addCandidate('w' + rest, `active nasal m- restored to w${labelSuffix}`);
    }

    if (s.startsWith('di') && s.length > 2) {
      const rest = s.slice(2);
      addCandidate(rest, `passive prefix di- stripped${labelSuffix}`);
    }
  };

  analyzePrefixes(word, '');

  if (stem !== word) {
    analyzePrefixes(stem, suffixStripped);
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getSomaliMorphologyCandidates(input: string): MorphologyCandidate[] {
  const word = normalizeMorphologyInput(input);
  if (word.length < 2) return [];

  const candidates: MorphologyCandidate[] = [];

  const addCandidate = (w: string, desc: string) => {
    if (w.length >= 2 && w !== word) {
      candidates.push(createCandidate(w, desc));
    }
  };

  const longSuffixes = ['kaas', 'taas', 'kiis', 'tiis', 'keed', 'teed', 'kiina', 'tiina'];
  let stem = word;
  for (const suff of longSuffixes) {
    if (word.endsWith(suff) && word.length > suff.length + 2) {
      stem = word.slice(0, -suff.length);
      addCandidate(stem, `demonstrative/possessive suffix -${suff} stripped`);
      break;
    }
  }

  const definiteSuffixes = [
    'ga', 'gi', 'gu',
    'ka', 'ki', 'ku',
    'xa', 'xi', 'xu',
    'da', 'di', 'du',
    'ta', 'ti', 'tu',
    'sha', 'shi', 'shu'
  ];
  for (const suff of definiteSuffixes) {
    if (stem.endsWith(suff) && stem.length > suff.length + 2) {
      const nextStem = stem.slice(0, -suff.length);
      addCandidate(nextStem, `definite article -${suff} stripped`);
      
      if (nextStem.length > 2 && nextStem[nextStem.length - 1] === nextStem[nextStem.length - 2]) {
        addCandidate(nextStem.slice(0, -1), `definite article -${suff} stripped and letter dedoubled`);
      }
      break;
    }
  }

  const pluralSuffixes = ['yaal', 'oyin', 'o'];
  for (const suff of pluralSuffixes) {
    if (word.endsWith(suff) && word.length > suff.length + 2) {
      const nextStem = word.slice(0, -suff.length);
      addCandidate(nextStem, `plural suffix -${suff} stripped`);
      
      if (suff === 'o' && nextStem.endsWith('y') && nextStem.length > 2) {
        addCandidate(nextStem.slice(0, -1) + 'i', `plural -yo stripped and replaced with -i`);
      }
      break;
    }
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getBurmeseMorphologyCandidates(input: string): MorphologyCandidate[] {
  // Burmese is an isolating language, no morphology candidates are needed.
  return [];
}

function getTibetanMorphologyCandidates(input: string): MorphologyCandidate[] {
  const candidates: MorphologyCandidate[] = [];
  const word = input.trim();

  // Common Tibetan case particles/clitics:
  // ཀྱིས་ (kyis), གྱིས་ (gyis), ཀྱི་ (kyi), གྱི་ (gyi), ཡིས་ (yis), ཡི་ (yi), ལས་ (las), ནས་ (nas), ལ (la), ན (na)
  const particles = ['ཀྱིས་', 'གྱིས་', 'ཀྱི་', 'གྱི་', 'ཡིས་', 'ཡི་', 'ལས་', 'ནས་', 'ལ', 'ན'];

  for (const part of particles) {
    if (word.endsWith(part) && word.length > part.length) {
      let stem = word.slice(0, -part.length);
      if (stem.endsWith('་')) {
        stem = stem.slice(0, -1);
      }
      if (stem.length > 0) {
        candidates.push({
          word: stem,
          label: stem,
          reason: `stripped particle ${part}`,
        });
      }
    }
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}

function getYorubaMorphologyCandidates(input: string): MorphologyCandidate[] {
  const candidates: MorphologyCandidate[] = [];
  const word = input.trim();

  // Strip tone marks to get base letters
  const base = word.normalize('NFD').replace(/[\u0300\u0301]/g, '').normalize('NFC').toLowerCase();

  if (base !== word.toLowerCase()) {
    candidates.push({
      word: base,
      label: base,
      reason: 'tone-insensitive base form',
    });
  }

  // Common Yoruba nominalizing prefixes: i-, a-, o-, e-
  const prefixes = ['i', 'a', 'o', 'e'];
  for (const prefix of prefixes) {
    if (base.startsWith(prefix) && base.length > prefix.length + 1) {
      const stem = base.slice(prefix.length);
      candidates.push({
        word: stem,
        label: stem,
        reason: `stripped prefix ${prefix}-`,
      });
    }
  }

  return uniqueCandidates(candidates, word).slice(0, 5);
}
