const Anthropic = require('@anthropic-ai/sdk');
const BaseAIProvider = require('./base-provider');

/**
 * Claude AI 分析器
 */
class ClaudeProvider extends BaseAIProvider {
  constructor(apiKey, model = 'claude-3-5-sonnet-20241022') {
    super({ apiKey, model });
    this.name = 'Claude';
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  /**
   * 验证配置
   */
  validateConfig() {
    if (!this.config.apiKey) {
      throw new Error('Claude API Key 未设置');
    }
    return true;
  }

  /**
   * 分析单个回答
   */
  async analyzeAnswer(answer) {
    const prompt = this.buildPrompt(answer);

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // 解析响应
      const responseText = message.content[0].text;
      return this.parseResponse(responseText);

    } catch (error) {
      console.error(`Claude 分析出错:`, error.message);
      return this.getDefaultAnalysis(error.message);
    }
  }

  /**
   * 获取模型信息
   */
  getModelInfo() {
    return {
      provider: this.name,
      model: this.model,
      maxTokens: 1000
    };
  }
}

module.exports = ClaudeProvider;
