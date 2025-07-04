import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Globe, Users, Lock, Calendar, User } from 'lucide-react';
import './WorldsGallery.css';

interface World {
  id: string;
  name: string;
  owner_id: string;
  settings: {
    is_public: boolean;
    max_users: number;
  };
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
  profiles?: {
    username: string;
  };
}

const WorldsGallery: React.FC = () => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my' | 'public'>('all');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Load worlds
    loadWorlds();
  }, [filter]);

  const loadWorlds = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('worlds')
        .select(`
          *,
          profiles!worlds_owner_id_fkey (username)
        `)
        .order('updated_at', { ascending: false });

      if (filter === 'my' && user) {
        query = query.eq('owner_id', user.id);
      } else if (filter === 'public') {
        query = query.eq('settings->>is_public', 'true');
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setWorlds(data || []);
    } catch (error) {
      console.error('Error loading worlds:', error);
    } finally {
      setLoading(false);
    }
  };

  const enterWorld = (worldId: string) => {
    navigate(`/world/${worldId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="worlds-gallery">
      <div className="gallery-header">
        <h2>Explore Worlds</h2>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Worlds
          </button>
          <button
            className={`filter-btn ${filter === 'public' ? 'active' : ''}`}
            onClick={() => setFilter('public')}
          >
            <Globe size={14} />
            Public
          </button>
          {user && (
            <button
              className={`filter-btn ${filter === 'my' ? 'active' : ''}`}
              onClick={() => setFilter('my')}
            >
              <User size={14} />
              My Worlds
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="gallery-loading">
          <div className="loading-spinner"></div>
          <p>Loading worlds...</p>
        </div>
      ) : worlds.length === 0 ? (
        <div className="gallery-empty">
          <Globe size={48} />
          <p>No worlds found</p>
          {filter === 'my' && <p className="hint">Create your first world to see it here!</p>}
        </div>
      ) : (
        <div className="worlds-grid">
          {worlds.map((world) => (
            <div
              key={world.id}
              className="world-card"
              onClick={() => enterWorld(world.id)}
            >
              <div className="world-thumbnail">
                {world.thumbnail_url ? (
                  <img src={world.thumbnail_url} alt={world.name} />
                ) : (
                  <div className="thumbnail-placeholder">
                    <Globe size={32} />
                  </div>
                )}
                <div className="world-overlay">
                  <button className="enter-btn">Enter World</button>
                </div>
              </div>
              <div className="world-info">
                <h3>{world.name}</h3>
                <div className="world-meta">
                  <span className="meta-item">
                    <User size={12} />
                    {world.profiles?.username || 'Anonymous'}
                  </span>
                  <span className="meta-item">
                    <Calendar size={12} />
                    {formatDate(world.updated_at || world.created_at)}
                  </span>
                  <span className="meta-item">
                    {world.settings?.is_public ? <Globe size={12} /> : <Lock size={12} />}
                    {world.settings?.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorldsGallery;