#!/usr/bin/env node

const { chromium } = require('playwright');
const CookieManager = require('./cookie-manager');
const readline = require('readline');

/**
 * 知乎登录工具（修复网络问题版本）
 * 打开浏览器让用户手动登录，然后保存 Cookie
 *
 * 修复：
 * - 忽略HTTPS证书错误
 * - 更长的超时时间
 * - 更好的错误处理
 */
class ZhihuLoginFixed {
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
    console.log('   知乎登录工具（修复版）');
    console.log('========================================\n');

    console.log('正在启动浏览器...');

    try {
      // 启动浏览器（非无头模式，用户需要看到浏览器进行登录）
      this.browser = await chromium.launch({
        headless: false,  // 显示浏览器窗口
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--ignore-certificate-errors',  // 忽略证书错误
          '--ignore-certificate-errors-spki-list',
          '--disable-web-security'  // 禁用某些安全检查
        ]
      });

      // 创建浏览器上下文（忽略HTTPS错误）
      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai',
        ignoreHTTPSErrors: true  // 关键：忽略HTTPS错误
      });

      // 创建新页面
      this.page = await this.context.newPage();

      console.log('✓ 浏览器启动成功\n');

      // 访问知乎首页
      console.log('正在打开知乎...');
      console.log('（如果长时间无响应，请检查网络连接）\n');

      await this.page.goto('https://www.zhihu.com/', {
        waitUntil: 'domcontentloaded',  // 改用 domcontentloaded，更快
        timeout: 90000  // 增加超时到90秒
      });

      console.log('✓ 知乎页面已打开\n');
      return true;

    } catch (error) {
      console.error('✗ 启动失败:', error.message);
      console.log('\n可能的原因：');
      console.log('1. 网络连接问题');
      console.log('2. 知乎服务器访问受限');
      console.log('3. 防火墙阻止\n');
      console.log('建议：使用本地HTML解析方案（见README.md）\n');
      throw error;
    }
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
        // 多种方式检查登录状态
        const userMenu = document.querySelector('.AppHeader-profileAvatar');
        const userLink = document.querySelector('.AppHeader-userInfo');
        const userButton = document.querySelector('[aria-label="用户"]');

        // 检查是否有用户相关的元素
        return !!(userMenu || userLink || userButton);
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

      // 过滤并保存 Cookie
      const filteredCookies = this.cookieManager.filterCookies(cookies);
      await this.cookieManager.saveCookies(filteredCookies);

      // 显示 Cookie 信息
      console.log('\nCookie 信息:');
      console.log(`- 原始数量: ${cookies.length}`);
      console.log(`- 过滤后: ${filteredCookies.length}`);

      const keyCookies = filteredCookies.filter(c =>
        ['z_c0', '_zap', 'd_c0', '_xsrf'].includes(c.name)
      );
      console.log(`- 关键 Cookie: ${keyCookies.map(c => c.name).join(', ')}`);

      if (!keyCookies.find(c => c.name === 'z_c0')) {
        console.log('\n⚠️  警告：缺少关键 Cookie (z_c0)，可能登录未成功');
        return false;
      }

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
        ignoreHTTPSErrors: true  // 忽略HTTPS错误
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
        const userButton = document.querySelector('[aria-label="用户"]');
        return !!(userMenu || userLink || userButton);
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
        console.log('或者使用本地HTML解析（推荐）：');
        console.log('npm run parse-html <文件名>\n');
        return true;
      } else {
        console.log('\n虽然保存了 Cookie，但测试失败');
        console.log('建议使用本地HTML解析方案（100%可靠）');
        console.log('详见 ANTI_CRAWLER_GUIDE.md\n');
        return false;
      }

    } catch (error) {
      console.error('\n登录过程出错:', error);
      console.log('\n========================================');
      console.log('   推荐方案：本地HTML解析');
      console.log('========================================\n');
      console.log('如果网络问题持续，建议使用本地HTML解析：');
      console.log('1. 在浏览器中打开知乎问题页面');
      console.log('2. 手动登录并滚动加载所有回答');
      console.log('3. Ctrl+S 保存完整网页');
      console.log('4. 运行: npm run parse-html <保存的文件名>');
      console.log('5. 运行: npm run analyze\n');
      console.log('详细说明见: ANTI_CRAWLER_GUIDE.md\n');
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
  const login = new ZhihuLoginFixed();

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

module.exports = ZhihuLoginFixed;
