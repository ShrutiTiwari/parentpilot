import React, { useState } from 'react';
import { PdfUploadButton } from './PdfUploadButton';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface PdfUploadDemoProps {
  onExtractSuccess: (extractedData: any | any[]) => void;
}

export const PdfUploadDemo: React.FC<PdfUploadDemoProps> = ({
  onExtractSuccess
}) => {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="space-y-4">
      {/* Demo Toggle Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDemo(!showDemo)}
          className="flex items-center gap-2"
        >
          {showDemo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showDemo ? 'Hide PDF Upload Demo' : 'Show PDF Upload Demo'}
        </Button>
      </div>

      {/* PDF Upload Button Demo */}
      {showDemo && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">PDF Upload Feature Demo</h3>
            <p className="text-sm text-gray-600">
              This is how the PDF upload button will look when the feature is enabled
            </p>
          </div>
          
          <PdfUploadButton
            onExtractSuccess={onExtractSuccess}
            className="max-w-2xl mx-auto"
          />
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              To enable this feature, set <code className="bg-gray-200 px-1 rounded">PDF_UPLOAD_ENABLED: true</code> in <code className="bg-gray-200 px-1 rounded">src/config/features.ts</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 