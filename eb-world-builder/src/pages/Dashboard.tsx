import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { User } from '@supabase/supabase-js';
import { Globe, Lock, Plus, LogOut, User as UserIcon, Clock, Users, Settings, RefreshCw, Trash2, MoreVertical } from 'lucide-react';
import CreateWorldModal from '../components/CreateWorldModal';
import './Dashboard.css';

interface World {
  id: string;
  name: string;
  thumbnail_url?: string;
  owner_id: string;
  settings: {
    is_public: boolean;
    max_users: number;
    access_code?: string;
  };
  created_at: string;
  updated_at: string;
  owner?: {
    username: string;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'my-worlds' | 'public-worlds'>('my-worlds');
  const [myWorlds, setMyWorlds] = useState<World[]>([]);
  const [publicWorlds, setPublicWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadWorlds();
    }
  }, [user, activeTab]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }
    
    // Ensure user has a profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
      
    if (!profile) {
      // Create profile if it doesn't exist
      await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`
        });
    }
    
    setUser(user);
  };

  const loadWorlds = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my-worlds') {
        const { data, error } = await supabase
          .from('worlds')
          .select('*')
          .eq('owner_id', user!.id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error loading my worlds:', error);
          throw error;
        }
        console.log('Loaded my worlds:', data);
        setMyWorlds(data || []);
      } else {
        const { data, error } = await supabase
          .from('worlds')
          .select(`
            *,
            owner:profiles!worlds_owner_id_fkey(username)
          `)
          .eq('settings->is_public', true)
          .neq('owner_id', user!.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setPublicWorlds(data || []);
      }
    } catch (error) {
      console.error('Error loading worlds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const enterWorld = (world: World) => {
    if (!world.settings.is_public && world.owner_id !== user?.id) {
      const code = prompt('Enter access code:');
      if (code !== world.settings.access_code) {
        alert('Invalid access code');
        return;
      }
    }
    navigate(`/world/${world.id}?name=${encodeURIComponent(world.name)}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const toggleWorldPrivacy = async (world: World) => {
    try {
      const newIsPublic = !world.settings.is_public;
      let accessCode = world.settings.access_code;
      
      // Generate access code if making private and doesn't have one
      if (!newIsPublic && !accessCode) {
        accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      }
      
      const { error } = await supabase
        .from('worlds')
        .update({ 
          settings: { 
            ...world.settings, 
            is_public: newIsPublic,
            access_code: newIsPublic ? null : accessCode
          } 
        })
        .eq('id', world.id);
        
      if (error) throw error;
      
      // Refresh worlds list
      loadWorlds();
    } catch (error) {
      console.error('Error toggling privacy:', error);
      alert('Failed to update world privacy');
    }
  };
  
  const deleteWorld = async (worldId: string) => {
    if (!window.confirm('Are you sure you want to delete this world? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('worlds')
        .delete()
        .eq('id', worldId);
        
      if (error) throw error;
      
      // Refresh worlds list
      loadWorlds();
    } catch (error) {
      console.error('Error deleting world:', error);
      alert('Failed to delete world');
    }
  };

  const joinPrivateWorld = async () => {
    if (!joinCode) {
      alert('Please enter an access code');
      return;
    }
    
    try {
      // Search for world with this access code
      const { data, error } = await supabase
        .from('worlds')
        .select('*')
        .eq('settings->access_code', joinCode.toUpperCase())
        .single();
        
      if (error || !data) {
        alert('Invalid access code');
        return;
      }
      
      // Navigate to the world
      navigate(`/world/${data.id}?name=${encodeURIComponent(data.name)}`);
      setShowJoinModal(false);
      setJoinCode('');
    } catch (error) {
      console.error('Error joining world:', error);
      alert('Failed to join world');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Left Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>EB World Builder</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'my-worlds' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-worlds')}
          >
            <UserIcon size={18} />
            <span>My Worlds</span>
          </button>
          
          <button
            className={`nav-item ${activeTab === 'public-worlds' ? 'active' : ''}`}
            onClick={() => setActiveTab('public-worlds')}
          >
            <Globe size={18} />
            <span>Public Worlds</span>
          </button>
          
          <button
            className="nav-item"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            <span>Create World</span>
          </button>
          
          <button
            className="nav-item"
            onClick={() => setShowJoinModal(true)}
          >
            <Lock size={18} />
            <span>Join Private World</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleSignOut}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>{activeTab === 'my-worlds' ? 'My Worlds' : 'Public Worlds'}</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-create" 
              onClick={() => loadWorlds()}
              title="Refresh worlds"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <RefreshCw size={20} />
              Refresh
            </button>
            {activeTab === 'my-worlds' && (
              <button className="btn-create" onClick={() => setShowCreateModal(true)}>
                <Plus size={20} />
                Create New World
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading worlds...</p>
          </div>
        ) : (
          <div className="worlds-grid">
            {activeTab === 'my-worlds' ? (
              myWorlds.length === 0 ? (
                <div className="empty-state">
                  <Globe size={64} />
                  <h3>No worlds yet</h3>
                  <p>Create your first world to get started!</p>
                  <button className="btn-create" onClick={() => setShowCreateModal(true)}>
                    <Plus size={20} />
                    Create World
                  </button>
                </div>
              ) : (
                myWorlds.map(world => (
                  <div key={world.id} className="world-card" style={{ background: 'rgba(15, 15, 25, 0.9)', border: '1px solid rgba(255, 140, 66, 0.2)' }}>
                    <div className="world-thumbnail" onClick={() => enterWorld(world)} style={{ cursor: 'pointer', position: 'relative' }}>
                      {world.thumbnail_url ? (
                        <img src={world.thumbnail_url} alt={world.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                      ) : (
                        <div className="thumbnail-placeholder" style={{ height: '200px', background: 'rgba(255, 140, 66, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Globe size={48} style={{ color: 'rgba(255, 140, 66, 0.5)' }} />
                        </div>
                      )}
                      <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        background: 'rgba(0, 0, 0, 0.7)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s'
                      }} 
                      className="world-overlay">
                        <button style={{ 
                          padding: '10px 24px',
                          background: 'rgba(255, 140, 66, 0.9)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}>Enter World</button>
                      </div>
                    </div>
                    <div style={{ padding: '20px', background: 'rgba(0, 0, 0, 0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h3 style={{ 
                          margin: 0,
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#ffffff',
                          WebkitTextFillColor: '#ffffff',
                          opacity: 1,
                          visibility: 'visible'
                        }}>{world.name}</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWorldPrivacy(world);
                            }}
                            title={world.settings.is_public ? 'Make Private' : 'Make Public'}
                          >
                            {world.settings.is_public ? <Lock size={16} /> : <Globe size={16} />}
                          </button>
                          <button
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 59, 48, 0.3)',
                              background: 'rgba(255, 59, 48, 0.1)',
                              color: '#ff3b30',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWorld(world.id);
                            }}
                            title="Delete World"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          padding: '4px 10px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '20px',
                          fontSize: '12px'
                        }}>
                          {world.settings.is_public ? (
                            <>
                              <Globe size={14} />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock size={14} />
                              Private
                            </>
                          )}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} />
                          {formatDate(world.updated_at)}
                        </span>
                      </div>
                      {!world.settings.is_public && world.settings.access_code && (
                        <div style={{
                          marginTop: '12px',
                          padding: '8px 12px',
                          background: 'rgba(255, 140, 66, 0.1)',
                          border: '1px solid rgba(255, 140, 66, 0.2)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.8)'
                        }}>
                          Access code: <code style={{ fontFamily: 'monospace', fontWeight: '600', color: '#ff8c42', marginLeft: '8px' }}>{world.settings.access_code}</code>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )
            ) : (
              publicWorlds.length === 0 ? (
                <div className="empty-state">
                  <Globe size={64} />
                  <h3>No public worlds yet</h3>
                  <p>Be the first to share your world!</p>
                </div>
              ) : (
                publicWorlds.map(world => (
                  <div key={world.id} className="world-card" style={{ background: 'rgba(15, 15, 25, 0.9)', border: '1px solid rgba(255, 140, 66, 0.2)' }}>
                    <div className="world-thumbnail" onClick={() => enterWorld(world)} style={{ cursor: 'pointer', position: 'relative' }}>
                      {world.thumbnail_url ? (
                        <img src={world.thumbnail_url} alt={world.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                      ) : (
                        <div className="thumbnail-placeholder" style={{ height: '200px', background: 'rgba(255, 140, 66, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Globe size={48} style={{ color: 'rgba(255, 140, 66, 0.5)' }} />
                        </div>
                      )}
                      <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        background: 'rgba(0, 0, 0, 0.7)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s'
                      }} 
                      className="world-overlay">
                        <button style={{ 
                          padding: '10px 24px',
                          background: 'rgba(255, 140, 66, 0.9)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}>Enter World</button>
                      </div>
                    </div>
                    <div style={{ padding: '20px', background: 'rgba(0, 0, 0, 0.4)' }}>
                      <h3 style={{ 
                        margin: '0 0 12px 0',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#ffffff',
                        WebkitTextFillColor: '#ffffff',
                        opacity: 1,
                        visibility: 'visible'
                      }}>{world.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <UserIcon size={14} />
                          {world.owner?.username || 'Unknown'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} />
                          {formatDate(world.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
      
      <CreateWorldModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      {/* Join Private World Modal */}
      {showJoinModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(15, 15, 25, 0.95)',
            border: '1px solid rgba(255, 140, 66, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ 
              margin: '0 0 24px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: '#ffffff'
            }}>Join Private World</h2>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              Enter the access code provided by the world owner
            </p>
            
            <input
              type="text"
              placeholder="Enter access code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && joinPrivateWorld()}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '16px',
                fontFamily: 'monospace',
                textAlign: 'center',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '24px'
              }}
              autoFocus
            />
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={joinPrivateWorld}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #ff8c42, #ff6b2b)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Join World
              </button>
              
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinCode('');
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;