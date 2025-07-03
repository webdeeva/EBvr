import React, { useRef, useEffect, useState } from 'react';
import { useGLTF, Box } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface SimpleEnvironmentModelProps {
  url: string;
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  isSelected?: boolean;
}

const SimpleEnvironmentModel: React.FC<SimpleEnvironmentModelProps> = ({ 
  url, 
  position, 
  scale, 
  rotation,
  isSelected = true 
}) => {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null);
  
  // Debug: Log prop changes
  useEffect(() => {
    console.log('[SimpleEnvironmentModel] Props changed:', {
      url,
      position,
      scale,
      rotation,
      isSelected,
      timestamp: Date.now()
    });
  }, [url, position, scale, rotation, isSelected]);
  
  // Debug: Log when groupRef is set
  useEffect(() => {
    console.log('[SimpleEnvironmentModel] groupRef current:', groupRef.current);
  }, [groupRef.current]);
  
  // Clone and prepare scene
  const [preparedScene, autoScale] = React.useMemo(() => {
    const cloned = scene.clone();
    
    // Calculate bounding box for auto-centering
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Auto-scale models to fit nicely in the scene
    const maxDim = Math.max(size.x, size.y, size.z);
    let calculatedAutoScale = 1;
    
    // Scale models based on their size
    if (maxDim > 1000) {
      // Very large models (like yours at 7500+ units)
      calculatedAutoScale = 50 / maxDim;
    } else if (maxDim > 100) {
      // Large models
      calculatedAutoScale = 30 / maxDim;
    } else if (maxDim > 20) {
      // Medium models
      calculatedAutoScale = 20 / maxDim;
    } else if (maxDim < 1) {
      // Very small models
      calculatedAutoScale = 10;
    }
    
    // Debug: Log auto-scaling calculation
    console.log('[SimpleEnvironmentModel] Auto-scaling calculation:', {
      modelSize: { x: size.x, y: size.y, z: size.z },
      maxDimension: maxDim,
      calculatedAutoScale,
      center: { x: center.x, y: center.y, z: center.z },
      boxMin: { x: box.min.x, y: box.min.y, z: box.min.z },
      boxMax: { x: box.max.x, y: box.max.y, z: box.max.z }
    });
    
    // Center and ground the model
    cloned.position.x = -center.x;
    cloned.position.y = -box.min.y;
    cloned.position.z = -center.z;
    
    // Store bounding box for selection visualization
    setBoundingBox(box);
    
    return [cloned, calculatedAutoScale];
  }, [scene]);
  
  // Force update transforms every frame to ensure they're applied
  useFrame(() => {
    if (groupRef.current) {
      // Debug: Log values being applied every second (not every frame to avoid spam)
      if (Math.random() < 0.01) { // ~1% chance, roughly once per second at 60fps
        console.log('[SimpleEnvironmentModel] useFrame applying:', {
          position: [position[0], position[1], position[2]],
          scale: scale * autoScale,
          rotation: [rotation[0], rotation[1], rotation[2]],
          autoScale,
          groupRefExists: !!groupRef.current
        });
      }
      
      groupRef.current.position.set(position[0], position[1], position[2]);
      groupRef.current.scale.set(scale * autoScale, scale * autoScale, scale * autoScale);
      groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
      
      // Debug: Verify actual Three.js object transforms
      if (Math.random() < 0.01) {
        console.log('[SimpleEnvironmentModel] Actual Three.js transforms:', {
          actualPosition: {
            x: groupRef.current.position.x,
            y: groupRef.current.position.y,
            z: groupRef.current.position.z
          },
          actualScale: {
            x: groupRef.current.scale.x,
            y: groupRef.current.scale.y,
            z: groupRef.current.scale.z
          },
          actualRotation: {
            x: groupRef.current.rotation.x,
            y: groupRef.current.rotation.y,
            z: groupRef.current.rotation.z
          },
          matrixAutoUpdate: groupRef.current.matrixAutoUpdate
        });
      }
    } else {
      // Debug: Log if groupRef is not available
      if (Math.random() < 0.01) {
        console.log('[SimpleEnvironmentModel] useFrame: groupRef.current is null!');
      }
    }
  });
  
  // Calculate bounding box dimensions for selection box
  const boxSize = boundingBox ? [
    (boundingBox.max.x - boundingBox.min.x) * scale * autoScale,
    (boundingBox.max.y - boundingBox.min.y) * scale * autoScale,
    (boundingBox.max.z - boundingBox.min.z) * scale * autoScale
  ] : [1, 1, 1];
  
  return (
    <group ref={groupRef}>
      <primitive object={preparedScene} />
      {isSelected && (
        <>
          <Box args={boxSize as [number, number, number]} position={[0, boxSize[1] / 2, 0]}>
            <meshBasicMaterial 
              color="#ff8c42" 
              wireframe 
              transparent 
              opacity={0.3} 
            />
          </Box>
          {/* Debug: Visual position indicator */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color="red" />
          </mesh>
        </>
      )}
    </group>
  );
};

export default SimpleEnvironmentModel;