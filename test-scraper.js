#!/usr/bin/env node

/**
 * 测试爬虫功能（不需要API key）
 * 仅爬取前几个回答，验证爬虫是否正常工作
 */

const ZhihuScraper = require('./zhihu-scraper');

async function testScraper() {
  const questionUrl = process.argv[2] || 'https://www.zhihu.com/question/490365386';

  console.log('测试知乎爬虫功能...\n');
  console.log('问题链接:', questionUrl);
  console.log('注意: 这是测试模式，只爬取部分回答\n');

  const scraper = new ZhihuScraper(questionUrl);

  try {
    // 初始化浏览器
    await scraper.init();

    // 访问页面
    console.log('正在访问页面...');
    await scraper.page.goto(questionUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('✓ 页面加载成功\n');

    // 等待回答列表
    await scraper.page.waitForSelector('.List-item', { timeout: 10000 });
    console.log('✓ 找到回答列表\n');

    // 获取前几个回答（不滚动）
    const answers = await scraper.page.evaluate(() => {
      const answerElements = document.querySelectorAll('.List-item');
      const results = [];

      // 只取前3个回答
      for (let i = 0; i < Math.min(3, answerElements.length); i++) {
        const element = answerElements[i];

        const authorElement = element.querySelector('.AuthorInfo-name');
        const author = authorElement ? authorElement.textContent.trim() : '匿名用户';

        const contentElement = element.querySelector('.RichContent-inner');
        const content = contentElement ? contentElement.innerText.trim() : '';

        const voteElement = element.querySelector('.VoteButton--up');
        const voteText = voteElement ? voteElement.textContent.trim() : '0';

        results.push({
          author,
          content: content.substring(0, 200),
          voteText
        });
      }

      return results;
    });

    console.log(`成功提取 ${answers.length} 个回答:\n`);

    answers.forEach((answer, idx) => {
      console.log(`${idx + 1}. 作者: ${answer.author}`);
      console.log(`   点赞: ${answer.voteText}`);
      console.log(`   内容: ${answer.content}...\n`);
    });

    console.log('✓ 测试成功！爬虫功能正常\n');

  } catch (error) {
    console.error('✗ 测试失败:', error.message);
    console.error('\n可能的原因:');
    console.error('1. 网络连接问题');
    console.error('2. 知乎页面结构变化');
    console.error('3. 被反爬虫机制阻止\n');
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

testScraper();
