import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, useGLTF } from '@react-three/drei';
import { useParams, useSearchParams } from 'react-router-dom';
import ChatOverlay from '../components/ChatOverlay';
import AvatarController from '../components/AvatarController';
import ScreenShare from '../components/ScreenShare';
import FileUploader from '../components/FileUploader';
import './WorldBuilder.css';

const Ground = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#1a1a1a" />
    </mesh>
  );
};

const EnvironmentModel = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
};

const WorldBuilder: React.FC = () => {
  const { worldId } = useParams();
  const [searchParams] = useSearchParams();
  const worldName = searchParams.get('name') || 'Untitled World';
  
  const [showChat, setShowChat] = useState(true);
  const [showScreenShare, setShowScreenShare] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [environmentModel, setEnvironmentModel] = useState<string | null>(null);

  return (
    <div className="world-builder-container">
      <div className="world-header glassmorphism-dark">
        <h1>{worldName}</h1>
        <div className="world-controls">
          <button 
            className="btn-glass"
            onClick={() => setShowChat(!showChat)}
          >
            💬 Chat
          </button>
          <button 
            className="btn-glass"
            onClick={() => setShowScreenShare(!showScreenShare)}
          >
            🖥️ Share Screen
          </button>
          <FileUploader 
            onImageUpload={(url) => console.log('Image uploaded:', url)}
            onSoundUpload={(url) => console.log('Sound uploaded:', url)}
            onModelUpload={(url) => setEnvironmentModel(url)}
          />
        </div>
      </div>

      <Canvas className="world-canvas">
        <Suspense fallback={null}>
          <Sky 
            distance={450000}
            sunPosition={[100, 20, 100]}
            inclination={0}
            azimuth={0.25}
          />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Ground />
          
          {avatarUrl && (
            <AvatarController 
              avatarUrl={avatarUrl}
              position={[0, 0, 0]}
            />
          )}
          
          {environmentModel && (
            <EnvironmentModel url={environmentModel} />
          )}
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>

      {showChat && (
        <ChatOverlay worldId={worldId || ''} />
      )}

      {showScreenShare && (
        <ScreenShare onClose={() => setShowScreenShare(false)} />
      )}

      {!avatarUrl && (
        <div className="avatar-setup glassmorphism-dark">
          <h2>Set Up Your Avatar</h2>
          <p>Create your Ready Player Me avatar to join the world</p>
          <button 
            className="btn-primary"
            onClick={() => {
              const subdomain = 'demo';
              const popup = window.open(
                `https://${subdomain}.readyplayer.me/avatar?frameApi`,
                'readyPlayerMeAvatar',
                'width=800,height=600'
              );
              
              const messageHandler = (event: MessageEvent) => {
                if (event.origin !== `https://${subdomain}.readyplayer.me`) return;
                
                if (event.data?.source === 'readyplayerme' && event.data?.eventName === 'v1.avatar.exported') {
                  setAvatarUrl(event.data.data.url);
                  window.removeEventListener('message', messageHandler);
                  popup?.close();
                }
              };
              
              window.addEventListener('message', messageHandler);
            }}
          >
            Create Avatar
          </button>
        </div>
      )}
    </div>
  );
};

export default WorldBuilder;