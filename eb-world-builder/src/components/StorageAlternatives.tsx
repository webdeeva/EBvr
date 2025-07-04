import React from 'react';

const StorageAlternatives: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 0, 0, 0.95)',
      border: '1px solid rgba(255, 140, 66, 0.3)',
      borderRadius: '12px',
      padding: '30px',
      maxWidth: '600px',
      zIndex: 10000,
      color: '#fff'
    }}>
      <h2 style={{ color: '#ff8c42', marginTop: 0 }}>Storage Solutions for GLB Files</h2>
      
      <p>Since Filestack isn't accepting GLB files, here are alternative solutions:</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ff8c42' }}>1. Cloudinary (Recommended)</h3>
        <ul>
          <li>Supports 3D models including GLB/GLTF</li>
          <li>Free tier: 25GB storage + 25GB bandwidth/month</li>
          <li>Direct URL access to uploaded files</li>
          <li>Easy integration with React</li>
        </ul>
        <a href="https://cloudinary.com/users/register/free" target="_blank" rel="noopener noreferrer" 
           style={{ color: '#ff8c42' }}>Sign up for free account →</a>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ff8c42' }}>2. Firebase Storage</h3>
        <ul>
          <li>Google's cloud storage solution</li>
          <li>Free tier: 5GB storage + 1GB/day download</li>
          <li>Works well with large files</li>
          <li>Good React integration</li>
        </ul>
        <a href="https://firebase.google.com/" target="_blank" rel="noopener noreferrer" 
           style={{ color: '#ff8c42' }}>Get started with Firebase →</a>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ff8c42' }}>3. AWS S3</h3>
        <ul>
          <li>Industry standard for file storage</li>
          <li>Free tier: 5GB storage for 12 months</li>
          <li>Supports any file type/size</li>
          <li>Requires more setup</li>
        </ul>
        <a href="https://aws.amazon.com/s3/" target="_blank" rel="noopener noreferrer" 
           style={{ color: '#ff8c42' }}>Learn about AWS S3 →</a>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ff8c42' }}>4. Supabase Storage</h3>
        <ul>
          <li>Open source Firebase alternative</li>
          <li>Free tier: 1GB storage + 2GB bandwidth</li>
          <li>Simple API for file uploads</li>
          <li>Built-in authentication</li>
        </ul>
        <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" 
           style={{ color: '#ff8c42' }}>Try Supabase →</a>
      </div>
      
      <p style={{ marginTop: '30px', fontSize: '14px', color: '#aaa' }}>
        Would you like me to implement any of these solutions? Cloudinary is the easiest for 3D models.
      </p>
      
      <button 
        onClick={onClose}
        style={{
          marginTop: '20px',
          background: '#ff8c42',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Close
      </button>
    </div>
  );
};

export default StorageAlternatives;