const { OpenAI } = require('openai');
const ImageExtractionStrategy = require('./ImageExtractionStrategy');
const fs = require('fs').promises;
const path = require('path');
const { getConfig, OPENAI_CONFIG } = require('../../config/llmConfig');

class OpenAIImageExtractionStrategy extends ImageExtractionStrategy {
  constructor(apiKey, temperature) {
    super();
    const config = getConfig();

    this.openai = new OpenAI({ apiKey });
    // For OpenAI, we can also use config but default to gpt-4o for now
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.temperature = typeof temperature !== 'undefined' ? temperature : OPENAI_CONFIG.TEMPERATURE.DEFAULT;
  }

  async extractEventsFromImage(prompt, fileBuffer, sourceFilename, mimeType = 'image/jpeg') {

    if (mimeType === 'application/pdf') {
      return await this.extractDataFromPDF(prompt, fileBuffer, sourceFilename);
    }

    // Handle images
    const imageBase64 = fileBuffer.toString('base64');

    try {

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Extract all future events from this image and label them with source: "${sourceFilename}". Include appropriate todos based on the event type.` },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: this.temperature,
        response_format: { type: "json_object" }
      });

      const choice = response.choices?.[0]?.message;

      if (choice?.refusal) {
        console.error('=== OpenAI STRATEGY: OpenAI refused to process the image ===');
        console.error('Refusal reason:', choice.refusal);
        throw new Error(`Image processing was refused: ${choice.refusal}. Please try with a different image or contact support if this persists.`);
      }

      if (!choice || !choice.content) {
        console.error('=== OpenAI STRATEGY: No content in OpenAI response ===');
        console.error('Full response:', JSON.stringify(response, null, 2));
        if (choice?.refusal) {
          throw new Error(`Image processing was refused: ${choice.refusal}. Please try with a different image.`);
        }
        if (response.choices?.[0]?.finish_reason === 'content_filter') {
          throw new Error('The image content was filtered out. Please try with a different image that contains clear, readable text.');
        }
        throw new Error('No response received from the AI service. Please try again in a few moments.');
      }
      let rawContent = response.choices[0].message.content.trim();
      // Log the full raw content for debugging

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
        // Ensure each event has todos array (optional: add your todos logic here)
        return result;
      } catch (parseError) {
        console.error('=== OpenAI STRATEGY: JSON parsing error ===');
        console.error('Error parsing JSON response:', parseError);
        console.error('Raw content that failed to parse:', rawContent);
        throw new Error('The AI response could not be processed. Please try again with a clearer image.');
      }
    } catch (error) {
      console.error('=== OpenAI STRATEGY: Error in extraction ===');
      console.error('Error extracting data from image:', error);
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
    const fileSizeMB = pdfBuffer.length / (1024 * 1024);
    const maxFileSizeMB = 50;
    if (fileSizeMB > maxFileSizeMB) {
      throw new Error(`PDF file is too large (${fileSizeMB.toFixed(1)}MB). Please use a smaller PDF file (under ${maxFileSizeMB}MB) or convert it to images first.`);
    }
    let file;
    try {
      file = await this.openai.files.create({
        file: Buffer.from(pdfBuffer),
        purpose: 'user_data'
      });
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Extract all future events from this PDF and label them with source: "${sourceFilename}". Include appropriate todos based on the event type.` },
              { type: 'input_file', file_id: file.id }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: DEFAULT_LLM_TEMPERATURE, 
        response_format: { type: "json_object" }
      });
      let rawContent = response.choices[0].message.content.trim();
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
        console.error('=== OpenAI STRATEGY: JSON parsing error for PDF ===');
        console.error('Error parsing JSON response:', parseError);
        console.error('Raw content that failed to parse:', rawContent);
        throw new Error('The AI response could not be processed. Please try again with a clearer PDF.');
      }
    } catch (error) {
      console.error('=== OpenAI STRATEGY: Error in PDF extraction ===');
      console.error('Error extracting data from PDF:', error);
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

module.exports = OpenAIImageExtractionStrategy; 