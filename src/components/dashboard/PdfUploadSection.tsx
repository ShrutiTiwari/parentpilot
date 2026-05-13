import React from 'react';
import { PdfUploadButton } from './PdfUploadButton';

interface PdfUploadSectionProps {
  onExtractSuccess: (extractedData: any | any[]) => void;
  className?: string;
  showPdfUpload?: boolean; // Feature flag to control visibility
  selectedProfile?: any;
  userId?: string;
  eventType: 'school' | 'personal';
}

export const PdfUploadSection: React.FC<PdfUploadSectionProps> = ({
  onExtractSuccess,
  className = '',
  showPdfUpload = false, // Default to false until feature is ready
  selectedProfile,
  userId,
  eventType
}) => {
  // Only render if the feature flag is enabled
  if (!showPdfUpload) {
    return null;
  }

  return (
    <PdfUploadButton
      onExtractSuccess={onExtractSuccess}
      className={className}
      selectedProfile={selectedProfile}
      userId={userId}
      eventType={eventType}
    />
  );
}; 