-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can create their own worlds" ON public.worlds;
DROP POLICY IF EXISTS "Users can view their own worlds" ON public.worlds;
DROP POLICY IF EXISTS "Users can update their own worlds" ON public.worlds;
DROP POLICY IF EXISTS "Users can delete their own worlds" ON public.worlds;
DROP POLICY IF EXISTS "Users can view public worlds" ON public.worlds;

-- Create new policies without recursion

-- Allow users to create worlds
CREATE POLICY "Users can create worlds" ON public.worlds
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Allow users to view their own worlds
CREATE POLICY "Users can view own worlds" ON public.worlds
FOR SELECT 
TO authenticated
USING (auth.uid() = owner_id);

-- Allow users to update their own worlds
CREATE POLICY "Users can update own worlds" ON public.worlds
FOR UPDATE 
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Allow users to delete their own worlds
CREATE POLICY "Users can delete own worlds" ON public.worlds
FOR DELETE 
TO authenticated
USING (auth.uid() = owner_id);

-- Allow anyone to view public worlds (simplified to avoid recursion)
CREATE POLICY "Anyone can view public worlds" ON public.worlds
FOR SELECT 
TO authenticated
USING ((settings->>'is_public')::boolean = true);

-- Fix world_assets policies
DROP POLICY IF EXISTS "Users can create assets for their worlds" ON public.world_assets;
DROP POLICY IF EXISTS "Users can view assets for their worlds" ON public.world_assets;
DROP POLICY IF EXISTS "Users can update assets for their worlds" ON public.world_assets;
DROP POLICY IF EXISTS "Users can delete assets for their worlds" ON public.world_assets;

-- Create world_assets policies
CREATE POLICY "Users can create world assets" ON public.world_assets
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.worlds 
    WHERE worlds.id = world_assets.world_id 
    AND worlds.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view world assets" ON public.world_assets
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.worlds 
    WHERE worlds.id = world_assets.world_id 
    AND (
      worlds.owner_id = auth.uid() 
      OR (worlds.settings->>'is_public')::boolean = true
    )
  )
);

CREATE POLICY "Users can update world assets" ON public.world_assets
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.worlds 
    WHERE worlds.id = world_assets.world_id 
    AND worlds.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.worlds 
    WHERE worlds.id = world_assets.world_id 
    AND worlds.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete world assets" ON public.world_assets
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.worlds 
    WHERE worlds.id = world_assets.world_id 
    AND worlds.owner_id = auth.uid()
  )
);