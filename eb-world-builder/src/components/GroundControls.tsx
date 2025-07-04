import React from 'react';
import { Lock, Unlock, RotateCcw, X, Palette } from 'lucide-react';
import './GroundControls.css';

interface GroundControlsProps {
  size: number;
  color: string;
  textureUrl: string | null;
  showGrid: boolean;
  isLocked: boolean;
  onSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
  onTextureChange: (url: string | null) => void;
  onGridToggle: () => void;
  onLockToggle: () => void;
  onReset: () => void;
  onClose: () => void;
  onUploadTexture: () => void;
}

const GroundControls: React.FC<GroundControlsProps> = ({
  size,
  color,
  textureUrl,
  showGrid,
  isLocked,
  onSizeChange,
  onColorChange,
  onTextureChange,
  onGridToggle,
  onLockToggle,
  onReset,
  onClose,
  onUploadTexture
}) => {
  return (
    <div className="ground-controls glassmorphism-dark">
      <div className="controls-header">
        <h3>Ground Controls</h3>
        <div className="header-buttons">
          <button 
            className={`icon-btn ${isLocked ? 'locked' : ''}`}
            onClick={onLockToggle}
            title={isLocked ? 'Unlock controls' : 'Lock controls'}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
          <button
            className="icon-btn"
            onClick={onClose}
            title="Close controls"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className={`controls-content ${isLocked ? 'disabled' : ''}`}>
        <div className="control-group">
          <label>Size</label>
          <div className="control-row">
            <span>Scale:</span>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={size}
              onChange={(e) => onSizeChange(parseFloat(e.target.value))}
              disabled={isLocked}
            />
            <span className="value">{size}</span>
          </div>
        </div>

        <div className="control-group">
          <label>Color</label>
          <div className="control-row">
            <span>Color:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              disabled={isLocked}
              className="color-input"
            />
            <span className="value">{color}</span>
          </div>
        </div>

        <div className="control-group">
          <label>Grid</label>
          <div className="control-row">
            <span>Show:</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={onGridToggle}
                disabled={isLocked}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="value">{showGrid ? 'On' : 'Off'}</span>
          </div>
        </div>

        <div className="control-group">
          <label>Texture</label>
          <div className="texture-controls">
            {textureUrl ? (
              <div className="texture-preview">
                <img src={textureUrl} alt="Ground texture" />
                <button
                  className="remove-texture-btn"
                  onClick={() => onTextureChange(null)}
                  disabled={isLocked}
                  title="Remove texture"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                className="upload-texture-btn"
                onClick={onUploadTexture}
                disabled={isLocked}
              >
                <Palette size={16} />
                <span>Add Texture</span>
              </button>
            )}
          </div>
        </div>

        <button
          className="reset-btn"
          onClick={onReset}
          disabled={isLocked}
        >
          <RotateCcw size={16} />
          Reset Ground
        </button>
      </div>
    </div>
  );
};

export default GroundControls;