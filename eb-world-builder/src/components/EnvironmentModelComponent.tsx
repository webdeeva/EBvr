import React, { useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface EnvironmentModelComponentProps {
  url: string;
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
}

const EnvironmentModelComponent: React.FC<EnvironmentModelComponentProps> = ({ 
  url, 
  position, 
  scale, 
  rotation 
}) => {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const [autoScale, setAutoScale] = useState(1);
  
  // Center and auto-scale the model on load
  useEffect(() => {
    if (scene) {
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Calculate max dimension
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // Auto scale to fit in reasonable bounds (e.g., 10 units)
      const targetSize = 10;
      const calculatedScale = targetSize / maxDim;
      setAutoScale(calculatedScale);
      
      // Center the model
      scene.position.x = -center.x;
      scene.position.y = -box.min.y; // Place bottom at y=0
      scene.position.z = -center.z;
      
      console.log('Model auto-scaled from', maxDim, 'to', targetSize, 'scale:', calculatedScale);
    }
  }, [scene]);
  
  // Apply transforms whenever they change
  useEffect(() => {
    if (groupRef.current) {
      // Apply position
      groupRef.current.position.set(position[0], position[1], position[2]);
      
      // Apply scale (multiply by autoScale to keep reasonable size)
      const finalScale = scale * autoScale;
      groupRef.current.scale.set(finalScale, finalScale, finalScale);
      
      // Apply rotation
      groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  }, [position, scale, rotation, autoScale]);
  
  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
};

export default EnvironmentModelComponent;