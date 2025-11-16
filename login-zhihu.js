#!/usr/bin/env node

const { chromium } = require('playwright');
const CookieManager = require('./cookie-manager');
const readline = require('readline');

/**
 * 知乎登录工具
 * 打开浏览器让用户手动登录，然后保存 Cookie
 */
class ZhihuLogin {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.cookieManager = new CookieManager();
  }

  /**
   * 启动浏览器并打开知乎登录页面
   */
  async start() {
    console.log('========================================');
    console.log('   知乎登录工具');
    console.log('========================================\n');

    console.log('正在启动浏览器...');

    // 启动浏览器（非无头模式，用户需要看到浏览器进行登录）
    this.browser = await chromium.launch({
      headless: false,  // 显示浏览器窗口
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
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true  // 忽略HTTPS错误，修复SSL证书问题
    });

    // 创建新页面
    this.page = await this.context.newPage();

    console.log('✓ 浏览器启动成功\n');

    // 访问知乎首页
    console.log('正在打开知乎...');
    await this.page.goto('https://www.zhihu.com/', {
      waitUntil: 'domcontentloaded',  // 改用 domcontentloaded，更快更可靠
      timeout: 90000  // 增加超时到90秒
    });

    console.log('✓ 知乎页面已打开\n');
  }

  /**
   * 等待用户完成登录
   */
  async waitForLogin() {
    console.log('========================================');
    console.log('请在浏览器中完成以下操作：');
    console.log('1. 点击页面右上角的"登录"按钮');
    console.log('2. 选择登录方式（手机验证码、密码等）');
    console.log('3. 完成登录');
    console.log('4. 确认看到个人头像（表示已登录）');
    console.log('========================================\n');

    // 创建命令行接口
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await new Promise((resolve) => {
      rl.question('完成登录后，按回车键继续... ', () => {
        rl.close();
        resolve();
      });
    });
  }

  /**
   * 验证登录状态
   */
  async verifyLogin() {
    console.log('\n正在验证登录状态...');

    try {
      // 检查是否存在登录用户的标识
      const isLoggedIn = await this.page.evaluate(() => {
        // 检查是否有用户菜单（登录后才有）
        const userMenu = document.querySelector('.AppHeader-profileAvatar');
        const userLink = document.querySelector('.AppHeader-userInfo');

        return !!(userMenu || userLink);
      });

      if (isLoggedIn) {
        console.log('✓ 登录状态验证成功！');
        return true;
      } else {
        console.log('✗ 未检测到登录状态');
        console.log('提示：请确保已经完成登录，并且页面右上角显示了你的头像');
        return false;
      }
    } catch (error) {
      console.error('验证登录状态时出错:', error.message);
      return false;
    }
  }

  /**
   * 保存 Cookie
   */
  async saveCookies() {
    console.log('\n正在保存 Cookie...');

    try {
      const cookies = await this.cookieManager.getCookiesFromContext(this.context);

      if (cookies.length === 0) {
        console.log('✗ 未获取到任何 Cookie');
        return false;
      }

      // 保存 Cookie
      await this.cookieManager.saveCookies(cookies);

      // 显示 Cookie 信息
      console.log('\nCookie 信息:');
      console.log(`- 总数: ${cookies.length}`);
      console.log(`- 关键 Cookie: ${cookies.filter(c => c.name.includes('z_c0') || c.name.includes('_zap')).map(c => c.name).join(', ')}`);

      return true;
    } catch (error) {
      console.error('保存 Cookie 失败:', error.message);
      return false;
    }
  }

  /**
   * 测试 Cookie 是否有效
   */
  async testCookies() {
    console.log('\n正在测试 Cookie...');

    try {
      // 关闭当前浏览器
      await this.browser.close();

      // 启动新浏览器测试
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--ignore-certificate-errors'
        ]
      });

      this.context = await this.browser.newContext({
        ignoreHTTPSErrors: true
      });

      // 加载 Cookie
      const cookies = await this.cookieManager.loadCookies();
      await this.cookieManager.applyCookiesToContext(this.context, cookies);

      // 访问知乎
      this.page = await this.context.newPage();
      await this.page.goto('https://www.zhihu.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // 检查登录状态
      const isLoggedIn = await this.page.evaluate(() => {
        const userMenu = document.querySelector('.AppHeader-profileAvatar');
        const userLink = document.querySelector('.AppHeader-userInfo');
        return !!(userMenu || userLink);
      });

      if (isLoggedIn) {
        console.log('✓ Cookie 测试成功！可以正常使用');
        return true;
      } else {
        console.log('✗ Cookie 测试失败，可能需要重新登录');
        return false;
      }
    } catch (error) {
      console.error('测试 Cookie 时出错:', error.message);
      return false;
    }
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('\n浏览器已关闭');
    }
  }

  /**
   * 运行完整的登录流程
   */
  async run() {
    try {
      // 1. 启动浏览器
      await this.start();

      // 2. 等待用户登录
      await this.waitForLogin();

      // 3. 验证登录状态
      const isLoggedIn = await this.verifyLogin();
      if (!isLoggedIn) {
        console.log('\n请重新运行此脚本并完成登录');
        return false;
      }

      // 4. 保存 Cookie
      const saved = await this.saveCookies();
      if (!saved) {
        console.log('\nCookie 保存失败');
        return false;
      }

      // 5. 测试 Cookie
      const tested = await this.testCookies();

      if (tested) {
        console.log('\n========================================');
        console.log('   登录成功！');
        console.log('========================================\n');
        console.log('现在你可以使用以下命令爬取知乎回答：');
        console.log('node zhihu-analyzer.js <问题URL>\n');
        return true;
      } else {
        console.log('\n虽然保存了 Cookie，但测试失败');
        console.log('你仍然可以尝试运行爬虫，可能可以正常工作');
        return false;
      }

    } catch (error) {
      console.error('\n登录过程出错:', error);
      return false;
    } finally {
      await this.close();
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const login = new ZhihuLogin();

  try {
    await login.run();
  } catch (error) {
    console.error('程序异常:', error);
    process.exit(1);
  }
}

// 只在直接运行时执行
if (require.main === module) {
  main();
}

module.exports = ZhihuLogin;
