import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useXR } from '@react-three/xr';
import { Group, SkinnedMesh, Bone } from 'three';
import { useFrame } from '@react-three/fiber';

interface VRAvatarProps {
  avatarUrl: string;
}

const VRAvatar: React.FC<VRAvatarProps> = ({ avatarUrl }) => {
  const { scene } = useGLTF(avatarUrl);
  const { player, isPresenting } = useXR();
  const avatarRef = useRef<Group>(null);
  const headBone = useRef<Bone | null>(null);

  useEffect(() => {
    if (scene && isPresenting) {
      // Find and hide the head mesh for first-person VR
      scene.traverse((child) => {
        if (child instanceof SkinnedMesh) {
          // Look for head bone
          const skeleton = child.skeleton;
          if (skeleton) {
            const bones = skeleton.bones;
            const head = bones.find(bone => 
              bone.name.toLowerCase().includes('head') ||
              bone.name.toLowerCase().includes('neck')
            );
            if (head) {
              headBone.current = head;
            }
          }

          // Hide head-related meshes
          if (child.name.toLowerCase().includes('head') ||
              child.name.toLowerCase().includes('eye') ||
              child.name.toLowerCase().includes('hair')) {
            child.visible = false;
          }
        }
      });
    }
  }, [scene, isPresenting]);

  useFrame(() => {
    if (avatarRef.current && player && isPresenting) {
      // Position avatar at player position
      avatarRef.current.position.copy(player.position);
      avatarRef.current.position.y = 0; // Keep feet on ground
      
      // Rotate avatar based on player rotation
      avatarRef.current.quaternion.copy(player.quaternion);
      
      // Optional: Update head bone position to match HMD
      if (headBone.current) {
        const headOffset = player.position.clone();
        headOffset.y += 1.6; // Approximate head height
        headBone.current.position.copy(headOffset);
      }
    }
  });

  if (!isPresenting) {
    return null; // Don't show VR avatar when not in VR
  }

  return (
    <group ref={avatarRef}>
      <primitive object={scene.clone()} />
    </group>
  );
};

export default VRAvatar;