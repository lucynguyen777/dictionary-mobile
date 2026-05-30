import { expect, test } from 'vitest';
import {
    buildAgentPrompt,
    canCreateAgent,
    DatasetEntry,
    findDatasetMatches,
    TranslationContextAgent,
} from '../data/datasetAgentRunner';

test('canCreateAgent respects MAX_ACTIVE_AGENTS = 3', () => {
  expect(canCreateAgent(0)).toBe(true);
  expect(canCreateAgent(2)).toBe(true);
  expect(canCreateAgent(3)).toBe(false);
  expect(canCreateAgent(4)).toBe(false);
});

test('findDatasetMatches handles exact simple words', () => {
  const dataset: DatasetEntry[] = [
    {
      id: '1',
      datasetId: 'ds-1',
      sourceText: 'MRI',
      targetText: 'cộng hưởng từ',
      type: 'term',
      tags: [],
      confidence: 1.0,
    },
  ];

  const sourceText = 'The patient underwent an mri scan.';
  const spans = findDatasetMatches(sourceText, dataset);

  expect(spans.length).toBe(1);
  expect(spans[0].sourceText).toBe('MRI');
  expect(spans[0].targetText).toBe('cộng hưởng từ');
});

test('findDatasetMatches handles longest match priority', () => {
  const dataset: DatasetEntry[] = [
    {
      id: '1',
      datasetId: 'ds-1',
      sourceText: 'machine',
      targetText: 'máy móc',
      type: 'term',
      tags: [],
      confidence: 1.0,
    },
    {
      id: '2',
      datasetId: 'ds-1',
      sourceText: 'machine learning',
      targetText: 'học máy',
      type: 'term',
      tags: [],
      confidence: 1.0,
    },
  ];

  const sourceText = 'We study machine learning algorithms.';
  const spans = findDatasetMatches(sourceText, dataset);

  expect(spans.length).toBe(1); // Should only match "machine learning", not "machine"
  expect(spans[0].sourceText).toBe('machine learning');
  expect(spans[0].targetText).toBe('học máy');
});

test('buildAgentPrompt appends glossary properly', () => {
  const agent: TranslationContextAgent = {
    id: 'agent-1',
    name: 'Medical Agent',
    isActive: true,
    datasetIds: ['ds-1'],
    systemInstruction: 'You are a medical translator.',
    retrievalSettings: { maxResults: 10, matchThreshold: 0.8, mode: 'exact_first' },
  };

  const spans = findDatasetMatches('The MRI result is clear.', [
    {
      id: '1',
      datasetId: 'ds-1',
      sourceText: 'MRI',
      targetText: 'cộng hưởng từ',
      type: 'term',
      tags: [],
      confidence: 1.0,
    },
  ]);

  const prompt = buildAgentPrompt(agent, spans);
  expect(prompt).toContain('You are a medical translator.');
  expect(prompt).toContain('IMPORTANT GLOSSARY TERMS TO USE:');
  expect(prompt).toContain('- "MRI" -> "cộng hưởng từ"');
});