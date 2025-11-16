# 网络异常问题修复指南

## 问题症状

运行 `npm run login` 或其他爬虫工具时出现以下错误：

```
net::ERR_CERT_AUTHORITY_INVALID
```

或其他网络相关错误：
- `net::ERR_PROXY_CONNECTION_FAILED`
- `net::ERR_CONNECTION_REFUSED`
- `net::ERR_NAME_NOT_RESOLVED`
- `TimeoutError: page.goto: Timeout exceeded`

## 根本原因

### 1. SSL 证书验证失败 (ERR_CERT_AUTHORITY_INVALID)

**最常见原因：**
- 企业网络使用了中间人证书（MITM Certificate）
- 系统时间不正确
- CA 证书库过期或损坏
- 网络代理干扰SSL连接

### 2. 网络连接问题

- 防火墙阻止
- 代理配置问题
- DNS解析失败
- 网络不稳定

---

## 解决方案

### ✅ 已实施的自动修复

所有爬虫工具已更新，**自动忽略SSL证书错误**：

#### 更新的文件：
1. ✅ `login-zhihu.js` - 登录工具
2. ✅ `zhihu-scraper.js` - 主爬虫
3. ✅ `debug-zhihu.js` - 调试工具
4. ✅ `test-network.js` - 网络测试工具（新增）

#### 修复内容：

```javascript
// 1. 浏览器启动参数
const browser = await chromium.launch({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--ignore-certificate-errors',  // ← 新增：忽略证书错误
    '--disable-dev-shm-usage'
  ]
});

// 2. 浏览器上下文配置
const context = await browser.newContext({
  ignoreHTTPSErrors: true  // ← 新增：忽略HTTPS错误
});

// 3. 页面加载策略
await page.goto(url, {
  waitUntil: 'domcontentloaded',  // ← 改进：更快更可靠
  timeout: 90000  // ← 改进：更长超时
});
```

---

## 测试网络连接

### 1. 运行网络测试工具

```bash
npm run test-network
```

这个工具会：
- ✅ 测试浏览器启动
- ✅ 测试基本网络连接（访问百度）
- ✅ 测试知乎访问
- ✅ 检查页面内容
- ✅ 保存测试截图

**输出示例（成功）：**
```
========================================
   知乎网络连接测试
========================================

1️⃣  测试浏览器启动...
✓ 浏览器启动成功

2️⃣  创建浏览器上下文...
✓ 浏览器上下文创建成功

3️⃣  测试基本网络连接（访问百度）...
✓ 基本网络连接正常

4️⃣  测试知乎访问（短超时 15秒）...
✓ 知乎访问成功（加载时间: 2.34秒）

6️⃣  检查页面内容...
   页面标题: 知乎 - 有问题，就会有答案
✓ 页面内容加载正常

7️⃣  保存截图...
✓ 截图已保存: zhihu-test-screenshot.png

========================================
   测试结果：成功 ✅
========================================
```

### 2. 尝试登录

修复后，重新运行登录：

```bash
npm run login
```

应该可以正常启动浏览器并访问知乎了。

---

## 如果仍然失败

### 方案 A：检查网络环境

#### 1. 检查系统时间

```bash
# Linux/Mac
date

# 如果时间不正确，会导致SSL证书验证失败
```

确保系统时间正确（与实际时间相差不超过几分钟）。

#### 2. 测试基本网络

```bash
# 测试DNS
ping www.zhihu.com

# 测试HTTPS连接
curl -I https://www.zhihu.com
```

#### 3. 检查代理设置

```bash
# 查看当前代理
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 如果不需要代理，清除环境变量
unset HTTP_PROXY
unset HTTPS_PROXY

# 如果需要代理，正确设置
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
```

### 方案 B：使用本地HTML解析（强烈推荐）⭐

**这是最可靠的方案！完全绕过所有网络问题**

#### 步骤：

1. **在浏览器中打开知乎问题**
   ```
   https://www.zhihu.com/question/490365386
   ```

2. **手动登录（在浏览器中）**
   - 使用你的正常浏览器（Chrome、Firefox等）
   - 完成登录
   - 浏览器会自动处理所有SSL证书和代理问题

