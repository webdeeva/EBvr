import React, { useState } from 'react';
import { PickerOverlay } from 'filestack-react';
import FilestackPicker from './FilestackPicker';
import FilestackPickerJs from './FilestackPickerJs';
import { FILESTACK_API_KEY, filestackConfig } from '../config/filestack';

const FilestackDebug: React.FC = () => {
  const [showBasicPicker, setShowBasicPicker] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showJsPicker, setShowJsPicker] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [testType, setTestType] = useState<'environment' | 'skybox' | 'content'>('environment');

  const addResult = (type: string, result: any) => {
    setResults(prev => [...prev, { type, result, timestamp: new Date().toISOString() }]);
  };

  const addError = (type: string, error: any) => {
    setErrors(prev => [...prev, { type, error, timestamp: new Date().toISOString() }]);
  };

  const getPickerOptions = () => {
    switch (testType) {
      case 'environment':
        return filestackConfig.environment;
      case 'skybox':
        return filestackConfig.skybox;
      case 'content':
        return filestackConfig.content;
      default:
        return filestackConfig.environment;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 60,
      left: 20,
      background: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid rgba(255, 140, 66, 0.3)',
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '400px',
      maxHeight: '500px',
      overflow: 'auto',
      zIndex: 1000
    }}>
      <h3 style={{ color: '#ff8c42', marginTop: 0 }}>Filestack Debug Panel</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ color: '#fff', marginRight: '10px' }}>Test Type:</label>
        <select 
          value={testType} 
          onChange={(e) => setTestType(e.target.value as any)}
          style={{
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
            padding: '5px',
            borderRadius: '4px'
          }}
        >
          <option value="environment">Environment (.glb/.gltf)</option>
          <option value="skybox">Skybox (images)</option>
          <option value="content">Content (mixed)</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#aaa', fontSize: '12px' }}>Current config for {testType}:</p>
        <pre style={{ color: '#888', fontSize: '10px', background: '#111', padding: '5px', borderRadius: '4px' }}>
          {JSON.stringify(getPickerOptions(), null, 2)}
        </pre>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setShowBasicPicker(true)}
          style={{
            background: '#ff8c42',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Basic
        </button>
        <button 
          onClick={() => setShowCustomPicker(true)}
          style={{
            background: '#ff8c42',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Custom
        </button>
        <button 
          onClick={() => setShowJsPicker(true)}
          style={{
            background: '#ff8c42',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test JS
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ color: '#4CAF50' }}>Results:</h4>
          {results.map((r, i) => (
            <div key={i} style={{ color: '#aaa', fontSize: '12px', marginBottom: '5px' }}>
              <strong>{r.type}:</strong> {JSON.stringify(r.result)}
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div>
          <h4 style={{ color: '#f44336' }}>Errors:</h4>
          {errors.map((e, i) => (
            <div key={i} style={{ color: '#f44336', fontSize: '12px', marginBottom: '5px' }}>
              <strong>{e.type}:</strong> {JSON.stringify(e.error)}
            </div>
          ))}
        </div>
      )}

      {/* Basic PickerOverlay */}
      {showBasicPicker && (
        <PickerOverlay
          apikey={FILESTACK_API_KEY}
          onSuccess={(res) => {
            addResult(`Basic PickerOverlay (${testType})`, res);
            setShowBasicPicker(false);
          }}
          onError={(err) => {
            addError(`Basic PickerOverlay (${testType})`, err);
            setShowBasicPicker(false);
          }}
          onClose={() => {
            addResult(`Basic PickerOverlay (${testType})`, 'Closed without upload');
            setShowBasicPicker(false);
          }}
          pickerOptions={getPickerOptions()}
        />
      )}

      {/* Custom FilestackPicker */}
      <FilestackPicker
        show={showCustomPicker}
        apikey={FILESTACK_API_KEY}
        onClose={() => {
          addResult(`Custom FilestackPicker (${testType})`, 'Closed');
          setShowCustomPicker(false);
        }}
        onSuccess={(res) => {
          addResult(`Custom FilestackPicker (${testType})`, res);
          setShowCustomPicker(false);
        }}
        onError={(err) => {
          addError(`Custom FilestackPicker (${testType})`, err);
        }}
        pickerOptions={getPickerOptions()}
      />

      {/* Direct JS Implementation */}
      <FilestackPickerJs
        show={showJsPicker}
        apikey={FILESTACK_API_KEY}
        onClose={() => {
          addResult(`JS Implementation (${testType})`, 'Closed');
          setShowJsPicker(false);
        }}
        onSuccess={(res) => {
          addResult(`JS Implementation (${testType})`, res);
          setShowJsPicker(false);
        }}
        onError={(err) => {
          addError(`JS Implementation (${testType})`, err);
        }}
        pickerOptions={getPickerOptions()}
      />
    </div>
  );
};

export default FilestackDebug;