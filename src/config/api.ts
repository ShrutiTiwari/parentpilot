// API configuration
export const API_BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname.includes('localhost')
      ? 'http://localhost:3000'
      : 'https://snap-remind-calendar-kid-shrutitiwaris-projects.vercel.app')
  : '';

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
  schools: {
    discoverWebsite: `${API_BASE_URL}/api/schools/discover-website`,
    discoverTermDatesPage: `${API_BASE_URL}/api/schools/discover-term-dates-page`,
    extractTermDates: `${API_BASE_URL}/api/schools/extract-term-dates`,
    create: `${API_BASE_URL}/api/schools/create`,
    addEvents: (schoolId: string) => `${API_BASE_URL}/api/schools/${schoolId}/events`,
    createWithEvents: `${API_BASE_URL}/api/schools/create-with-events`, // Legacy
  },
}; 