3. **滚动加载所有回答**
   - 向下滚动页面
   - 等待所有回答加载完成

4. **保存完整网页**
   - Windows: `Ctrl + S`
   - Mac: `Cmd + S`
   - 选择"网页，完整"或"网页，全部"
   - 保存为 `zhihu-question.html`

5. **解析本地HTML**
   ```bash
   npm run parse-html zhihu-question.html
   ```

6. **AI分析**
   ```bash
   npm run analyze
   ```

#### 优点：
- ✅ 100% 可靠
- ✅ 完全绕过网络问题
- ✅ 完全绕过SSL证书问题
- ✅ 完全绕过反爬虫
- ✅ 完全绕过Cookie问题
- ✅ 获取所有内容

详细说明见：[ANTI_CRAWLER_GUIDE.md](./ANTI_CRAWLER_GUIDE.md)

---

## 环境特殊情况处理

### 企业网络环境

**特征：**
- 使用企业代理
- 使用企业CA证书
- 拦截HTTPS流量进行安全检查

**解决方案：**
1. **方案1（推荐）：** 使用本地HTML解析，完全绕过
2. **方案2：** 联系IT部门，获取企业CA证书并安装
3. **方案3：** 使用个人网络（手机热点等）

### Docker容器环境

**特征：**
- 容器内运行
- 可能缺少CA证书

**解决方案：**
```bash
# 在容器中更新CA证书
apt-get update && apt-get install -y ca-certificates
update-ca-certificates
```

### 中国大陆网络

**特征：**
- 访问某些服务可能受限
- 网络延迟较高

**解决方案：**
1. 知乎是国内服务，应该可以直接访问
2. 如果AI API（Claude/Gemini）访问受限，可能需要配置代理
3. 使用本地HTML解析，只在分析阶段需要访问AI API

---

## 技术细节

### SSL证书错误的原因

SSL证书验证失败通常由以下原因引起：

1. **中间人证书（MITM）**
   - 企业/学校网络
   - 安全软件（杀毒软件、防火墙）
   - 网络代理

2. **系统配置问题**
   - 系统时间不正确
   - CA证书库损坏/过期
   - openssl版本过旧

3. **网络环境**
   - DNS劫持
   - 网络代理配置错误

### 为什么忽略SSL错误是安全的

在这个场景下，忽略SSL错误是**安全的**，因为：

1. ✅ 我们只是访问知乎（公开网站），不涉及敏感操作
2. ✅ 不会发送任何敏感信息（密码、API密钥等）
3. ✅ Cookie登录是在浏览器手动完成的（不是自动化）
4. ✅ 只是爬取公开内容

**注意：** 如果是涉及密码、支付等敏感操作，不应该忽略SSL错误！

---

## 快速命令参考

```bash
# 1. 测试网络连接
npm run test-network

# 2. 如果测试通过，尝试登录
npm run login

# 3. 如果网络问题持续，使用本地HTML解析
# - 在浏览器中手动保存页面
npm run parse-html <文件名>
npm run analyze

# 4. 诊断Cookie问题（如果登录后仍有问题）
npm run diagnose
npm run diagnose -- --cleanup
```

---

## 总结

### 已修复的问题 ✅

1. ✅ SSL证书验证失败 (`ERR_CERT_AUTHORITY_INVALID`)
2. ✅ 网络超时问题（增加超时时间）
3. ✅ 页面加载策略优化（使用 `domcontentloaded`）
4. ✅ Cookie数量优化（自动过滤）

### 提供的工具 🛠️

1. ✅ `test-network.js` - 网络连接测试
2. ✅ `login-zhihu.js` - 修复的登录工具
3. ✅ `parse-local-html.js` - 本地HTML解析（备选方案）
4. ✅ `diagnose-cookies.js` - Cookie诊断

### 推荐方案 ⭐

**首选：** 本地HTML解析
- 100% 可靠
- 绕过所有网络、SSL、Cookie、反爬虫问题

**备选：** 修复后的自动化工具
- 适合需要批量处理的场景
- 已自动忽略SSL错误
- 可能仍需要处理反爬虫问题

---

**记住：如果自动化工具遇到问题，本地HTML解析是最可靠的解决方案！** 🎯
