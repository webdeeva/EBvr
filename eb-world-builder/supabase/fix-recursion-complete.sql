-- First, disable RLS to clear everything
ALTER TABLE public.worlds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_access DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on worlds table
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'worlds'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.worlds', pol.policyname);
    END LOOP;
END $$;

-- Drop ALL existing policies on world_assets table
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'world_assets'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.world_assets', pol.policyname);
    END LOOP;
END $$;

-- Drop ALL existing policies on world_access table
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'world_access'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.world_access', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_access ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for worlds
CREATE POLICY "Enable insert for authenticated users only" ON public.worlds
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Enable select for owners" ON public.worlds
FOR SELECT TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Enable update for owners" ON public.worlds
FOR UPDATE TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Enable delete for owners" ON public.worlds
FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- Add a separate policy for public worlds (no recursion)
CREATE POLICY "Enable read access for public worlds" ON public.worlds
FOR SELECT TO authenticated
USING (
  (settings->>'is_public')::boolean = true 
  AND auth.uid() != owner_id  -- Prevent duplicate with owner policy
);

-- Create simple policies for world_assets (no EXISTS subqueries to avoid recursion)
CREATE POLICY "Enable all for world owners on assets" ON public.world_assets
FOR ALL TO authenticated
USING (
  world_id IN (
    SELECT id FROM public.worlds WHERE owner_id = auth.uid()
  )
);

-- For now, let's make sure you can at least save
-- You can refine these policies later

-- Also, let's check if there are any triggers that might be causing issues
-- List all triggers on these tables (for debugging)
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
AND event_object_table IN ('worlds', 'world_assets', 'world_access');