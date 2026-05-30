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