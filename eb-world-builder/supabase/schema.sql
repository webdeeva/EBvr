-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create worlds table
CREATE TABLE IF NOT EXISTS public.worlds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    thumbnail_url TEXT,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{"max_users": 20, "is_public": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create world_assets table
CREATE TABLE IF NOT EXISTS public.world_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('environment', 'skybox', 'content')),
    url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create world_access table
CREATE TABLE IF NOT EXISTS public.world_access (
    world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'invited', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (world_id, user_id)
);

-- Create indexes
CREATE INDEX idx_worlds_owner_id ON public.worlds(owner_id);
CREATE INDEX idx_world_assets_world_id ON public.world_assets(world_id);
CREATE INDEX idx_world_access_user_id ON public.world_access(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_access ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Worlds policies
CREATE POLICY "Worlds viewable by participants" ON public.worlds
    FOR SELECT USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.world_access
            WHERE world_access.world_id = worlds.id
            AND world_access.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update their worlds" ON public.worlds
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their worlds" ON public.worlds
    FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create worlds" ON public.worlds
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- World assets policies
CREATE POLICY "World assets viewable by world participants" ON public.world_assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.worlds
            WHERE worlds.id = world_assets.world_id
            AND (
                worlds.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.world_access
                    WHERE world_access.world_id = worlds.id
                    AND world_access.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "World owners can manage assets" ON public.world_assets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.worlds
            WHERE worlds.id = world_assets.world_id
            AND worlds.owner_id = auth.uid()
        )
    );

-- World access policies
CREATE POLICY "World access viewable by participants" ON public.world_access
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.worlds
            WHERE worlds.id = world_access.world_id
            AND worlds.owner_id = auth.uid()
        )
    );

CREATE POLICY "World owners can manage access" ON public.world_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.worlds
            WHERE worlds.id = world_access.world_id
            AND worlds.owner_id = auth.uid()
        )
    );

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_worlds_updated_at BEFORE UPDATE ON public.worlds
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();