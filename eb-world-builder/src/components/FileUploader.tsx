import React, { useRef } from 'react';

interface FileUploaderProps {
  onImageUpload: (url: string) => void;
  onSoundUpload: (url: string) => void;
  onModelUpload: (url: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onImageUpload, 
  onSoundUpload,
  onModelUpload 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const fileType = file.type;

    if (fileType.startsWith('image/')) {
      onImageUpload(url);
    } else if (fileType.startsWith('audio/')) {
      onSoundUpload(url);
    } else if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
      onModelUpload(url);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*,.glb,.gltf"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <button 
        className="btn-glass"
        onClick={() => fileInputRef.current?.click()}
      >
        📁 Upload
      </button>
    </>
  );
};

export default FileUploader;