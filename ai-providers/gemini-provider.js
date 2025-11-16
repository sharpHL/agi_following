const { GoogleGenerativeAI } = require('@google/generative-ai');
const BaseAIProvider = require('./base-provider');

/**
 * Gemini AI 分析器
 */
class GeminiProvider extends BaseAIProvider {
  constructor(apiKey, model = 'gemini-1.5-flash') {
    super({ apiKey, model });
    this.name = 'Gemini';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  /**
   * 验证配置
   */
  validateConfig() {
    if (!this.config.apiKey) {
      throw new Error('Gemini API Key 未设置');
    }
    return true;
  }

  /**
   * 分析单个回答
   */
  async analyzeAnswer(answer) {
    const prompt = this.buildPrompt(answer);

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      return this.parseResponse(responseText);

    } catch (error) {
      console.error(`Gemini 分析出错:`, error.message);
      return this.getDefaultAnalysis(error.message);
    }
  }

  /**
   * 获取模型信息
   */
  getModelInfo() {
    return {
      provider: this.name,
      model: this.model
    };
  }
}

module.exports = GeminiProvider;
