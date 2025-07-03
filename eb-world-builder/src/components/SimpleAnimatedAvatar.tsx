import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface SimpleAnimatedAvatarProps {
  avatarUrl: string;
  position: [number, number, number];
}

const SimpleAnimatedAvatar: React.FC<SimpleAnimatedAvatarProps> = ({ avatarUrl, position }) => {
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
  });

  // Animation state
  const [isMoving, setIsMoving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  
  // Store references to bones for procedural animation
  const bones = useRef<{ [key: string]: THREE.Bone }>({});

  useEffect(() => {
    console.log('Simple Animated Avatar loaded:', avatarUrl);
    
    if (avatarRef.current) {
      avatarRef.current.position.set(...position);
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 1, 0);
      
      // Find and store bone references
      avatarRef.current.traverse((child) => {
        if (child instanceof THREE.Bone) {
          bones.current[child.name] = child;
          console.log('Found bone:', child.name);
        }
      });
    }
  }, [avatarUrl, position, camera]);

  useEffect(() => {
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
    if (!avatarRef.current) return;

    const speed = keys.current.shift ? 10 : 5;
    const moving = keys.current.w || keys.current.s || keys.current.a || keys.current.d;
    const running = moving && keys.current.shift;
    
    setIsMoving(moving);
    setIsRunning(running);
    
    // Movement
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
    
    avatarRef.current.position.x += velocity.current.x;
    avatarRef.current.position.z += velocity.current.z;
    
    // Procedural animation
    if (moving) {
      const time = state.clock.elapsedTime;
      const animSpeed = running ? 15 : 10;
      const animIntensity = running ? 1.2 : 1;
      
      // Body bob
      avatarRef.current.position.y = position[1] + Math.sin(time * animSpeed) * 0.05 * animIntensity;
      
      // Slight rotation sway
      avatarRef.current.rotation.z = Math.sin(time * animSpeed * 0.5) * 0.02 * animIntensity;
      
      // Animate specific bones if found
      if (bones.current['LeftUpperArm']) {
        bones.current['LeftUpperArm'].rotation.x = Math.sin(time * animSpeed) * 0.3 * animIntensity;
      }
      if (bones.current['RightUpperArm']) {
        bones.current['RightUpperArm'].rotation.x = -Math.sin(time * animSpeed) * 0.3 * animIntensity;
      }
      if (bones.current['LeftUpperLeg']) {
        bones.current['LeftUpperLeg'].rotation.x = -Math.sin(time * animSpeed) * 0.4 * animIntensity;
      }
      if (bones.current['RightUpperLeg']) {
        bones.current['RightUpperLeg'].rotation.x = Math.sin(time * animSpeed) * 0.4 * animIntensity;
      }
    } else {
      // Return to rest position
      avatarRef.current.position.y = THREE.MathUtils.lerp(avatarRef.current.position.y, position[1], 0.1);
      avatarRef.current.rotation.z = THREE.MathUtils.lerp(avatarRef.current.rotation.z, 0, 0.1);
      
      // Reset bone rotations
      Object.values(bones.current).forEach(bone => {
        if (bone.rotation) {
          bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, 0, 0.1);
        }
      });
    }
    
    // Face direction of movement
    if (direction.current.length() > 0) {
      const angle = Math.atan2(direction.current.x, direction.current.z);
      avatarRef.current.rotation.y = angle;
    }
    
    // Camera follow
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
    <group ref={avatarRef}>
      <primitive object={scene} />
    </group>
  );
};

export default SimpleAnimatedAvatar;