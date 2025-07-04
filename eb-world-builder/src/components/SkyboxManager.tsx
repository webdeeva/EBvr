import React, { useState } from 'react';
import { X, Trash2, CheckCircle, Image, Download } from 'lucide-react';
import SkyboxThumbnail from './SkyboxThumbnail';
import './SkyboxManager.css';

interface Skybox {
  url: string;
  filename: string;
  uploadedAt: number;
  thumbnail?: string;
}

interface SkyboxManagerProps {
  skyboxes: { [id: string]: Skybox };
  currentSkyboxId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClearSkybox: () => void;
}

const SkyboxManager: React.FC<SkyboxManagerProps> = ({
  skyboxes,
  currentSkyboxId,
  onClose,
  onSelect,
  onDelete,
  onClearSkybox
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileSize = (url: string) => {
    // Since we don't have file size info, we'll show "HDR" for .hdr files
    if (url.includes('.hdr')) return 'HDR';
    if (url.includes('.exr')) return 'EXR';
    return 'Image';
  };

  return (
    <div className="skybox-manager-overlay">
      <div className="skybox-manager">
        <div className="skybox-manager-header">
          <h2>Skybox Manager</h2>
          <button className="skybox-manager-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="skybox-manager-actions">
          <button
            className="skybox-action-btn skybox-clear-btn"
            onClick={onClearSkybox}
            disabled={!currentSkyboxId}
          >
            Use Default Sky
          </button>
        </div>

        <div className="skybox-manager-grid">
          {Object.keys(skyboxes).length === 0 ? (
            <div className="skybox-manager-empty">
              <Image size={48} />
              <p>No skyboxes uploaded yet</p>
              <p className="skybox-manager-hint">
                Click the Skybox button to upload panoramic images
              </p>
            </div>
          ) : (
            Object.entries(skyboxes).map(([id, skybox]) => (
              <div
                key={id}
                className={`skybox-item ${currentSkyboxId === id ? 'active' : ''}`}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(id)}
              >
                <div className="skybox-thumbnail">
                  <SkyboxThumbnail 
                    url={skybox.url} 
                    width={240} 
                    height={160}
                    onThumbnailGenerated={(dataUrl) => {
                      // Optional: Could save thumbnail to state here
                    }}
                  />
                  {currentSkyboxId === id && (
                    <div className="skybox-active-indicator">
                      <CheckCircle size={24} />
                    </div>
                  )}
                </div>

                <div className="skybox-info">
                  <div className="skybox-name">{skybox.filename}</div>
                  <div className="skybox-meta">
                    <span className="skybox-type">{getFileSize(skybox.url)}</span>
                    <span className="skybox-date">{formatDate(skybox.uploadedAt)}</span>
                  </div>
                </div>

                <div className="skybox-actions">
                  <a
                    href={skybox.url}
                    download={skybox.filename}
                    className="skybox-action-btn"
                    onClick={(e) => e.stopPropagation()}
                    title="Download"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    className="skybox-action-btn skybox-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this skybox?')) {
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

export default SkyboxManager;