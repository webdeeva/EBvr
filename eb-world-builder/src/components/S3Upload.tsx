import React, { useState, useRef } from 'react';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload as S3Upload } from '@aws-sdk/lib-storage';
import { AWS_CONFIG, getS3FileUrl, validateFile } from '../config/aws';
import { Upload, X, Loader } from 'lucide-react';
import { supabase } from '../config/supabase';
import './S3Upload.css';

interface S3UploadProps {
  show: boolean;
  uploadType: 'environment' | 'skybox' | 'content';
  onSuccess: (result: any) => void;
  onClose: () => void;
  onError?: (error: any) => void;
}

const S3UploadComponent: React.FC<S3UploadProps> = ({
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
  const uploadRef = useRef<S3Upload | null>(null);

  if (!show) return null;

  const settings = AWS_CONFIG.uploadSettings[uploadType];
  
  // Initialize S3 client
  console.log('[S3Upload] Initializing S3 client with config:', {
    region: AWS_CONFIG.region,
    bucket: AWS_CONFIG.bucketName,
    hasAccessKey: !!AWS_CONFIG.accessKeyId,
    hasSecretKey: !!AWS_CONFIG.secretAccessKey
  });
  
  const s3Client = new S3Client({
    region: AWS_CONFIG.region,
    credentials: {
      accessKeyId: AWS_CONFIG.accessKeyId,
      secretAccessKey: AWS_CONFIG.secretAccessKey
    },
    // Disable checksums to avoid CRC32 errors
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED'
  });
  
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
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      const timestamp = Date.now();
      const fileName = `${timestamp}-${selectedFile.name}`;
      const key = `${settings.folder}${fileName}`;
      
      const contentType = (settings.contentTypes as any)[extension] || 'application/octet-stream';
      
      console.log('[S3Upload] Starting upload:', {
        file: selectedFile.name,
        size: selectedFile.size,
        key: key,
        contentType: contentType
      });
      
      // Use multipart upload for large files
      const upload = new S3Upload({
        client: s3Client,
        params: {
          Bucket: AWS_CONFIG.bucketName,
          Key: key,
          Body: selectedFile,
          ContentType: contentType
          // Removed ACL - bucket policy will handle public access
        },
        // Configure multipart upload
        partSize: 5 * 1024 * 1024, // 5MB parts
        queueSize: 4, // Parallel parts
        leavePartsOnError: false
      });
      
      // Store upload reference so we can abort if needed
      uploadRef.current = upload;
      
      // Track upload progress
      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && progress.total) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setUploadProgress(percent);
          console.log(`[S3Upload] Progress: ${percent}%`);
        }
      });
      
      // Wait for upload to complete
      const result = await upload.done();
      console.log('[S3Upload] Upload complete:', result);
      
      // Get the public URL
      const fileUrl = getS3FileUrl(key);
      
      // Save to database if user is authenticated (non-blocking)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const { error } = await supabase
            .from('user_uploads')
            .insert({
              user_id: user.id,
              type: uploadType,
              name: selectedFile.name,
              url: fileUrl,
              file_size: selectedFile.size,
              mime_type: contentType,
              metadata: {
                key: key,
                extension: extension,
                uploadedAt: Date.now()
              }
            });
          
          if (error) {
            console.error('[S3Upload] Failed to save to database:', error);
            console.error('[S3Upload] Database error details:', {
              code: error.code,
              message: error.message,
              details: error.details
            });
          } else {
            console.log('[S3Upload] Successfully saved to database');
          }
        } catch (dbError) {
          console.error('[S3Upload] Database error:', dbError);
        }
      }
      
      // Call success callback (this is what adds the skybox to the UI)
      onSuccess({
        filesUploaded: [{
          url: fileUrl,
          filename: selectedFile.name,
          size: selectedFile.size,
          type: extension,
          key: key,
          uploadedAt: Date.now()
        }]
      });
      
      // Reset state
      setSelectedFile(null);
      setUploadProgress(0);
      onClose();
      
    } catch (err) {
      console.error('[S3Upload] Upload error:', err);
      console.error('[S3Upload] Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        fullError: err
      });
      
      // Log specific AWS SDK error details
      if (err && typeof err === 'object' && '$metadata' in err) {
        console.error('[S3Upload] AWS SDK Error Metadata:', (err as any).$metadata);
        console.error('[S3Upload] AWS Request ID:', (err as any).$metadata?.requestId);
        console.error('[S3Upload] AWS HTTP Status:', (err as any).$metadata?.httpStatusCode);
      }
      
      let errorMessage = 'Upload failed';
      if (err instanceof Error) {
        if (err.message.includes('NetworkingError') || err.message.includes('Network')) {
          errorMessage = 'Network error. Check CORS settings on your S3 bucket.';
        } else if (err.message.includes('Access Denied') || err.message.includes('403')) {
          errorMessage = 'Access denied. Check your AWS credentials and bucket permissions.';
        } else if (err.message.includes('CredentialsError')) {
          errorMessage = 'Invalid AWS credentials. Please check your access key and secret key.';
        } else if (err.message.includes('No \'Access-Control-Allow-Origin\'')) {
          errorMessage = 'CORS error. Your S3 bucket needs proper CORS configuration.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      if (onError) onError(err);
    } finally {
      setUploading(false);
      uploadRef.current = null;
    }
  };

  const handleCancel = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      setUploading(false);
      setUploadProgress(0);
    }
    onClose();
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
    <div className="s3-upload-overlay">
      <div className="s3-upload-modal">
        <div className="s3-upload-header">
          <h2>{getTitle()}</h2>
          <button className="s3-upload-close" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>
        
        <div className="s3-upload-body">
          {error && (
            <div className="s3-error">
              {error}
            </div>
          )}
          
          <div 
            className="s3-dropzone"
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
              <div className="s3-file-info">
                <p className="s3-file-name">{selectedFile.name}</p>
                <p className="s3-file-size">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                <Upload size={48} />
                <p>Click to select files or drag and drop</p>
                <p className="s3-formats">
                  Accepted formats: {settings.allowedFormats.join(', ')}
                </p>
                <p className="s3-max-size">
                  Max size: {settings.maxFileSize / (1024 * 1024 * 1024)} GB
                </p>
              </>
            )}
          </div>
          
          {uploading && (
            <div className="s3-progress">
              <div className="s3-progress-bar">
                <div 
                  className="s3-progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p>{uploadProgress}% uploaded</p>
            </div>
          )}
          
          <div className="s3-actions">
            <button 
              className="s3-button s3-button-cancel"
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancel
            </button>
            <button 
              className="s3-button s3-button-upload"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader className="s3-spinner" size={16} />
                  Uploading...
                </>
              ) : (
                'Upload to S3'
              )}
            </button>
          </div>
          
          <div className="s3-info">
            <p>Powered by AWS S3 • No file size limits</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default S3UploadComponent;