// Turns a CSV/TSV glossary file (two columns: term, translation) into lines for the
// Specialized Translation glossary editor.
import { parseDelimitedRows } from './csvImport';
import { parseGlossaryText } from './glossaryMatching';

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
