import React, { useEffect, useState } from 'react';
import * as filestack from 'filestack-js';
import './FilestackPicker.css';

interface FilestackPickerProps {
  apikey: string;
  onSuccess: (result: any) => void;
  onClose: () => void;
  onError?: (error: any) => void;
  pickerOptions?: any;
  show: boolean;
}

const FilestackPicker: React.FC<FilestackPickerProps> = ({
  apikey,
  onSuccess,
  onClose,
  onError,
  pickerOptions,
  show
}) => {
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    if (apikey) {
      console.log('[FilestackPicker] Initializing with API key:', apikey);
      try {
        const filestackClient = filestack.init(apikey);
        setClient(filestackClient);
        console.log('[FilestackPicker] Client initialized successfully');
      } catch (error) {
        console.error('[FilestackPicker] Failed to initialize client:', error);
      }
    }
  }, [apikey]);

  useEffect(() => {
    if (show && client) {
      console.log('[FilestackPicker] Preparing to show picker with options:', pickerOptions);
      // Use minimal options to avoid parameter errors
      const options: any = {
        onUploadDone: (result: any) => {
          console.log('[FilestackPicker] Upload done:', result);
          onSuccess(result);
        }
      };
      
      // Only add maxFiles if it's specified and valid
      if (pickerOptions && pickerOptions.maxFiles) {
        options.maxFiles = pickerOptions.maxFiles;
      }

      // Add custom CSS to style the picker
      const style = document.createElement('style');
      style.textContent = `
        .fsp-picker {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
        }
        .fsp-header {
          background: rgba(0, 0, 0, 0.9) !important;
          border-bottom: 1px solid rgba(255, 140, 66, 0.3) !important;
        }
        .fsp-header__title {
          color: #ff8c42 !important;
        }
        .fsp-button {
          background: #ff8c42 !important;
          border: none !important;
          color: white !important;
        }
        .fsp-button:hover {
          background: #ff7a2a !important;
        }
        .fsp-content {
          background: rgba(0, 0, 0, 0.8) !important;
        }
        .fsp-drop-pane__container {
          background: rgba(0, 0, 0, 0.6) !important;
          border: 2px dashed rgba(255, 140, 66, 0.5) !important;
        }
        .fsp-drop-pane__text {
          color: #ff8c42 !important;
        }
      `;
      document.head.appendChild(style);

      try {
        console.log('[FilestackPicker] Creating picker with options:', options);
        const picker = client.picker(options);
        console.log('[FilestackPicker] Opening picker...');
        picker.open();
        console.log('[FilestackPicker] Picker opened successfully');
      } catch (error) {
        console.error('[FilestackPicker] Error opening picker:', error);
        if (onError) onError(error);
        onClose();
      }

      return () => {
        // Clean up style
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    }
  }, [show, client, pickerOptions, onSuccess, onClose, onError]);

  // The picker opens in its own modal, so we don't need to render anything
  return null;
};

export default FilestackPicker;