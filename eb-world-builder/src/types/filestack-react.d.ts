declare module 'filestack-react' {
  import { ReactElement } from 'react';
  
  interface FileUploaded {
    url: string;
    filename?: string;
    mimetype?: string;
    size?: number;
    handle?: string;
    uploadURL?: string;
    name?: string;
    type?: string;
  }
  
  interface PickerResult {
    filesUploaded: FileUploaded[];
    files?: FileUploaded[];
    [key: string]: any; // Allow additional properties
  }
  
  interface PickerOptions {
    accept?: string[];
    maxFiles?: number;
    fromSources?: string[];
    uploadInBackground?: boolean;
    disableTransformer?: boolean;
    transformations?: {
      crop?: boolean;
      circle?: boolean;
      rotate?: boolean;
    };
  }
  
  interface PickerOverlayProps {
    apikey: string;
    onSuccess: (result: PickerResult | any) => void;
    onClose: () => void;
    onError?: (error: any) => void;
    pickerOptions?: PickerOptions;
  }
  
  export const PickerOverlay: React.FC<PickerOverlayProps>;
}