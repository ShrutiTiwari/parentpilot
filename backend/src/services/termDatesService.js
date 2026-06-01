/**
 * Term Dates Service
 * Handles extraction of term dates from school websites using AI
 */

class TermDatesService {
  constructor() {
    this.CLAUDE_CONFIG = null;
    this.OPENAI_CONFIG = null;
    this.ImageExtractionStrategyFactory = null;

    // Lazy load dependencies to avoid circular imports
    this._initializeDependencies();
  }

  _initializeDependencies() {
    try {
      const { CLAUDE_CONFIG, OPENAI_CONFIG } = require('../config/llmConfig');
      this.CLAUDE_CONFIG = CLAUDE_CONFIG;
      this.OPENAI_CONFIG = OPENAI_CONFIG;

      this.ImageExtractionStrategyFactory = require('./strategies/ImageExtractionStrategyFactory');
    } catch (error) {
      console.error('Error loading dependencies:', error);
    }
  }

  /**
   * Extract term dates from a school's term dates page
   * @param {Object} params - Extraction parameters
   * @param {string} params.termDatesPageUrl - URL of the term dates page
   * @param {string} params.schoolName - Name of the school
   * @returns {Promise<Object>} Extraction result with events and raw data
   */
  async extractTermDates({ termDatesPageUrl, schoolName }) {

    if (!termDatesPageUrl) {
      throw new Error('Term dates page URL is required');
    }

    try {
      // Step 1: Fetch the term dates page HTML
      const pageResponse = await fetch(termDatesPageUrl);

      if (!pageResponse.ok) {
        throw new Error(`Failed to fetch term dates page: ${pageResponse.status} ${pageResponse.statusText}`);
      }

      const html = await pageResponse.text();

      // Use cheerio to extract clean text content for better AI parsing
      const cheerio = require('cheerio');
      const $ = cheerio.load(html);

      // Remove script and style tags
      $('script, style, nav, header, footer').remove();

      // Get the main text content
      const textContent = $('body').text();

      // Clean up the text - remove excessive whitespace
      const cleanedText = textContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      // Step 2: Use AI to extract term dates
      const extractedEvents = await this._extractEventsWithAI(cleanedText, termDatesPageUrl);

      // Log first few events for debugging
      if (extractedEvents.length > 0) {
        extractedEvents.slice(0, 3).forEach((event, idx) => {
        });
      }

      return {
        success: true,
        extractedEvents: extractedEvents,
        rawData: cleanedText.substring(0, 2000) // Return cleaned text sample for debugging
      };

    } catch (error) {
      console.error('Error extracting term dates:', error);
      throw error;
    }
  }

  /**
   * Use AI to extract events from cleaned text content
   * @param {string} cleanedText - Cleaned HTML text content
   * @param {string} termDatesPageUrl - Original URL for source reference
   * @returns {Promise<Array>} Array of extracted events
   */
  async _extractEventsWithAI(cleanedText, termDatesPageUrl) {
    // Check if we have access to AI strategies
    const factory = new this.ImageExtractionStrategyFactory();

    // Prefer Claude, fallback to OpenAI
    let strategy;
    let aiService;
    if (factory.isStrategyAvailable('claude')) {
      strategy = factory.getStrategy('claude');
      aiService = 'claude';
    } else if (factory.isStrategyAvailable('openai')) {
      strategy = factory.getStrategy('openai');
      aiService = 'openai';
    } else {
      throw new Error('AI service is not available. Please check API key configuration.');
    }

    const systemPrompt = `You are a data extraction specialist for UK school term dates.

Extract ALL term dates and important school dates from the HTML content provided.

IMPORTANT RULES:
1. Extract dates EXACTLY as shown on the page
2. For date ranges (e.g., "Monday 20 October to Friday 31 October"), create ONE event for the START date
3. Current year is 2025, so "Advent Term 2025" means academic year 2025-2026
4. "Half Term" is a HOLIDAY (break)
5. "Term begins" is when school STARTS (general)
6. "Term ends" is when school FINISHES (general)
7. "Staff return" or INSET days are GENERAL events

Return a JSON object with this structure:
{
  "events": [
    {
      "title": "Descriptive title (e.g., 'Autumn Term Begins', 'Half Term Holiday', 'Autumn Term Ends')",
      "date": "YYYY-MM-DD",
      "time_start": "00:00:00",
      "time_end": "00:00:00",
      "year_group": "All",
      "year_groups": ["All"],
      "category": "holiday|general",
      "source": "${termDatesPageUrl}",
      "venue": null,
      "school_code_required": false,
      "visibility": "public"
    }
  ]
}

Categories:
- "holiday": Half terms, end of term holidays (when students are OFF)
- "general": Term starts, term ends, INSET days, staff training

For all events: time_start="00:00:00", time_end="00:00:00"

EXAMPLE:
If you see:
"Half Term: Monday 20 October to Friday 31 October"

Extract as:
{
  "title": "Half Term Holiday",
  "date": "2025-10-20",
  "category": "holiday"
}

Extract ALL terms shown (Advent, Lent, Trinity/Summer).
Return ONLY valid JSON, no other text.`;

    const userPrompt = `Extract term dates from this content:\n\n${cleanedText.substring(0, 20000)}`;

    let response;

    if (aiService === 'claude') {
      response = await strategy.anthropic.messages.create({
        model: this.CLAUDE_CONFIG.DEFAULT_MODEL,
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: systemPrompt + '\n\n' + userPrompt
          }
        ]
      });

      const content = response.content?.[0];
      if (!content || !content.text) {
        throw new Error('No response received from Claude API');
      }

      let rawContent = content.text.trim();

      // Try multiple strategies to extract JSON
      let parsedResponse = null;

      // Strategy 1: Strip markdown code blocks
      if (rawContent.startsWith('```json') || rawContent.startsWith('```')) {
        rawContent = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim();
      }

      // Strategy 2: Try to parse directly
      try {
        parsedResponse = JSON.parse(rawContent);
      } catch (e) {

        // Strategy 3: Extract JSON object from text
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } catch (e2) {
            console.error('Failed to parse extracted JSON:', e2);
          }
        }
      }

      if (!parsedResponse || !parsedResponse.events) {
        console.error('Could not parse AI response as valid JSON');
        response = { events: [] };
      } else {
        response = parsedResponse;
      }
    } else {
      // OpenAI
      const completion = await strategy.openai.chat.completions.create({
        model: this.OPENAI_CONFIG.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 4000
      });

      try {
        response = JSON.parse(completion.choices[0].message.content || '{"events":[]}');
      } catch (e) {
        console.error('Failed to parse OpenAI response:', e);
        response = { events: [] };
      }
    }

    return response.events || [];
  }

  /**
   * Handle errors and return appropriate HTTP status codes
   * @param {Error} error - The error object
   * @returns {Object} Error response object with status code and message
   */
  handleError(error) {
    console.error('Error in term dates service:', error);

    let statusCode = 500;
    let errorMessage = 'Failed to extract term dates';

    if (error.message.includes('AI service is not available') ||
        error.message.includes('API key') ||
        error.message.includes('authentication')) {
      statusCode = 503;
      errorMessage = 'AI service unavailable';
    } else if (error.message.includes('rate limit')) {
      statusCode = 429;
      errorMessage = 'Too many requests. Please try again later.';
    } else if (error.message.includes('required')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('Failed to fetch')) {
      statusCode = 400;
      errorMessage = 'Could not access the term dates page. Please check the URL.';
    }

    return {
      statusCode,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
}

module.exports = new TermDatesService();