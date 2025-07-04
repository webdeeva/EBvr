import React, { useState, useRef } from 'react';
import { CLOUDINARY_CONFIG, getCloudinaryUploadUrl, validateFile } from '../config/cloudinary';
import { Upload, X, Loader } from 'lucide-react';
import './CloudinaryUpload.css';

interface CloudinaryUploadProps {
  show: boolean;
  uploadType: 'environment' | 'skybox' | 'content';
  onSuccess: (result: any) => void;
  onClose: () => void;
  onError?: (error: any) => void;
}

const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  show,
  uploadType,
  onSuccess,
  onClose,
  onError
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!show) return null;

  const settings = CLOUDINARY_CONFIG.uploadSettings[uploadType];
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    const validationError = validateFile(file, uploadType);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    // Check if we need to create upload preset first
    if (!CLOUDINARY_CONFIG.uploadPreset) {
      setError('Please create an unsigned upload preset named "eb-world-builder" in your Cloudinary dashboard');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      console.log('[CloudinaryUpload] Starting upload:', {
        file: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
        folder: settings.folder,
        resourceType: settings.resourceType
      });
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', settings.folder);
      // Don't send resource_type for unsigned uploads - let Cloudinary auto-detect
      // formData.append('resource_type', settings.resourceType);
      formData.append('tags', settings.tags.join(','));
      
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            console.log('Cloudinary upload success:', result);
            
            // Return the result with the secure URL
            onSuccess({
              filesUploaded: [{
                url: result.secure_url,
                filename: result.original_filename,
                size: result.bytes,
                type: result.resource_type,
                format: result.format
              }]
            });
            
            // Reset state
            setSelectedFile(null);
            setUploadProgress(0);
            onClose();
          } catch (parseError) {
            console.error('Failed to parse response:', xhr.responseText);
            setError('Invalid response from server');
          }
        } else {
          console.error('Upload failed with status:', xhr.status);
          console.error('Response:', xhr.responseText);
          try {
            const errorData = JSON.parse(xhr.responseText);
            setError(errorData.error?.message || 'Upload failed');
          } catch {
            setError(`Upload failed with status ${xhr.status}`);
          }
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        const errorMsg = 'Upload failed. Please check your internet connection.';
        setError(errorMsg);
        if (onError) onError(new Error(errorMsg));
      });
      
      // Send request - use the correct endpoint based on resource type
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${settings.resourceType}/upload`;
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      if (onError) onError(err);
    } finally {
      setUploading(false);
    }
  };

  const getAcceptString = () => {
    return settings.allowedFormats.map(ext => `.${ext}`).join(',');
  };

  const getTitle = () => {
    switch (uploadType) {
      case 'environment':
        return 'Upload Environment Model';
      case 'skybox':
        return 'Upload Skybox Image';
      case 'content':
        return 'Upload Content';
      default:
        return 'Upload File';
    }
  };

  return (
    <div className="cloudinary-upload-overlay">
      <div className="cloudinary-upload-modal">
        <div className="cloudinary-upload-header">
          <h2>{getTitle()}</h2>
          <button className="cloudinary-upload-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="cloudinary-upload-body">
          {error && (
            <div className="cloudinary-error">
              {error}
            </div>
          )}
          
          <div 
            className="cloudinary-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptString()}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              multiple={uploadType === 'content'}
            />
            
            {selectedFile ? (
              <div className="cloudinary-file-info">
                <p className="cloudinary-file-name">{selectedFile.name}</p>
                <p className="cloudinary-file-size">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                <Upload size={48} />
                <p>Click to select files or drag and drop</p>
                <p className="cloudinary-formats">
                  Accepted formats: {settings.allowedFormats.join(', ')}
                </p>
                <p className="cloudinary-max-size">
                  Max size: {settings.maxFileSize / 1024 / 1024} MB
                </p>
              </>
            )}
          </div>
          
          {uploading && (
            <div className="cloudinary-progress">
              <div className="cloudinary-progress-bar">
                <div 
                  className="cloudinary-progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p>{uploadProgress}% uploaded</p>
            </div>
          )}
          
          <div className="cloudinary-actions">
            <button 
              className="cloudinary-button cloudinary-button-cancel"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button 
              className="cloudinary-button cloudinary-button-upload"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader className="cloudinary-spinner" size={16} />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudinaryUpload;