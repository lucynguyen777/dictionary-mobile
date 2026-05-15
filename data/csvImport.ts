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
  fieldMapping?: Record<number, VocabularyImportField | 'ignore'>;
};

export type CsvParseResult = {
  rows: VocabularyImportRow[];
  errors: string[];
  headers?: string[];
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

  const headers = options.hasHeader ? rows[0].map((v) => v.trim()) : rows[0]?.map((_, index) => `Cột ${index + 1}`) ?? [];
  const fieldIndexes = getRowFieldIndexes(headers.map(normalizeHeader), options.hasHeader, options.fieldMapping);
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

  return { ...finalizeParseResult(vocabularyRows, errors), headers };
}

function parseColumnOrientedCsvRows(rows: string[][], options: VocabularyImportOptions): CsvParseResult {
  const dataRows = options.hasHeader ? rows.slice(1) : rows;
  if (!dataRows.length) return { rows: [], errors: ['CSV đọc theo cột cần ít nhất một dòng dữ liệu.'] };

  const headers = options.hasHeader ? dataRows.map((row) => (row[0] ?? '').trim()) : dataRows.map((_, index) => `Hàng ${index + 1}`);
  const fieldRowIndexes = getColumnFieldRowIndexes(dataRows, options.hasHeader, options.fieldMapping);
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

  return { ...finalizeParseResult(vocabularyRows, errors), headers };
}

function parseCsvRows(csv: string) {
  const delimiter = detectDelimiter(csv);
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

    if (char === delimiter && !inQuotes) {
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

function detectDelimiter(text: string) {
  const firstDataLine = text.split(/\r?\n/).find((line) => line.trim()) ?? '';
  const tabCount = (firstDataLine.match(/\t/g) ?? []).length;
  const commaCount = (firstDataLine.match(/,/g) ?? []).length;

  return tabCount > commaCount ? '\t' : ',';
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

function getRowFieldIndexes(
  headers: string[],
  hasHeader: boolean,
  fieldMapping?: Record<number, VocabularyImportField | 'ignore'>
): Record<VocabularyImportField, number> {
  if (!hasHeader) {
    const indexes = defaultFieldOrder.reduce(
      (indexes, field, index) => ({
        ...indexes,
        [field]: index,
      }),
      {} as Record<VocabularyImportField, number>
    );

    return applyImportFieldMapping(indexes, fieldMapping);
  }

  const indexes: Record<VocabularyImportField, number> = {
    word: -1,
    definition: -1,
    ipa: -1,
    note: -1,
    tags: -1,
  };

  const mappedIndexes = applyImportFieldMapping(indexes, fieldMapping);

  // fallback to auto-detection for unmapped fields
  defaultFieldOrder.forEach((field) => {
    if (mappedIndexes[field] >= 0) return;

    mappedIndexes[field] = findHeaderIndex(headers, headerAliases[field]);
  });

  return mappedIndexes;
}

function getColumnFieldRowIndexes(
  rows: string[][],
  hasHeader: boolean,
  fieldMapping?: Record<number, VocabularyImportField | 'ignore'>
): Record<VocabularyImportField, number> {
  if (!hasHeader) {
    const indexes = defaultFieldOrder.reduce(
      (indexes, field, index) => ({
        ...indexes,
        [field]: index,
      }),
      {} as Record<VocabularyImportField, number>
    );

    return applyImportFieldMapping(indexes, fieldMapping);
  }

  const headers = rows.map((row) => normalizeHeader(row[0] ?? ''));

  const indexes: Record<VocabularyImportField, number> = {
    word: -1,
    definition: -1,
    ipa: -1,
    note: -1,
    tags: -1,
  };

  const mappedIndexes = applyImportFieldMapping(indexes, fieldMapping);

  defaultFieldOrder.forEach((field) => {
    if (mappedIndexes[field] >= 0) return;

    mappedIndexes[field] = findHeaderIndex(headers, headerAliases[field]);
  });

  return mappedIndexes;
}

function applyImportFieldMapping(
  indexes: Record<VocabularyImportField, number>,
  fieldMapping?: Record<number, VocabularyImportField | 'ignore'>
) {
  if (!fieldMapping) return indexes;

  const nextIndexes = { ...indexes };

  Object.entries(fieldMapping).forEach(([key, value]) => {
    const index = Number(key);
    if (value !== 'ignore') nextIndexes[value] = index;
  });

  return nextIndexes;
}

export function detectHeaderFieldMapping(headers: string[]): Record<number, VocabularyImportField | 'ignore'> {
  const mapping: Record<number, VocabularyImportField | 'ignore'> = {};

  headers.forEach((header, index) => {
    const norm = normalizeHeader(header);
    let found: VocabularyImportField | 'ignore' = 'ignore';

    for (const field of defaultFieldOrder) {
      if (headerAliases[field].includes(norm)) {
        found = field;
        break;
      }
    }

    mapping[index] = found;
  });

  return mapping;
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
