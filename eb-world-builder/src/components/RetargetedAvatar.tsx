import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils';

interface RetargetedAvatarProps {
  avatarUrl: string;
  position: [number, number, number];
}

const RetargetedAvatar: React.FC<RetargetedAvatarProps> = ({ avatarUrl, position }) => {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  // Load models
  const avatar = useGLTF(avatarUrl);
  const idleModel = useGLTF('/animations/idle-male.glb');
  const walkModel = useGLTF('/animations/walk-male.glb');
  const runModel = useGLTF('/animations/run-male.glb');
  
  // Clone avatar to avoid mutations
  const clonedAvatar = useMemo(() => clone(avatar.scene), [avatar.scene]);
  
  // Get all animations
  const animations = useMemo(() => {
    const anims: THREE.AnimationClip[] = [];
    
    // Add animations with descriptive names
    if (idleModel.animations.length > 0) {
      const idleClip = idleModel.animations[0].clone();
      idleClip.name = 'idle';
      anims.push(idleClip);
    }
    
    if (walkModel.animations.length > 0) {
      const walkClip = walkModel.animations[0].clone();
      walkClip.name = 'walk';
      anims.push(walkClip);
    }
    
    if (runModel.animations.length > 0) {
      const runClip = runModel.animations[0].clone();
      runClip.name = 'run';
      anims.push(runClip);
    }
    
    return anims;
  }, [idleModel.animations, walkModel.animations, runModel.animations]);
  
  // Set up animations on the avatar
  const { actions, mixer } = useAnimations(animations, group);
  
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
  });
  
  // Camera controls
  const cameraDistance = useRef(10);
  const cameraAngle = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);

  // Initialize
  useEffect(() => {
    console.log('Retargeted Avatar initialized');
    console.log('Available actions:', Object.keys(actions));
    
    if (group.current) {
      group.current.position.set(...position);
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 1, 0);
    }
    
    // Play idle animation by default
    if (actions.idle) {
      actions.idle.play();
      console.log('Playing idle animation');
    }
  }, [actions, position, camera]);

  // Keyboard and mouse controls
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
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        isMouseDown.current = true;
      }
    };
    
    const handleMouseUp = () => {
      isMouseDown.current = false;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDown.current) {
        cameraAngle.current.x -= e.movementX * 0.01;
        cameraAngle.current.y = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraAngle.current.y - e.movementY * 0.01));
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      cameraDistance.current = Math.max(5, Math.min(20, cameraDistance.current + e.deltaY * 0.01));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Update loop
  useFrame((state, delta) => {
    if (!group.current || !mixer) return;

    // Update animation mixer
    mixer.update(delta);

    const speed = keys.current.shift ? 10 : 5;
    const isMoving = keys.current.w || keys.current.s || keys.current.a || keys.current.d;
    const isRunning = isMoving && keys.current.shift;
    
    // Determine target animation
    let targetAnimation = 'idle';
    if (isRunning && actions.run) {
      targetAnimation = 'run';
    } else if (isMoving && actions.walk) {
      targetAnimation = 'walk';
    }
    
    // Switch animations with crossfade
    if (targetAnimation !== currentAnimation) {
      const fadeOutAction = actions[currentAnimation];
      const fadeInAction = actions[targetAnimation];
      
      if (fadeOutAction && fadeInAction) {
        fadeOutAction.fadeOut(0.2);
        fadeInAction.reset().fadeIn(0.2).play();
        console.log(`Switching from ${currentAnimation} to ${targetAnimation}`);
      }
      
      setCurrentAnimation(targetAnimation);
    }
    
    // Movement (camera-relative)
    const forward = new THREE.Vector3(0, 0, 0);
    const right = new THREE.Vector3(0, 0, 0);
    
    if (keys.current.w) forward.z = -1;
    if (keys.current.s) forward.z = 1;
    if (keys.current.a) right.x = -1;
    if (keys.current.d) right.x = 1;
    
    // Rotate movement based on camera angle
    const moveAngle = cameraAngle.current.x;
    direction.current.set(
      forward.z * Math.sin(moveAngle) + right.x * Math.cos(moveAngle),
      0,
      forward.z * Math.cos(moveAngle) - right.x * Math.sin(moveAngle)
    );
    
    direction.current.normalize();
    
    if (direction.current.length() > 0) {
      velocity.current.add(direction.current.multiplyScalar(speed * delta));
      
      // Face direction of movement
      const angle = Math.atan2(direction.current.x, direction.current.z);
      group.current.rotation.y = angle;
    }
    
    // Apply damping
    velocity.current.multiplyScalar(0.9);
    
    // Update position
    group.current.position.x += velocity.current.x;
    group.current.position.z += velocity.current.z;
    group.current.position.y = position[1];
    
    // Camera follow with mouse orbit controls
    const cameraOffset = new THREE.Vector3(
      Math.sin(cameraAngle.current.x) * cameraDistance.current,
      5 + Math.sin(cameraAngle.current.y) * cameraDistance.current * 0.5,
      Math.cos(cameraAngle.current.x) * cameraDistance.current
    );
    
    const desiredCameraPosition = new THREE.Vector3(
      group.current.position.x + cameraOffset.x,
      group.current.position.y + cameraOffset.y,
      group.current.position.z + cameraOffset.z
    );
    
    camera.position.lerp(desiredCameraPosition, 0.1);
    
    // Look at avatar with slight offset upward
    const lookTarget = new THREE.Vector3(
      group.current.position.x,
      group.current.position.y + 1.5,
      group.current.position.z
    );
    camera.lookAt(lookTarget);
  });

  return (
    <group ref={group}>
      <primitive object={clonedAvatar} />
    </group>
  );
};

// Preload all models
useGLTF.preload('/animations/idle-male.glb');
useGLTF.preload('/animations/walk-male.glb');
useGLTF.preload('/animations/run-male.glb');

export default RetargetedAvatar;