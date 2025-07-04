import React, { Suspense, useState, useRef, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, PerspectiveCamera } from '@react-three/drei';
import { XR, VRButton, useXR, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ChatOverlay from '../components/ChatOverlay';
import S3UploadComponent from '../components/S3Upload';
import ContentBrowser from '../components/ContentBrowser';
import SkyboxManager from '../components/SkyboxManager';
import AvatarWithVoiceState from '../components/AvatarWithVoiceState';
import FixedRetargetedAvatar from '../components/FixedRetargetedAvatar';
import ScreenShare from '../components/ScreenShare';
import EnvironmentControls from '../components/EnvironmentControls';
import SimpleEnvironmentModel from '../components/SimpleEnvironmentModel';
import SceneObjectsList, { SceneObject } from '../components/SceneObjectsList';
import GroundControls from '../components/GroundControls';
import ContentDisplay from '../components/ContentDisplay';
import VRButtonComponent from '../components/VR/VRButton';
import VRScene from '../components/VR/VRScene';
import VRPanel from '../components/VR/VRPanel';
import VoiceChatWrapper from '../components/VoiceChatWrapper';
import AuthComponent from '../components/Auth';
import { getStoredUserName } from '../utils/nameGenerator';
import { AWS_CONFIG } from '../config/aws';
import { supabase } from '../config/supabase';
import { MessageSquare, Share2, Upload, Globe, Layers, User, Image, Music, Package, Eye, EyeOff, FolderOpen, Cloud, ZoomIn, ZoomOut, UserCheck, LogOut, Save, AlertCircle, X, ChevronUp, Lock } from 'lucide-react';
import VoiceButtonOverlay from '../components/VoiceButtonOverlay';
import './WorldBuilder.css';

export const Ground: React.FC<{ 
  visible: boolean;
  size: number;
  color: string;
  textureUrl: string | null;
}> = ({ visible, size, color, textureUrl }) => {
  if (!visible) return null;
  
  const texture = textureUrl ? new THREE.TextureLoader().load(textureUrl) : null;
  if (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(size / 10, size / 10);
  }
  
  return (
    <mesh name="ground" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial 
        color={color} 
        map={texture}
      />
    </mesh>
  );
};

// Component to handle VR/non-VR avatar rendering
const AvatarManager = React.memo<{ 
  avatarUrl: string | null; 
  isEditingEnvironment: boolean;
  cameraMode: 'normal' | 'zoom' | 'birdseye';
  userName: string;
}>(({ 
  avatarUrl, 
  isEditingEnvironment,
  cameraMode,
  userName
}) => {
  const { isPresenting } = useXR();
  
  if (!avatarUrl || isEditingEnvironment) return null;
  
  // In VR, don't show desktop avatar (VR body is handled separately)
  if (isPresenting) {
    return null;
  }
  
  // In non-VR, use regular avatar
  return (
    <AvatarWithVoiceState 
      avatarUrl={avatarUrl}
      position={[0, -0.5, 0]}
      cameraMode={cameraMode}
      userName={userName}
    />
  );
});


// Create XR store outside component
const xrStore = createXRStore();

const WorldBuilder: React.FC = () => {
  const { worldId } = useParams();
  const [searchParams] = useSearchParams();
  const worldName = searchParams.get('name') || 'Untitled World';
  const isTemp = searchParams.get('temp') === 'true';
  const navigate = useNavigate();
  
  const [showChat, setShowChat] = useState(false);
  const [showScreenShare, setShowScreenShare] = useState(false);
  const showControls = true; // Always show controls when requested
  const [showEnvironmentControls, setShowEnvironmentControls] = useState(true);
  const [showObjectsList, setShowObjectsList] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarVisible, setAvatarVisible] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([]);
  const [showControlsPanel, setShowControlsPanel] = useState(true);
  const [isEditingEnvironment, setIsEditingEnvironment] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [showEnvironmentPicker, setShowEnvironmentPicker] = useState(false);
  const [showSkyboxPicker, setShowSkyboxPicker] = useState(false);
  const [showContentPicker, setShowContentPicker] = useState(false);
  const [currentSkyboxId, setCurrentSkyboxId] = useState<string | null>(null);
  const [skyboxes, setSkyboxes] = useState<{
    [id: string]: {
      url: string;
      filename: string;
      uploadedAt: number;
      thumbnail?: string;
    };
  }>({});
  const [groundVisible, setGroundVisible] = useState(true);
  const [showGroundControls, setShowGroundControls] = useState(false);
  const [groundSettings, setGroundSettings] = useState({
    size: 100,
    color: '#1a1a1a',
    textureUrl: null as string | null,
    showGrid: true,
    isLocked: true
  });
  const [showContentBrowser, setShowContentBrowser] = useState(false);
  const [showSkyboxManager, setShowSkyboxManager] = useState(false);
  const [cameraMode, setCameraMode] = useState<'normal' | 'zoom' | 'birdseye'>('normal');
  const [contentItems, setContentItems] = useState<{
    [id: string]: {
      url: string;
      type: 'image' | 'audio' | 'model';
      position: [number, number, number];
      scale: number;
      rotation: [number, number, number];
      visible: boolean;
      isLocked?: boolean;
      filename?: string;
      uploadedAt?: number;
    };
  }>({});
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
  
  // Authentication and session state
  const [user, setUser] = useState<any>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showVoiceChatPrompt, setShowVoiceChatPrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [actualWorldId, setActualWorldId] = useState<string | null>(null);
  const [saveNotification, setSaveNotification] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });
  const [isPublic, setIsPublic] = useState(true);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  
  // Generate random access code
  const generateAccessCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setAccessCode(code);
    return code;
  };
  
  // Save world to database
  const saveWorld = async () => {
    if (!user || isTemp) {
      setShowAuthPrompt(true);
      return;
    }

    setIsSaving(true);
    try {
      console.log('Starting save process...');
      
      // Prepare assets array
      const assets: any[] = [];

      // Add environments
      Object.entries(environmentModels).forEach(([id, model]) => {
        assets.push({
          type: 'environment',
          url: model.url,
          metadata: { 
            position: model.transform.position,
            scale: model.transform.scale,
            rotation: model.transform.rotation,
            visible: model.visible, 
            isLocked: model.transform.isLocked 
          }
        });
      });

      // Add skyboxes
      Object.entries(skyboxes).forEach(([id, skybox]) => {
        assets.push({
          type: 'skybox',
          url: skybox.url,
          metadata: { 
            filename: skybox.filename,
            uploadedAt: skybox.uploadedAt,
            thumbnail: skybox.thumbnail,
            isCurrent: id === currentSkyboxId
          }
        });
      });

      // Add content items
      Object.entries(contentItems).forEach(([id, item]) => {
        assets.push({
          type: 'content',
          url: item.url,
          metadata: { 
            position: item.position,
            scale: item.scale,
            rotation: item.rotation,
            visible: item.visible,
            filename: item.filename,
            uploadedAt: item.uploadedAt,
            contentType: item.type
          }
        });
      });

      // Get current skybox thumbnail URL
      let thumbnailUrl = null;
      if (currentSkyboxId && skyboxes[currentSkyboxId]) {
        thumbnailUrl = skyboxes[currentSkyboxId].thumbnail || skyboxes[currentSkyboxId].url;
      }

      // Call the database function
      const { data, error } = await supabase.rpc('save_world', {
        p_world_id: actualWorldId,
        p_world_name: worldName,
        p_owner_id: user.id,
        p_settings: { 
          max_users: 20, 
          is_public: isPublic,
          access_code: !isPublic ? (accessCode || generateAccessCode()) : null,
          thumbnail_url: thumbnailUrl
        },
        p_assets: assets
      });

      if (error) throw error;
      
      const worldUuid = data;
      if (!actualWorldId && worldUuid) {
        setActualWorldId(worldUuid);
      }

      setLastSaved(new Date());
      console.log('World saved successfully!');
      
      // Show success notification
      setSaveNotification({
        show: true,
        type: 'success',
        message: 'World saved successfully!'
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setSaveNotification({ show: false, type: 'success', message: '' });
      }, 3000);
      
      // Update URL to use the actual world ID
      if (!actualWorldId && worldUuid) {
        window.history.replaceState({}, '', `/world/${worldUuid}?name=${encodeURIComponent(worldName)}`);
      }
    } catch (error: any) {
      console.error('Error saving world:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to save world';
      if (error.code === '42501') {
        errorMessage = 'Permission denied. Please make sure you are logged in.';
      } else if (error.code === '23505') {
        errorMessage = 'A world with this ID already exists.';
      } else if (error.message) {
        errorMessage = `Failed to save: ${error.message}`;
      }
      
      setSaveNotification({
        show: true,
        type: 'error',
        message: errorMessage
      });
      
      // Hide notification after 5 seconds for errors
      setTimeout(() => {
        setSaveNotification({ show: false, type: 'error', message: '' });
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Load world data
  const loadWorld = async (worldUuid: string) => {
    try {
      // Load world details
      const { data: world, error: worldError } = await supabase
        .from('worlds')
        .select('*')
        .eq('id', worldUuid)
        .single();

      if (worldError) throw worldError;

      // Load privacy settings
      if (world) {
        setIsPublic(world.settings?.is_public ?? true);
        setAccessCode(world.settings?.access_code || null);
      }

      // Load world assets
      const { data: assets, error: assetsError } = await supabase
        .from('world_assets')
        .select('*')
        .eq('world_id', worldUuid);

      if (assetsError) throw assetsError;

      // Process assets
      const newEnvironments: typeof environmentModels = {};
      const newSkyboxes: typeof skyboxes = {};
      const newContentItems: typeof contentItems = {};
      let currentSkybox: string | null = null;

      assets?.forEach((asset, index) => {
        if (asset.type === 'environment') {
          newEnvironments[`env-${index}`] = {
            url: asset.url,
            transform: {
              position: asset.metadata?.position || [0, 0, 0],
              scale: asset.metadata?.scale || 1,
              rotation: asset.metadata?.rotation || [0, 0, 0],
              isLocked: asset.metadata?.isLocked || false
            },
            visible: asset.metadata?.visible ?? true
          };
        } else if (asset.type === 'skybox') {
          const skyboxId = `skybox-${index}`;
          newSkyboxes[skyboxId] = {
            url: asset.url,
            filename: asset.metadata?.filename || 'Skybox',
            uploadedAt: asset.metadata?.uploadedAt || Date.now(),
            thumbnail: asset.metadata?.thumbnail
          };
          if (asset.metadata?.isCurrent) {
            currentSkybox = skyboxId;
          }
        } else if (asset.type === 'content') {
          newContentItems[`content-${index}`] = {
            url: asset.url,
            type: asset.metadata?.contentType as 'image' | 'audio' | 'model',
            position: asset.metadata?.position || [0, 0, 0],
            scale: asset.metadata?.scale || 1,
            rotation: asset.metadata?.rotation || [0, 0, 0],
            visible: asset.metadata?.visible ?? true,
            isLocked: true,
            filename: asset.metadata?.filename,
            uploadedAt: asset.metadata?.uploadedAt
          };
        }
      });

      setEnvironmentModels(newEnvironments);
      setSkyboxes(newSkyboxes);
      setContentItems(newContentItems);
      setCurrentSkyboxId(currentSkybox);
      setLastSaved(world.updated_at ? new Date(world.updated_at) : null);
    } catch (error) {
      console.error('Error loading world:', error);
    }
  };

  // Load saved data on mount
  useEffect(() => {
    // Check authentication
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      
      // If user is logged in, try to load avatar from database
      if (user) {
        // TODO: Load avatar from user profile in database
        const savedAvatar = localStorage.getItem('eb-avatar-url');
        if (savedAvatar) {
          setAvatarUrl(savedAvatar);
        }
      } else {
        // Guest user - load from localStorage
        const savedAvatar = localStorage.getItem('eb-avatar-url');
        if (savedAvatar) {
          setAvatarUrl(savedAvatar);
        }
      }
    });
    
    setUserName(getStoredUserName());

    // If it's not a temp world and we have a valid UUID, load it
    if (!isTemp && worldId && worldId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      setActualWorldId(worldId);
      loadWorld(worldId);
    }
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Save avatar URL when it changes
  useEffect(() => {
    if (avatarUrl) {
      localStorage.setItem('eb-avatar-url', avatarUrl);
    }
  }, [avatarUrl]);
  
  // Timer for temporary session warning
  useEffect(() => {
    if (!user && isTemp) {
      const timer = setTimeout(() => {
        setShowTimeWarning(true);
        setShowAuthPrompt(true);
      }, 45 * 60 * 1000); // 45 minutes
      
      return () => clearTimeout(timer);
    }
  }, [user, isTemp]);

  // Load user uploads from database
  useEffect(() => {
    const loadUserUploads = async () => {
      if (!user) return;
      
      try {
        // Load skyboxes
        const { data: skyboxData, error: skyboxError } = await supabase
          .from('user_uploads')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'skybox')
          .order('created_at', { ascending: false });
          
        if (skyboxError) {
          console.error('Error loading skyboxes:', skyboxError);
        } else if (skyboxData) {
          const skyboxMap: { [id: string]: any } = {};
          skyboxData.forEach(skybox => {
            skyboxMap[skybox.id] = {
              url: skybox.url,
              filename: skybox.name,
              uploadedAt: new Date(skybox.created_at).getTime(),
              thumbnail: skybox.thumbnail_url
            };
          });
          setSkyboxes(prev => ({ ...prev, ...skyboxMap }));
        }
        
        // Load environment models
        const { data: envData, error: envError } = await supabase
          .from('user_uploads')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'environment')
          .order('created_at', { ascending: false });
          
        if (envError) {
          console.error('Error loading environments:', envError);
        } else if (envData) {
          const envMap: { [id: string]: any } = {};
          envData.forEach(env => {
            envMap[env.id] = {
              url: env.url,
              name: env.name,
              transform: {
                position: [0, 0, 0],
                scale: [1, 1, 1],
                rotation: [0, 0, 0],
                isLocked: false
              },
              uploadedAt: new Date(env.created_at).getTime()
            };
          });
          setEnvironmentModels(prev => ({ ...prev, ...envMap }));
        }
        
        // Load content items
        const { data: contentData, error: contentError } = await supabase
          .from('user_uploads')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'content')
          .order('created_at', { ascending: false });
          
        if (contentError) {
          console.error('Error loading content:', contentError);
        } else if (contentData) {
          const contentMap: { [id: string]: any } = {};
          contentData.forEach(content => {
            contentMap[content.id] = {
              url: content.url,
              type: content.metadata?.extension || 'image',
              position: [0, 0, 0],
              scale: 1,
              rotation: [0, 0, 0],
              isLocked: false,
              uploadedAt: new Date(content.created_at).getTime()
            };
          });
          setContentItems(prev => ({ ...prev, ...contentMap }));
        }
      } catch (error) {
        console.error('Error loading user uploads:', error);
      }
    };
    
    loadUserUploads();
  }, [user]);

  // Fetch username from profiles when user is logged in
  useEffect(() => {
    if (user) {
      const fetchUsername = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
          
          if (data?.username) {
            setUserName(data.username);
          }
        } catch (err) {
          console.error('Error fetching username:', err);
        }
      };
      
      fetchUsername();
    } else {
      // Use generated username for guests
      setUserName(getStoredUserName());
    }
  }, [user]);

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
    
    // Add content items
    Object.entries(contentItems).forEach(([id, item]) => {
      const typeLabel = item.type === 'audio' ? '🎵' : item.type === 'model' ? '📦' : '🖼️';
      objects.push({
        id,
        name: `${typeLabel} Content ${id.split('-').pop()}`,
        type: 'object',
        visible: item.visible,
        selected: selectedObjectId === id
      });
    });
    
    setSceneObjects(objects);
  }, [avatarUrl, environmentModels, contentItems, selectedObjectId]);

  return (
    <>
      <VoiceButtonOverlay user={user} onAuthPrompt={() => setShowVoiceChatPrompt(true)} />
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
            onClick={() => setShowEnvironmentPicker(true)}
            title="Upload Environment"
          >
            <Globe size={14} />
            <span>Environment</span>
          </button>
          <button
            className="btn-glass"
            onClick={() => setShowSkyboxPicker(true)}
            title="Upload Skybox"
          >
            <Image size={14} />
            <span>Skybox</span>
          </button>
          <button
            className={`btn-glass ${showSkyboxManager ? 'active' : ''}`}
            onClick={() => setShowSkyboxManager(!showSkyboxManager)}
            title="Manage Skyboxes"
          >
            <Cloud size={14} />
            <span>Skyboxes</span>
          </button>
          <button
            className="btn-glass"
            onClick={() => setShowContentPicker(true)}
            title="Upload Content"
          >
            <Upload size={14} />
            <span>Upload</span>
          </button>
          <button
            className={`btn-glass ${showContentBrowser ? 'active' : ''}`}
            onClick={() => setShowContentBrowser(!showContentBrowser)}
            title="Browse Content"
          >
            <FolderOpen size={14} />
            <span>Browse</span>
          </button>
          <button
            className={`btn-glass ${showObjectsList ? 'active' : ''}`}
            onClick={() => setShowObjectsList(!showObjectsList)}
            title={showObjectsList ? 'Hide Objects List' : 'Show Objects List'}
          >
            <Layers size={14} />
            <span>Objects</span>
          </button>
          <button
            className={`btn-glass ${showEnvironmentControls && selectedObjectId ? 'active' : ''} ${!selectedObjectId ? 'inactive' : ''}`}
            onClick={() => {
              if (selectedObjectId && (environmentModels[selectedObjectId] || contentItems[selectedObjectId])) {
                setShowEnvironmentControls(!showEnvironmentControls);
              }
            }}
            title={!selectedObjectId ? 'Select an object first' : (showEnvironmentControls ? 'Hide Controls' : 'Show Controls')}
            disabled={!selectedObjectId}
          >
            <ZoomIn size={14} />
            <span>Controls</span>
          </button>
          <button
            className={`btn-glass ${showGroundControls ? 'active' : ''}`}
            onClick={() => setShowGroundControls(!showGroundControls)}
            title={showGroundControls ? 'Hide Ground Controls' : 'Show Ground Controls'}
          >
            <Layers size={14} />
            <span>Ground</span>
          </button>
          
          {/* Voice Chat Button - moved to overlay */}
          
          <VRButtonComponent />
          
          {/* Privacy toggle - only show for logged in users */}
          {user && (
            <button
              className={`btn-glass ${!isPublic ? 'active' : ''}`}
              onClick={() => {
                setIsPublic(!isPublic);
                if (isPublic && !accessCode) {
                  generateAccessCode();
                }
              }}
              title={isPublic ? 'World is public' : `Private - Code: ${accessCode}`}
            >
              {isPublic ? <Globe size={14} /> : <Lock size={14} />}
              <span>{isPublic ? 'Public' : 'Private'}</span>
            </button>
          )}
          
          {/* Save button - only show for logged in users */}
          {user && (
            <button
              className={`btn-glass ${isSaving ? 'saving' : ''}`}
              onClick={saveWorld}
              disabled={isSaving}
              title={lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Save world'}
            >
              <Save size={14} />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          )}
          
          <button
            className="btn-glass btn-leave"
            onClick={() => {
              if (window.confirm('Are you sure you want to leave this world?')) {
                // If user is authenticated, go to dashboard; otherwise go to landing page
                if (user) {
                  navigate('/dashboard');
                } else {
                  navigate('/');
                }
              }
            }}
            title="Leave World"
          >
            <LogOut size={14} />
            <span>Leave</span>
          </button>
        </div>
      </div>

      <VRButton store={xrStore} />
      <Canvas className="world-canvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} onCreated={() => console.log('Canvas recreated!')}>
        <XR store={xrStore}>
          <Suspense fallback={null}>
          {!avatarUrl && (
            <PerspectiveCamera 
              makeDefault 
              position={Object.keys(environmentModels).length > 0 ? [15, 10, 15] : [0, 5, 10]} 
              fov={60}
            />
          )}
          {currentSkyboxId && skyboxes[currentSkyboxId] ? (
            <Environment files={skyboxes[currentSkyboxId].url} background />
          ) : (
            <Sky 
              distance={450000}
              sunPosition={[100, 20, 100]}
              inclination={0}
              azimuth={0.25}
            />
          )}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Ground 
            visible={groundVisible} 
            size={groundSettings.size}
            color={groundSettings.color}
            textureUrl={groundSettings.textureUrl}
          />
          {groundVisible && groundSettings.showGrid && <gridHelper args={[groundSettings.size, groundSettings.size, 0x444444, 0x222222]} position={[0, -0.49, 0]} />}
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
            cameraMode={cameraMode}
            userName={userName}
          />
          
          {/* VR Components */}
          <VRScene />
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
          
          {/* Render content items */}
          {Object.entries(contentItems).map(([id, item]) => (
            item.visible && (
              <ContentDisplay
                key={id}
                content={{ id, ...item }}
                isSelected={selectedObjectId === id}
                onSelect={() => {
                  setSelectedObjectId(id);
                  // Unlock the content item when selected
                  setContentItems(prev => ({
                    ...prev,
                    [id]: {
                      ...prev[id],
                      isLocked: false
                    }
                  }));
                  // Hide avatar for editing
                  setIsEditingEnvironment(true);
                  // Show controls
                  setShowEnvironmentControls(true);
                }}
              />
            )
          ))}
          
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

      {showContentBrowser && (
        <ContentBrowser
          contentItems={contentItems}
          onClose={() => setShowContentBrowser(false)}
          onDelete={(id) => {
            setContentItems(prev => {
              const newItems = { ...prev };
              delete newItems[id];
              return newItems;
            });
            if (selectedObjectId === id) {
              setSelectedObjectId(null);
            }
          }}
          onToggleVisibility={(id) => {
            setContentItems(prev => ({
              ...prev,
              [id]: {
                ...prev[id],
                visible: !prev[id].visible
              }
            }));
          }}
          onSelect={(id) => {
            setSelectedObjectId(id);
            setShowContentBrowser(false);
          }}
          selectedId={selectedObjectId}
        />
      )}

      {showSkyboxManager && (
        <SkyboxManager
          skyboxes={skyboxes}
          currentSkyboxId={currentSkyboxId}
          onClose={() => setShowSkyboxManager(false)}
          onSelect={(id) => {
            setCurrentSkyboxId(id);
            setShowSkyboxManager(false);
          }}
          onDelete={(id) => {
            setSkyboxes(prev => {
              const newSkyboxes = { ...prev };
              delete newSkyboxes[id];
              return newSkyboxes;
            });
            if (currentSkyboxId === id) {
              setCurrentSkyboxId(null);
            }
          }}
          onClearSkybox={() => {
            setCurrentSkyboxId(null);
          }}
        />
      )}


      {showControls && showEnvironmentControls && !selectedObjectId && (
        <div className="environment-controls">
          <div className="controls-header">
            <h3>Environment Controls</h3>
            <button 
              className="icon-btn"
              onClick={() => setShowEnvironmentControls(false)}
              title="Close controls"
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            <p>Select an object or image to adjust its position, scale, and rotation.</p>
          </div>
        </div>
      )}

      {selectedObjectId && environmentModels[selectedObjectId] && showControls && showEnvironmentControls && (
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

      {selectedObjectId && contentItems[selectedObjectId] && showControls && showEnvironmentControls && (
        <EnvironmentControls
          position={contentItems[selectedObjectId].position}
          scale={contentItems[selectedObjectId].scale}
          rotation={contentItems[selectedObjectId].rotation}
          isLocked={contentItems[selectedObjectId].isLocked || false}
          onPositionChange={(position) => {
            if (!contentItems[selectedObjectId].isLocked) {
              setContentItems(prev => ({
                ...prev,
                [selectedObjectId]: {
                  ...prev[selectedObjectId],
                  position
                }
              }));
            }
          }}
          onScaleChange={(scale) => {
            if (!contentItems[selectedObjectId].isLocked) {
              setContentItems(prev => ({
                ...prev,
                [selectedObjectId]: {
                  ...prev[selectedObjectId],
                  scale
                }
              }));
            }
          }}
          onRotationChange={(rotation) => {
            if (!contentItems[selectedObjectId].isLocked) {
              setContentItems(prev => ({
                ...prev,
                [selectedObjectId]: {
                  ...prev[selectedObjectId],
                  rotation
                }
              }));
            }
          }}
          onLockToggle={() => {
            const newLocked = !contentItems[selectedObjectId].isLocked;
            setContentItems(prev => ({
              ...prev,
              [selectedObjectId]: {
                ...prev[selectedObjectId],
                isLocked: newLocked
              }
            }));
            // Set editing state - hide avatar when unlocked (editing)
            setIsEditingEnvironment(!newLocked);
          }}
          onReset={() => {
            setContentItems(prev => ({
              ...prev,
              [selectedObjectId]: {
                ...prev[selectedObjectId],
                position: [0, 2, 0],
                scale: contentItems[selectedObjectId].type === 'image' ? 3 : 1,
                rotation: [0, 0, 0]
              }
            }));
          }}
          onClose={() => {
            setShowEnvironmentControls(false);
            setIsEditingEnvironment(false);
            // Lock the content when closing
            setContentItems(prev => ({
              ...prev,
              [selectedObjectId]: {
                ...prev[selectedObjectId],
                isLocked: true
              }
            }));
          }}
        />
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
            } else if (id.startsWith('content-')) {
              setContentItems(prev => {
                const newItems = { ...prev };
                delete newItems[id];
                return newItems;
              });
              if (selectedObjectId === id) {
                setSelectedObjectId(null);
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
            } else if (id.startsWith('content-')) {
              setContentItems(prev => ({
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

      {showGroundControls && (
        <GroundControls
          size={groundSettings.size}
          color={groundSettings.color}
          textureUrl={groundSettings.textureUrl}
          showGrid={groundSettings.showGrid}
          isLocked={groundSettings.isLocked}
          onSizeChange={(size) => {
            setGroundSettings(prev => ({ ...prev, size }));
          }}
          onColorChange={(color) => {
            setGroundSettings(prev => ({ ...prev, color }));
          }}
          onTextureChange={(url) => {
            setGroundSettings(prev => ({ ...prev, textureUrl: url }));
          }}
          onGridToggle={() => {
            setGroundSettings(prev => ({ ...prev, showGrid: !prev.showGrid }));
          }}
          onLockToggle={() => {
            const newLocked = !groundSettings.isLocked;
            setGroundSettings(prev => ({ ...prev, isLocked: newLocked }));
            // Hide avatar when editing (unlocked)
            setIsEditingEnvironment(!newLocked);
          }}
          onReset={() => {
            setGroundSettings({
              size: 100,
              color: '#1a1a1a',
              textureUrl: null,
              showGrid: true,
              isLocked: true
            });
            setIsEditingEnvironment(false);
          }}
          onClose={() => {
            setShowGroundControls(false);
            setIsEditingEnvironment(false);
            // Lock ground when closing
            setGroundSettings(prev => ({ ...prev, isLocked: true }));
          }}
          onUploadTexture={() => {
            // Create a temporary flag to indicate we're uploading a ground texture
            sessionStorage.setItem('uploadingGroundTexture', 'true');
            setShowContentPicker(true);
          }}
        />
      )}

      {avatarUrl && showControlsPanel && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '16px',
          background: 'rgba(15, 15, 25, 0.7)',
          borderRadius: '16px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 140, 66, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          color: 'white',
          fontSize: '13px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minWidth: '240px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '-8px'
          }}>
            <div style={{
              fontWeight: '600',
              color: 'rgba(255, 140, 66, 0.8)',
              textTransform: 'uppercase',
              fontSize: '11px',
              letterSpacing: '1px'
            }}>Controls</div>
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 140, 66, 0.1)',
                borderRadius: '6px',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                color: 'rgba(255, 255, 255, 0.6)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 140, 66, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.2)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.1)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              }}
              onClick={() => setShowControlsPanel(false)}
              title="Hide controls"
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>W/A/S/D - Move</div>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Shift - Run</div>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Mouse - Look around</div>
          
          <div style={{
            fontWeight: '600',
            color: 'rgba(255, 140, 66, 0.8)',
            textTransform: 'uppercase',
            fontSize: '11px',
            letterSpacing: '1px',
            marginTop: '16px',
            marginBottom: '8px'
          }}>Camera</div>
          <div style={{
            display: 'flex',
            gap: '5px',
            marginTop: '5px'
          }}>
            <button
              style={{
                padding: '8px 12px',
                background: cameraMode === 'normal' ? 'rgba(255, 140, 66, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid ' + (cameraMode === 'normal' ? 'rgba(255, 140, 66, 0.3)' : 'rgba(255, 140, 66, 0.1)'),
                borderRadius: '8px',
                color: cameraMode === 'normal' ? 'white' : 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (cameraMode !== 'normal') {
                  e.currentTarget.style.background = 'rgba(255, 140, 66, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.2)';
                }
              }}
              onMouseOut={(e) => {
                if (cameraMode !== 'normal') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.1)';
                }
              }}
              onClick={() => setCameraMode('normal')}
              title="Normal View"
            >
              <ZoomOut size={14} />
              Normal
            </button>
            <button
              style={{
                padding: '8px 12px',
                background: cameraMode === 'zoom' ? 'rgba(255, 140, 66, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid ' + (cameraMode === 'zoom' ? 'rgba(255, 140, 66, 0.3)' : 'rgba(255, 140, 66, 0.1)'),
                borderRadius: '8px',
                color: cameraMode === 'zoom' ? 'white' : 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (cameraMode !== 'zoom') {
                  e.currentTarget.style.background = 'rgba(255, 140, 66, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.2)';
                }
              }}
              onMouseOut={(e) => {
                if (cameraMode !== 'zoom') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.1)';
                }
              }}
              onClick={() => setCameraMode('zoom')}
              title="Zoom In View"
            >
              <ZoomIn size={14} />
              Zoom
            </button>
            <button
              style={{
                padding: '8px 12px',
                background: cameraMode === 'birdseye' ? 'rgba(255, 140, 66, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid ' + (cameraMode === 'birdseye' ? 'rgba(255, 140, 66, 0.3)' : 'rgba(255, 140, 66, 0.1)'),
                borderRadius: '8px',
                color: cameraMode === 'birdseye' ? 'white' : 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (cameraMode !== 'birdseye') {
                  e.currentTarget.style.background = 'rgba(255, 140, 66, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.2)';
                }
              }}
              onMouseOut={(e) => {
                if (cameraMode !== 'birdseye') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.1)';
                }
              }}
              onClick={() => setCameraMode('birdseye')}
              title="First Person View"
            >
              <Eye size={14} />
              First Person
            </button>
          </div>
          <button
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 140, 66, 0.2)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.9)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 140, 66, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
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

      {avatarUrl && !showControlsPanel && (
        <button
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            width: '48px',
            height: '48px',
            background: 'rgba(15, 15, 25, 0.7)',
            borderRadius: '12px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 140, 66, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.8)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 140, 66, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.3)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(15, 15, 25, 0.7)';
            e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.15)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onClick={() => setShowControlsPanel(true)}
          title="Show controls"
        >
          <ChevronUp size={20} />
        </button>
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

      {/* S3 Upload */}
      <S3UploadComponent
        show={showEnvironmentPicker}
        uploadType="environment"
        onClose={() => setShowEnvironmentPicker(false)}
        onSuccess={(result: any) => {
          const files = result?.filesUploaded || result?.files || [];
          const fileArray = Array.isArray(files) ? files : [files];
          
          if (!fileArray || fileArray.length === 0 || !fileArray[0]) {
            console.error('No files uploaded');
            setShowEnvironmentPicker(false);
            return;
          }
          
          const file = fileArray[0];
          const fileUrl = file.url || file.handle || file.uploadURL;
          
          if (!fileUrl) {
            console.error('No URL found in file data:', file);
            setShowEnvironmentPicker(false);
            return;
          }
          
          const id = `env-${Date.now()}`;
          setEnvironmentModels(prev => ({
            ...prev,
            [id]: {
              url: fileUrl,
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
          setShowEnvironmentPicker(false);
        }}
        onError={(error) => {
          console.error('Environment upload error:', error);
          alert('Failed to upload environment file. Please try again.');
        }}
      />

      <S3UploadComponent
        show={showSkyboxPicker}
        uploadType="skybox"
        onClose={() => setShowSkyboxPicker(false)}
        onSuccess={(result: any) => {
          const files = result?.filesUploaded || result?.files || [];
          const fileArray = Array.isArray(files) ? files : [files];
          
          if (!fileArray || fileArray.length === 0 || !fileArray[0]) {
            console.error('No skybox file uploaded');
            setShowSkyboxPicker(false);
            return;
          }
          
          const file = fileArray[0];
          const fileUrl = file.url || file.handle || file.uploadURL;
          
          if (!fileUrl) {
            console.error('No URL found in skybox file data:', file);
            setShowSkyboxPicker(false);
            return;
          }
          
          const id = `skybox-${Date.now()}`;
          setSkyboxes(prev => ({
            ...prev,
            [id]: {
              url: fileUrl,
              filename: file.filename || file.name || `skybox-${id}`,
              uploadedAt: file.uploadedAt || Date.now()
            }
          }));
          setCurrentSkyboxId(id);
          setShowSkyboxPicker(false);
          setShowSkyboxManager(true);
        }}
        onError={(error) => {
          console.error('Skybox upload error:', error);
          alert('Failed to upload skybox. Please try again.');
        }}
      />

      <S3UploadComponent
        show={showContentPicker}
        uploadType="content"
        onClose={() => setShowContentPicker(false)}
        onSuccess={(result: any) => {
          const files = result?.filesUploaded || result?.files || [];
          const fileArray = Array.isArray(files) ? files : [files];
          
          if (!fileArray || fileArray.length === 0) {
            console.error('No content files uploaded');
            setShowContentPicker(false);
            return;
          }
          
          // Check if this is a ground texture upload
          const isGroundTexture = sessionStorage.getItem('uploadingGroundTexture') === 'true';
          sessionStorage.removeItem('uploadingGroundTexture');
          
          if (isGroundTexture && fileArray.length > 0) {
            // Handle ground texture upload
            const file = fileArray[0];
            const fileUrl = file.url || file.handle || file.uploadURL;
            if (fileUrl) {
              setGroundSettings(prev => ({ ...prev, textureUrl: fileUrl }));
            }
            setShowContentPicker(false);
            return;
          }
          
          // Handle multiple content files
          fileArray.forEach((file, index) => {
            if (!file) {
              console.error('Invalid content file at index', index);
              return;
            }
            
            const fileUrl = file.url || file.handle || file.uploadURL;
            if (!fileUrl) {
              console.error('No URL found in content file data:', file);
              return;
            }
            
            const id = `content-${Date.now()}-${index}`;
            let type: 'image' | 'audio' | 'model' = 'image';
            
            const filename = file.filename || file.name || '';
            const mimetype = file.mimetype || file.type || '';
            
            if (mimetype.startsWith('audio/')) {
              type = 'audio';
            } else if (filename.endsWith('.glb') || filename.endsWith('.gltf')) {
              type = 'model';
            }
            
            setContentItems(prev => ({
              ...prev,
              [id]: {
                url: fileUrl,
                type,
                position: [index * 2 - 2, 2, -2] as [number, number, number],
                scale: type === 'image' ? 3 : 1,
                rotation: [0, 0, 0] as [number, number, number],
                visible: true,
                isLocked: false,
                filename: file.filename || file.name || `${type}-${id}`,
                uploadedAt: file.uploadedAt || Date.now()
              }
            }));
          });
          setShowContentPicker(false);
          setShowObjectsList(true);
        }}
        onError={(error) => {
          console.error('Content upload error:', error);
          alert('Failed to upload content. Please try again.');
        }}
      />

      {/* Voice Chat */}
      {userName && worldId && user && (
        <div style={{ display: 'none' }}>
          <VoiceChatWrapper
            roomName={worldId}
            userName={userName}
            minimal={false}
          />
        </div>
      )}
      
      {/* Auth Prompt Modal */}
      {(showAuthPrompt || showVoiceChatPrompt) && (
        <div className="auth-modal-overlay" onClick={() => {
          setShowAuthPrompt(false);
          setShowVoiceChatPrompt(false);
        }}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="auth-modal-close"
              onClick={() => {
                setShowAuthPrompt(false);
                setShowVoiceChatPrompt(false);
              }}
            >
              ×
            </button>
            {showVoiceChatPrompt && (
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <AlertCircle size={48} color="#ff8c42" style={{ marginBottom: '16px' }} />
                <h2>Sign in to use voice chat</h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px' }}>
                  Voice chat requires an account for security and moderation.
                </p>
              </div>
            )}
            {showTimeWarning && (
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <AlertCircle size={48} color="#ff8c42" style={{ marginBottom: '16px' }} />
                <h2>Your session is about to expire</h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px' }}>
                  Sign in now to save your world and continue building!
                </p>
              </div>
            )}
            <AuthComponent onSuccess={() => {
              setShowAuthPrompt(false);
              setShowVoiceChatPrompt(false);
              setShowTimeWarning(false);
            }} />
          </div>
        </div>
      )}
      
      {/* Temporary User Banner */}
      {isTemp && !user && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 24px',
          background: 'rgba(255, 140, 66, 0.1)',
          border: '1px solid rgba(255, 140, 66, 0.3)',
          borderRadius: '20px',
          color: '#ff8c42',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 100,
        }}>
          <AlertCircle size={16} />
          Temporary session - <span 
            style={{ textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => setShowAuthPrompt(true)}
          >
            Sign in to save
          </span>
        </div>
      )}

      {/* Save Notification */}
      {saveNotification.show && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 24px',
          background: saveNotification.type === 'success' 
            ? 'rgba(76, 175, 80, 0.9)' 
            : 'rgba(244, 67, 54, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: `1px solid ${saveNotification.type === 'success' 
            ? 'rgba(76, 175, 80, 0.3)' 
            : 'rgba(244, 67, 54, 0.3)'}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000,
          animation: 'slideDown 0.3s ease-out'
        }}>
          {saveNotification.type === 'success' ? (
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Save size={16} />
            </div>
          ) : (
            <AlertCircle size={24} />
          )}
          {saveNotification.message}
        </div>
      )}
    </div>
    </>
  );
};

export default WorldBuilder;