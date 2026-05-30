# Specialized Translation Dataset Agents Plan

This plan turns the accepted RAG-grounded translation dataset and per-user agent requirements into implementation-ready specifications, ensuring a strict boundary between user workspace features and encrypted backend/AI proxies.

---

## 1. Overview & Objectives

- **Context-Grounded (RAG) Agents**: In the MVP, "training an agent" refers strictly to creating a dataset-grounded RAG context agent. It does **not** fine-tune an OpenAI model or create a custom model per user.
- **Credential Separation**: Users may provide their own API credentials through encrypted backend storage (using GCM envelopes). The Expo app must never bundle or display plain user API keys.
- **Product Scope**: Dictionary Mobile provides the workspace, dataset editor, retrieval/indexing layer, prompt/context setup, and provider-call guardrails.

---

## 2. Dataset Upload Contract

### Accepted Formats & Parsing Strategy

| Format | Parsing Strategy / Engine | Size Limit |
| :--- | :--- | :--- |
| **CSV / TSV** | Parser: `papaparse` or simple stream-based JS parser. Splitting by comma/tab. | Max 5MB |
| **XLS / XLSX** | Parser: `xlsx` (SheetJS) light. Extract first sheet rows or allow sheet selection. | Max 5MB |
| **TXT** | Split by lines or custom paragraph/sentence breaks. | Max 2MB |
| **Markdown** | Extract headings, lists, tables, and paragraphs. | Max 2MB |
| **JSON** | Bounded array validation (matching dataset schema). | Max 5MB |
| **DOCX** | Parser: `mammoth` (HTML/plain text extraction without layout styling). | Max 10MB |
| **PDF (Text-Extractable)** | Parser: `pdfjs-dist` (extracting text layers segment-by-segment). | Max 10MB |

### Out of Scope / Quarantined Formats
- Scanned PDF (no text layer; requires OCR pipeline).
- Image-only formats (JPEG, PNG, TIFF, WebP).
- Audio / Video formats (MP3, WAV, MP4).
- Remote document URLs or live integrations (Google Docs URLs, OneDrive URLs) that would bypass local parsing.
- Arbitrary executable code / macros (embedded in XLS/DOCX).

---

## 3. Editable Dataset Model

Every dataset entry represents a mapping between source segment/term and its translated counterpart.

```typescript
export interface DatasetEntry {
  id: string; // UUID
  userId: string;
  datasetId: string;
  sourceText: string; // Left hand text (e.g., source term/phrase)
  targetText: string; // Right hand text (translation)
  type: 'term' | 'phrase' | 'sentence' | 'paragraph' | 'note';
  domainId?: string; // Optional domain categorization
  tags: string[]; // User tags for filtering
  confidence: number; // 0.0 to 1.0 (rating of translation quality)
  sourceDocumentId?: string; // Originating parsed file if applicable
  
  // Validation & Conflict states
  validationState: 'valid' | 'empty' | 'duplicate' | 'conflict' | 'error';
  conflictWithId?: string; // Refers to the other conflicting entry ID
  
  // Auditing & Status
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // Soft delete timestamp
  
  // Local-only revision marker (simple stack for undo/redo)
  revisionHistory?: Array<{
    timestamp: string;
    sourceText: string;
    targetText: string;
  }>;
}
```

---

## 4. Smart Recognition & Highlighting

To maximize efficiency and respect user privacy, the local app handles smart recognition using a fast client-side matcher before making backend or AI requests.

### Matcher Mechanics
1. **Normalization**: Trim whitespace, convert to lowercase, remove punctuation for matching purposes while keeping the original string index offsets intact.
2. **Longest Match First**: When spans overlap (e.g., matching "machine learning" vs "machine"), the matcher selects the longest span to prevent redundant or noisy highlights.
3. **Spans & Highlights**:
   - Returns a structured array of indices: `[{ start: number, end: number, entryId: string, type: 'match' | 'conflict' | 'missing' }]`.
4. **Interactive UI**:
   - Source text is rendered in a rich text surface where matched spans are wrapped in clickable highlights.
   - Click/tap on highlights opens a **Terminology Chip** showing the translation, confidence, tags, and domain.
   - **Conflict Warnings**: If a term matches multiple entries with differing translations, highlight in orange/red with a conflict details card.
   - **Glossary Candidates**: Automatically identify repeated terms (frequency > 3) that do not yet exist in the dataset and suggest adding them as new entries.

---

## 5. Per-User Context Agents

Users can create specialized translation/AI assistant agents that act as custom-trained translators using RAG.

