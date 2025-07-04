-- Create a database function to save worlds without RLS issues
CREATE OR REPLACE FUNCTION save_world(
  p_world_id UUID DEFAULT NULL,
  p_world_name TEXT DEFAULT 'Untitled World',
  p_owner_id UUID DEFAULT auth.uid(),
  p_settings JSONB DEFAULT '{"is_public": true, "max_users": 20}'::jsonb,
  p_assets JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_world_id UUID;
BEGIN
  -- Check if user is authenticated
  IF p_owner_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert or update world
  IF p_world_id IS NULL THEN
    -- Create new world
    INSERT INTO worlds (name, owner_id, settings)
    VALUES (p_world_name, p_owner_id, p_settings)
    RETURNING id INTO v_world_id;
  ELSE
    -- Update existing world (verify ownership first)
    UPDATE worlds 
    SET name = p_world_name, 
        settings = p_settings,
        updated_at = NOW()
    WHERE id = p_world_id AND owner_id = p_owner_id
    RETURNING id INTO v_world_id;
    
    IF v_world_id IS NULL THEN
      RAISE EXCEPTION 'World not found or you do not have permission';
    END IF;
  END IF;

  -- Delete existing assets
  DELETE FROM world_assets WHERE world_id = v_world_id;

  -- Insert new assets
  IF jsonb_array_length(p_assets) > 0 THEN
    INSERT INTO world_assets (world_id, type, url, metadata)
    SELECT 
      v_world_id,
      (asset->>'type')::TEXT,
      (asset->>'url')::TEXT,
      (asset->'metadata')::JSONB
    FROM jsonb_array_elements(p_assets) AS asset;
  END IF;

  RETURN v_world_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION save_world TO authenticated;