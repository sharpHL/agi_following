#!/usr/bin/env node

require('dotenv').config();

const ZhihuScraper = require('./zhihu-scraper');
const AnswerAnalyzer = require('./answer-analyzer');
const fs = require('fs').promises;

/**
 * 知乎问题分析主程序
 * 整合爬虫和分析功能，提供完整的工作流
 */
class ZhihuQuestionAnalyzer {
  constructor(options = {}) {
    this.questionUrl = options.questionUrl;
    this.maxAnalyze = options.maxAnalyze || 20;
    this.outputDir = options.outputDir || './output';
    this.scraperDelay = options.scraperDelay || 2000;
    this.analyzerDelay = options.analyzerDelay || 2000;
  }

  /**
   * 执行完整的分析流程
   */
  async run() {
    console.log('========================================');
    console.log('   知乎问题分析系统');
    console.log('========================================\n');

    try {
      // 创建输出目录
      await this.ensureOutputDir();

      // 步骤1: 爬取回答
      console.log('【步骤 1/3】爬取知乎回答\n');
      const answers = await this.scrapeAnswers();

      if (answers.length === 0) {
        console.error('未找到任何回答，程序终止');
        return;
      }

      // 步骤2: 分析回答价值
      console.log('\n【步骤 2/3】使用AI分析回答价值\n');
      await this.analyzeAnswers();

      // 步骤3: 生成报告
      console.log('\n【步骤 3/3】生成分析报告\n');
      await this.generateFinalReport();

      console.log('\n========================================');
      console.log('   分析完成！');
      console.log('========================================\n');

      this.printSummary();

    } catch (error) {
      console.error('\n执行失败:', error.message);
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * 确保输出目录存在
   */
  async ensureOutputDir() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`创建输出目录: ${this.outputDir}\n`);
    }
  }

  /**
   * 爬取知乎回答
   */
  async scrapeAnswers() {
    const scraper = new ZhihuScraper(this.questionUrl);

    try {
      await scraper.init();
      await scraper.loadAllAnswers();
      scraper.sortByTime();

      const outputFile = `${this.outputDir}/answers.json`;
      await scraper.saveToFile(outputFile);

      console.log(`\n✓ 成功爬取 ${scraper.getAnswers().length} 个回答`);
      console.log(`✓ 数据已保存到: ${outputFile}`);

      return scraper.getAnswers();

    } finally {
      await scraper.close();
    }
  }

  /**
   * 分析回答价值
   */
  async analyzeAnswers() {
    const analyzer = new AnswerAnalyzer();

    await analyzer.loadAnswers(`${this.outputDir}/answers.json`);

    // 限制分析数量
    const actualMaxAnalyze = Math.min(this.maxAnalyze, analyzer.answers.length);
    console.log(`将分析前 ${actualMaxAnalyze} 个回答\n`);

    await analyzer.analyzeAll(actualMaxAnalyze, this.analyzerDelay);

    // 保存分析结果
    await analyzer.saveResults(
      `${this.outputDir}/analysis.json`,
      `${this.outputDir}/report.md`
    );

    this.analysisResults = analyzer.getResults();
  }

  /**
   * 生成最终报告
   */
  async generateFinalReport() {
    // 读取现有报告
    const reportPath = `${this.outputDir}/report.md`;
    let report = await fs.readFile(reportPath, 'utf-8');

    // 添加问题信息
    const header = `# 知乎问题分析报告\n\n`;
    const questionInfo = `**问题链接**: ${this.questionUrl}\n`;
    const timestamp = `**分析时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;

    report = header + questionInfo + timestamp + report.substring(report.indexOf('\n') + 1);

    // 重新保存
    await fs.writeFile(reportPath, report, 'utf-8');

    console.log(`✓ 报告已生成: ${reportPath}`);
  }

  /**
   * 打印摘要信息
   */
  printSummary() {
    console.log('输出文件：');
    console.log(`  - ${this.outputDir}/answers.json      (所有回答的原始数据)`);
    console.log(`  - ${this.outputDir}/analysis.json     (AI分析结果)`);
    console.log(`  - ${this.outputDir}/report.md         (分析报告)\n`);

    if (this.analysisResults && this.analysisResults.length > 0) {
      console.log('TOP 3 最有价值的回答：\n');

      const sorted = [...this.analysisResults].sort(
        (a, b) => b.analysis.totalScore - a.analysis.totalScore
      );

      sorted.slice(0, 3).forEach((answer, idx) => {
        console.log(`${idx + 1}. ${answer.author} (${answer.analysis.totalScore}/50分)`);
        console.log(`   时间: ${answer.timeText}`);
        console.log(`   点赞: ${answer.voteCount}`);
        console.log(`   摘要: ${answer.analysis.summary}\n`);
      });
    }
  }
}

/**
 * 命令行接口
 */
async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
知乎问题分析工具

用法:
  node zhihu-analyzer.js <问题URL> [选项]

示例:
  node zhihu-analyzer.js https://www.zhihu.com/question/490365386
  node zhihu-analyzer.js https://www.zhihu.com/question/490365386 --max-analyze 30

选项:
  --max-analyze <数量>    最多分析多少个回答（默认: 20）
  --output-dir <路径>     输出目录（默认: ./output）
  --help, -h              显示帮助信息

环境变量:
  ANTHROPIC_API_KEY       Claude API密钥（必需）

输出:
  - answers.json          所有爬取的回答数据
  - analysis.json         AI分析结果
  - report.md             分析报告（Markdown格式）
    `);
    process.exit(0);
  }

  // 解析URL
  const questionUrl = args[0];

  if (!questionUrl.includes('zhihu.com/question/')) {
    console.error('错误: 请提供有效的知乎问题URL');
    console.error('示例: https://www.zhihu.com/question/490365386');
    process.exit(1);
  }

  // 解析选项
  const options = {
    questionUrl,
    maxAnalyze: 20,
    outputDir: './output'
  };

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--max-analyze' && args[i + 1]) {
      options.maxAnalyze = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--output-dir' && args[i + 1]) {
      options.outputDir = args[i + 1];
      i++;
    }
  }

  // 检查环境变量
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('错误: 未设置 ANTHROPIC_API_KEY 环境变量');
    console.error('请先设置: export ANTHROPIC_API_KEY=your-api-key');
    process.exit(1);
  }

  // 执行分析
  const analyzer = new ZhihuQuestionAnalyzer(options);
  await analyzer.run();
}

// 只在直接运行时执行
if (require.main === module) {
  main().catch(error => {
    console.error('程序异常退出:', error);
    process.exit(1);
  });
}

module.exports = ZhihuQuestionAnalyzer;
