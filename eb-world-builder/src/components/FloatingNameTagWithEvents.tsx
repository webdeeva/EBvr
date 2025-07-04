import React, { useMemo, useState, useEffect } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { Shape, ShapeGeometry } from 'three';
import * as THREE from 'three';

interface FloatingNameTagWithEventsProps {
  name: string;
  position: [number, number, number];
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

const FloatingNameTagWithEvents: React.FC<FloatingNameTagWithEventsProps> = ({ name, position = [0, 0, 0] }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const handleMuteChange = (event: CustomEvent<{ isMuted: boolean }>) => {
      setIsMuted(event.detail.isMuted);
    };

    const handleSpeakingChange = (event: CustomEvent<{ isSpeaking: boolean }>) => {
      setIsSpeaking(event.detail.isSpeaking);
    };

    window.addEventListener('voiceMuteChanged' as any, handleMuteChange);
    window.addEventListener('voiceSpeakingChanged' as any, handleSpeakingChange);

    return () => {
      window.removeEventListener('voiceMuteChanged' as any, handleMuteChange);
      window.removeEventListener('voiceSpeakingChanged' as any, handleSpeakingChange);
    };
  }, []);

  // Calculate width based on name length and mic icon
  const width = useMemo(() => {
    return name.length * 0.06 + 0.5; // Smaller scale
  }, [name]);

  const height = 0.2; // Smaller height

  // Create pill shapes
  const borderShape = useMemo(() => createPillShape(width + 0.04, height + 0.04), [width, height]);
  const bgShape = useMemo(() => createPillShape(width, height), [width, height]);

  return (
    <Billboard
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
      position={[0, 2.1, 0]}
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
          fontSize={0.1}
          maxWidth={2}
          lineHeight={1}
          letterSpacing={0.01}
          textAlign="left"
          anchorX="left"
          anchorY="middle"
          position={[-width/2 + 0.08, 0, 0.01]}
        >
          {name}
        </Text>
        
        {/* Mic icon */}
        <group position={[width/2 - 0.15, 0, 0.01]}>
          {isMuted ? (
            // Muted mic icon (X shape)
            <group>
              <mesh>
                <planeGeometry args={[0.08, 0.015]} />
                <meshBasicMaterial color="#ff5555" />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <planeGeometry args={[0.08, 0.015]} />
                <meshBasicMaterial color="#ff5555" />
              </mesh>
            </group>
          ) : (
            // Active mic icon with speaking indicator
            <group>
              {/* Main mic icon */}
              <mesh>
                <circleGeometry args={[0.03, 16]} />
                <meshBasicMaterial color={isSpeaking ? "#00ff88" : "#66ff99"} />
              </mesh>
              {/* Speaking pulse effect - separate to avoid scaling issues */}
              {isSpeaking && (
                <mesh position={[0, 0, -0.001]}>
                  <circleGeometry args={[0.045, 16]} />
                  <meshBasicMaterial color="#00ff88" transparent opacity={0.2} />
                </mesh>
              )}
            </group>
          )}
        </group>
      </group>
    </Billboard>
  );
};

export default FloatingNameTagWithEvents;