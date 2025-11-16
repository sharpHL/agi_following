#!/usr/bin/env node

const { chromium } = require('playwright');
const CookieManager = require('./cookie-manager');

/**
 * 知乎页面调试工具
 * 帮助诊断爬虫问题
 */
async function debugZhihu() {
  const questionUrl = process.argv[2] || 'https://www.zhihu.com/question/490365386';

  console.log('========================================');
  console.log('   知乎调试工具');
  console.log('========================================\n');
  console.log(`问题链接: ${questionUrl}\n`);

  const browser = await chromium.launch({
    headless: false,  // 显示浏览器，方便观察
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });

  // 加载 Cookie
  const cookieManager = new CookieManager();
  const cookies = await cookieManager.loadCookies();
  if (cookies.length > 0) {
    await cookieManager.applyCookiesToContext(context, cookies);
  }

  const page = await context.newPage();

  try {
    console.log('1️⃣  访问页面...');
    await page.goto(questionUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('✓ 页面加载完成\n');

    // 等待一下
    await page.waitForTimeout(3000);

    console.log('2️⃣  检查登录状态...');
    const loginStatus = await page.evaluate(() => {
      const selectors = [
        '.AppHeader-profileAvatar',
        '.AppHeader-userInfo',
        '.Avatar',
        '[data-za-detail-view-element_name="ProfileMenu"]'
      ];

      const results = {};
      selectors.forEach(sel => {
        const element = document.querySelector(sel);
        results[sel] = element ? 'Found ✓' : 'Not found ✗';
      });

      return results;
    });

    console.log('登录状态检测结果:');
    Object.entries(loginStatus).forEach(([selector, result]) => {
      console.log(`  ${selector}: ${result}`);
    });

    const isLoggedIn = Object.values(loginStatus).some(v => v.includes('✓'));
    console.log(`\n登录状态: ${isLoggedIn ? '✓ 已登录' : '✗ 未登录'}\n`);

    console.log('3️⃣  检查回答列表...');
    const answerListInfo = await page.evaluate(() => {
      const selectors = [
        '.List-item',
        '.AnswerItem',
        '.ContentItem',
        '[class*="Answer"]',
        '[class*="List"]',
        'article'
      ];

      const results = {};
      selectors.forEach(sel => {
        const elements = document.querySelectorAll(sel);
        results[sel] = `Found ${elements.length} elements`;
      });

      return results;
    });

    console.log('回答列表检测结果:');
    Object.entries(answerListInfo).forEach(([selector, result]) => {
      console.log(`  ${selector}: ${result}`);
    });

    console.log('\n4️⃣  获取页面HTML快照（前1000字符）...');
    const htmlSnapshot = await page.evaluate(() => {
      return document.body.innerHTML.substring(0, 1000);
    });
    console.log(htmlSnapshot);
    console.log('...\n');

    console.log('5️⃣  检查是否有登录提示...');
    const loginPrompt = await page.evaluate(() => {
      const text = document.body.innerText;
      const keywords = ['登录', '注册', 'Sign in', 'Login'];
      const found = keywords.filter(kw => text.includes(kw));
      return found;
    });
    console.log(`找到的关键词: ${loginPrompt.join(', ')}\n`);

    console.log('6️⃣  截图保存（用于分析）...');
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: false });
    console.log('✓ 截图已保存到: debug-screenshot.png\n');

    console.log('========================================');
    console.log('   调试信息收集完成');
    console.log('========================================\n');

    console.log('📋 诊断建议:');
    if (!isLoggedIn) {
      console.log('❌ 未登录状态');
      console.log('   建议: 运行 node login-zhihu.js 重新登录\n');
    }

    const hasAnswers = Object.values(answerListInfo).some(v => !v.includes('0 elements'));
    if (!hasAnswers) {
      console.log('❌ 未找到回答元素');
      console.log('   建议: 知乎页面结构可能已变化，需要更新选择器');
      console.log('   请查看 debug-screenshot.png 截图');
      console.log('   或手动在浏览器中检查页面结构\n');
    }

    console.log('🔧 浏览器将保持打开30秒，供你手动检查...');
    console.log('   请查看浏览器窗口，检查页面状态');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ 调试过程出错:', error.message);
  } finally {
    await browser.close();
    console.log('\n浏览器已关闭');
  }
}

debugZhihu().catch(console.error);
