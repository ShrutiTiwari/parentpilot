/**
 * LLM Configuration
 * Central configuration for all AI/LLM related settings
 */

// Claude (Anthropic) Configuration
const CLAUDE_CONFIG = {
  // Model versions - Using Claude 4 family (latest as of 2025)
  MODELS: {
    // Claude 4 Models (Current)
    SONNET_4_5: 'claude-sonnet-4-5-20250929',      // Latest Sonnet (Sep 2025)
    SONNET_4_5_ALIAS: 'claude-sonnet-4-5',         // Auto-updates to latest
    HAIKU_4_5: 'claude-haiku-4-5-20251001',        // Latest Haiku (Oct 2025)
    OPUS_4_1: 'claude-opus-4-1-20250805',          // Latest Opus (Aug 2025)

    // Legacy Claude 3 Models (Still available)
    HAIKU_3_5: 'claude-3-5-haiku-20241022',
    HAIKU_3: 'claude-3-haiku-20240307'
  },

  // Default model to use - Claude Sonnet 4.5 (best balance of speed/intelligence)
  DEFAULT_MODEL: 'claude-sonnet-4-5-20250929',

  // Temperature settings
  TEMPERATURE: {
    DEFAULT: 0.2,
    CREATIVE: 0.7,
    PRECISE: 0.1,
    BALANCED: 0.5
  },

  // Token limits
  MAX_TOKENS: {
    DEFAULT: 2000,
    LARGE: 4096,
    SMALL: 1024
  },

  // Retry configuration
  RETRY: {
    MAX_RETRIES: 3,
    BASE_DELAY_MS: 2000,
    RETRYABLE_STATUS_CODES: [429, 500, 502, 503, 504, 529]
  }
};

// OpenAI Configuration
const OPENAI_CONFIG = {
  MODELS: {
    GPT_4O: 'gpt-4o',
    GPT_4_TURBO: 'gpt-4-turbo-preview',
    GPT_4: 'gpt-4',
    GPT_3_5_TURBO: 'gpt-3.5-turbo'
  },
  DEFAULT_MODEL: 'gpt-4o',
  TEMPERATURE: {
    DEFAULT: 0.2,
    CREATIVE: 0.7,
    PRECISE: 0.1,
    BALANCED: 0.5
  }
};

// Image/PDF Processing Configuration
const PROCESSING_CONFIG = {
  // Supported file types
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  SUPPORTED_DOCUMENT_TYPES: ['application/pdf'],

  // File size limits (in MB)
  MAX_FILE_SIZE: {
    IMAGE: 10,
    PDF: 50
  },

  // Processing timeouts (in ms)
  TIMEOUT: {
    IMAGE: 30000,
    PDF: 60000
  }
};

// Environment-based overrides
const getConfig = () => {
  return {
    claude: {
      model: process.env.CLAUDE_MODEL || CLAUDE_CONFIG.DEFAULT_MODEL,
      temperature: parseFloat(process.env.LLM_TEMPERATURE) || CLAUDE_CONFIG.TEMPERATURE.DEFAULT,
      maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || CLAUDE_CONFIG.MAX_TOKENS.DEFAULT
    },
    retry: {
      maxRetries: parseInt(process.env.MAX_RETRIES) || CLAUDE_CONFIG.RETRY.MAX_RETRIES,
      baseDelay: parseInt(process.env.RETRY_BASE_DELAY) || CLAUDE_CONFIG.RETRY.BASE_DELAY_MS
    },
    processing: PROCESSING_CONFIG
  };
};

module.exports = {
  CLAUDE_CONFIG,
  OPENAI_CONFIG,
  PROCESSING_CONFIG,
  getConfig
};
