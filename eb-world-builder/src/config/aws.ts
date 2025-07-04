// AWS S3 Configuration
export const AWS_CONFIG = {
  // Your AWS credentials
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || '',
  region: process.env.REACT_APP_AWS_REGION || 'us-east-2',
  bucketName: process.env.REACT_APP_AWS_BUCKET_NAME || 'eb-world-builder-assets',
  
  // Folder structure in S3
  folders: {
    environments: 'environments/',
    skyboxes: 'skyboxes/',
    content: 'content/'
  },
  
  // Upload settings
  uploadSettings: {
    environment: {
      folder: 'environments/',
      allowedFormats: ['glb', 'gltf'],
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
      contentTypes: {
        'glb': 'model/gltf-binary',
        'gltf': 'model/gltf+json'
      }
    },
    skybox: {
      folder: 'skyboxes/',
      allowedFormats: ['jpg', 'jpeg', 'png', 'hdr', 'exr'],
      maxFileSize: 500 * 1024 * 1024, // 500MB
      contentTypes: {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'hdr': 'image/vnd.radiance',
        'exr': 'image/x-exr'
      }
    },
    content: {
      folder: 'content/',
      allowedFormats: ['glb', 'gltf', 'jpg', 'jpeg', 'png', 'mp3', 'wav', 'ogg'],
      maxFileSize: 1024 * 1024 * 1024, // 1GB
      contentTypes: {
        'glb': 'model/gltf-binary',
        'gltf': 'model/gltf+json',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg'
      }
    }
  }
};

// Helper function to get file URL after upload
export const getS3FileUrl = (key: string) => {
  return `https://${AWS_CONFIG.bucketName}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`;
};

// Helper function to validate file before upload
export const validateFile = (file: File, uploadType: 'environment' | 'skybox' | 'content'): string | null => {
  const settings = AWS_CONFIG.uploadSettings[uploadType];
  
  // Check file size
  if (file.size > settings.maxFileSize) {
    return `File too large. Maximum size is ${settings.maxFileSize / (1024 * 1024 * 1024)}GB`;
  }
  
  // Check file format
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !settings.allowedFormats.includes(extension)) {
    return `Invalid file format. Allowed formats: ${settings.allowedFormats.join(', ')}`;
  }
  
  return null; // No error
};