import React, { useEffect, useRef } from 'react';
import { FILESTACK_API_KEY } from '../config/filestack';

interface FilestackPickerJsProps {
  show: boolean;
  apikey?: string;
  onClose: () => void;
  onSuccess: (result: any) => void;
  onError?: (error: any) => void;
  pickerOptions?: any;
  pickerType?: 'environment' | 'skybox' | 'content';
}

declare global {
  interface Window {
    filestack: any;
  }
}

const FilestackPickerJs: React.FC<FilestackPickerJsProps> = ({
  show,
  apikey = FILESTACK_API_KEY,
  onClose,
  onSuccess,
  onError,
  pickerOptions = {},
  pickerType = 'content'
}) => {
  const pickerRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!show) return;

    const loadFilestackScript = () => {
      return new Promise((resolve, reject) => {
        if (window.filestack) {
          resolve(window.filestack);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://static.filestackapi.com/filestack-js/3.x.x/filestack.min.js';
        script.async = true;
        script.onload = () => {
          if (window.filestack) {
            resolve(window.filestack);
          } else {
            reject(new Error('Filestack failed to load'));
          }
        };
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const openPicker = async () => {
      try {
        console.log(`[FilestackPickerJs] Opening ${pickerType} picker...`);
        
        await loadFilestackScript();
        
        const client = window.filestack.init(apikey);
        
        const options = {
          maxFiles: 1,
          uploadInBackground: false,
          onOpen: () => console.log(`[FilestackPickerJs] ${pickerType} picker opened`),
          onClose: () => {
            console.log(`[FilestackPickerJs] ${pickerType} picker closed`);
            onClose();
          },
          onFileSelected: (file: any) => {
            console.log(`[FilestackPickerJs] File selected:`, file);
          },
          onFileUploadStarted: (file: any) => {
            console.log(`[FilestackPickerJs] Upload started:`, file);
          },
          onFileUploadProgress: (file: any, progress: any) => {
            console.log(`[FilestackPickerJs] Upload progress:`, progress);
          },
          onFileUploadFinished: (file: any) => {
            console.log(`[FilestackPickerJs] Upload finished:`, file);
          },
          onFileUploadFailed: (file: any, error: any) => {
            console.error(`[FilestackPickerJs] Upload failed:`, file, error);
            if (onError) onError(error);
          },
          onUploadDone: (result: any) => {
            console.log(`[FilestackPickerJs] All uploads done:`, result);
            onSuccess(result);
            onClose();
          },
          ...pickerOptions
        };

        pickerRef.current = client.picker(options);
        pickerRef.current.open();
        
      } catch (error) {
        console.error(`[FilestackPickerJs] Error opening picker:`, error);
        if (onError) onError(error);
        onClose();
      }
    };

    openPicker();

    return () => {
      if (pickerRef.current && typeof pickerRef.current.close === 'function') {
        pickerRef.current.close();
      }
    };
  }, [show, onClose, onSuccess, pickerOptions, pickerType]);

  return null;
};

export default FilestackPickerJs;