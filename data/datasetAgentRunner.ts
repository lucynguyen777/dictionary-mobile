/**
 * Dataset Agent Runner — Local RAG matching and agent validation.
 *
 * Implements the Specialized Translation Dataset Agents Plan:
 * - Smart Recognition & Highlighting (Matcher)
 * - Agent definition validation (≤ 3 active agents limit)
 */

export interface DatasetEntry {
  id: string;
  datasetId: string;
  sourceText: string;
  targetText: string;
  type: 'term' | 'phrase' | 'sentence' | 'paragraph' | 'note';
  domainId?: string;
  tags: string[];
  confidence: number;
}

export interface MatchSpan {
  start: number;
  end: number;
  entryId: string;
  type: 'match' | 'conflict' | 'missing';
  sourceText: string;
  targetText: string;
}

export interface TranslationContextAgent {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  datasetIds: string[];
  domainId?: string;
  systemInstruction: string;
  retrievalSettings: {
    maxResults: number;
    matchThreshold: number;
    mode: 'exact_first' | 'hybrid' | 'rag_always';
  };
}

/**
 * Validates agent creation constraints.
 * Rule: Default maxAgentsPerUser = 3 active context agents.
 */
export function canCreateAgent(activeAgentsCount: number): boolean {
  const MAX_ACTIVE_AGENTS = 3;
  return activeAgentsCount < MAX_ACTIVE_AGENTS;
}

/**
 * Normalizes text for matching (lowercase, removes most punctuation, trims whitespace)
 */
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Smart Matcher
 * 1. Longest match first (sort entries by length descending).
 * 2. Find exact substring index of normalized term within normalized source.
 * 3. Map back to original string spans (naive mapping for MVP: assume word boundaries align).
 */
export function findDatasetMatches(sourceText: string, datasetEntries: DatasetEntry[]): MatchSpan[] {
  if (!sourceText || datasetEntries.length === 0) return [];

  const normalizedSource = normalizeForMatching(sourceText);
  const spans: MatchSpan[] = [];
  const coveredIndices = new Set<number>();

  // Sort entries by length descending to prefer longer phrases over single words
  const sortedEntries = [...datasetEntries].sort((a, b) => b.sourceText.length - a.sourceText.length);

  for (const entry of sortedEntries) {
    const normalizedTerm = normalizeForMatching(entry.sourceText);
    if (!normalizedTerm) continue;

    // We do a simple indexOf loop on the lowercase source
    const lowerSource = sourceText.toLowerCase();
    const lowerTerm = entry.sourceText.toLowerCase();

    let startIndex = lowerSource.indexOf(lowerTerm);
    while (startIndex !== -1) {
      const endIndex = startIndex + lowerTerm.length;

      // Check if this span is already covered by a longer match
      let isCovered = false;
      for (let i = startIndex; i < endIndex; i++) {
        if (coveredIndices.has(i)) {
          isCovered = true;
          break;
        }
      }

      if (!isCovered) {
        // Mark as covered
        for (let i = startIndex; i < endIndex; i++) {
          coveredIndices.add(i);
        }

        spans.push({
          start: startIndex,
          end: endIndex,
          entryId: entry.id,
          type: 'match', // TODO: detect conflicts if needed
          sourceText: entry.sourceText,
          targetText: entry.targetText,
        });
      }

      startIndex = lowerSource.indexOf(lowerTerm, startIndex + 1);
    }
  }

  // Sort spans by start index
  return spans.sort((a, b) => a.start - b.start);
}

/**
 * Build a system prompt enriched with RAG context
 */
export function buildAgentPrompt(agent: TranslationContextAgent, contextSpans: MatchSpan[]): string {
  const baseInstruction = agent.systemInstruction || 'Translate the following text accurately.';

  if (contextSpans.length === 0) {
    return baseInstruction;
  }

  const glossaryLines = contextSpans.map((span) => `- "${span.sourceText}" -> "${span.targetText}"`).join('\n');

  return `${baseInstruction}\n\nIMPORTANT GLOSSARY TERMS TO USE:\n${glossaryLines}`;
}