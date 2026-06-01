/**
 * School Discovery Service
 * Handles school website discovery using AI
 */

class SchoolDiscoveryService {
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
   * Discover school website using AI
   * @param {Object} params - Search parameters
   * @param {string} params.schoolName - Name of the school
   * @param {string} params.city - City where school is located
   * @param {string} params.country - Country where school is located
   * @returns {Promise<Object>} Discovery result with URL, confidence, and reasoning
   */
  async discoverWebsite({ schoolName, city, country }) {

    if (!schoolName) {
      throw new Error('School name is required');
    }

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

    // Build the prompt
    const locationInfo = [
      city ? `City: ${city}` : '',
      country ? `Country: ${country}` : ''
    ].filter(Boolean).join('\n');

    const prompt = `Find the official PUBLIC website URL for this school. This should be the main website that parents and students use to find information about the school.

School Details:
Name: ${schoolName}
${locationInfo}

IMPORTANT:
- Look for the PRIMARY official website that has school information, news, events, and contact details
- Avoid internal portals, staff-only sites, or subdomain sites that aren't public-facing
- The URL should typically be the main domain (e.g., schoolname.org.uk, not portal.schoolname.org.uk)
- Make sure the site contains typical school content like term dates, news, admissions info
- If there are multiple domains (.org.uk vs .org), prefer the more official/established one

Return ONLY the main public website URL (starting with http:// or https://). If you cannot find the main public website with high confidence, return exactly the text "NOT_FOUND".`;

    let websiteUrl;

    if (aiService === 'claude') {
      const response = await strategy.anthropic.messages.create({
        model: this.CLAUDE_CONFIG.DEFAULT_MODEL,
        max_tokens: 200,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content?.[0];
      if (!content || !content.text) {
        throw new Error('No response received from Claude API');
      }

      websiteUrl = content.text.trim();
    } else {
      // OpenAI
      const completion = await strategy.openai.chat.completions.create({
        model: this.OPENAI_CONFIG.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that finds official PUBLIC school websites that parents and students use. Look for the PRIMARY official website with school information, news, events, and contact details. Avoid internal portals, staff-only sites, or subdomain sites. Prefer main domains over subdomains. Return ONLY the main public website URL, nothing else. If you cannot find the main public website with high confidence, return "NOT_FOUND".'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      websiteUrl = completion.choices[0].message.content?.trim() || 'NOT_FOUND';
    }

    // Check if website was found
    if (websiteUrl === 'NOT_FOUND' || !websiteUrl.startsWith('http')) {
      return {
        suggestedUrl: null,
        confidence: 'low',
        reasoning: 'Could not find official school website'
      };
    }

    // Validate the URL actually works
    const validationResult = await this._validateWebsiteUrl(websiteUrl);

    if (!validationResult.isValid) {

      // Try common variations if original fails
      const variations = this._generateUrlVariations(websiteUrl);
      for (const variation of variations) {
        const variationResult = await this._validateWebsiteUrl(variation);
        if (variationResult.isValid) {
          return {
            suggestedUrl: variation,
            confidence: 'high',
            reasoning: `Found working school website (corrected from AI suggestion)`
          };
        }
      }

      return {
        suggestedUrl: websiteUrl, // Return original even if not working, with lower confidence
        confidence: 'medium',
        reasoning: `AI found URL but validation failed: ${validationResult.reason}`
      };
    }

    return {
      suggestedUrl: websiteUrl,
      confidence: 'high',
      reasoning: 'Found and validated official school website'
    };
  }

  /**
   * Validate if a website URL actually works and is a legitimate school site
   * @param {string} url - URL to validate
   * @returns {Promise<Object>} Validation result with isValid flag and reason
   */
  async _validateWebsiteUrl(url) {
    try {
      // First check if URL is accessible with HEAD request
      const headResponse = await fetch(url, {
        method: 'HEAD',
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'PowerParent School Discovery Bot 1.0'
        }
      });

      if (!headResponse.ok) {
        return {
          isValid: false,
          reason: `HTTP ${headResponse.status}: ${headResponse.statusText}`
        };
      }

      // If HEAD request succeeds, fetch some content to analyze
      const contentResponse = await fetch(url, {
        method: 'GET',
        timeout: 15000, // 15 second timeout for content
        headers: {
          'User-Agent': 'PowerParent School Discovery Bot 1.0'
        }
      });

      if (!contentResponse.ok) {
        return {
          isValid: false,
          reason: `Content fetch failed: HTTP ${contentResponse.status}`
        };
      }

      // Get first 5000 characters to analyze
      const text = await contentResponse.text();
      const contentSample = text.substring(0, 5000).toLowerCase();

      // Check for signs this might not be the real school website
      const suspiciousIndicators = [
        'domain for sale',
        'parked domain',
        'coming soon',
        'under construction',
        'this domain may be for sale',
        'buy this domain',
        'domain expired',
        'suspended domain',
        'default web page',
        'apache default page',
        'nginx default page',
        'page not found',
        '404',
        'directory listing'
      ];

      for (const indicator of suspiciousIndicators) {
        if (contentSample.includes(indicator)) {
          return {
            isValid: false,
            reason: `Appears to be ${indicator} page, not school website`
          };
        }
      }

      // Check for positive school indicators
      const schoolIndicators = [
        'school',
        'academy',
        'education',
        'pupils',
        'students',
        'term dates',
        'admissions',
        'curriculum',
        'headteacher',
        'principal',
        'staff',
        'ofsted',
        'year groups'
      ];

      let schoolIndicatorCount = 0;
      for (const indicator of schoolIndicators) {
        if (contentSample.includes(indicator)) {
          schoolIndicatorCount++;
        }
      }

      if (schoolIndicatorCount >= 3) {
        return {
          isValid: true,
          reason: `URL is accessible and appears to be a school website (${schoolIndicatorCount} school indicators found)`
        };
      } else {
        return {
          isValid: false,
          reason: `URL accessible but doesn't appear to be a school website (only ${schoolIndicatorCount} school indicators found)`
        };
      }

    } catch (error) {
      return {
        isValid: false,
        reason: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Generate common URL variations to try if the original fails
   * @param {string} originalUrl - Original URL from AI
   * @returns {string[]} Array of URL variations to try
   */
  _generateUrlVariations(originalUrl) {
    const variations = [];

    try {
      const url = new URL(originalUrl);
      const hostname = url.hostname;
      const protocol = url.protocol;
      const path = url.pathname;

      // Common domain variations
      if (hostname.endsWith('.org.uk')) {
        // Try .org instead of .org.uk
        const newHostname = hostname.replace('.org.uk', '.org');
        variations.push(`${protocol}//${newHostname}${path}`);
      } else if (hostname.endsWith('.org')) {
        // Try .org.uk instead of .org
        const newHostname = hostname.replace('.org', '.org.uk');
        variations.push(`${protocol}//${newHostname}${path}`);
      }

      if (hostname.endsWith('.co.uk')) {
        // Try .com instead of .co.uk
        const newHostname = hostname.replace('.co.uk', '.com');
        variations.push(`${protocol}//${newHostname}${path}`);
      } else if (hostname.endsWith('.com')) {
        // Try .co.uk instead of .com
        const newHostname = hostname.replace('.com', '.co.uk');
        variations.push(`${protocol}//${newHostname}${path}`);
      }

      // Try with www if not present, without www if present
      if (hostname.startsWith('www.')) {
        const noWwwHostname = hostname.replace('www.', '');
        variations.push(`${protocol}//${noWwwHostname}${path}`);
      } else {
        const wwwHostname = `www.${hostname}`;
        variations.push(`${protocol}//${wwwHostname}${path}`);
      }

    } catch (error) {
    }

    return variations;
  }

  /**
   * Handle errors and return appropriate HTTP status codes
   * @param {Error} error - The error object
   * @returns {Object} Error response object with status code and message
   */
  handleError(error) {
    console.error('Error in school discovery service:', error);

    let statusCode = 500;
    let errorMessage = 'Failed to discover school website';

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
    }

    return {
      statusCode,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
}

module.exports = new SchoolDiscoveryService();