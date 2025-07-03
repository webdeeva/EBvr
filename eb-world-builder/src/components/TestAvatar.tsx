import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface TestAvatarProps {
  position: [number, number, number];
}

const TestAvatar: React.FC<TestAvatarProps> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
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

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
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
    if (!meshRef.current) return;

    const speed = keys.current.shift ? 10 : 5;
    
    direction.current.set(0, 0, 0);
    
    if (keys.current.w) direction.current.z -= 1;
    if (keys.current.s) direction.current.z += 1;
    if (keys.current.a) direction.current.x -= 1;
    if (keys.current.d) direction.current.x += 1;
    
    direction.current.normalize();
    
    if (direction.current.length() > 0) {
      velocity.current.add(direction.current.multiplyScalar(speed * delta));
    }
    
    velocity.current.multiplyScalar(0.9);
    
    meshRef.current.position.add(velocity.current);
    
    if (direction.current.length() > 0) {
      const angle = Math.atan2(direction.current.x, direction.current.z);
      meshRef.current.rotation.y = angle;
    }
    
    const cameraOffset = new THREE.Vector3(0, 5, 10);
    cameraOffset.applyQuaternion(meshRef.current.quaternion);
    camera.position.lerp(
      meshRef.current.position.clone().add(cameraOffset),
      0.1
    );
    camera.lookAt(meshRef.current.position);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color="#00ff00" />
    </mesh>
  );
};

export default TestAvatar;