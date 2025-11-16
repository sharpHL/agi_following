const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const fs = require('fs').promises;
const CookieManager = require('./cookie-manager');

// 添加 stealth 插件（隐藏自动化特征）
chromium.use(stealth);

/**
 * 知乎问题回答爬虫（Stealth 版本）
 * 使用反反爬虫技术，更难被检测
 */
class ZhihuScraperStealth {
  constructor(questionUrl, options = {}) {
    this.questionUrl = questionUrl;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.answers = [];
    this.cookieManager = new CookieManager(options.cookieFile);
    this.useCookies = options.useCookies !== false;
  }

  /**
   * 初始化浏览器（隐蔽模式）
   */
  async init() {
    console.log('启动隐蔽模式浏览器...');

    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled', // 关键：隐藏自动化标志
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    // 创建隐蔽的浏览器上下文
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      // 添加常见的浏览器特征
      extraHTTPHeaders: {
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    // 加载 Cookie
    if (this.useCookies) {
      const cookies = await this.cookieManager.loadCookies();
      if (cookies.length > 0) {
        await this.cookieManager.applyCookiesToContext(this.context, cookies);
      }
    }

    // 创建页面
    this.page = await this.context.newPage();

    // 进一步隐藏自动化特征
    await this.page.addInitScript(() => {
      // 覆盖 navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // 覆盖 navigator.plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });

      // 覆盖 navigator.languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['zh-CN', 'zh', 'en']
      });

      // 添加 chrome 对象
      window.chrome = {
        runtime: {}
      };

      // 覆盖 permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    console.log('✓ 隐蔽模式浏览器启动成功');
  }

  /**
   * 模拟人类行为：随机延迟
   */
  async humanDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.page.waitForTimeout(delay);
  }

  /**
   * 模拟人类行为：随机鼠标移动
   */
  async randomMouseMove() {
    const x = Math.floor(Math.random() * 1000) + 100;
    const y = Math.floor(Math.random() * 600) + 100;
    await this.page.mouse.move(x, y);
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
      // 模拟真实访问：先访问首页
      console.log('模拟真实用户行为：先访问首页...');
      await this.page.goto('https://www.zhihu.com/', {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      await this.humanDelay(2000, 4000);
      await this.randomMouseMove();

      // 再访问目标页面
      console.log('访问目标问题页面...');
      await this.page.goto(this.questionUrl, {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      console.log('页面加载完成');

      await this.humanDelay(2000, 3000);

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
        console.log('建议：使用本地 HTML 解析方案（node parse-local-html.js）');
      }

      // 模拟人类滚动
      await this.humanScrollToLoadAll();

      // 提取回答数据
      await this.extractAnswers();

      console.log(`成功提取 ${this.answers.length} 个回答`);

    } catch (error) {
      console.error('加载页面失败:', error.message);
      throw error;
    }
  }

  /**
   * 模拟人类滚动加载所有回答
   */
  async humanScrollToLoadAll() {
    console.log('开始模拟人类滚动行为...');

    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 30;

    while (scrollAttempts < maxScrollAttempts) {
      // 模拟真实用户滚动：不是直接到底部，而是逐步滚动
      await this.page.evaluate(() => {
        const scrollDistance = Math.floor(Math.random() * 500) + 500;
        window.scrollBy(0, scrollDistance);
      });

      // 随机延迟（模拟阅读时间）
      await this.humanDelay(1500, 3000);

      // 偶尔向上滚动一点（模拟回看）
      if (Math.random() < 0.2) {
        await this.page.evaluate(() => {
          window.scrollBy(0, -200);
        });
        await this.humanDelay(500, 1000);
      }

      // 随机鼠标移动
      if (Math.random() < 0.3) {
        await this.randomMouseMove();
      }

      // 检查是否到底部
      const currentHeight = await this.page.evaluate(() => document.body.scrollHeight);

      if (currentHeight === previousHeight) {
        // 再尝试滚动到绝对底部
        await this.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await this.humanDelay(2000, 3000);

        const finalHeight = await this.page.evaluate(() => document.body.scrollHeight);
        if (finalHeight === currentHeight) {
          console.log('✓ 已加载所有回答');
          break;
        }
      }

      previousHeight = currentHeight;
      scrollAttempts++;

      if (scrollAttempts % 5 === 0) {
        const currentAnswers = await this.page.$$('.List-item');
        console.log(`已滚动 ${scrollAttempts} 次，当前可见 ${currentAnswers.length} 个回答...`);
      }
    }

    if (scrollAttempts >= maxScrollAttempts) {
      console.log('达到最大滚动次数');
    }
  }

  /**
   * 提取回答数据
   */
  async extractAnswers() {
    console.log('开始提取回答数据...');

    this.answers = await this.page.evaluate(() => {
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
          break;
        }
      }

      const answers = [];

      answerElements.forEach((element, index) => {
        try {
          const authorElement = element.querySelector('.AuthorInfo-name');
          const author = authorElement ? authorElement.textContent.trim() : '匿名用户';

          const contentElement = element.querySelector('.RichContent-inner');
          let content = '';
          if (contentElement) {
            content = contentElement.innerText.trim();
          }

          const timeElement = element.querySelector('.ContentItem-time');
          let timeText = '';
          if (timeElement) {
            timeText = timeElement.textContent.trim();
          }

          const voteElement = element.querySelector('.VoteButton--up');
          let voteCount = 0;
          if (voteElement) {
            const voteText = voteElement.textContent.trim();
            voteCount = voteText.includes('K')
              ? parseFloat(voteText.replace('K', '')) * 1000
              : parseInt(voteText) || 0;
          }

          const commentElement = element.querySelector('.ContentItem-actions button[aria-label*="评论"]');
          let commentCount = 0;
          if (commentElement) {
            const commentText = commentElement.textContent.trim();
            commentCount = parseInt(commentText.replace(/[^0-9]/g, '')) || 0;
          }

          if (content && content.length > 10) {
            answers.push({
              index: index + 1,
              author,
              content: content.substring(0, 2000),
              timeText,
              voteCount,
              commentCount,
              contentLength: content.length
            });
          }
        } catch (error) {
          // 忽略错误，继续处理下一个
        }
      });

      return answers;
    });

    console.log(`提取完成，共 ${this.answers.length} 个有效回答`);
  }

  /**
   * 排序和保存（与原版相同）
   */
  sortByTime() {
    this.answers.forEach(answer => {
      answer.parsedTime = this.parseTimeText(answer.timeText);
    });
    this.answers.sort((a, b) => b.parsedTime - a.parsedTime);
  }

  parseTimeText(timeText) {
    if (!timeText) return 0;
    const now = Date.now();
    const dateMatch = timeText.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) return new Date(dateMatch[0]).getTime();
    if (timeText.includes('分钟前')) return now - parseInt(timeText) * 60 * 1000;
    if (timeText.includes('小时前')) return now - parseInt(timeText) * 60 * 60 * 1000;
    if (timeText.includes('天前')) return now - parseInt(timeText) * 24 * 60 * 60 * 1000;
    return 0;
  }

  async saveToFile(filename = 'zhihu_answers.json') {
    const data = {
      questionUrl: this.questionUrl,
      totalAnswers: this.answers.length,
      scrapedAt: new Date().toISOString(),
      method: 'stealth',
      answers: this.answers
    };
    await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf-8');
  }

  getAnswers() {
    return this.answers;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = ZhihuScraperStealth;
