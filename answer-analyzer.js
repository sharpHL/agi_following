require('dotenv').config();
const fs = require('fs').promises;
const AIProviderFactory = require('./ai-providers');

/**
 * 知乎回答价值分析器
 * 支持多种 AI 服务（Claude、Gemini）分析回答价值
 */
class AnswerAnalyzer {
  constructor(aiProvider = null) {
    // 如果没有提供 AI 提供商，从环境变量创建
    if (aiProvider) {
      this.aiProvider = aiProvider;
    } else {
      try {
        this.aiProvider = AIProviderFactory.createFromEnv();
      } catch (error) {
        console.error('初始化 AI 提供商失败:', error.message);
        throw error;
      }
    }

    this.answers = [];
    this.analysisResults = [];

    console.log(`使用 AI 提供商: ${this.aiProvider.getName()}`);
    const modelInfo = this.aiProvider.getModelInfo();
    if (modelInfo.model) {
      console.log(`模型: ${modelInfo.model}`);
    }
  }

  /**
   * 从文件加载回答数据
   */
  async loadAnswers(filename = 'zhihu_answers.json') {
    console.log(`从 ${filename} 加载回答数据...`);

    try {
      const data = await fs.readFile(filename, 'utf-8');
      const parsed = JSON.parse(data);
      this.answers = parsed.answers || [];
      console.log(`成功加载 ${this.answers.length} 个回答`);
      return this.answers;
    } catch (error) {
      console.error('加载文件失败:', error.message);
      throw error;
    }
  }

  /**
   * 分析单个回答的价值
   */
  async analyzeAnswer(answer) {
    try {
      return await this.aiProvider.analyzeAnswer(answer);
    } catch (error) {
      console.error(`分析回答时出错:`, error.message);
      return this.aiProvider.getDefaultAnalysis(error.message);
    }
  }

  /**
   * 批量分析所有回答
   */
  async analyzeAll(maxAnswers = 20, delayMs = 2000) {
    console.log(`开始分析回答（最多分析 ${maxAnswers} 个）...`);

    // 限制分析数量，避免API调用过多
    const answersToAnalyze = this.answers.slice(0, maxAnswers);

    for (let i = 0; i < answersToAnalyze.length; i++) {
      const answer = answersToAnalyze[i];
      console.log(`\n[${i + 1}/${answersToAnalyze.length}] 分析回答: ${answer.author}`);

      const analysis = await this.analyzeAnswer(answer);

      this.analysisResults.push({
        ...answer,
        analysis
      });

      console.log(`  总分: ${analysis.totalScore}/50`);
      console.log(`  摘要: ${analysis.summary}`);

      // 添加延迟，避免API限流
      if (i < answersToAnalyze.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log('\n分析完成！');
  }

  /**
   * 获取最有价值的回答
   */
  getTopAnswers(count = 10) {
    // 按总分降序排序
    const sorted = [...this.analysisResults].sort(
      (a, b) => b.analysis.totalScore - a.analysis.totalScore
    );

    return sorted.slice(0, count);
  }

  /**
   * 生成分析报告
   */
  generateReport() {
    const topAnswers = this.getTopAnswers(10);

    let report = '# 知乎回答价值分析报告\n\n';
    report += `分析时间: ${new Date().toLocaleString('zh-CN')}\n`;
    report += `总回答数: ${this.answers.length}\n`;
    report += `已分析数: ${this.analysisResults.length}\n`;
    report += `AI 提供商: ${this.aiProvider.getName()}\n\n`;

    report += '## 最有价值的回答 TOP 10\n\n';

    topAnswers.forEach((answer, idx) => {
      const { analysis } = answer;

      report += `### ${idx + 1}. ${answer.author}\n\n`;
      report += `**评分**: ${analysis.totalScore}/50 分\n\n`;
      report += `**发布时间**: ${answer.timeText}\n`;
      report += `**点赞数**: ${answer.voteCount}\n`;
      report += `**评论数**: ${answer.commentCount}\n\n`;

      report += '**各维度得分**:\n';
      report += `- 深度: ${analysis.depth}/10\n`;
      report += `- 准确性: ${analysis.accuracy}/10\n`;
      report += `- 实用性: ${analysis.practicality}/10\n`;
      report += `- 完整性: ${analysis.completeness}/10\n`;
      report += `- 表达质量: ${analysis.expressionQuality}/10\n\n`;

      report += `**价值总结**: ${analysis.summary}\n\n`;

      if (analysis.strengths && analysis.strengths.length > 0) {
        report += '**优点**:\n';
        analysis.strengths.forEach(strength => {
          report += `- ${strength}\n`;
        });
        report += '\n';
      }

      if (analysis.weaknesses && analysis.weaknesses.length > 0) {
        report += '**不足**:\n';
        analysis.weaknesses.forEach(weakness => {
          report += `- ${weakness}\n`;
        });
        report += '\n';
      }

      report += `**内容预览**:\n`;
      report += `${answer.content.substring(0, 300)}...\n\n`;
      report += '---\n\n';
    });

    return report;
  }

  /**
   * 保存分析结果
   */
  async saveResults(
    analysisFile = 'zhihu_analysis.json',
    reportFile = 'zhihu_report.md'
  ) {
    console.log('\n保存分析结果...');

    // 保存完整的分析数据
    await fs.writeFile(
      analysisFile,
      JSON.stringify(this.analysisResults, null, 2),
      'utf-8'
    );
    console.log(`✓ 分析数据已保存到: ${analysisFile}`);

    // 保存报告
    const report = this.generateReport();
    await fs.writeFile(reportFile, report, 'utf-8');
    console.log(`✓ 分析报告已保存到: ${reportFile}`);
  }

  /**
   * 获取分析结果
   */
  getResults() {
    return this.analysisResults;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  (async () => {
    try {
      const analyzer = new AnswerAnalyzer();

      // 加载回答数据
      await analyzer.loadAnswers('zhihu_answers.json');

      // 分析回答（限制数量以节省API调用）
      const maxAnalyze = parseInt(process.env.MAX_ANALYZE) || 20;
      await analyzer.analyzeAll(maxAnalyze);

      // 保存结果
      await analyzer.saveResults();

      // 显示TOP 3
      console.log('\n=== TOP 3 最有价值的回答 ===\n');
      const top3 = analyzer.getTopAnswers(3);
      top3.forEach((answer, idx) => {
        console.log(`${idx + 1}. ${answer.author} (${answer.analysis.totalScore}/50分)`);
        console.log(`   ${answer.analysis.summary}`);
        console.log('');
      });

    } catch (error) {
      console.error('执行失败:', error);
      process.exit(1);
    }
  })();
}

module.exports = AnswerAnalyzer;
