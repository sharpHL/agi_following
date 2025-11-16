#!/usr/bin/env node

const fs = require('fs').promises;
const cheerio = require('cheerio');
const path = require('path');

/**
 * 本地 HTML 文件解析器
 * 用于解析手动保存的知乎问题页面
 *
 * 使用方法：
 * 1. 在浏览器中打开知乎问题页面
 * 2. 滚动到底部加载所有回答
 * 3. 右键 → 保存页面为 → 完整网页
 * 4. 运行: node parse-local-html.js <保存的html文件路径>
 */
class LocalHTMLParser {
  constructor(htmlFilePath) {
    this.htmlFilePath = htmlFilePath;
    this.answers = [];
    this.$ = null;
  }

  /**
   * 加载 HTML 文件
   */
  async loadHTML() {
    console.log(`正在读取文件: ${this.htmlFilePath}`);

    try {
      const html = await fs.readFile(this.htmlFilePath, 'utf-8');
      this.$ = cheerio.load(html);
      console.log('✓ HTML 文件加载成功\n');
      return true;
    } catch (error) {
      console.error('✗ 读取文件失败:', error.message);
      return false;
    }
  }

  /**
   * 提取问题信息
   */
  extractQuestionInfo() {
    const $ = this.$;

    // 提取问题标题
    const title = $('h1.QuestionHeader-title').text().trim() ||
                  $('.QuestionHeader-main h1').text().trim() ||
                  'title';

    // 提取问题描述
    const description = $('.QuestionRichText').text().trim() ||
                       $('.QuestionHeader-detail').text().trim() ||
                       '';

    // 提取关注数和回答数
    const followCount = $('.NumberBoard-itemValue').first().text().trim() || '0';
    const answerCount = $('.List-headerText span').text().trim() || '0';

    console.log('问题信息:');
    console.log(`  标题: ${title}`);
    console.log(`  描述: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`);
    console.log(`  关注: ${followCount}`);
    console.log(`  回答: ${answerCount}\n`);

    return { title, description, followCount, answerCount };
  }

  /**
   * 解析回答列表
   */
  parseAnswers() {
    const $ = this.$;
    console.log('开始解析回答...\n');

    // 尝试多种可能的选择器
    const possibleSelectors = [
      '.List-item',
      '.AnswerItem',
      '.ContentItem',
      'div[itemprop="answer"]',
      'article'
    ];

    let answerElements = null;
    for (const selector of possibleSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`✓ 使用选择器: ${selector}`);
        console.log(`✓ 找到 ${elements.length} 个元素\n`);
        answerElements = elements;
        break;
      }
    }

    if (!answerElements || answerElements.length === 0) {
      console.log('✗ 未找到回答元素');
      console.log('提示: HTML 文件可能不完整，或页面结构已变化\n');
      return [];
    }

    // 解析每个回答
    answerElements.each((index, element) => {
      try {
        const $elem = $(element);

        // 提取作者信息
        const authorName = $elem.find('.AuthorInfo-name').text().trim() ||
                          $elem.find('.UserLink-link').text().trim() ||
                          $elem.find('[itemprop="name"]').text().trim() ||
                          '匿名用户';

        // 提取作者简介
        const authorBio = $elem.find('.AuthorInfo-detail').text().trim() ||
                         $elem.find('.AuthorInfo-badge').text().trim() ||
                         '';

        // 提取回答内容
        let content = $elem.find('.RichContent-inner').text().trim() ||
                     $elem.find('.RichText').text().trim() ||
                     $elem.find('[itemprop="text"]').text().trim() ||
                     '';

        // 清理内容（移除多余空白）
        content = content.replace(/\s+/g, ' ').trim();

        // 提取时间信息
        const timeText = $elem.find('.ContentItem-time').text().trim() ||
                        $elem.find('[data-tooltip]').attr('data-tooltip') ||
                        $elem.find('time').text().trim() ||
                        '';

        // 提取点赞数
        let voteCount = 0;
        const voteText = $elem.find('.VoteButton--up').text().trim() ||
                        $elem.find('[aria-label*="赞同"]').text().trim() ||
                        '0';

        if (voteText.includes('K')) {
          voteCount = Math.round(parseFloat(voteText.replace('K', '')) * 1000);
        } else if (voteText.includes('万')) {
          voteCount = Math.round(parseFloat(voteText.replace('万', '')) * 10000);
        } else {
          voteCount = parseInt(voteText.replace(/[^0-9]/g, '')) || 0;
        }

        // 提取评论数
        let commentCount = 0;
        const commentText = $elem.find('[aria-label*="评论"]').text().trim() ||
                           $elem.find('.Button--withIcon').text().trim() ||
                           '0';
        commentCount = parseInt(commentText.replace(/[^0-9]/g, '')) || 0;

        // 提取收藏数
        let collectCount = 0;
        const collectText = $elem.find('[aria-label*="收藏"]').text().trim() || '0';
        collectCount = parseInt(collectText.replace(/[^0-9]/g, '')) || 0;

        // 只保存有效回答（有内容）
        if (content && content.length > 20) {
          this.answers.push({
            index: this.answers.length + 1,
            author: authorName,
            authorBio: authorBio,
            content: content,
            timeText: timeText,
            voteCount: voteCount,
            commentCount: commentCount,
            collectCount: collectCount,
            contentLength: content.length
          });

          if (this.answers.length <= 3) {
            console.log(`[${this.answers.length}] ${authorName}`);
            console.log(`    点赞: ${voteCount} | 评论: ${commentCount}`);
            console.log(`    内容: ${content.substring(0, 80)}...\n`);
          }
        }

      } catch (error) {
        console.error(`解析第 ${index + 1} 个回答时出错:`, error.message);
      }
    });

    console.log(`✓ 成功解析 ${this.answers.length} 个回答\n`);
    return this.answers;
  }

  /**
   * 按时间排序
   */
  sortByTime() {
    console.log('按时间排序...');

    // 解析时间文本
    this.answers.forEach(answer => {
      answer.parsedTime = this.parseTimeText(answer.timeText);
    });

    // 按时间倒序排列（最新的在前）
    this.answers.sort((a, b) => b.parsedTime - a.parsedTime);

    console.log('✓ 排序完成\n');
  }

  /**
   * 解析时间文本
   */
  parseTimeText(timeText) {
    if (!timeText) return 0;

    const now = Date.now();

    // 具体日期
    const dateMatch = timeText.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      return new Date(dateMatch[0]).getTime();
    }

    // 相对时间
    if (timeText.includes('分钟前')) {
      const minutes = parseInt(timeText);
      return now - minutes * 60 * 1000;
    }

    if (timeText.includes('小时前')) {
      const hours = parseInt(timeText);
      return now - hours * 60 * 60 * 1000;
    }

    if (timeText.includes('天前')) {
      const days = parseInt(timeText);
      return now - days * 24 * 60 * 60 * 1000;
    }

    if (timeText.includes('昨天')) {
      return now - 24 * 60 * 60 * 1000;
    }

    return 0;
  }

  /**
   * 保存结果
   */
  async saveResults(outputFile = 'zhihu_answers.json') {
    console.log(`保存结果到 ${outputFile}...`);

    const questionInfo = this.extractQuestionInfo();

    const data = {
      source: 'local-html',
      htmlFile: path.basename(this.htmlFilePath),
      questionInfo: questionInfo,
      totalAnswers: this.answers.length,
      parsedAt: new Date().toISOString(),
      answers: this.answers
    };

    await fs.writeFile(outputFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log('✓ 保存成功\n');

    return outputFile;
  }

  /**
   * 显示统计信息
   */
  showStats() {
    console.log('========================================');
    console.log('   解析统计');
    console.log('========================================\n');

    console.log(`总回答数: ${this.answers.length}`);

    if (this.answers.length > 0) {
      // 统计总点赞数
      const totalVotes = this.answers.reduce((sum, a) => sum + a.voteCount, 0);
      console.log(`总点赞数: ${totalVotes.toLocaleString()}`);

      // 平均点赞数
      const avgVotes = Math.round(totalVotes / this.answers.length);
      console.log(`平均点赞: ${avgVotes}`);

      // 最高点赞
      const topAnswer = this.answers.reduce((max, a) =>
        a.voteCount > max.voteCount ? a : max
      );
      console.log(`最高点赞: ${topAnswer.voteCount} (${topAnswer.author})`);

      // 内容统计
      const totalLength = this.answers.reduce((sum, a) => sum + a.contentLength, 0);
      const avgLength = Math.round(totalLength / this.answers.length);
      console.log(`平均字数: ${avgLength}`);

      console.log('\n');
    }
  }
}

