const OpenAIImageExtractionStrategy = require('./OpenAIImageExtractionStrategy');
const ClaudeImageExtractionStrategy = require('./ClaudeImageExtractionStrategy');
const { DEFAULT_LLM_TEMPERATURE } = require('./OpenAIImageExtractionStrategy');

class ImageExtractionStrategyFactory {
  constructor() {
    this.strategies = new Map();
    this.defaultStrategy = 'openai';
    // Read temperature from env, fallback to constant
    this.temperature = typeof process.env.LLM_TEMPERATURE !== 'undefined' ? parseFloat(process.env.LLM_TEMPERATURE) : DEFAULT_LLM_TEMPERATURE;
  }

  /**
   * Get the appropriate strategy based on configuration
   * @param {string} strategyName - The name of the strategy to use ('openai' or 'claude')
   * @returns {ImageExtractionStrategy} The strategy instance
   */
  getStrategy(strategyName = null) {
    const strategy = strategyName || process.env.LLM_STRATEGY || this.defaultStrategy;
    
    if (this.strategies.has(strategy)) {
      return this.strategies.get(strategy);
    }

    let strategyInstance;
    
    switch (strategy.toLowerCase()) {
      case 'claude':
        const claudeApiKey = process.env.ANTHROPIC_API_KEY;
        if (!claudeApiKey) {
          throw new Error('ANTHROPIC_API_KEY environment variable is required for Claude strategy');
        }
        strategyInstance = new ClaudeImageExtractionStrategy(claudeApiKey, this.temperature);
        console.log('=== STRATEGY FACTORY: Using Claude strategy ===');
        break;
        
      case 'openai':
      default:
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
          throw new Error('OPENAI_API_KEY environment variable is required for OpenAI strategy');
        }
        strategyInstance = new OpenAIImageExtractionStrategy(openaiApiKey, this.temperature);
        console.log('=== STRATEGY FACTORY: Using OpenAI strategy ===');
        break;
    }

    this.strategies.set(strategy, strategyInstance);
    return strategyInstance;
  }

  /**
   * Get the current strategy name
   * @returns {string} The current strategy name
   */
  getCurrentStrategyName() {
    return process.env.LLM_STRATEGY || this.defaultStrategy;
  }

  /**
   * Get available strategies
   * @returns {Array<string>} List of available strategy names
   */
  getAvailableStrategies() {
    return ['openai', 'claude'];
  }

  /**
   * Check if a strategy is available (has required API key)
   * @param {string} strategyName - The strategy name to check
   * @returns {boolean} Whether the strategy is available
   */
  isStrategyAvailable(strategyName) {
    switch (strategyName.toLowerCase()) {
      case 'claude':
        return !!process.env.ANTHROPIC_API_KEY;
      case 'openai':
        return !!process.env.OPENAI_API_KEY;
      default:
        return false;
    }
  }
}

module.exports = ImageExtractionStrategyFactory; 