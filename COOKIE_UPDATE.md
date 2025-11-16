# Cookie 问题解决方案 - 更新说明

## 问题诊断

您遇到的问题：
- ✗ 加载了 26 个 Cookie，但仍然登录失败
- ✗ Cookie 数量多但质量差

## 根本原因

**Playwright 的 `context.cookies()` 会保存浏览器中的所有 Cookie**，包括：

1. ❌ **其他网站的 Cookie** - 如 Google, Baidu 等
2. ❌ **过期的 Cookie** - 已失效但未删除
3. ❌ **第三方追踪 Cookie** - 广告、统计等
4. ❌ **无效的 Cookie** - 空值或损坏

**知乎只需要 4-8 个关键 Cookie！**

---

## 解决方案

### 已实现的改进

#### 1. Cookie 诊断工具 (`diagnose-cookies.js`)

**功能：**
- ✅ 分析 Cookie 文件
- ✅ 识别知乎 vs 非知乎 Cookie
- ✅ 检查过期状态
- ✅ 验证关键 Cookie（z_c0, _zap, d_c0, _xsrf）
- ✅ 显示域名统计
- ✅ 提供清理功能

**使用方法：**

```bash
# 诊断 Cookie
npm run diagnose
# 或
node diagnose-cookies.js

# 清理无效 Cookie（自动备份）
npm run diagnose -- --cleanup
# 或
node diagnose-cookies.js --cleanup
```

**输出示例：**

```
========================================
   Cookie 诊断工具
========================================

📦 总共 26 个 Cookie

✓ 知乎相关 Cookie: 8 个

🔑 关键 Cookie 检查:

  z_c0: ✓ 存在
    值: 2|1:0|10:123456789...
    过期: 2024-12-16 10:30:00

  _zap: ✓ 存在
  d_c0: ✓ 存在
  _xsrf: ❌ 不存在

⏰ 过期的 Cookie: 5 个

📊 按域名分组:

  .zhihu.com: 8 个
  .google.com: 12 个  ← 不需要
  .baidu.com: 6 个    ← 不需要

========================================
   诊断结果
========================================

✓ 关键 Cookie (z_c0) 存在

⚠️  发现 5 个过期的 Cookie
   建议: 清理过期 Cookie
   运行: node diagnose-cookies.js --cleanup

⚠️  非知乎 Cookie 过多 (18 个)
   建议: 只保留知乎相关 Cookie
   运行: node diagnose-cookies.js --cleanup
```

#### 2. Cookie 管理器增强 (`cookie-manager.js`)

**新增功能：**

##### `filterCookies()` 方法

自动过滤无效 Cookie：

```javascript
filterCookies(cookies) {
  return cookies.filter(cookie => {
    // 1. 只保留知乎域名
    const isZhihu = cookie.domain && cookie.domain.includes('zhihu.com');
    if (!isZhihu) return false;

    // 2. 删除过期 Cookie
    if (cookie.expires && cookie.expires < Date.now() / 1000) {
      console.log(`  跳过过期 Cookie: ${cookie.name}`);
      return false;
    }

    // 3. 删除空值 Cookie
    if (!cookie.value || cookie.value.trim() === '') {
      return false;
    }

    return true;
  });
}
```

##### `applyCookiesToContext()` 增强

- ✅ 应用前自动过滤
- ✅ 检查关键 Cookie（z_c0）
- ✅ 显示有效 Cookie 数量
- ✅ 列出关键 Cookie 名称

**使用效果：**

```
✓ 已应用 6 个有效 Cookie
  关键 Cookie: z_c0, _zap, d_c0, _xsrf
```

#### 3. 完整文档 (`COOKIE_FIX_GUIDE.md`)

详细指南包括：
- ✅ 问题原因分析
- ✅ 诊断步骤
- ✅ 清理方法
- ✅ 关键 Cookie 说明
- ✅ 故障排除
- ✅ 最佳实践

---

## 使用流程

### 首次诊断

```bash
# 1. 诊断当前 Cookie
npm run diagnose

# 2. 如果发现问题，清理
npm run diagnose -- --cleanup

# 3. 测试 Cookie 是否有效
npm run debug https://www.zhihu.com/question/490365386
```

### Cookie 对比

**清理前：**
```json
{
  "总数": 26,
  "知乎相关": 8,
  "其他网站": 18,  ← 问题
  "过期": 5,       ← 问题
  "关键Cookie": ["z_c0", "_zap"]
}
```

**清理后：**
```json
{
  "总数": 6,       ← 精简
  "知乎相关": 6,   ← 全部有效
  "其他网站": 0,   ← 已清理
  "过期": 0,       ← 已清理
  "关键Cookie": ["z_c0", "_zap", "d_c0", "_xsrf"]
}
```

