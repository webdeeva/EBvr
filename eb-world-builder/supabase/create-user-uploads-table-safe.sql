-- Create user_uploads table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('environment', 'skybox', 'content')),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size BIGINT,
    mime_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON public.user_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_type ON public.user_uploads(type);
CREATE INDEX IF NOT EXISTS idx_user_uploads_created_at ON public.user_uploads(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view own uploads" ON public.user_uploads;
CREATE POLICY "Users can view own uploads" ON public.user_uploads
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own uploads" ON public.user_uploads;
CREATE POLICY "Users can insert own uploads" ON public.user_uploads
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own uploads" ON public.user_uploads;
CREATE POLICY "Users can update own uploads" ON public.user_uploads
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own uploads" ON public.user_uploads;
CREATE POLICY "Users can delete own uploads" ON public.user_uploads
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger only if it doesn't exist
DROP TRIGGER IF EXISTS update_user_uploads_updated_at ON public.user_uploads;
CREATE TRIGGER update_user_uploads_updated_at BEFORE UPDATE ON public.user_uploads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();