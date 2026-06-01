import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

/**
 * Tests the connection to the backend server
 * @returns {Promise<Object>} The server health status
 */
export const testBackendConnection = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.health);
    if (!response.ok) {
      throw new Error('Backend health check failed');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Backend connection failed:', error);
    throw error;
  }
};

/**
 * Extracts event data from an uploaded image
 * @param {File} imageFile - The image file to process
 * @returns {Promise<Object>} The extracted event data
 */
export const extractEventFromImage = async (imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(API_ENDPOINTS.extractEvent, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it automatically with boundary
    });

    if (!response.ok) {
      throw new Error('Failed to extract event from image');
    }

    const data = await response.json();
    return data.event;
  } catch (error) {
    console.error('Error extracting event from image:', error);
    throw error;
  }
}; 