// Turns a CSV/TSV glossary file (two columns: term, translation) into lines for the
// Specialized Translation glossary editor.
import { parseDelimitedRows } from './csvImport';
import { parseGlossaryText } from './glossaryMatching';
import { extractDocxReaderText, extractPdfReaderText } from './readerImport';
import { nativePdfExtractionBridge } from './pdfWebViewExtraction';

const HEADER_NAMES = new Set(['term', 'source', 'source term', 'word', 'thuật ngữ', 'thuat ngu', 'từ', 'english', 'en']);

export function glossaryLinesFromDelimitedText(text: string) {
  const rows = parseDelimitedRows(text.replace(/^﻿/, ''));
  const lines: string[] = [];
  let skippedRows = 0;

  rows.forEach((row, index) => {
    const cells = row.map((cell) => cell.replace(/\s+/g, ' ').trim());
    const [sourceTerm = '', targetTerm = ''] = cells;
    if (index === 0 && HEADER_NAMES.has(sourceTerm.toLocaleLowerCase())) return;
    // Arrows or tabs inside a cell would split the editor line differently, so such rows are skipped.
    if (!sourceTerm || !targetTerm || /→|->/.test(sourceTerm) || /→|->/.test(targetTerm)) {
      skippedRows += 1;
      return;
    }
    lines.push(`${sourceTerm} → ${targetTerm}`);
  });

  return { lines, skippedRows };
}

// Appends imported lines after the current glossary; on duplicates the existing entry wins.
export function mergeGlossaryText(current: string, importedLines: string[]) {
  const existing = new Set(parseGlossaryText(current).terms.map((term) => term.sourceTerm.toLocaleLowerCase()));
  const added = importedLines.filter((line) => {
    const key = line.split(' → ')[0].toLocaleLowerCase();
    if (existing.has(key)) return false;
    existing.add(key);
    return true;
  });
  const base = current.trimEnd();
  return { addedCount: added.length, text: [base, ...added].filter(Boolean).join('\n') };
}

// Glossary text from a DOCX or PDF: two-column tables (DOCX rows arrive as "term | translation") and
// "term → translation" / "term -> translation" / tab-separated lines. Prose lines are ignored.
export function glossaryLinesFromDocumentText(text: string) {
  const lines: string[] = [];
  let skippedRows = 0;
  let isFirstRow = true;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    let cells: string[] | null = null;
    if (/→|->/.test(line)) cells = line.split(/\s*(?:→|->)\s*/);
    else if (line.includes('\t')) cells = line.split('\t');
    else if (line.includes(' | ')) cells = line.split(' | ');
    if (!cells) continue;

    const [sourceTerm = '', targetTerm = ''] = cells.map((cell) => cell.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (isFirstRow && HEADER_NAMES.has(sourceTerm.toLocaleLowerCase())) {
      isFirstRow = false;
      continue;
    }
    isFirstRow = false;
    if (!sourceTerm || !targetTerm || cells.filter((cell) => cell.trim()).length > 2) {
      skippedRows += 1;
      continue;
    }
    lines.push(`${sourceTerm} → ${targetTerm}`);
  }

  return { lines, skippedRows };
}

export type GlossaryFileKind = 'delimited' | 'docx' | 'pdf';

export function getGlossaryFileKind(fileName: string, mimeType = ''): GlossaryFileKind {
  const name = fileName.toLocaleLowerCase();
  if (name.endsWith('.docx') || mimeType.includes('wordprocessingml')) return 'docx';
  if (name.endsWith('.pdf') || mimeType.includes('pdf')) return 'pdf';
  return 'delimited';
}

// Reads a picked glossary file of any supported kind into editor lines.
export async function glossaryLinesFromFile(
  file: { arrayBuffer: () => Promise<ArrayBuffer>; text: () => Promise<string> },
  fileName: string,
  mimeType = '',
  { isWeb = process.env.EXPO_OS === 'web' }: { isWeb?: boolean } = {}
) {
  const kind = getGlossaryFileKind(fileName, mimeType);
  if (kind === 'delimited') return glossaryLinesFromDelimitedText(await file.text());
  const buffer = await file.arrayBuffer();
  const text = kind === 'docx'
    ? await extractDocxReaderText(buffer)
    : isWeb ? await extractPdfReaderText(buffer) : await nativePdfExtractionBridge.extract(buffer);
  return glossaryLinesFromDocumentText(text);
}
