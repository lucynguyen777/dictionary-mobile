import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureDir = join(repoRoot, 'tests', 'fixtures', 'reader-pdf');

mkdirSync(fixtureDir, { recursive: true });

const fixtures = [
  {
    fileName: 'digital-simple.pdf',
    title: 'Reader PDF Simple Fixture',
    lines: ['Reader PDF Simple Fixture', 'This digital PDF contains selectable text for Reader import tests.'],
  },
  {
    fileName: 'digital-multiline.pdf',
    title: 'Reader PDF Multiline Fixture',
    lines: [
      'Reader PDF Multiline Fixture',
      'First paragraph keeps readable line order.',
      'Second paragraph checks line wrapping and paragraph joining.',
      'Final line confirms extraction reaches the end of the page.',
    ],
  },
  {
    fileName: 'digital-columns.pdf',
    title: 'Reader PDF Columns Fixture',
    lines: [
      'Left column heading',
      'Left column body line one.',
      'Left column body line two.',
      'Right column heading',
      'Right column body line one.',
      'Right column body line two.',
    ],
    columns: true,
  },
  {
    fileName: 'empty.pdf',
    title: 'Reader PDF Empty Fixture',
    lines: [],
  },
  {
    fileName: 'scanned-image.pdf',
    title: 'Reader PDF Image Only Fixture',
    lines: [],
    imageOnly: true,
  },
];

for (const fixture of fixtures) {
  writeFileSync(join(fixtureDir, fixture.fileName), createPdf(fixture));
}

function createPdf({
  title,
  lines,
  columns = false,
  imageOnly = false,
}) {
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>');
  const pagesId = addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  const pageId = addObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const content = createPageContent(lines, { columns, imageOnly });
  addObject(`<< /Length ${Buffer.byteLength(content, 'ascii')} >>\nstream\n${content}\nendstream`);
  addObject(`<< /Title (${escapePdfText(title)}) /Producer (Dictionary Mobile fixture generator) >>`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info 6 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  if (pagesId !== 2 || pageId !== 3) {
    throw new Error('Unexpected fixture object id layout.');
  }

  return pdf;
}

function createPageContent(lines, { columns, imageOnly }) {
  if (imageOnly) {
    return [
      '0.94 0.94 0.94 rg',
      '72 220 468 360 re',
      'f',
      '0.75 0.75 0.75 rg',
      '110 300 388 8 re',
      'f',
      '110 340 388 8 re',
      'f',
      '110 380 388 8 re',
      'f',
    ].join('\n');
  }

  if (!lines.length) return '';

  if (columns) {
    const left = lines.slice(0, 3);
    const right = lines.slice(3);

    return [
      'BT',
      '/F1 14 Tf',
      '72 700 Td',
      ...left.flatMap((line, index) => [
        index ? '0 -24 Td' : '',
        `(${escapePdfText(line)}) Tj`,
      ]).filter(Boolean),
      '240 48 Td',
      ...right.flatMap((line, index) => [
        index ? '0 -24 Td' : '',
        `(${escapePdfText(line)}) Tj`,
      ]).filter(Boolean),
      'ET',
    ].join('\n');
  }

  return [
    'BT',
    '/F1 14 Tf',
    '72 720 Td',
    ...lines.flatMap((line, index) => [
      index ? '0 -28 Td' : '',
      `(${escapePdfText(line)}) Tj`,
    ]).filter(Boolean),
    'ET',
  ].join('\n');
}

function escapePdfText(value) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
