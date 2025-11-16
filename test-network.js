#!/usr/bin/env node

const { chromium } = require('playwright');

/**
 * 网络连接测试工具
 * 诊断是否能够访问知乎
 */
async function testNetwork() {
  console.log('========================================');
  console.log('   知乎网络连接测试');
  console.log('========================================\n');

  let browser = null;

  try {
    // 1. 测试浏览器启动
    console.log('1️⃣  测试浏览器启动...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    console.log('✓ 浏览器启动成功\n');

    // 2. 创建上下文
    console.log('2️⃣  创建浏览器上下文...');
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai'
    });
    const page = await context.newPage();
    console.log('✓ 浏览器上下文创建成功\n');

    // 3. 测试基本网络（访问百度）
    console.log('3️⃣  测试基本网络连接（访问百度）...');
    try {
      await page.goto('https://www.baidu.com', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      console.log('✓ 基本网络连接正常\n');
    } catch (error) {
      console.log('✗ 基本网络连接失败:', error.message);
      console.log('⚠️  可能的原因：');
      console.log('   - 网络连接问题');
      console.log('   - 防火墙阻止');
      console.log('   - 代理设置问题\n');
      throw error;
    }

    // 4. 测试知乎访问（短超时）
    console.log('4️⃣  测试知乎访问（短超时 15秒）...');
    try {
      const startTime = Date.now();
      await page.goto('https://www.zhihu.com', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✓ 知乎访问成功（加载时间: ${loadTime}秒）\n`);
    } catch (error) {
      console.log('✗ 知乎访问失败（15秒超时）:', error.message);
      console.log('\n尝试使用更长的超时时间...\n');

      // 5. 尝试更长的超时
      console.log('5️⃣  测试知乎访问（长超时 60秒）...');
      try {
        const startTime = Date.now();
        await page.goto('https://www.zhihu.com', {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
        const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✓ 知乎访问成功（加载时间: ${loadTime}秒）`);
        console.log('⚠️  注意：加载时间较长，可能网络不稳定\n');
      } catch (error2) {
        console.log('✗ 知乎访问失败（60秒超时）:', error2.message);
        console.log('\n⚠️  可能的原因：');
        console.log('   - 知乎服务器响应慢');
        console.log('   - 被知乎反爬虫拦截');
        console.log('   - 网络不稳定');
        console.log('   - 需要使用代理\n');
        throw error2;
      }
    }

    // 6. 检查页面内容
    console.log('6️⃣  检查页面内容...');
    const title = await page.title();
    console.log(`   页面标题: ${title}`);

    const hasContent = await page.evaluate(() => {
      return document.body && document.body.innerText.length > 0;
    });

    if (hasContent) {
      console.log('✓ 页面内容加载正常\n');
    } else {
      console.log('✗ 页面内容为空\n');
    }

    // 7. 截图保存
    console.log('7️⃣  保存截图...');
    await page.screenshot({ path: 'zhihu-test-screenshot.png', fullPage: false });
    console.log('✓ 截图已保存: zhihu-test-screenshot.png\n');

    // 总结
    console.log('========================================');
    console.log('   测试结果：成功 ✅');
    console.log('========================================\n');
    console.log('网络连接正常，可以访问知乎。');
    console.log('\n下一步：运行登录工具');
    console.log('npm run login\n');

    return true;

  } catch (error) {
    console.log('\n========================================');
    console.log('   测试结果：失败 ❌');
    console.log('========================================\n');
    console.log('错误详情:', error.message);
    console.log('\n建议的解决方案：\n');
    console.log('1. 检查网络连接');
    console.log('2. 尝试在浏览器中手动访问 https://www.zhihu.com');
    console.log('3. 如果使用代理，请配置环境变量：');
    console.log('   export HTTP_PROXY=http://your-proxy:port');
    console.log('   export HTTPS_PROXY=http://your-proxy:port');
    console.log('\n4. 或者使用本地HTML解析方案（推荐）：');
    console.log('   - 在浏览器中手动打开知乎问题');
    console.log('   - 登录并滚动加载所有回答');
    console.log('   - Ctrl+S 保存页面');
    console.log('   - 运行: npm run parse-html <文件名>\n');

    return false;

  } finally {
    if (browser) {
      await browser.close();
      console.log('浏览器已关闭\n');
    }
  }
}

// 运行测试
if (require.main === module) {
  testNetwork()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('测试异常:', error);
      process.exit(1);
    });
}

module.exports = testNetwork;
