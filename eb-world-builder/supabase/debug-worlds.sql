-- Debug: Check if worlds exist and their owners
SELECT 
    w.id,
    w.name,
    w.owner_id,
    w.created_at,
    w.updated_at,
    w.settings,
    p.username as owner_username,
    au.email as owner_email
FROM worlds w
LEFT JOIN profiles p ON w.owner_id = p.id
LEFT JOIN auth.users au ON w.owner_id = au.id
ORDER BY w.created_at DESC
LIMIT 10;

-- Check current user ID
SELECT auth.uid() as current_user_id;

-- Check if current user has a profile
SELECT * FROM profiles WHERE id = auth.uid();

-- Count worlds by owner
SELECT 
    owner_id,
    COUNT(*) as world_count
FROM worlds
GROUP BY owner_id;

-- Check RLS policies on worlds table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'worlds';