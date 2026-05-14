export type VocabularyImportRow = {
  word: string;
  definition: string;
  ipa: string;
  note: string;
  tags: string[];
};

export type CsvParseResult = {
  rows: VocabularyImportRow[];
  errors: string[];
};

const headerAliases = {
  word: ['word', 'term', 'vocabulary'],
  definition: ['definition', 'meaning', 'nghia', 'nghĩa'],
  ipa: ['ipa', 'phonetic', 'pronunciation'],
  note: ['note', 'notes', 'ghi chu', 'ghi chú'],
  tags: ['tags', 'tag', 'topic', 'topics'],
};

export function parseVocabularyCsv(csv: string): CsvParseResult {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) return { rows: [], errors: ['CSV cần có header và ít nhất một dòng dữ liệu.'] };

  const headers = rows[0].map(normalizeHeader);
  const wordIndex = findHeaderIndex(headers, headerAliases.word);
  if (wordIndex < 0) return { rows: [], errors: ['CSV cần có cột word.'] };

  const definitionIndex = findHeaderIndex(headers, headerAliases.definition);
  const ipaIndex = findHeaderIndex(headers, headerAliases.ipa);
  const noteIndex = findHeaderIndex(headers, headerAliases.note);
  const tagsIndex = findHeaderIndex(headers, headerAliases.tags);
  const errors: string[] = [];
  const vocabularyRows = rows.slice(1).flatMap((row, index) => {
    const word = getCell(row, wordIndex).trim().toLowerCase();
    if (!word) {
      errors.push(`Dòng ${index + 2} bị bỏ qua vì thiếu word.`);
      return [];
    }

    return [
      {
        word,
        definition: getCell(row, definitionIndex).trim(),
        ipa: getCell(row, ipaIndex).trim(),
        note: getCell(row, noteIndex).trim(),
        tags: getCell(row, tagsIndex).split('|').map((tag) => tag.trim()).filter(Boolean),
      },
    ];
  });

  return { rows: vocabularyRows, errors };
}

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);

  return rows;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.includes(header));
}

function getCell(row: string[], index: number) {
  if (index < 0) return '';

  return row[index] ?? '';
}

