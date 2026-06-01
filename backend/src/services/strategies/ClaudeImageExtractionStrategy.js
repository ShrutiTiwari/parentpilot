const Anthropic = require('@anthropic-ai/sdk');
const ImageExtractionStrategy = require('./ImageExtractionStrategy');
const fs = require('fs').promises;
const path = require('path');
const { getConfig, CLAUDE_CONFIG } = require('../../config/llmConfig');

class ClaudeImageExtractionStrategy extends ImageExtractionStrategy {
  constructor(apiKey, temperature) {
    super();
    const config = getConfig();

    // Allow override from environment variable, fallback to passed value, then default
    this.temperature = typeof temperature !== 'undefined' ? temperature : config.claude.temperature;
    this.model = config.claude.model;
    this.maxTokens = config.claude.maxTokens;
    this.maxRetries = config.retry.maxRetries;
    this.baseDelay = config.retry.baseDelay;

    this.anthropic = new Anthropic({ apiKey });
  }

  async makeClaudeRequest(requestData, retryCount = 0) {
    try {
      const response = await this.anthropic.messages.create(requestData);
      return response;
    } catch (error) {
      console.error(`Claude API request failed (attempt ${retryCount + 1}):`, error.message);

      // Check if this is a retryable error using config
      const isRetryable = CLAUDE_CONFIG.RETRY.RETRYABLE_STATUS_CODES.includes(error.status) ||
                          (error.status === 429 && error.headers?.['x-should-retry'] === 'true');

      if (isRetryable && retryCount < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, retryCount); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeClaudeRequest(requestData, retryCount + 1);
      }

      // If we've exhausted retries or it's not a retryable error, throw the original error
      throw error;
    }
  }

  async extractEventsFromImage(prompt, fileBuffer, sourceFilename, mimeType = 'image/jpeg') {

    if (mimeType === 'application/pdf') {
      return await this.extractDataFromPDF(prompt, fileBuffer, sourceFilename);
    }

    // Handle images
    const imageBase64 = fileBuffer.toString('base64');

    try {

      const response = await this.makeClaudeRequest({
        model: this.model,
        max_tokens: this.maxTokens,
        system: 'You are an expert at extracting structured event data from images. You MUST extract ALL events visible in the image, not just the first one. Always return a JSON array with one object per event.',
        temperature: this.temperature,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${prompt}\n\nExtract ALL future events from this image and label them with source: "${sourceFilename}". Include appropriate todos based on the event type. IMPORTANT: If you see multiple events, you MUST extract every single one.`
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: imageBase64
                }
              }
            ]
          }
        ]
      });

      const content = response.content?.[0];

      if (!content || !content.text) {
        console.error('=== CLAUDE STRATEGY: No content in Claude response ===');
        console.error('Full response:', JSON.stringify(response, null, 2));
        throw new Error('No response received from the AI service. Please try again in a few moments.');
      }
      let rawContent = content.text.trim();

      // If wrapped in markdown code block, strip it
      if (rawContent.startsWith("```json") || rawContent.startsWith("```")) {
        rawContent = rawContent.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }

      try {
        let result = JSON.parse(rawContent);
        // If result is not an array, wrap it in an array and log a warning
        if (!Array.isArray(result)) {
          console.warn('Model output was not an array. Wrapping in array.');
          result = [result];
        }
        return result;
      } catch (parseError) {
        console.error('=== CLAUDE STRATEGY: JSON parsing error ===');
        console.error('Error parsing JSON response:', parseError);
        console.error('Raw content that failed to parse:', rawContent);
        
        // Try to extract JSON from the response if it's wrapped in text
        try {
          const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const extractedJson = jsonMatch[0];
            let result = JSON.parse(extractedJson);
            if (!Array.isArray(result)) {
              result = [result];
            }
            return result;
          }
        } catch (fallbackError) {
          console.error('Fallback JSON extraction also failed:', fallbackError);
        }
        
        throw new Error('The AI response could not be processed. Please try again with a clearer image.');
      }
    } catch (error) {
      console.error('=== CLAUDE STRATEGY: Error in extraction ===');
      console.error('Error extracting data from image:', error);
      
      // Handle specific API error types
      if (error.status === 529) {
        throw new Error('The AI service is currently overloaded. Please try again in a few minutes.');
      }
      
      if (error.status === 503 || error.status === 502 || error.status === 504) {
        throw new Error('The AI service is temporarily unavailable. Please try again in a few moments.');
      }
      
      if (error.type === 'auth_subrequest_error') {
        throw new Error('Temporary service issue. Please try again in a few moments.');
      }
      
      if (error.response?.data) {
        if (error.response.status === 413) {
          throw new Error('PDF file is too large for processing. Please use a smaller PDF file (under 50MB) or convert it to images first.');
        }
        if (error.response.status === 429) {
          throw new Error('Service is temporarily busy. Please try again in a few minutes.');
        }
        if (error.response.status === 401) {
          throw new Error('Service configuration error. Please contact support.');
        }
      }
      
      if (error.message.includes('Image processing was refused') || 
          error.message.includes('Please try again') ||
          error.message.includes('Please try with a different image')) {
        throw error;
      }
      
      throw new Error('Failed to process the image. Please try again with a clearer image or contact support if the issue persists.');
    }
  }

  async extractDataFromPDF(prompt, pdfBuffer, sourceFilename) {

    const config = getConfig();
    const fileSizeMB = pdfBuffer.length / (1024 * 1024);
    const maxFileSizeMB = config.processing.MAX_FILE_SIZE.PDF;

    if (fileSizeMB > maxFileSizeMB) {
      throw new Error(`PDF file is too large (${fileSizeMB.toFixed(1)}MB). Please use a smaller PDF file (under ${maxFileSizeMB}MB) or convert it to images first.`);
    }

    try {

      const response = await this.makeClaudeRequest({
        model: this.model,
        max_tokens: this.maxTokens,
        system: 'You are an expert at extracting structured event data from PDFs. You MUST extract ALL events visible in the PDF, not just the first one. Always return a JSON array with one object per event.',
        temperature: this.temperature,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${prompt}\n\nExtract ALL future events from this PDF and label them with source: "${sourceFilename}". Include appropriate todos based on the event type. IMPORTANT: If you see multiple events, you MUST extract every single one.`
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfBuffer.toString('base64')
                }
              }
            ]
          }
        ]
      });

      let rawContent = response.content[0].text.trim();
      
      if (rawContent.startsWith("```json") || rawContent.startsWith("```")) {
        rawContent = rawContent.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      
      try {
        let result = JSON.parse(rawContent);
        if (!Array.isArray(result)) {
          console.warn('Model output was not an array. Wrapping in array.');
          result = [result];
        }
        return result;
      } catch (parseError) {
        console.error('=== CLAUDE STRATEGY: JSON parsing error for PDF ===');
        console.error('Error parsing JSON response:', parseError);
        console.error('Raw content that failed to parse:', rawContent);
        throw new Error('The AI response could not be processed. Please try again with a clearer PDF.');
      }
    } catch (error) {
      console.error('=== CLAUDE STRATEGY: Error in PDF extraction ===');
      console.error('Error extracting data from PDF:', error);
      
      // Handle specific API error types
      if (error.status === 529) {
        throw new Error('The AI service is currently overloaded. Please try again in a few minutes.');
      }
      
      if (error.status === 503 || error.status === 502 || error.status === 504) {
        throw new Error('The AI service is temporarily unavailable. Please try again in a few moments.');
      }
      
      if (error.type === 'auth_subrequest_error') {
        throw new Error('Temporary service issue. Please try again in a few moments.');
      }
      
      if (error.response?.data) {
        if (error.response.status === 413) {
          throw new Error('PDF file is too large for processing. Please use a smaller PDF file (under 50MB) or convert it to images first.');
        }
        if (error.response.status === 429) {
          throw new Error('Service is temporarily busy. Please try again in a few minutes.');
        }
        if (error.response.status === 401) {
          throw new Error('Service configuration error. Please contact support.');
        }
      }
      
      throw new Error('Failed to process the PDF. Please try again with a clearer PDF or contact support if the issue persists.');
    }
  }
}

module.exports = ClaudeImageExtractionStrategy; 