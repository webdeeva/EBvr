-- First, let's check what's causing the 500 error
-- It might be conflicting policies

-- Disable RLS temporarily to test
ALTER TABLE public.worlds DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on worlds table
DROP POLICY IF EXISTS "Anyone can view public worlds" ON public.worlds;
DROP POLICY IF EXISTS "Authenticated users can create worlds" ON public.worlds;
DROP POLICY IF EXISTS "Owners can delete their worlds" ON public.worlds;
DROP POLICY IF EXISTS "Owners can update their worlds" ON public.worlds;
DROP POLICY IF EXISTS "Users can create worlds" ON public.worlds;
DROP POLICY IF EXISTS "Users can delete own worlds" ON public.worlds;
DROP POLICY IF EXISTS "Users can update own worlds" ON public.worlds;
DROP POLICY IF EXISTS "Users can view own worlds" ON public.worlds;
DROP POLICY IF EXISTS "Worlds viewable by participants" ON public.worlds;

-- Create simple, non-conflicting policies
-- 1. Users can see their own worlds
CREATE POLICY "Users can view own worlds" ON public.worlds
    FOR SELECT
    USING (auth.uid() = owner_id);

-- 2. Users can see public worlds
CREATE POLICY "Users can view public worlds" ON public.worlds
    FOR SELECT
    USING ((settings->>'is_public')::boolean = true);

-- 3. Users can create worlds
CREATE POLICY "Users can create worlds" ON public.worlds
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- 4. Users can update their own worlds
CREATE POLICY "Users can update own worlds" ON public.worlds
    FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 5. Users can delete their own worlds
CREATE POLICY "Users can delete own worlds" ON public.worlds
    FOR DELETE
    USING (auth.uid() = owner_id);

-- Test query to verify it works
-- This should return your worlds when run from the app
SELECT * FROM worlds WHERE owner_id = 'e055310a-ebb5-4eff-9c9a-c9ad116d7870';