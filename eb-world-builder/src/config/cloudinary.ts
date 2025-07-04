// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  // Your Cloudinary credentials
  cloudName: 'dakxuqd2r',
  apiKey: '477297342566765',
  apiSecret: 'tPeiOnmL7nY19ZaRxmvj8Txx2ME', // Note: In production, this should be kept server-side
  uploadPreset: 'eb-world-builder', // You'll need to create this unsigned preset in Cloudinary dashboard
  
  // Folder structure in Cloudinary
  folders: {
    environments: 'eb-world/environments',
    skyboxes: 'eb-world/skyboxes',
    content: 'eb-world/content'
  },
  
  // Upload settings
  uploadSettings: {
    environment: {
      folder: 'eb-world/environments',
      resourceType: 'raw', // For non-image files like GLB
      allowedFormats: ['glb', 'gltf'],
      maxFileSize: 1000000000, // 1GB
      tags: ['environment', '3d-model']
    },
    skybox: {
      folder: 'eb-world/skyboxes',
      resourceType: 'image',
      allowedFormats: ['jpg', 'jpeg', 'png', 'hdr', 'exr'],
      maxFileSize: 200000000, // 200MB
      tags: ['skybox', 'panorama']
    },
    content: {
      folder: 'eb-world/content',
      resourceType: 'auto', // Auto-detect resource type
      allowedFormats: ['glb', 'gltf', 'jpg', 'jpeg', 'png', 'mp3', 'wav', 'ogg'],
      maxFileSize: 500000000, // 500MB
      tags: ['content']
    }
  }
};

// Helper function to get upload URL
export const getCloudinaryUploadUrl = () => {
  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`;
};

// Helper function to validate file before upload
export const validateFile = (file: File, uploadType: 'environment' | 'skybox' | 'content'): string | null => {
  const settings = CLOUDINARY_CONFIG.uploadSettings[uploadType];
  
  // Check file size
  if (file.size > settings.maxFileSize) {
    return `File too large. Maximum size is ${settings.maxFileSize / 1000000}MB`;
  }
  
  // Check file format
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !settings.allowedFormats.includes(extension)) {
    return `Invalid file format. Allowed formats: ${settings.allowedFormats.join(', ')}`;
  }
  
  return null; // No error
};