import React from 'react';
import { Trash2, Eye, EyeOff, Box } from 'lucide-react';
import './SceneObjectsList.css';

export interface SceneObject {
  id: string;
  name: string;
  type: 'environment' | 'avatar' | 'object';
  visible: boolean;
  selected: boolean;
}

interface SceneObjectsListProps {
  objects: SceneObject[];
  onSelectObject: (id: string) => void;
  onDeleteObject: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

const SceneObjectsList: React.FC<SceneObjectsListProps> = ({
  objects,
  onSelectObject,
  onDeleteObject,
  onToggleVisibility
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'environment':
        return '🌍';
      case 'avatar':
        return '👤';
      default:
        return '📦';
    }
  };

  return (
    <div className="scene-objects-list">
      <div className="list-header">
        <h3>Scene Objects</h3>
        <span className="object-count">{objects.length}</span>
      </div>
      
      <div className="objects-container">
        {objects.length === 0 ? (
          <div className="empty-state">
            <Box size={24} />
            <p>No objects in scene</p>
          </div>
        ) : (
          objects.map((obj) => (
            <div 
              key={obj.id}
              className={`object-item ${obj.selected ? 'selected' : ''}`}
              onClick={() => onSelectObject(obj.id)}
            >
              <div className="object-info">
                <span className="object-icon">{getIcon(obj.type)}</span>
                <span className="object-name">{obj.name}</span>
                <span className="object-type">{obj.type}</span>
              </div>
              
              <div className="object-actions">
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(obj.id);
                  }}
                  title={obj.visible ? 'Hide' : 'Show'}
                >
                  {obj.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  className="action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteObject(obj.id);
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
  );
};

export default SceneObjectsList;