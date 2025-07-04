import React from 'react';

const StorageOptions: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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
      maxWidth: '700px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 10000,
      color: '#fff'
    }}>
      <h2 style={{ color: '#ff8c42', marginTop: 0 }}>Best Storage Solutions for Large 3D Files</h2>
      
      <div style={{ marginBottom: '25px', padding: '20px', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '8px' }}>
        <h3 style={{ color: '#4CAF50', marginTop: 0 }}>🏆 Recommended: AWS S3 + CloudFront</h3>
        <ul style={{ marginBottom: '15px' }}>
          <li><strong>File size limit:</strong> 5TB per file</li>
          <li><strong>Cost:</strong> ~$0.023/GB storage + ~$0.085/GB transfer</li>
          <li><strong>For 10GB of GLB files:</strong> ~$0.23/month storage + transfer costs</li>
          <li><strong>Features:</strong> Global CDN, no file restrictions, scales infinitely</li>
        </ul>
        <p>Perfect for 3D models. I can implement this for you right now.</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ff8c42' }}>2. Firebase Storage (Google)</h3>
        <ul>
          <li><strong>File size limit:</strong> 5GB per file</li>
          <li><strong>Free tier:</strong> 5GB storage + 1GB/day download</li>
          <li><strong>Paid:</strong> $0.026/GB storage + $0.12/GB download</li>
          <li>Easy setup, good for medium-sized projects</li>
        </ul>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ff8c42' }}>3. Backblaze B2</h3>
        <ul>
          <li><strong>File size limit:</strong> 10TB per file</li>
          <li><strong>Cost:</strong> $0.005/GB storage (10x cheaper than S3)</li>
          <li><strong>Free:</strong> 10GB storage + 1GB/day download</li>
          <li>Very affordable, S3-compatible API</li>
        </ul>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ff8c42' }}>4. Supabase Storage</h3>
        <ul>
          <li><strong>File size limit:</strong> 5GB per file</li>
          <li><strong>Free tier:</strong> 1GB storage + 2GB transfer</li>
          <li><strong>Pro:</strong> $25/month for 100GB storage</li>
          <li>Includes authentication and database</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ff8c42' }}>5. R2 by Cloudflare</h3>
        <ul>
          <li><strong>File size limit:</strong> 5TB per file</li>
          <li><strong>Cost:</strong> $0.015/GB storage (no transfer fees!)</li>
          <li><strong>Free tier:</strong> 10GB storage</li>
          <li>Zero egress fees - great for frequently accessed files</li>
        </ul>
      </div>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: 'rgba(255, 140, 66, 0.1)', 
        border: '1px solid rgba(255, 140, 66, 0.3)', 
        borderRadius: '6px' 
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          Which would you like to implement? AWS S3 is the most robust and I can set it up quickly.
        </p>
      </div>
      
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
          fontSize: '16px',
          width: '100%'
        }}
      >
        Close
      </button>
    </div>
  );
};

export default StorageOptions;