/**
 * 命令行入口
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
知乎本地 HTML 解析工具

用法:
  node parse-local-html.js <HTML文件路径> [输出文件]

示例:
  node parse-local-html.js zhihu-question.html
  node parse-local-html.js zhihu-question.html output/answers.json

步骤:
  1. 在浏览器中打开知乎问题页面并登录
  2. 滚动到页面底部，加载所有回答
  3. 右键 → 保存页面为 → 网页，全部 (*.html)
  4. 运行此脚本解析保存的 HTML 文件

优点:
  ✓ 完全绕过反爬虫限制
  ✓ 可以获取所有回答（包括需要登录的内容）
  ✓ 速度快，无需等待网络请求
  ✓ 可重复解析，无需重新爬取
    `);
    process.exit(0);
  }

  const htmlFile = args[0];
  const outputFile = args[1] || 'zhihu_answers.json';

  // 检查文件是否存在
  try {
    await fs.access(htmlFile);
  } catch (error) {
    console.error(`✗ 文件不存在: ${htmlFile}\n`);
    console.error('请确保文件路径正确，或使用 --help 查看使用说明');
    process.exit(1);
  }

  console.log('========================================');
  console.log('   知乎本地 HTML 解析器');
  console.log('========================================\n');

  const parser = new LocalHTMLParser(htmlFile);

  try {
    // 加载 HTML
    const loaded = await parser.loadHTML();
    if (!loaded) {
      process.exit(1);
    }

    // 提取问题信息
    parser.extractQuestionInfo();

    // 解析回答
    const answers = parser.parseAnswers();

    if (answers.length === 0) {
      console.log('未找到任何回答，请检查 HTML 文件是否完整\n');
      process.exit(1);
    }

    // 排序
    parser.sortByTime();

    // 保存结果
    await parser.saveResults(outputFile);

    // 显示统计
    parser.showStats();

    console.log('========================================');
    console.log(`✓ 解析完成！现在可以运行分析:`);
    console.log(`  node answer-analyzer.js`);
    console.log('========================================\n');

  } catch (error) {
    console.error('解析过程出错:', error);
    process.exit(1);
  }
}

// 只在直接运行时执行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = LocalHTMLParser;
