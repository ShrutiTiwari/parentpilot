// Feature flags configuration
// Set these to true/false to enable/disable features

export const FEATURE_FLAGS = {
  // PDF Upload Feature
  // Set to true when the PDF upload functionality is fully ready
  PDF_UPLOAD_ENABLED: false, // Disabled - not working properly at the moment
  
  // Add other feature flags here as needed
  // EXAMPLE_FEATURE: false,
} as const;

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
}; 