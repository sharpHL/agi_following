const { chromium } = require('playwright');
const fs = require('fs').promises;
const CookieManager = require('./cookie-manager');

/**
 * 知乎问题回答爬虫
 * 使用Playwright模拟真实浏览器，抓取问题下的所有回答
 */
class ZhihuScraper {
  constructor(questionUrl, options = {}) {
    this.questionUrl = questionUrl;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.answers = [];
    this.cookieManager = new CookieManager(options.cookieFile);
    this.useCookies = options.useCookies !== false; // 默认使用cookie
  }

  /**
   * 初始化浏览器
   */
  async init() {
    console.log('启动浏览器...');
    this.browser = await chromium.launch({
      headless: true, // 无头模式，提高性能
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors',  // 忽略证书错误，修复网络异常
        '--disable-dev-shm-usage'
      ]
    });

    // 创建浏览器上下文
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true  // 忽略HTTPS错误，修复SSL证书问题
    });

    // 加载并应用 Cookie（如果启用）
    if (this.useCookies) {
      const cookies = await this.cookieManager.loadCookies();
      if (cookies.length > 0) {
        await this.cookieManager.applyCookiesToContext(this.context, cookies);
      }
    }

    // 创建页面
    this.page = await this.context.newPage();

    console.log('浏览器启动成功');
  }

  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    try {
      const isLoggedIn = await this.page.evaluate(() => {
        const userMenu = document.querySelector('.AppHeader-profileAvatar');
        const userLink = document.querySelector('.AppHeader-userInfo');
        return !!(userMenu || userLink);
      });

      if (isLoggedIn) {
        console.log('✓ 已登录状态');
      } else {
        console.log('⚠ 未登录状态（可能看不到全部回答）');
        console.log('提示：运行 node login-zhihu.js 来登录');
      }

      return isLoggedIn;
    } catch (error) {
      console.log('无法检测登录状态');
      return false;
    }
  }

  /**
   * 访问问题页面并加载所有回答
   */
  async loadAllAnswers() {
    console.log(`正在访问: ${this.questionUrl}`);

    try {
      // 访问页面，等待网络空闲
      await this.page.goto(this.questionUrl, {
        waitUntil: 'domcontentloaded',  // 改用 domcontentloaded，更可靠
        timeout: 90000  // 增加超时到90秒
      });

      console.log('页面加载完成');

      // 检查登录状态
      await this.checkLoginStatus();

      console.log('开始获取回答...');

      // 尝试多个可能的选择器
      const possibleSelectors = [
        '.List-item',
        '.AnswerItem',
        '.ContentItem',
        'article[class*="Answer"]',
        '[itemprop="answer"]'
      ];

      let foundSelector = null;
      for (const selector of possibleSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          foundSelector = selector;
          console.log(`✓ 找到回答列表（选择器: ${selector}）`);
          break;
        } catch (e) {
          // 继续尝试下一个选择器
        }
      }

      if (!foundSelector) {
        console.log('⚠ 警告：使用所有已知选择器都未找到回答列表');
        console.log('页面可能需要登录，或者结构已变化');
        console.log('提示：运行 node debug-zhihu.js 进行详细诊断');
      }

      // 滚动加载所有回答
      await this.scrollToLoadAll();

      // 提取回答数据
      await this.extractAnswers();

      console.log(`成功提取 ${this.answers.length} 个回答`);

    } catch (error) {
      console.error('加载页面失败:', error.message);
      throw error;
    }
  }

  /**
   * 滚动页面加载所有回答
   */
  async scrollToLoadAll() {
    console.log('开始滚动加载所有回答...');

    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 50; // 最多滚动50次，防止无限循环

    while (scrollAttempts < maxScrollAttempts) {
      // 滚动到页面底部
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // 等待新内容加载
      await this.page.waitForTimeout(2000);

      // 获取当前页面高度
      const currentHeight = await this.page.evaluate(() => document.body.scrollHeight);

      // 如果高度不再变化，说明已经加载完所有内容
      if (currentHeight === previousHeight) {
        console.log('已加载所有回答');
        break;
      }

      previousHeight = currentHeight;
      scrollAttempts++;

      // 显示进度
      if (scrollAttempts % 5 === 0) {
        const currentAnswers = await this.page.$$('.List-item');
        console.log(`已滚动 ${scrollAttempts} 次，当前可见 ${currentAnswers.length} 个回答...`);
      }
    }

    if (scrollAttempts >= maxScrollAttempts) {
      console.log('达到最大滚动次数，停止加载');
    }
  }

  /**
   * 提取回答数据
   */
  async extractAnswers() {
    console.log('开始提取回答数据...');

    this.answers = await this.page.evaluate(() => {
      // 尝试多个可能的选择器
      const possibleSelectors = [
        '.List-item',
        '.AnswerItem',
        '.ContentItem',
        'article[class*="Answer"]',
        '[itemprop="answer"]'
      ];

      let answerElements = [];
      for (const selector of possibleSelectors) {
        answerElements = document.querySelectorAll(selector);
        if (answerElements.length > 0) {
          console.log(`使用选择器: ${selector}，找到 ${answerElements.length} 个元素`);
          break;
        }
      }

      const answers = [];

      answerElements.forEach((element, index) => {
        try {
          // 提取作者信息
          const authorElement = element.querySelector('.AuthorInfo-name');
          const author = authorElement ? authorElement.textContent.trim() : '匿名用户';

          // 提取回答内容
          const contentElement = element.querySelector('.RichContent-inner');
          let content = '';
          if (contentElement) {
            // 获取文本内容，去除HTML标签
            content = contentElement.innerText.trim();
          }

          // 提取时间信息
          const timeElement = element.querySelector('.ContentItem-time');
          let timeText = '';
          if (timeElement) {
            timeText = timeElement.textContent.trim();
          } else {
            // 尝试其他可能的时间选择器
            const altTimeElement = element.querySelector('[data-tooltip*="编辑于"], [data-tooltip*="发布于"]');
            if (altTimeElement) {
              timeText = altTimeElement.getAttribute('data-tooltip') || altTimeElement.textContent.trim();
            }
          }

          // 提取点赞数
          const voteElement = element.querySelector('.VoteButton--up');
          let voteCount = 0;
          if (voteElement) {
            const voteText = voteElement.textContent.trim();
            voteCount = voteText.includes('K')
              ? parseFloat(voteText.replace('K', '')) * 1000
              : parseInt(voteText) || 0;
          }

          // 提取评论数
          const commentElement = element.querySelector('.ContentItem-actions button[aria-label*="评论"]');
          let commentCount = 0;
          if (commentElement) {
            const commentText = commentElement.textContent.trim();
            commentCount = parseInt(commentText.replace(/[^0-9]/g, '')) || 0;
          }

          // 只保存有内容的回答
          if (content && content.length > 10) {
            answers.push({
              index: index + 1,
              author,
              content: content.substring(0, 2000), // 限制长度，避免过长
              timeText,
              voteCount,
              commentCount,
              contentLength: content.length
            });
          }
        } catch (error) {
          console.error(`提取第 ${index + 1} 个回答时出错:`, error.message);
        }
      });

      return answers;
    });

    console.log(`提取完成，共 ${this.answers.length} 个有效回答`);
  }

  /**
   * 按时间倒排（最新的在前）
   * 注意：知乎的时间格式比较复杂，这里使用简单的启发式方法
   */
  sortByTime() {
    console.log('按时间排序回答...');

    // 解析时间文本为可比较的值
    this.answers.forEach(answer => {
      answer.parsedTime = this.parseTimeText(answer.timeText);
    });

    // 按时间倒序排列（最新的在前）
    this.answers.sort((a, b) => b.parsedTime - a.parsedTime);

    console.log('排序完成');
  }

  /**
   * 解析知乎的时间文本
   * 例如："编辑于 2023-10-15"、"发布于 2023-10-15"、"3 小时前"等
   */
  parseTimeText(timeText) {
    if (!timeText) return 0;

    const now = Date.now();

    // 匹配具体日期：YYYY-MM-DD
    const dateMatch = timeText.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      return new Date(dateMatch[0]).getTime();
    }

    // 匹配相对时间
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

    // 默认返回0（最早）
    return 0;
  }

  /**
   * 保存结果到JSON文件
   */
  async saveToFile(filename = 'zhihu_answers.json') {
    console.log(`保存结果到 ${filename}...`);

    const data = {
      questionUrl: this.questionUrl,
      totalAnswers: this.answers.length,
      scrapedAt: new Date().toISOString(),
      answers: this.answers
    };

    await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf-8');
    console.log('保存成功');
  }

  /**
   * 获取回答列表
   */
  getAnswers() {
    return this.answers;
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('浏览器已关闭');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const questionUrl = process.argv[2] || 'https://www.zhihu.com/question/490365386';

  (async () => {
    const scraper = new ZhihuScraper(questionUrl);

    try {
      await scraper.init();
      await scraper.loadAllAnswers();
      scraper.sortByTime();
      await scraper.saveToFile('zhihu_answers.json');

      console.log('\n=== 爬取摘要 ===');
      console.log(`问题链接: ${questionUrl}`);
      console.log(`回答总数: ${scraper.getAnswers().length}`);
      console.log(`前3个回答:`);
      scraper.getAnswers().slice(0, 3).forEach((answer, idx) => {
        console.log(`\n${idx + 1}. 作者: ${answer.author}`);
        console.log(`   时间: ${answer.timeText}`);
        console.log(`   点赞: ${answer.voteCount}`);
        console.log(`   内容预览: ${answer.content.substring(0, 100)}...`);
      });

    } catch (error) {
      console.error('执行失败:', error);
      process.exit(1);
    } finally {
      await scraper.close();
    }
  })();
}

module.exports = ZhihuScraper;
