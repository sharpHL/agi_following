#!/usr/bin/env node

const fs = require('fs').promises;

/**
 * Cookie 诊断工具
 * 分析保存的 Cookie，找出问题
 */
async function diagnoseCookies() {
  const cookieFile = '.zhihu-cookies.json';

  console.log('========================================');
  console.log('   Cookie 诊断工具');
  console.log('========================================\n');

  try {
    // 读取 Cookie 文件
    const data = await fs.readFile(cookieFile, 'utf-8');
    const cookies = JSON.parse(data);

    console.log(`📦 总共 ${cookies.length} 个 Cookie\n`);

    // 1. 检查知乎相关的 Cookie
    const zhihuCookies = cookies.filter(c =>
      c.domain && (c.domain.includes('zhihu.com') || c.domain.includes('.zhihu.com'))
    );
    console.log(`✓ 知乎相关 Cookie: ${zhihuCookies.length} 个`);

    // 2. 检查关键 Cookie
    const keyCookies = {
      'z_c0': cookies.find(c => c.name === 'z_c0'),
      '_zap': cookies.find(c => c.name === '_zap'),
      'd_c0': cookies.find(c => c.name === 'd_c0'),
      '_xsrf': cookies.find(c => c.name === '_xsrf')
    };

    console.log('\n🔑 关键 Cookie 检查:\n');
    for (const [name, cookie] of Object.entries(keyCookies)) {
      if (cookie) {
        const isExpired = cookie.expires && cookie.expires > 0 && cookie.expires < Date.now() / 1000;
        const status = isExpired ? '❌ 已过期' : '✓ 存在';
        console.log(`  ${name}: ${status}`);
        if (cookie.value) {
          console.log(`    值: ${cookie.value.substring(0, 20)}...`);
        }
        if (cookie.expires && cookie.expires > 0) {
          const expireDate = new Date(cookie.expires * 1000);
          console.log(`    过期: ${expireDate.toLocaleString()}`);
        }
      } else {
        console.log(`  ${name}: ❌ 不存在`);
      }
    }

    // 3. 检查过期的 Cookie
    const now = Date.now() / 1000;
    const expiredCookies = cookies.filter(c =>
      c.expires && c.expires > 0 && c.expires < now
    );
    console.log(`\n⏰ 过期的 Cookie: ${expiredCookies.length} 个`);

    // 4. 检查 Cookie 属性
    console.log('\n🔍 Cookie 属性检查:\n');
    const sampleCookie = zhihuCookies[0] || cookies[0];
    if (sampleCookie) {
      console.log('  示例 Cookie 属性:');
      console.log(`    name: ${sampleCookie.name}`);
      console.log(`    domain: ${sampleCookie.domain}`);
      console.log(`    path: ${sampleCookie.path}`);
      console.log(`    secure: ${sampleCookie.secure}`);
      console.log(`    httpOnly: ${sampleCookie.httpOnly}`);
      console.log(`    sameSite: ${sampleCookie.sameSite}`);
    }

    // 5. 按域名分组统计
    console.log('\n📊 按域名分组:\n');
    const domainStats = {};
    cookies.forEach(c => {
      const domain = c.domain || 'unknown';
      domainStats[domain] = (domainStats[domain] || 0) + 1;
    });

    Object.entries(domainStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([domain, count]) => {
        console.log(`  ${domain}: ${count} 个`);
      });

    // 6. 诊断建议
    console.log('\n========================================');
    console.log('   诊断结果');
    console.log('========================================\n');

    const hasZ_c0 = !!keyCookies['z_c0'];
    const hasValidZ_c0 = hasZ_c0 && keyCookies['z_c0'].value && keyCookies['z_c0'].value.length > 20;

    if (!hasZ_c0) {
      console.log('❌ 缺少关键 Cookie: z_c0');
      console.log('   建议: 重新登录\n');
      console.log('   运行: node login-zhihu.js\n');
    } else if (!hasValidZ_c0) {
      console.log('⚠️  z_c0 存在但值可能无效');
      console.log('   建议: 重新登录\n');
    } else {
      console.log('✓ 关键 Cookie (z_c0) 存在\n');
    }

    if (expiredCookies.length > 0) {
      console.log(`⚠️  发现 ${expiredCookies.length} 个过期的 Cookie`);
      console.log('   建议: 清理过期 Cookie\n');
      console.log('   运行: node diagnose-cookies.js --clean\n');
    }

    if (zhihuCookies.length < cookies.length * 0.5) {
      console.log(`⚠️  非知乎 Cookie 过多 (${cookies.length - zhihuCookies.length} 个)`);
      console.log('   建议: 只保留知乎相关 Cookie\n');
      console.log('   运行: node diagnose-cookies.js --cleanup\n');
    }

    // 7. 生成清理后的 Cookie
    if (process.argv.includes('--cleanup')) {
      console.log('开始清理 Cookie...\n');

      // 只保留知乎相关的、未过期的 Cookie
      const cleanedCookies = cookies.filter(c => {
        const isZhihu = c.domain && c.domain.includes('zhihu.com');
        const notExpired = !c.expires || c.expires <= 0 || c.expires > now;
        return isZhihu && notExpired;
      });

      // 备份原文件
      await fs.writeFile(
        '.zhihu-cookies.backup.json',
        JSON.stringify(cookies, null, 2),
        'utf-8'
      );

      // 保存清理后的 Cookie
      await fs.writeFile(
        cookieFile,
        JSON.stringify(cleanedCookies, null, 2),
        'utf-8'
      );

      console.log(`✓ 清理完成!`);
      console.log(`  原 Cookie: ${cookies.length} 个`);
      console.log(`  清理后: ${cleanedCookies.length} 个`);
      console.log(`  备份已保存: .zhihu-cookies.backup.json\n`);
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('❌ Cookie 文件不存在\n');
      console.log('请先运行登录: node login-zhihu.js\n');
    } else {
      console.error('❌ 读取 Cookie 失败:', error.message);
    }
  }
}

// 运行诊断
diagnoseCookies().catch(console.error);