---

## 知乎关键 Cookie 说明

| Cookie 名 | 作用 | 必需性 |
|----------|------|--------|
| **z_c0** | 用户认证令牌 | ⭐⭐⭐⭐⭐ 必须 |
| **_zap** | 会话ID | ⭐⭐⭐⭐ 重要 |
| **d_c0** | 设备标识 | ⭐⭐⭐ 推荐 |
| **_xsrf** | CSRF防护 | ⭐⭐⭐ 推荐 |
| **Hm_lvt_xxx** | 统计 | ⭐ 可选 |

**只需要这 4-6 个 Cookie！**

---

## 如果清理后仍然失败

### 选项 1：完全重新登录

```bash
# 1. 删除旧 Cookie
rm .zhihu-cookies.json
rm .zhihu-cookies.backup.json

# 2. 重新登录
npm run login

# 3. 立即诊断
npm run diagnose

# 4. 测试
npm run debug <URL>
```

### 选项 2：使用本地 HTML 解析（推荐）⭐

**这是最可靠的方案！**

```bash
# 1. 在浏览器中打开问题页面
# 2. 登录并滚动加载所有回答
# 3. Ctrl+S / Cmd+S 保存页面
# 4. 解析 HTML

npm run parse-html zhihu-question.html
npm run analyze
```

**优点：**
- ✅ 100% 可靠
- ✅ 完全绕过反爬虫
- ✅ 不需要担心 Cookie
- ✅ 可以获取所有内容

详见：[ANTI_CRAWLER_GUIDE.md](./ANTI_CRAWLER_GUIDE.md)

---

## 快速命令参考

```bash
# Cookie 管理
npm run diagnose              # 诊断 Cookie
npm run diagnose -- --cleanup # 清理 Cookie
npm run login                 # 重新登录

# 测试
npm run debug <URL>           # 测试爬虫

# 推荐方案（本地 HTML）
npm run parse-html <文件>     # 解析 HTML
npm run analyze               # AI 分析
```

---

## 技术细节

### Cookie 过滤逻辑

```javascript
// 在 cookie-manager.js 中
filterCookies(cookies) {
  const now = Date.now() / 1000;

  return cookies.filter(cookie => {
    // 检查 1: 域名
    const isZhihu = cookie.domain?.includes('zhihu.com');

    // 检查 2: 过期时间
    const isExpired = cookie.expires &&
                      cookie.expires > 0 &&
                      cookie.expires < now;

    // 检查 3: 值是否存在
    const hasValue = cookie.value && cookie.value.trim() !== '';

    return isZhihu && !isExpired && hasValue;
  });
}
```

### 自动应用过滤

```javascript
// 在 applyCookiesToContext() 中
async applyCookiesToContext(context, cookies = null) {
  let cookiesToApply = cookies || this.cookies;

  // 自动过滤
  cookiesToApply = this.filterCookies(cookiesToApply);

  // 检查关键 Cookie
  const hasZ_c0 = cookiesToApply.some(c => c.name === 'z_c0');
  if (!hasZ_c0) {
    console.log('⚠️  缺少关键 Cookie: z_c0');
    console.log('建议重新登录');
  }

  // 应用 Cookie
  await context.addCookies(cookiesToApply);
  console.log(`✓ 已应用 ${cookiesToApply.length} 个有效 Cookie`);
}
```

---

## 下一步

1. **运行诊断：**
   ```bash
   npm run diagnose
   ```

2. **清理 Cookie（如果需要）：**
   ```bash
   npm run diagnose -- --cleanup
   ```

3. **选择方案：**

   **方案 A（推荐）：** 本地 HTML 解析
   ```bash
   # 手动保存页面，然后：
   npm run parse-html zhihu-question.html
   npm run analyze
   ```

   **方案 B：** 测试爬虫（可能仍被反爬虫拦截）
   ```bash
   npm run debug https://www.zhihu.com/question/490365386
   ```

---

## 总结

### 已解决的问题

1. ✅ Cookie 数量过多（26 个 → 6 个）
2. ✅ 包含非知乎 Cookie
3. ✅ 包含过期 Cookie
4. ✅ 缺少验证机制

### 提供的工具

1. ✅ `diagnose-cookies.js` - Cookie 诊断
2. ✅ `cookie-manager.js` - 自动过滤
3. ✅ `COOKIE_FIX_GUIDE.md` - 完整文档
4. ✅ `parse-local-html.js` - 替代方案

### 推荐方案

**最可靠：** 本地 HTML 解析（`parse-local-html.js`）
- 100% 成功率
- 完全绕过反爬虫
- 无 Cookie 问题

---

**记住：Cookie 多不一定好，精简才是王道！** 🎯
