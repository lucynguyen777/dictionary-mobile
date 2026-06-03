import { describe, expect, it, vi } from 'vitest';

import { createOcrLookupSuggestions, runOcrEngine } from '../data/ocr';
import { createOcrProviderRegistry } from '../data/ocrProviderRegistry';
import { ChandraOCRProvider, mapChandraResponseToOcrResult } from '../data/providers/ChandraOCRProvider';
import {
  classifyPdfForReaderImport,
  extractPdfReaderDocument,
  extractReaderTextFromOcrResult,
} from '../data/readerImport';

describe('Chandra OCR provider integration', () => {
  it('registers Chandra alongside MLKit without replacing the OCR engine contract', async () => {
    const chandra = new ChandraOCRProvider({
      isAvailable: () => true,
      recognizeImage: async () => ({
        markdown: '# Lecture Notes\n\narticulate clearly',
        pages: [
          {
            pageNumber: 1,
            blocks: [
              {
                text: 'articulate clearly',
                confidence: 0.91,
                lines: [{ text: 'articulate clearly', confidence: 0.92 }],
              },
            ],
          },
        ],
      }),
    });
    const registry = createOcrProviderRegistry({ chandraClient: undefined });
    const providerIds = registry.list().map((provider) => provider.id);

    expect(providerIds).toEqual(['mlkit', 'chandra', 'deterministic-fixture', 'native-ocr-unavailable']);
    expect(await runOcrEngine(chandra, { imageUri: 'file:///scan.png', languageCode: 'en' })).toMatchObject({
      engine: 'native',
      imageUri: 'file:///scan.png',
      languageCode: 'en',
      text: 'Lecture Notes\narticulate clearly',
    });
  });

  it('maps Chandra responses to OCR lookup candidates', () => {
    const result = mapChandraResponseToOcrResult(
      {
        pages: [
          { pageNumber: 1, markdown: 'research paper\ncomplex table' },
          { pageNumber: 2, text: 'vocabulary mining' },
        ],
      },
      { imageUri: 'file:///paper-page.png', languageCode: 'en' }
    );

    expect(result.engine).toBe('native');
    expect(result.blocks).toHaveLength(3);
    expect(createOcrLookupSuggestions(result)).toContain('research paper complex table vocabulary mining');
  });

  it('keeps Chandra unavailable until a service client is injected', async () => {
    const registry = createOcrProviderRegistry({ defaultProviderId: 'chandra' });
    const chandra = registry.select('chandra');

    expect(await chandra.isAvailable()).toBe(false);
    await expect(runOcrEngine(chandra, { imageUri: 'file:///scan.png', languageCode: 'en' })).rejects.toThrow(
      'requires a dev-client/native runtime'
    );
  });

  it('classifies digital PDFs before OCR and does not OCR extractable text', async () => {
    const ocrParser = vi.fn(async () => ({ markdown: 'should not run' }));
    const rawContent = new ArrayBuffer(4);
    const parser = vi.fn(async () => 'Digital PDF text');

    await expect(classifyPdfForReaderImport(rawContent, parser)).resolves.toEqual({
      kind: 'digital',
      text: 'Digital PDF text',
    });

    const result = await extractPdfReaderDocument('paper.pdf', rawContent, parser, { ocrParser });

    expect(result.content).toBe('Digital PDF text');
    expect(ocrParser).not.toHaveBeenCalled();
  });

  it('imports image-based PDFs through an injected Chandra OCR parser into normal Reader text', async () => {
    const rawContent = new ArrayBuffer(4);
    const result = await extractPdfReaderDocument(
      'scanned-lecture.pdf',
      rawContent,
      async () => '',
      {
        ocrParser: async ({ fileName }) => ({
          markdown: '# Scanned Lecture\n\nhighlight lookup save flashcard',
          pages: [{ pageNumber: 1, text: `OCR from ${fileName}` }],
          metadata: { provider: 'chandra' },
        }),
      }
    );

    expect(result).toEqual({
      title: 'scanned-lecture',
      content: 'Scanned Lecture\nhighlight lookup save flashcard',
      sourceFormat: 'pdf',
    });
    expect(extractReaderTextFromOcrResult({ pages: [{ markdown: 'Reader\n\nvocabulary mining' }] })).toBe(
      'Reader\nvocabulary mining'
    );
  });
});
