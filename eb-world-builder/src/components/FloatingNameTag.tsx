import React, { useMemo } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { Shape, ShapeGeometry } from 'three';
import * as THREE from 'three';

interface FloatingNameTagProps {
  name: string;
  position: [number, number, number];
  isMuted?: boolean;
  isSpeaking?: boolean;
}

// Create a pill shape with rounded ends
function createPillShape(width: number, height: number): Shape {
  const shape = new Shape();
  const radius = height / 2;
  const halfWidth = width / 2;
  
  // Start from top left (after the curve)
  shape.moveTo(-halfWidth + radius, radius);
  
  // Top line
  shape.lineTo(halfWidth - radius, radius);
  
  // Right semicircle (clockwise from top to bottom)
  shape.absarc(halfWidth - radius, 0, radius, Math.PI / 2, -Math.PI / 2, true);
  
  // Bottom line
  shape.lineTo(-halfWidth + radius, -radius);
  
  // Left semicircle (clockwise from bottom to top)
  shape.absarc(-halfWidth + radius, 0, radius, -Math.PI / 2, Math.PI / 2, true);
  
  shape.closePath();
  
  return shape;
}

const FloatingNameTag = React.memo<FloatingNameTagProps>(({ name, position, isMuted = false, isSpeaking = false }) => {
  // Calculate width based on name length and mic icon
  const width = useMemo(() => {
    return name.length * 0.1 + 0.8; // Extra space for mic icon
  }, [name]);

  const height = 0.3;

  // Create pill shapes
  const borderShape = useMemo(() => createPillShape(width + 0.04, height + 0.04), [width, height]);
  const bgShape = useMemo(() => createPillShape(width, height), [width, height]);

  return (
    <Billboard
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
      position={[0, 2.2, 0]}
    >
      <group>
        {/* Orange border pill */}
        <mesh position={[0, 0, -0.01]}>
          <shapeGeometry args={[borderShape]} />
          <meshBasicMaterial color="#ff8c42" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
        
        {/* Dark background pill */}
        <mesh>
          <shapeGeometry args={[bgShape]} />
          <meshBasicMaterial color="#1a1a1a" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
          
        {/* Name text */}
        <Text
          color="#ffffff"
          fontSize={0.15}
          maxWidth={3}
          lineHeight={1}
          letterSpacing={0.01}
          textAlign="left"
          anchorX="left"
          anchorY="middle"
          position={[-width/2 + 0.1, 0, 0.01]}
        >
          {name}
        </Text>
        
        {/* Mic icon */}
        <group position={[width/2 - 0.2, 0, 0.01]}>
          {isMuted ? (
            // Muted mic icon (X shape)
            <group>
              <mesh>
                <planeGeometry args={[0.12, 0.02]} />
                <meshBasicMaterial color="#ff5555" />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <planeGeometry args={[0.12, 0.02]} />
                <meshBasicMaterial color="#ff5555" />
              </mesh>
            </group>
          ) : (
            // Active mic icon with speaking indicator
            <group>
              {/* Main mic icon */}
              <mesh>
                <circleGeometry args={[0.05, 16]} />
                <meshBasicMaterial color={isSpeaking ? "#00ff88" : "#66ff99"} />
              </mesh>
              {/* Speaking pulse effect - separate to avoid scaling issues */}
              {isSpeaking && (
                <mesh position={[0, 0, -0.001]}>
                  <circleGeometry args={[0.07, 16]} />
                  <meshBasicMaterial color="#00ff88" transparent opacity={0.2} />
                </mesh>
              )}
            </group>
          )}
        </group>
      </group>
    </Billboard>
  );
});

export default FloatingNameTag;