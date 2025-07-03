import React, { Suspense, useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, useGLTF, PerspectiveCamera } from '@react-three/drei';
import { VRButton, XR, Controllers, Hands, useXR } from '@react-three/xr';
import * as THREE from 'three';
import { useParams, useSearchParams } from 'react-router-dom';
import ChatOverlay from '../components/ChatOverlay';
import FixedRetargetedAvatar from '../components/FixedRetargetedAvatar';
import TestAvatar from '../components/TestAvatar';
import ScreenShare from '../components/ScreenShare';
import EnvironmentControls from '../components/EnvironmentControls';
import SimpleEnvironmentModel from '../components/SimpleEnvironmentModel';
import SceneObjectsList, { SceneObject } from '../components/SceneObjectsList';
import VRButtonComponent from '../components/VR/VRButton';
import VRControllers from '../components/VR/VRControllers';
import VRAvatar from '../components/VR/VRAvatar';
import VRTeleportation from '../components/VR/VRTeleportation';
import VRPanel from '../components/VR/VRPanel';
import { getStoredUserName } from '../utils/nameGenerator';
import { MessageSquare, Share2, Upload, ChevronDown, ChevronUp, Globe, Layers, User } from 'lucide-react';
import './WorldBuilder.css';

const Ground = () => {
  return (
    <mesh name="ground" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#1a1a1a" />
    </mesh>
  );
};

// Component to handle VR/non-VR avatar rendering
const AvatarManager: React.FC<{ avatarUrl: string | null; isEditingEnvironment: boolean }> = ({ 
  avatarUrl, 
  isEditingEnvironment 
}) => {
  const { isPresenting } = useXR();
  
  if (!avatarUrl || isEditingEnvironment) return null;
  
  // In VR, use VR avatar with body visible
  if (isPresenting) {
    return <VRAvatar avatarUrl={avatarUrl} />;
  }
  
  // In non-VR, use regular avatar
  if (avatarUrl === 'test-box') {
    return <TestAvatar position={[0, 0, 0]} />;
  }
  
  return (
    <FixedRetargetedAvatar 
      avatarUrl={avatarUrl}
      position={[0, 0, 0]}
    />
  );
};


