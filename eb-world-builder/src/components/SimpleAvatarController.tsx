import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface SimpleAvatarControllerProps {
  avatarUrl: string;
  position: [number, number, number];
}

const SimpleAvatarController: React.FC<SimpleAvatarControllerProps> = ({ avatarUrl, position }) => {
  const { scene } = useGLTF(avatarUrl);
  const avatarRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
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
    console.log('Avatar loaded from URL:', avatarUrl);
    console.log('Avatar scene:', scene);
    // Focus the window to capture keyboard input
    window.focus();
    
    // Reset avatar position to ensure it starts at the correct location
    if (avatarRef.current) {
      avatarRef.current.position.set(position[0], position[1], position[2]);
      // Set initial camera position
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 1, 0);
    }
  }, [avatarUrl, scene, position, camera]);

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
      
      // Add walking animation by bobbing
      const time = state.clock.getElapsedTime();
      avatarRef.current.position.y = position[1] + Math.sin(time * 10) * 0.05;
    } else {
      // Reset to normal height when not moving
      avatarRef.current.position.y = position[1];
    }
    
    velocity.current.multiplyScalar(0.9);
    
    avatarRef.current.position.x += velocity.current.x;
    avatarRef.current.position.z += velocity.current.z;
    
    if (direction.current.length() > 0) {
      const angle = Math.atan2(direction.current.x, direction.current.z);
      avatarRef.current.rotation.y = angle;
    }
    
    const cameraOffset = new THREE.Vector3(0, 5, 10);
    cameraOffset.applyQuaternion(avatarRef.current.quaternion);
    camera.position.lerp(
      new THREE.Vector3(
        avatarRef.current.position.x + cameraOffset.x,
        avatarRef.current.position.y + cameraOffset.y,
        avatarRef.current.position.z + cameraOffset.z
      ),
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

export default SimpleAvatarController;