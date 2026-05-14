export type VocabularyImportRow = {
  word: string;
  definition: string;
  ipa: string;
  note: string;
  tags: string[];
};

export type VocabularyImportField = keyof VocabularyImportRow;
export type VocabularyImportOrientation = 'rows' | 'columns';

export type VocabularyImportOptions = {
  orientation: VocabularyImportOrientation;
  hasHeader: boolean;
  primaryField: VocabularyImportField;
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

const defaultFieldOrder: VocabularyImportField[] = ['word', 'definition', 'ipa', 'note', 'tags'];

const defaultImportOptions: VocabularyImportOptions = {
  orientation: 'rows',
  hasHeader: true,
  primaryField: 'word',
};

export function parseVocabularyCsv(csv: string, options: Partial<VocabularyImportOptions> = {}): CsvParseResult {
  const importOptions = { ...defaultImportOptions, ...options };
  const rows = parseCsvRows(csv);
  if (!rows.length) return { rows: [], errors: ['CSV đang trống.'] };

  if (importOptions.orientation === 'columns') {
    return parseColumnOrientedCsvRows(rows, importOptions);
  }

  return parseRowOrientedCsvRows(rows, importOptions);
}

function parseRowOrientedCsvRows(rows: string[][], options: VocabularyImportOptions): CsvParseResult {
  if (options.hasHeader && rows.length < 2) {
    return { rows: [], errors: ['CSV cần có header và ít nhất một dòng dữ liệu.'] };
  }

  const headers = options.hasHeader ? rows[0].map(normalizeHeader) : [];
  const fieldIndexes = getRowFieldIndexes(headers, options.hasHeader);
  const wordIndex = fieldIndexes.word;
  const primaryIndex = fieldIndexes[options.primaryField];
  if (options.hasHeader && wordIndex < 0 && primaryIndex < 0) {
    return { rows: [], errors: [`CSV cần có cột word hoặc cột khóa chính ${options.primaryField}.`] };
  }

  const errors: string[] = [];
  const dataRows = options.hasHeader ? rows.slice(1) : rows;
  const rowOffset = options.hasHeader ? 2 : 1;
  const vocabularyRows = dataRows.flatMap((row, index) => {
    const primaryValue = getCell(row, primaryIndex).trim();
    const rawWord = getCell(row, wordIndex).trim() || primaryValue;
    const word = normalizeWord(rawWord);
    if (!word || !primaryValue) {
      errors.push(`Dòng ${index + rowOffset} bị bỏ qua vì thiếu ${options.primaryField}.`);
      return [];
    }

    return [
      {
        word,
        definition: getCell(row, fieldIndexes.definition).trim(),
        ipa: getCell(row, fieldIndexes.ipa).trim(),
        note: getCell(row, fieldIndexes.note).trim(),
        tags: parseTags(getCell(row, fieldIndexes.tags)),
      },
    ];
  });

  return finalizeParseResult(vocabularyRows, errors);
}

function parseColumnOrientedCsvRows(rows: string[][], options: VocabularyImportOptions): CsvParseResult {
  const dataRows = options.hasHeader ? rows.slice(1) : rows;
  if (!dataRows.length) return { rows: [], errors: ['CSV đọc theo cột cần ít nhất một dòng dữ liệu.'] };

  const fieldRowIndexes = getColumnFieldRowIndexes(dataRows, options.hasHeader);
  const wordRowIndex = fieldRowIndexes.word;
  const primaryRowIndex = fieldRowIndexes[options.primaryField];
  if (wordRowIndex < 0 && primaryRowIndex < 0) {
    return { rows: [], errors: [`CSV đọc theo cột cần hàng word hoặc hàng khóa chính ${options.primaryField}.`] };
  }

  const maxColumnCount = Math.max(...dataRows.map((row) => row.length));
  const errors: string[] = [];
  const vocabularyRows: VocabularyImportRow[] = [];

  const firstDataColumnIndex = options.hasHeader ? 1 : 0;

  for (let columnIndex = firstDataColumnIndex; columnIndex < maxColumnCount; columnIndex += 1) {
    const primaryValue = getCell(dataRows[primaryRowIndex] ?? [], columnIndex).trim();
    const rawWord = getCell(dataRows[wordRowIndex] ?? [], columnIndex).trim() || primaryValue;
    const word = normalizeWord(rawWord);

    if (!word || !primaryValue) {
      errors.push(`Cột ${columnIndex + 1} bị bỏ qua vì thiếu ${options.primaryField}.`);
      continue;
    }

    vocabularyRows.push({
      word,
      definition: getCell(dataRows[fieldRowIndexes.definition] ?? [], columnIndex).trim(),
      ipa: getCell(dataRows[fieldRowIndexes.ipa] ?? [], columnIndex).trim(),
      note: getCell(dataRows[fieldRowIndexes.note] ?? [], columnIndex).trim(),
      tags: parseTags(getCell(dataRows[fieldRowIndexes.tags] ?? [], columnIndex)),
    });
  }

  return finalizeParseResult(vocabularyRows, errors);
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

function getRowFieldIndexes(headers: string[], hasHeader: boolean): Record<VocabularyImportField, number> {
  if (!hasHeader) {
    return defaultFieldOrder.reduce(
      (indexes, field, index) => ({
        ...indexes,
        [field]: index,
      }),
      {} as Record<VocabularyImportField, number>
    );
  }

  return {
    word: findHeaderIndex(headers, headerAliases.word),
    definition: findHeaderIndex(headers, headerAliases.definition),
    ipa: findHeaderIndex(headers, headerAliases.ipa),
    note: findHeaderIndex(headers, headerAliases.note),
    tags: findHeaderIndex(headers, headerAliases.tags),
  };
}

function getColumnFieldRowIndexes(rows: string[][], hasHeader: boolean): Record<VocabularyImportField, number> {
  if (!hasHeader) {
    return defaultFieldOrder.reduce(
      (indexes, field, index) => ({
        ...indexes,
        [field]: index,
      }),
      {} as Record<VocabularyImportField, number>
    );
  }

  const headers = rows.map((row) => normalizeHeader(row[0] ?? ''));

  return {
    word: findHeaderIndex(headers, headerAliases.word),
    definition: findHeaderIndex(headers, headerAliases.definition),
    ipa: findHeaderIndex(headers, headerAliases.ipa),
    note: findHeaderIndex(headers, headerAliases.note),
    tags: findHeaderIndex(headers, headerAliases.tags),
  };
}

function normalizeWord(value: string) {
  return value.trim().toLowerCase();
}

function parseTags(value: string) {
  return value
    .split(/[|,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function finalizeParseResult(rows: VocabularyImportRow[], errors: string[]): CsvParseResult {
  const duplicateWords = findDuplicateWords(rows);

  if (duplicateWords.length) {
    errors.push(
      `Có ${duplicateWords.length} từ bị trùng và sẽ được gộp khi import: ${duplicateWords.slice(0, 5).join(', ')}${
        duplicateWords.length > 5 ? '...' : ''
      }.`
    );
  }

  if (!rows.length && !errors.length) {
    errors.push('Không tìm thấy từ hợp lệ trong file.');
  }

  return { rows, errors };
}

function findDuplicateWords(rows: VocabularyImportRow[]) {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    counts.set(row.word, (counts.get(row.word) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([word]) => word);
}
