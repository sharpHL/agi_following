const ClaudeProvider = require('./claude-provider');
const GeminiProvider = require('./gemini-provider');

/**
 * AI 提供商工厂
 * 根据配置创建相应的 AI 分析器
 */
class AIProviderFactory {
  /**
   * 创建 AI 提供商实例
   * @param {string} provider - 提供商名称 ('claude' 或 'gemini')
   * @param {string} apiKey - API 密钥
   * @param {string} model - 模型名称（可选）
   * @returns {BaseAIProvider} AI 提供商实例
   */
  static create(provider, apiKey, model = null) {
    const providerLower = provider.toLowerCase();

    switch (providerLower) {
      case 'claude':
        return new ClaudeProvider(
          apiKey,
          model || 'claude-3-5-sonnet-20241022'
        );

      case 'gemini':
        return new GeminiProvider(
          apiKey,
          model || 'gemini-1.5-flash'
        );

      default:
        throw new Error(
          `未知的 AI 提供商: ${provider}。支持的提供商: claude, gemini`
        );
    }
  }

  /**
   * 从环境变量创建 AI 提供商
   * @returns {BaseAIProvider} AI 提供商实例
   */
  static createFromEnv() {
    require('dotenv').config();

    const provider = process.env.AI_PROVIDER || 'claude';
    const model = process.env.AI_MODEL;

    let apiKey;

    if (provider.toLowerCase() === 'claude') {
      apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error(
          '未设置 ANTHROPIC_API_KEY 环境变量。请在 .env 文件中设置或运行: export ANTHROPIC_API_KEY=your-key'
        );
      }
    } else if (provider.toLowerCase() === 'gemini') {
      apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          '未设置 GEMINI_API_KEY 环境变量。请在 .env 文件中设置或运行: export GEMINI_API_KEY=your-key'
        );
      }
    }

    return this.create(provider, apiKey, model);
  }

  /**
   * 获取支持的提供商列表
   * @returns {Array<string>}
   */
  static getSupportedProviders() {
    return ['claude', 'gemini'];
  }

  /**
   * 获取默认模型
   * @param {string} provider - 提供商名称
   * @returns {Object} 模型信息
   */
  static getDefaultModels(provider) {
    const models = {
      claude: {
        default: 'claude-3-5-sonnet-20241022',
        available: [
          'claude-3-5-sonnet-20241022',
          'claude-3-haiku-20240307',
          'claude-3-opus-20240229'
        ]
      },
      gemini: {
        default: 'gemini-1.5-flash',
        available: [
          'gemini-1.5-pro',
          'gemini-1.5-flash',
          'gemini-pro'
        ]
      }
    };

    return models[provider.toLowerCase()] || null;
  }
}

module.exports = AIProviderFactory;