const WorldBuilder: React.FC = () => {
  const { worldId } = useParams();
  const [searchParams] = useSearchParams();
  const worldName = searchParams.get('name') || 'Untitled World';
  
  const [showChat, setShowChat] = useState(false);
  const [showScreenShare, setShowScreenShare] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showEnvironmentControls, setShowEnvironmentControls] = useState(true);
  const [showObjectsList, setShowObjectsList] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarVisible, setAvatarVisible] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([]);
  const [isEditingEnvironment, setIsEditingEnvironment] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [environmentModels, setEnvironmentModels] = useState<{
    [id: string]: {
      url: string;
      transform: {
        position: [number, number, number];
        scale: number;
        rotation: [number, number, number];
        isLocked: boolean;
      };
      visible: boolean;
    };
  }>({});
  
  // Load saved data on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem('eb-avatar-url');
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }
    setUserName(getStoredUserName());
  }, []);
  
  // Save avatar URL when it changes
  useEffect(() => {
    if (avatarUrl) {
      localStorage.setItem('eb-avatar-url', avatarUrl);
    }
  }, [avatarUrl]);

  // Update scene objects list when models change
  useEffect(() => {
    const objects: SceneObject[] = [];
    
    // Add avatar if present
    if (avatarUrl) {
      objects.push({
        id: 'avatar-1',
        name: 'Player Avatar',
        type: 'avatar',
        visible: true,
        selected: selectedObjectId === 'avatar-1'
      });
    }
    
    // Add environment models
    Object.entries(environmentModels).forEach(([id, model]) => {
      objects.push({
        id,
        name: `Environment ${id.split('-')[1]}`,
        type: 'environment',
        visible: model.visible,
        selected: selectedObjectId === id
      });
    });
    
    setSceneObjects(objects);
  }, [avatarUrl, environmentModels, selectedObjectId]);

  return (
    <div className="world-builder-container">
      <div className="world-header glassmorphism-dark">
        <div className="header-left">
          <h1>{worldName}</h1>
          {userName && (
            <div className="user-info">
              <User size={12} />
              <span>{userName}</span>
            </div>
          )}
        </div>
        <div className="world-controls">
          <button 
            className={`btn-glass ${showChat ? 'active' : ''}`}
            onClick={() => setShowChat(!showChat)}
            title={showChat ? 'Hide Chat' : 'Show Chat'}
          >
            <MessageSquare size={14} />
            <span>Chat</span>
          </button>
          <button 
            className={`btn-glass ${showScreenShare ? 'active' : ''}`}
            onClick={() => setShowScreenShare(!showScreenShare)}
            title={showScreenShare ? 'Hide Screen Share' : 'Share Screen'}
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>
          <button
            className="btn-glass"
            onClick={(e) => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.glb,.gltf';
              input.onchange = (event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  const id = `env-${Date.now()}`;
                  setEnvironmentModels(prev => ({
                    ...prev,
                    [id]: {
                      url,
                      transform: {
                        position: [0, -0.5, 0],
                        scale: 1,
                        rotation: [0, 0, 0],
                        isLocked: false
                      },
                      visible: true
                    }
                  }));
                  setSelectedObjectId(id);
                  setShowEnvironmentControls(true);
                  setShowObjectsList(true);
                }
              };
              input.click();
            }}
            title="Upload Environment"
          >
            <Globe size={14} />
            <span>Environment</span>
          </button>
          <button
            className={`btn-glass ${showObjectsList ? 'active' : ''}`}
            onClick={() => setShowObjectsList(!showObjectsList)}
            title={showObjectsList ? 'Hide Objects List' : 'Show Objects List'}
          >
            <Layers size={14} />
            <span>Objects</span>
          </button>
          <VRButtonComponent />
          <button
            className={`btn-glass ${showControls ? '' : 'collapsed'}`}
            onClick={() => setShowControls(!showControls)}
            title={showControls ? 'Hide Controls' : 'Show Controls'}
          >
            {showControls ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <Canvas className="world-canvas">
        <XR>
          <Suspense fallback={null}>
          {!avatarUrl && (
            <PerspectiveCamera 
              makeDefault 
              position={Object.keys(environmentModels).length > 0 ? [15, 10, 15] : [0, 5, 10]} 
              fov={60}
            />
          )}
          <Sky 
            distance={450000}
            sunPosition={[100, 20, 100]}
            inclination={0}
            azimuth={0.25}
          />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Ground />
          <gridHelper args={[100, 100, 0x444444, 0x222222]} position={[0, -0.49, 0]} />
          {Object.keys(environmentModels).length > 0 && <axesHelper args={[5]} />}
          
          {/* Fixed reference markers to help see movement */}
          {Object.keys(environmentModels).length > 0 && (
            <>
              <mesh position={[10, 1, 0]}>
                <boxGeometry args={[1, 2, 1]} />
                <meshBasicMaterial color="yellow" wireframe />
              </mesh>
              <mesh position={[-10, 1, 0]}>
                <boxGeometry args={[1, 2, 1]} />
                <meshBasicMaterial color="cyan" wireframe />
              </mesh>
              <mesh position={[0, 1, 10]}>
                <boxGeometry args={[1, 2, 1]} />
                <meshBasicMaterial color="magenta" wireframe />
              </mesh>
            </>
          )}
          
          <AvatarManager 
            avatarUrl={avatarUrl} 
            isEditingEnvironment={isEditingEnvironment} 
          />
          
          {/* VR Components */}
          <VRControllers />
          <VRTeleportation />
          <VRPanel userName={userName} worldName={worldName} />
          
          {Object.entries(environmentModels).map(([id, model]) => {
            // Debug: Log what props are being passed to SimpleEnvironmentModel
            if (selectedObjectId === id) {
              console.log('[WorldBuilder] Passing props to selected SimpleEnvironmentModel:', {
                id,
                position: model.transform.position,
                scale: model.transform.scale,
                rotation: model.transform.rotation,
                isSelected: selectedObjectId === id,
                url: model.url
              });
            }
            
            return model.visible && (
              <SimpleEnvironmentModel
                key={id}
                url={model.url}
                position={model.transform.position}
                scale={model.transform.scale}
                rotation={model.transform.rotation}
                isSelected={selectedObjectId === id}
              />
            );
          })}
          
          {/* Always show OrbitControls for camera movement */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
          <Environment preset="sunset" />
          </Suspense>
        </XR>
      </Canvas>

      {showChat && (
        <ChatOverlay worldId={worldId || ''} />
      )}

      {showScreenShare && (
        <ScreenShare onClose={() => setShowScreenShare(false)} />
      )}

      {selectedObjectId && environmentModels[selectedObjectId] && showControls && (
        <>
          {!showEnvironmentControls && (
            <button
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                padding: '10px 16px',
                backgroundColor: 'rgba(204, 85, 0, 0.2)',
                border: '1px solid rgba(204, 85, 0, 0.4)',
                borderRadius: '8px',
                color: '#ff8c42',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(204, 85, 0, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(204, 85, 0, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(204, 85, 0, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(204, 85, 0, 0.4)';
              }}
              onClick={() => setShowEnvironmentControls(true)}
            >
              <Globe size={16} />
              Show Environment Controls
            </button>
          )}
          {showEnvironmentControls && (
            <EnvironmentControls
          position={environmentModels[selectedObjectId].transform.position}
          scale={environmentModels[selectedObjectId].transform.scale}
          rotation={environmentModels[selectedObjectId].transform.rotation}
          isLocked={environmentModels[selectedObjectId].transform.isLocked}
          onPositionChange={(position) => {
            console.log('Position changed to:', position);
            setEnvironmentModels(prev => ({
              ...prev,
              [selectedObjectId]: {
                ...prev[selectedObjectId],
                transform: { ...prev[selectedObjectId].transform, position }
              }
            }));
          }}
          onScaleChange={(scale) => {
            console.log('[WorldBuilder] Scale changed to:', scale, 'for object:', selectedObjectId);
            console.log('[WorldBuilder] Avatar present:', !!avatarUrl);
            setEnvironmentModels(prev => ({
              ...prev,
              [selectedObjectId]: {
                ...prev[selectedObjectId],
                transform: { ...prev[selectedObjectId].transform, scale }
              }
            }));
          }}
          onRotationChange={(rotation) => {
            console.log('Rotation changed to:', rotation);
            setEnvironmentModels(prev => ({
              ...prev,
              [selectedObjectId]: {
                ...prev[selectedObjectId],
                transform: { ...prev[selectedObjectId].transform, rotation }
              }
            }));
          }}
          onLockToggle={() => {
            const newLocked = !environmentModels[selectedObjectId].transform.isLocked;
            setEnvironmentModels(prev => ({
              ...prev,
              [selectedObjectId]: {
                ...prev[selectedObjectId],
                transform: { 
                  ...prev[selectedObjectId].transform, 
                  isLocked: newLocked 
                }
              }
            }));
            // Set editing state - hide avatar when unlocked (editing)
            setIsEditingEnvironment(!newLocked);
          }}
          onReset={() => 
            setEnvironmentModels(prev => ({
              ...prev,
              [selectedObjectId]: {
                ...prev[selectedObjectId],
                transform: {
                  position: [0, -0.5, 0],
                  scale: 1,
                  rotation: [0, 0, 0],
                  isLocked: false
                }
              }
            }))
          }
              onClose={() => {
                setShowEnvironmentControls(false);
                setIsEditingEnvironment(false);
              }}
            />
          )}
        </>
      )}

      {showObjectsList && (
        <SceneObjectsList
          objects={sceneObjects}
          onSelectObject={(id) => {
            setSelectedObjectId(id);
            if (id.startsWith('env-')) {
              setShowEnvironmentControls(true);
            }
          }}
          onDeleteObject={(id) => {
            if (id === 'avatar-1') {
              if (window.confirm('Are you sure you want to delete your avatar?')) {
                setAvatarUrl(null);
                setIsEditingEnvironment(false);
                localStorage.removeItem('eb-avatar-url');
              }
            } else if (id.startsWith('env-')) {
              setEnvironmentModels(prev => {
                const newModels = { ...prev };
                delete newModels[id];
                return newModels;
              });
              if (selectedObjectId === id) {
                setSelectedObjectId(null);
                setShowEnvironmentControls(false);
              }
            }
          }}
          onToggleVisibility={(id) => {
            if (id.startsWith('env-')) {
              setEnvironmentModels(prev => ({
                ...prev,
                [id]: {
                  ...prev[id],
                  visible: !prev[id].visible
                }
              }));
            }
          }}
        />
      )}

      {avatarUrl && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '15px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px'
        }}>
          <div style={{marginBottom: '10px', fontWeight: 'bold'}}>Controls:</div>
          <div>W/A/S/D - Move</div>
          <div>Shift - Run</div>
          <div>Mouse - Look around</div>
          <button
            style={{
              marginTop: '15px',
              width: '100%',
              padding: '8px',
              backgroundColor: 'rgba(255, 59, 48, 0.2)',
              border: '1px solid rgba(255, 59, 48, 0.4)',
              borderRadius: '6px',
              color: '#ff6b6b',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.4)';
            }}
            onClick={() => {
              if (window.confirm('Are you sure you want to delete your avatar?')) {
                setAvatarUrl(null);
                setIsEditingEnvironment(false);
                localStorage.removeItem('eb-avatar-url');
              }
            }}
          >
            Delete Avatar
          </button>
        </div>
      )}

      {!avatarUrl && (
        <div className="avatar-setup glassmorphism-dark">
          <h2>Set Up Your Avatar</h2>
          <p>Create your Ready Player Me avatar to join the world</p>
          <button 
            className="btn-primary"
            onClick={() => {
              // Use the official Ready Player Me iframe URL
              const popup = window.open(
                `https://readyplayer.me/avatar?frameApi`,
                'readyPlayerMeAvatar',
                'width=800,height=600'
              );
              
              const messageHandler = (event: MessageEvent) => {
                console.log('Received message:', event);
                
                // Parse the message data
                let json;
                try {
                  json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                } catch (e) {
                  json = event.data;
                }
                
                // Check if message is from Ready Player Me
                if (json?.source !== 'readyplayerme') {
                  return;
                }
                
                // Handle Ready Player Me events
                if (json.eventName === 'v1.frame.ready') {
                  console.log('Ready Player Me frame is ready');
                  // Subscribe to all events
                  popup?.postMessage(
                    JSON.stringify({
                      target: 'readyplayerme',
                      type: 'subscribe',
                      eventName: 'v1.**'
                    }),
                    '*'
                  );
                }
                
                // Get avatar URL when exported
                if (json.eventName === 'v1.avatar.exported') {
                  console.log('Avatar exported:', json.data.url);
                  setAvatarUrl(json.data.url);
                  window.removeEventListener('message', messageHandler);
                  popup?.close();
                }
              };
              
              window.addEventListener('message', messageHandler);
            }}
          >
            Create Avatar
          </button>
          <div style={{marginTop: '20px', padding: '10px', borderTop: '1px solid rgba(255,255,255,0.2)'}}>
            <p style={{fontSize: '12px', marginBottom: '10px'}}>Or paste your Ready Player Me avatar URL:</p>
            <input 
              type="text"
              placeholder="https://models.readyplayer.me/YOUR_AVATAR_ID.glb"
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                color: 'white'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  const url = input.value.trim();
                  if (url && url.includes('readyplayer.me')) {
                    // Ensure it's a GLB URL
                    let glbUrl = url;
                    if (!url.endsWith('.glb')) {
                      // Extract avatar ID and construct GLB URL
                      const idMatch = url.match(/([a-f0-9]{24})/i);
                      if (idMatch) {
                        glbUrl = `https://models.readyplayer.me/${idMatch[1]}.glb`;
                      }
                    }
                    console.log('Manual avatar URL:', glbUrl);
                    setAvatarUrl(glbUrl);
                    input.value = '';
                  }
                }
              }}
            />
            <small style={{color: '#888'}}>Press Enter to load avatar</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldBuilder;