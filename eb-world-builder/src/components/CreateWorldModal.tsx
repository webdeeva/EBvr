import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, X } from 'lucide-react';
import { supabase } from '../config/supabase';
import './CreateWorldModal.css';

interface CreateWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateWorldModal: React.FC<CreateWorldModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [worldName, setWorldName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!worldName.trim()) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Create the world using the save_world function
      const { data, error } = await supabase.rpc('save_world', {
        p_world_name: worldName.trim(),
        p_settings: { is_public: true, max_users: 20 }
      });

      if (error) throw error;

      // Navigate to the newly created world
      navigate(`/world/${data}?name=${encodeURIComponent(worldName.trim())}`);
    } catch (err) {
      console.error('Error creating world:', err);
      setError('Failed to create world. Please try again.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && worldName.trim()) {
      handleCreate();
    }
  };

  const handleClose = () => {
    setWorldName('');
    setError('');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New World</h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="worldName">World Name</label>
            <input
              id="worldName"
              type="text"
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a name for your world"
              autoFocus
              maxLength={50}
            />
            <p className="form-hint">Choose a memorable name for your world</p>
          </div>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={handleCreate}
            disabled={!worldName.trim() || loading}
          >
            {loading ? (
              <>Creating...</>
            ) : (
              <>
                <Globe size={18} />
                Create World
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorldModal;