import React from 'react';
import { Image as DreiImage, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ContentItem {
  id: string;
  url: string;
  type: 'image' | 'audio' | 'model';
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
}

interface ContentDisplayProps {
  content: ContentItem;
  isSelected: boolean;
  onSelect: () => void;
}

// Separate component for model content to avoid hooks rules violation
const ModelContent: React.FC<{ content: ContentItem; onSelect: () => void }> = ({ content, onSelect }) => {
  const { scene } = useGLTF(content.url);
  return (
    <primitive
      object={scene.clone()}
      position={content.position}
      scale={[content.scale, content.scale, content.scale]}
      rotation={content.rotation}
      onClick={onSelect}
    />
  );
};

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, isSelected, onSelect }) => {
  if (content.type === 'image') {
    return (
      <group position={content.position} rotation={content.rotation}>
        <DreiImage
          url={content.url}
          scale={content.scale * 2}
          onClick={onSelect}
          transparent
        />
        {isSelected && (
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[content.scale * 2 + 0.2, content.scale * 2 + 0.2]} />
            <meshBasicMaterial color="#ff8c42" transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    );
  }

  if (content.type === 'model') {
    return <ModelContent content={content} onSelect={onSelect} />;
  }

  if (content.type === 'audio') {
    // Audio visualizer placeholder
    return (
      <mesh position={content.position} onClick={onSelect}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial 
          color={isSelected ? "#ff8c42" : "#4a9eff"} 
          wireframe={isSelected}
        />
      </mesh>
    );
  }

  return null;
};

export default ContentDisplay;