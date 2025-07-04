import React, { useState } from 'react';
import { X, Trash2, Eye, EyeOff, Image, Music, Package, Download } from 'lucide-react';
import './ContentBrowser.css';

interface ContentItem {
  url: string;
  type: 'image' | 'audio' | 'model';
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  visible: boolean;
  filename?: string;
  uploadedAt?: number;
}

interface ContentBrowserProps {
  contentItems: { [id: string]: ContentItem };
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId?: string | null;
}

const ContentBrowser: React.FC<ContentBrowserProps> = ({
  contentItems,
  onClose,
  onDelete,
  onToggleVisibility,
  onSelect,
  selectedId
}) => {
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'audio' | 'model'>('all');

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image size={16} />;
      case 'audio':
        return <Music size={16} />;
      case 'model':
        return <Package size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const getFileExtension = (url: string) => {
    const parts = url.split('.');
    return parts[parts.length - 1].toUpperCase();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const filteredItems = Object.entries(contentItems).filter(([_, item]) => {
    if (selectedType === 'all') return true;
    return item.type === selectedType;
  });

  const getThumbnail = (item: ContentItem) => {
    if (item.type === 'image') {
      return (
        <div 
          className="content-thumbnail"
          style={{ backgroundImage: `url(${item.url})` }}
        />
      );
    }
    return (
      <div className="content-thumbnail content-thumbnail-placeholder">
        {getIcon(item.type)}
      </div>
    );
  };

  return (
    <div className="content-browser-overlay">
      <div className="content-browser">
        <div className="content-browser-header">
          <h2>Content Browser</h2>
          <button className="content-browser-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="content-browser-filters">
          <button
            className={`filter-btn ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            All ({Object.keys(contentItems).length})
          </button>
          <button
            className={`filter-btn ${selectedType === 'image' ? 'active' : ''}`}
            onClick={() => setSelectedType('image')}
          >
            <Image size={14} />
            Images
          </button>
          <button
            className={`filter-btn ${selectedType === 'audio' ? 'active' : ''}`}
            onClick={() => setSelectedType('audio')}
          >
            <Music size={14} />
            Audio
          </button>
          <button
            className={`filter-btn ${selectedType === 'model' ? 'active' : ''}`}
            onClick={() => setSelectedType('model')}
          >
            <Package size={14} />
            3D Models
          </button>
        </div>

        <div className="content-browser-grid">
          {filteredItems.length === 0 ? (
            <div className="content-browser-empty">
              <p>No content uploaded yet</p>
              <p className="content-browser-hint">
                Use the Content button to upload images, audio, or 3D models
              </p>
            </div>
          ) : (
            filteredItems.map(([id, item]) => (
              <div
                key={id}
                className={`content-item ${selectedId === id ? 'selected' : ''} ${!item.visible ? 'hidden' : ''}`}
                onClick={() => onSelect(id)}
              >
                {getThumbnail(item)}
                
                <div className="content-item-info">
                  <div className="content-item-name">
                    {item.filename || `${item.type}-${id.split('-').pop()}`}
                  </div>
                  <div className="content-item-meta">
                    <span className="content-item-type">{getFileExtension(item.url)}</span>
                    <span className="content-item-position">
                      ({item.position[0].toFixed(1)}, {item.position[1].toFixed(1)}, {item.position[2].toFixed(1)})
                    </span>
                  </div>
                </div>

                <div className="content-item-actions">
                  <button
                    className="content-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(id);
                    }}
                    title={item.visible ? 'Hide' : 'Show'}
                  >
                    {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <a
                    href={item.url}
                    download
                    className="content-action-btn"
                    onClick={(e) => e.stopPropagation()}
                    title="Download"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    className="content-action-btn content-action-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete this ${item.type}?`)) {
                        onDelete(id);
                      }
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentBrowser;