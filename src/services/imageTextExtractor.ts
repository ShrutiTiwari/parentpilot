// imageTextExtractor.ts
// Service to extract text or structured data from an image using OpenAI Vision via backend

export async function extractTextFromImage(imageFile: File): Promise<any> {
  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch('/api/extract-event', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to extract text from image');
    }
    const data = await response.json();
    // You can return data.event, data.text, or the whole response depending on backend
    return data;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
} 