import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarControllerProps {
  avatarUrl: string;
  position: [number, number, number];
}

const AvatarController: React.FC<AvatarControllerProps> = ({ avatarUrl, position }) => {
  const { scene, animations } = useGLTF(avatarUrl);
  const avatarRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { actions, names } = useAnimations(animations, avatarRef);
  const [isMoving, setIsMoving] = useState(false);
  
  useEffect(() => {
    console.log('Avatar loaded from URL:', avatarUrl);
    console.log('Avatar scene:', scene);
    console.log('Available animations:', names);
    // Focus the window to capture keyboard input
    window.focus();
    
    // Reset avatar position to ensure it starts at the correct location
    if (avatarRef.current) {
      avatarRef.current.position.set(position[0], position[1], position[2]);
      // Set initial camera position
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 1, 0);
    }
    
    // Play idle animation if available
    if (actions && names && names.length > 0) {
      // Try to find idle animation or play the first one
      const idleAnimation = names.find(name => name.toLowerCase().includes('idle')) || names[0];
      if (idleAnimation && actions && actions[idleAnimation]) {
        actions[idleAnimation]?.play();
      }
    }
  }, [avatarUrl, scene, position, camera, actions, names]);
  
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
        console.log(`Key pressed: ${key}`);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
        console.log(`Key released: ${key}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!avatarRef.current) return;

    const speed = keys.current.shift ? 10 : 5;
    
    direction.current.set(0, 0, 0);
    
    if (keys.current.w) direction.current.z -= 1;
    if (keys.current.s) direction.current.z += 1;
    if (keys.current.a) direction.current.x -= 1;
    if (keys.current.d) direction.current.x += 1;
    
    direction.current.normalize();
    
    if (direction.current.length() > 0) {
      velocity.current.add(direction.current.multiplyScalar(speed * delta));
      console.log('Moving avatar, position:', avatarRef.current.position);
    }
    
    velocity.current.multiplyScalar(0.9);
    
    avatarRef.current.position.add(velocity.current);
    
    if (direction.current.length() > 0) {
      const angle = Math.atan2(direction.current.x, direction.current.z);
      avatarRef.current.rotation.y = angle;
    }
    
    const cameraOffset = new THREE.Vector3(0, 5, 10);
    cameraOffset.applyQuaternion(avatarRef.current.quaternion);
    camera.position.lerp(
      avatarRef.current.position.clone().add(cameraOffset),
      0.1
    );
    camera.lookAt(avatarRef.current.position);
  });

  return (
    <group ref={avatarRef} position={position}>
      <primitive object={scene} scale={1} position={[0, 0, 0]} />
    </group>
  );
};

export default AvatarController;