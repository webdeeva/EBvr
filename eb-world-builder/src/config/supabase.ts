import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface World {
  id: string;
  name: string;
  thumbnail_url?: string;
  owner_id: string;
  settings: {
    max_users?: number;
    is_public?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface WorldAsset {
  id: string;
  world_id: string;
  type: 'environment' | 'skybox' | 'content';
  url: string;
  metadata: {
    filename?: string;
    position?: [number, number, number];
    scale?: number;
    rotation?: [number, number, number];
    is_active?: boolean;
  };
  created_at: string;
}

export interface WorldAccess {
  world_id: string;
  user_id: string;
  role: 'owner' | 'invited' | 'viewer';
  created_at: string;
}