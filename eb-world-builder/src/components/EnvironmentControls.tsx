import React from 'react';
import { Lock, Unlock, RotateCcw, X } from 'lucide-react';
import './EnvironmentControls.css';

interface EnvironmentControlsProps {
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  isLocked: boolean;
  onPositionChange: (position: [number, number, number]) => void;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: [number, number, number]) => void;
  onLockToggle: () => void;
  onReset: () => void;
  onClose: () => void;
}

const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({
  position,
  scale,
  rotation,
  isLocked,
  onPositionChange,
  onScaleChange,
  onRotationChange,
  onLockToggle,
  onReset,
  onClose
}) => {
  const handlePositionChange = (axis: number, value: number) => {
    console.log('[EnvironmentControls] Position change:', { axis, value, currentPosition: position, isLocked });
    if (isLocked) {
      console.log('[EnvironmentControls] Controls are locked!');
      return;
    }
    const newPosition: [number, number, number] = [...position];
    newPosition[axis] = value;
    onPositionChange(newPosition);
  };

  const handleRotationChange = (axis: number, value: number) => {
    console.log('[EnvironmentControls] Rotation change:', { axis, value, currentRotation: rotation, isLocked });
    if (isLocked) {
      console.log('[EnvironmentControls] Controls are locked!');
      return;
    }
    const newRotation: [number, number, number] = [...rotation];
    newRotation[axis] = value;
    onRotationChange(newRotation);
  };
  
  console.log('[EnvironmentControls] Current props:', { position, scale, rotation, isLocked });

  return (
    <div className="environment-controls glassmorphism-dark">
      <div className="controls-header">
        <h3>Environment Controls</h3>
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
          <label>Position</label>
          <div className="control-row">
            <span>X:</span>
            <input
              type="range"
              min="-50"
              max="50"
              step="0.1"
              value={position[0]}
              onChange={(e) => handlePositionChange(0, parseFloat(e.target.value))}
              onMouseDown={() => console.log('[EnvironmentControls] Slider clicked, isLocked:', isLocked)}
              disabled={isLocked}
            />
            <span className="value">{position[0].toFixed(1)}</span>
          </div>
          <div className="control-row">
            <span>Y:</span>
            <input
              type="range"
              min="-50"
              max="50"
              step="0.1"
              value={position[1]}
              onChange={(e) => handlePositionChange(1, parseFloat(e.target.value))}
              disabled={isLocked}
            />
            <span className="value">{position[1].toFixed(1)}</span>
          </div>
          <div className="control-row">
            <span>Z:</span>
            <input
              type="range"
              min="-50"
              max="50"
              step="0.1"
              value={position[2]}
              onChange={(e) => handlePositionChange(2, parseFloat(e.target.value))}
              disabled={isLocked}
            />
            <span className="value">{position[2].toFixed(1)}</span>
          </div>
        </div>

        <div className="control-group">
          <label>Scale</label>
          <div className="control-row">
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={scale}
              onChange={(e) => {
                console.log('[EnvironmentControls] Scale onChange:', e.target.value);
                onScaleChange(parseFloat(e.target.value));
              }}
              onMouseDown={() => console.log('[EnvironmentControls] Scale slider clicked, current scale:', scale)}
              disabled={isLocked}
            />
            <span className="value">{scale.toFixed(2)}x</span>
          </div>
        </div>

        <div className="control-group">
          <label>Rotation</label>
          <div className="control-row">
            <span>X:</span>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={rotation[0] * 180 / Math.PI}
              onChange={(e) => handleRotationChange(0, parseFloat(e.target.value) * Math.PI / 180)}
              disabled={isLocked}
            />
            <span className="value">{(rotation[0] * 180 / Math.PI).toFixed(0)}°</span>
          </div>
          <div className="control-row">
            <span>Y:</span>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={rotation[1] * 180 / Math.PI}
              onChange={(e) => handleRotationChange(1, parseFloat(e.target.value) * Math.PI / 180)}
              disabled={isLocked}
            />
            <span className="value">{(rotation[1] * 180 / Math.PI).toFixed(0)}°</span>
          </div>
          <div className="control-row">
            <span>Z:</span>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={rotation[2] * 180 / Math.PI}
              onChange={(e) => handleRotationChange(2, parseFloat(e.target.value) * Math.PI / 180)}
              disabled={isLocked}
            />
            <span className="value">{(rotation[2] * 180 / Math.PI).toFixed(0)}°</span>
          </div>
        </div>

        <button 
          className="reset-btn"
          onClick={onReset}
          disabled={isLocked}
        >
          <RotateCcw size={14} />
          <span>Reset to Default</span>
        </button>
      </div>
    </div>
  );
};

export default EnvironmentControls;