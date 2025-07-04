-- Create user_uploads table to store all user uploaded content
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

-- Create indexes for performance
CREATE INDEX idx_user_uploads_user_id ON public.user_uploads(user_id);
CREATE INDEX idx_user_uploads_type ON public.user_uploads(type);
CREATE INDEX idx_user_uploads_created_at ON public.user_uploads(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_uploads ENABLE ROW LEVEL SECURITY;

-- Users can view their own uploads
CREATE POLICY "Users can view own uploads" ON public.user_uploads
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own uploads
CREATE POLICY "Users can insert own uploads" ON public.user_uploads
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own uploads
CREATE POLICY "Users can update own uploads" ON public.user_uploads
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own uploads" ON public.user_uploads
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE TRIGGER update_user_uploads_updated_at BEFORE UPDATE ON public.user_uploads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to get or create guest uploads
CREATE OR REPLACE FUNCTION public.get_guest_uploads(p_guest_id TEXT)
RETURNS TABLE (
    id UUID,
    type TEXT,
    name TEXT,
    url TEXT,
    thumbnail_url TEXT,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- For guests, we'll use localStorage to store their uploads
    -- This function is just a placeholder for consistency
    RETURN QUERY
    SELECT 
        NULL::UUID as id,
        NULL::TEXT as type,
        NULL::TEXT as name,
        NULL::TEXT as url,
        NULL::TEXT as thumbnail_url,
        NULL::JSONB as metadata
    WHERE FALSE; -- Return empty result set
END;
$$;