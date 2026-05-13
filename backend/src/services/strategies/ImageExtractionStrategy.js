/**
 * Base class for image extraction strategies
 * Defines the interface that all LLM strategies must implement
 */
class ImageExtractionStrategy {
  constructor() {
    if (this.constructor === ImageExtractionStrategy) {
      throw new Error('ImageExtractionStrategy is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Extract events from an image or PDF file
   * @param {string} prompt - The system prompt to use for extraction
   * @param {Buffer} fileBuffer - The file buffer (image or PDF)
   * @param {string} sourceFilename - The original filename
   * @param {string} mimeType - The MIME type of the file
   * @returns {Promise<Array>} Array of extracted events
   */
  async extractEventsFromImage(prompt, fileBuffer, sourceFilename, mimeType = 'image/jpeg') {
    throw new Error('extractEventsFromImage method must be implemented by subclass');
  }

  /**
   * Extract data from PDF files
   * @param {string} prompt - The system prompt to use for extraction
   * @param {Buffer} pdfBuffer - The PDF file buffer
   * @param {string} sourceFilename - The original filename
   * @returns {Promise<Array>} Array of extracted events
   */
  async extractDataFromPDF(prompt, pdfBuffer, sourceFilename) {
    throw new Error('extractDataFromPDF method must be implemented by subclass');
  }

  /**
   * Get the strategy name for logging and identification
   * @returns {string} The strategy name
   */
  getStrategyName() {
    return this.constructor.name;
  }
}

module.exports = ImageExtractionStrategy; 