// API configuration
// Locally: Vite proxies /api/* to localhost:3000 so empty string works
// Production: set VITE_API_URL to the deployed backend URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Log which API URL is being used
console.log('Using API URL:', API_BASE_URL);

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  extractEvent: `${API_BASE_URL}/api/extract-event`,
  auth: {
    url: `${API_BASE_URL}/api/auth/url`,
    callback: `${API_BASE_URL}/api/auth/callback`,
    status: (userId: string) => `${API_BASE_URL}/api/auth/status/${userId}`,
  },
  gmail: {
    actions: (userId: string) => `${API_BASE_URL}/api/gmail-actions/${userId}`,
  },
  learners: {
    byShareToken: (shareToken: string) => `${API_BASE_URL}/api/learners/${shareToken}`,
    summary: (shareToken: string) => `${API_BASE_URL}/api/learners/${shareToken}/summary`,
  },
  events: {
    checkConflicts: `${API_BASE_URL}/api/events/check-conflicts`,
  },
  inboundEmail: {
    pending: `${API_BASE_URL}/api/inbound-email/pending`,
    discard: (id: string) => `${API_BASE_URL}/api/inbound-email/${id}/discard`,
    stagingConfirm: (stagingId: string) => `${API_BASE_URL}/api/inbound-email/staging/${stagingId}/confirm`,
    stagingDiscard: (stagingId: string) => `${API_BASE_URL}/api/inbound-email/staging/${stagingId}/discard`,
  },
  schools: {
    discoverWebsite: `${API_BASE_URL}/api/schools/discover-website`,
    discoverTermDatesPage: `${API_BASE_URL}/api/schools/discover-term-dates-page`,
    extractTermDates: `${API_BASE_URL}/api/schools/extract-term-dates`,
    create: `${API_BASE_URL}/api/schools/create`,
    addEvents: (schoolId: string) => `${API_BASE_URL}/api/schools/${schoolId}/events`,
    createWithEvents: `${API_BASE_URL}/api/schools/create-with-events`, // Legacy
  },
}; 