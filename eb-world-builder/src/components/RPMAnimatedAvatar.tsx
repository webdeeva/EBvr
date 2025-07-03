import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface RPMAnimatedAvatarProps {
  avatarUrl: string;
  position: [number, number, number];
}

const RPMAnimatedAvatar: React.FC<RPMAnimatedAvatarProps> = ({ avatarUrl, position }) => {
  // Load avatar model
  const { scene } = useGLTF(avatarUrl);
  
  // Load animation GLB files (which contain full animated models)
  const idleGLTF = useGLTF('/animations/idle-male.glb');
  const walkGLTF = useGLTF('/animations/walk-male.glb');
  const runGLTF = useGLTF('/animations/run-male.glb');
  
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [currentAnim, setCurrentAnim] = useState('idle');
  
  // Extract animations from the GLB files
  const { actions, mixer } = useAnimations(
    [
      ...(idleGLTF.animations || []),
      ...(walkGLTF.animations || []),
      ...(runGLTF.animations || [])
    ],
    group
  );
  
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
  });

  // Setup animations
  useEffect(() => {
    console.log('RPM Animated Avatar loaded');
    console.log('Avatar scene:', scene);
    console.log('Idle animations:', idleGLTF.animations);
    console.log('Walk animations:', walkGLTF.animations);
    console.log('Run animations:', runGLTF.animations);
    console.log('All actions:', Object.keys(actions));
    
    if (group.current) {
      group.current.position.set(...position);
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 1, 0);
    }
    
    // Clone the avatar scene to avoid mutations
    const clonedScene = scene.clone();
    
    // Find the avatar's skeleton
    let skeleton: THREE.Skeleton | null = null;
    clonedScene.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const skinnedMesh = child as THREE.SkinnedMesh;
        skeleton = skinnedMesh.skeleton;
      }
    });
    
    // If we found a skeleton, try to apply animations to it
    if (skeleton && mixer && group.current) {
      console.log('Found skeleton, setting up animations');
      
      // Create animation clips that target the avatar's skeleton
      if (idleGLTF.animations.length > 0) {
        const idleClip = idleGLTF.animations[0];
        const idleAction = mixer.clipAction(idleClip, group.current);
        idleAction.play();
      }
    }
  }, [scene, idleGLTF, walkGLTF, runGLTF, actions, mixer, position, camera]);

  // Keyboard controls
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

  // Animation and movement
  useFrame((state, delta) => {
    if (!group.current) return;

    const speed = keys.current.shift ? 10 : 5;
    const isMoving = keys.current.w || keys.current.s || keys.current.a || keys.current.d;
    const isRunning = isMoving && keys.current.shift;
    
    // Determine target animation
    let targetAnim = 'idle';
    if (isRunning) targetAnim = 'run';
    else if (isMoving) targetAnim = 'walk';
    
    // Switch animations
    if (targetAnim !== currentAnim) {
      const prevAction = actions[Object.keys(actions)[0]];
      const nextAction = actions[Object.keys(actions)[targetAnim === 'walk' ? 1 : targetAnim === 'run' ? 2 : 0]];
      
      if (prevAction && nextAction && prevAction !== nextAction) {
        prevAction.fadeOut(0.2);
        nextAction.reset().fadeIn(0.2).play();
      }
      
      setCurrentAnim(targetAnim);
    }
    
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
    
    group.current.position.x += velocity.current.x;
    group.current.position.z += velocity.current.z;
    group.current.position.y = position[1];
    
    if (direction.current.length() > 0) {
      const angle = Math.atan2(direction.current.x, direction.current.z);
      group.current.rotation.y = angle;
    }
    
    // Camera follow
    const cameraOffset = new THREE.Vector3(0, 5, 10);
    cameraOffset.applyQuaternion(group.current.quaternion);
    camera.position.lerp(
      new THREE.Vector3(
        group.current.position.x + cameraOffset.x,
        group.current.position.y + cameraOffset.y,
        group.current.position.z + cameraOffset.z
      ),
      0.1
    );
    camera.lookAt(group.current.position);
    
    // Update mixer
    if (mixer) {
      mixer.update(delta);
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
};

// Preload animation files
useGLTF.preload('/animations/idle-male.glb');
useGLTF.preload('/animations/walk-male.glb');
useGLTF.preload('/animations/run-male.glb');

export default RPMAnimatedAvatar;