- **Agent Limit**: Default `maxAgentsPerUser = 3` active context agents. Additional agents are blocked/staged for a future paid-tier decision.
- **Agent Schema**:
  ```typescript
  export interface TranslationContextAgent {
    id: string; // UUID
    userId: string;
    name: string;
    description?: string;
    isActive: boolean;
    isArchived: boolean;
    
    // RAG Grounding
    datasetIds: string[]; // Connected datasets
    domainId?: string;
    systemInstruction: string; // Customizable base instructions (e.g. "Translate with a medical tone")
    
    // Retrieval Parameters
    retrievalSettings: {
      maxResults: number; // K-nearest or exact matches to pull into context
      matchThreshold: number; // Minimum match score
      mode: 'exact_first' | 'hybrid' | 'rag_always';
    };
    
    // Credentials & Auditing
    userProviderConnectionId?: string; // Binds to encrypted custom credentials
    dailyTokenUsage: number;
    monthlyTokenUsage: number;
    createdAt: string;
    updatedAt: string;
  }
  ```

---

## 6. Editor Environment Modes

The editor serves as the primary workspace for managing and building datasets. It supports mode-specific import/export boundaries:

### Supported Editor Modes
1. **Plain Text Mode**: Lightest mode, simple raw segmentation, line-by-line tabular matching.
2. **Markdown Mode**: Supports standard headings, bullet points, code blocks, and markdown tables.
3. **Word-like Rich Text Mode**: Supports basic bold, italic, underline, list formats, and text alignments.
4. **Google Docs-like Collaborative-Ready Surface (MVP local only)**: Real collaborative live-sync is blocked. The UI behaves as a local-first single-user workspace.
5. **LaTeX Mode**: Structural sections, math equations, bibliographies. 

### Explicit Unsupported / Stubbed States
- **Collaboration**: Shows "Collaboration requires remote workspace synchronization. Upgrade or sync now" (stubbed/blocked).
- **Advanced Word Layouts**: Standard text styling only; multi-column frames, shapes, or complex layout styling are stripped during import.
- **LaTeX Compilation**: Editing LaTeX equations is supported; local compilation to PDF is marked unsupported.
- **Google Docs Live Sync**: Retains manual import/export; live sync is disabled.

---

## 7. Supabase Database Schema

Below is the database migration schema to support this module. RLS (Row Level Security) is enabled on all tables, ensuring strict user isolation.

```sql
-- Up Migration: Specialized Translation Dataset Agents Schema

-- 1. Translation Datasets Table
CREATE TABLE public.translation_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Translation Dataset Entries Table
CREATE TABLE public.translation_dataset_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dataset_id UUID NOT NULL REFERENCES public.translation_datasets(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    entry_type VARCHAR(50) DEFAULT 'term' NOT NULL, -- 'term', 'phrase', 'sentence', 'paragraph', 'note'
    domain_id VARCHAR(100),
    tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    confidence NUMERIC(3, 2) DEFAULT 1.00 CHECK (confidence >= 0.00 AND confidence <= 1.00) NOT NULL,
    source_document_id UUID,
    validation_state VARCHAR(50) DEFAULT 'valid' NOT NULL, -- 'valid', 'empty', 'duplicate', 'conflict', 'error'
    conflict_with_id UUID,
    revision_history JSONB DEFAULT '[]'::JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. Translation Dataset Documents (Tracking uploaded files)
CREATE TABLE public.translation_dataset_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dataset_id UUID NOT NULL REFERENCES public.translation_datasets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Translation Context Agents
CREATE TABLE public.translation_context_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    dataset_ids UUID[] DEFAULT '{}'::UUID[] NOT NULL,
    domain_id VARCHAR(100),
    system_instruction TEXT NOT NULL,
    retrieval_settings JSONB DEFAULT '{"maxResults": 3, "matchThreshold": 0.5, "mode": "exact_first"}'::JSONB NOT NULL,
    user_provider_connection_id UUID,
    daily_token_usage INTEGER DEFAULT 0 NOT NULL,
    monthly_token_usage INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS on all tables
ALTER TABLE public.translation_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_dataset_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_dataset_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_context_agents ENABLE ROW LEVEL SECURITY;

-- 6. Setup RLS Policies (strictly bound by auth.uid())
CREATE POLICY "Users can manage their own datasets" 
    ON public.translation_datasets 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own dataset entries" 
    ON public.translation_dataset_entries 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own dataset documents" 
    ON public.translation_dataset_documents 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own context agents" 
    ON public.translation_context_agents 
    FOR ALL USING (auth.uid() = user_id);
```

---

## 8. Test Expectations & Validation Criteria

To verify safety, robustness, and accuracy in future implementation:

1. **Parser Integrity**: Mock various upload files (CSV, JSON, DOCX) and assert the parsed structure yields exact `sourceText` and `targetText` fields under maximum size thresholds.
2. **Security & Key Boundaries**: Verify no user credentials (API keys) are ever returned to the client in plaintext. Ensure RLS policies reject attempts to read or write other users' data rows.
3. **Local Matcher Correctness**: Assert correct highlight spans when source texts contain nested or overlapping terms (e.g. source: `"The quick brown fox"` matched against keywords `"quick"` and `"quick brown"` returns `"quick brown"` span).
4. **Agent Constraints**: Verify that a user cannot activate more than 3 agents simultaneously. Attempts to activate a 4th agent must throw a validation error.
5. **No Invented Context**: Ensure the RAG prompt engine appends exact dataset matching results without inflating or inventing lexical entries.