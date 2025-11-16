/**
 * AI 分析器基类
 * 定义统一的接口，让不同的 AI 服务可以互换使用
 */
class BaseAIProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
  }

  /**
   * 分析单个回答
   * @param {Object} answer - 回答对象
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeAnswer(answer) {
    throw new Error('analyzeAnswer() must be implemented by subclass');
  }

  /**
   * 构建分析提示词
   * @param {Object} answer - 回答对象
   * @returns {string} 提示词
   */
  buildPrompt(answer) {
    return `请分析以下知乎回答的价值。从以下维度评分（每项1-10分）：

1. **深度**: 分析是否深入，是否有独到见解
2. **准确性**: 内容是否准确可靠，是否有事实依据
3. **实用性**: 对读者是否有实际帮助和指导意义
4. **完整性**: 是否全面回答了问题，论述是否完整
5. **表达质量**: 逻辑是否清晰，表达是否流畅

【回答内容】
作者: ${answer.author}
点赞数: ${answer.voteCount}
评论数: ${answer.commentCount}
发布时间: ${answer.timeText}

内容:
${answer.content}

请返回JSON格式的评分结果，格式如下：
{
  "depth": 分数,
  "accuracy": 分数,
  "practicality": 分数,
  "completeness": 分数,
  "expressionQuality": 分数,
  "totalScore": 总分,
  "summary": "一句话总结这个回答的核心价值",
  "strengths": ["优点1", "优点2"],
  "weaknesses": ["缺点1", "缺点2"]
}`;
  }

  /**
   * 解析 AI 响应，提取 JSON
   * @param {string} responseText - AI 返回的文本
   * @returns {Object} 解析后的结果
   */
  parseResponse(responseText) {
    try {
      // 尝试提取JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return analysis;
      } else {
        throw new Error('无法从响应中提取JSON');
      }
    } catch (error) {
      console.error('解析响应失败:', error.message);
      // 返回默认评分
      return this.getDefaultAnalysis(error.message);
    }
  }

  /**
   * 获取默认分析结果（当分析失败时）
   * @param {string} errorMsg - 错误信息
   * @returns {Object} 默认分析结果
   */
  getDefaultAnalysis(errorMsg = '分析失败') {
    return {
      depth: 5,
      accuracy: 5,
      practicality: 5,
      completeness: 5,
      expressionQuality: 5,
      totalScore: 25,
      summary: errorMsg,
      strengths: [],
      weaknesses: [],
      error: errorMsg
    };
  }

  /**
   * 获取提供商名称
   * @returns {string}
   */
  getName() {
    return this.name;
  }

  /**
   * 验证配置是否有效
   * @returns {boolean}
   */
  validateConfig() {
    throw new Error('validateConfig() must be implemented by subclass');
  }
}

module.exports = BaseAIProvider;
