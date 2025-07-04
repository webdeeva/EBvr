import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

interface SkyboxThumbnailProps {
  url: string;
  width?: number;
  height?: number;
  onThumbnailGenerated?: (dataUrl: string) => void;
}

const SkyboxThumbnail: React.FC<SkyboxThumbnailProps> = ({
  url,
  width = 240,
  height = 160,
  onThumbnailGenerated
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      preserveDrawingBuffer: true 
    });
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.6;
    // Three.js 0.152+ uses outputColorSpace instead of outputEncoding
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0.1);

    // Check if it's an HDR file
    const isHDR = url.toLowerCase().endsWith('.hdr') || url.toLowerCase().endsWith('.exr');

    if (isHDR) {
      // Load HDR texture
      const loader = new RGBELoader();
      loader.load(
        url,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = texture;
          scene.background = texture;
          
          // Render once
          renderer.render(scene, camera);
          
          // Generate thumbnail
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnailUrl(dataUrl);
          setIsGenerating(false);
          
          if (onThumbnailGenerated) {
            onThumbnailGenerated(dataUrl);
          }
          
          // Cleanup
          texture.dispose();
        },
        undefined,
        (error) => {
          console.error('Error loading HDR:', error);
          setIsGenerating(false);
        }
      );
    } else {
      // Load regular image texture
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = texture;
          scene.background = texture;
          
          // Render once
          renderer.render(scene, camera);
          
          // Generate thumbnail
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnailUrl(dataUrl);
          setIsGenerating(false);
          
          if (onThumbnailGenerated) {
            onThumbnailGenerated(dataUrl);
          }
          
          // Cleanup
          texture.dispose();
        },
        undefined,
        (error) => {
          console.error('Error loading texture:', error);
          setIsGenerating(false);
        }
      );
    }

    return () => {
      renderer.dispose();
    };
  }, [url, width, height, onThumbnailGenerated]);

  // For regular images, we can also show them directly
  const isRegularImage = url.toLowerCase().match(/\.(jpg|jpeg|png)$/);

  if (isRegularImage && !isGenerating) {
    return (
      <img 
        src={thumbnailUrl || url} 
        alt="Skybox thumbnail" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: isGenerating ? 'block' : 'none'
        }}
      />
      {!isGenerating && thumbnailUrl && (
        <img 
          src={thumbnailUrl} 
          alt="Skybox thumbnail" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </>
  );
};

export default SkyboxThumbnail;