# 故障排除指南

## 问题：爬取0个回答 / 未登录状态

### 症状

```
⚠ 未登录状态（可能看不到全部回答）
未找到回答列表，可能页面结构已变化或无回答
成功提取 0 个回答
```

### 原因

1. **Cookie 已过期** - 最常见原因
2. **知乎页面结构变化** - 选择器失效
3. **反爬虫检测** - 知乎识别了自动化工具
4. **网络问题** - 页面未完全加载

---

## 🔧 快速修复步骤

### 步骤 1：重新登录（推荐）

```bash
# 1. 删除旧的 Cookie
rm .zhihu-cookies.json

# 2. 重新登录
node login-zhihu.js
```

完成登录后测试：

```bash
node zhihu-analyzer.js https://www.zhihu.com/question/490365386
```

### 步骤 2：运行诊断工具

```bash
node debug-zhihu.js https://www.zhihu.com/question/490365386
```

诊断工具会：
- ✅ 检测登录状态
- ✅ 尝试多个选择器
- ✅ 保存截图到 `debug-screenshot.png`
- ✅ 保持浏览器打开30秒供检查

### 步骤 3：查看截图

打开 `debug-screenshot.png`，检查：
- 是否显示"登录"按钮 → Cookie 无效
- 是否看到回答列表 → 页面正常加载
- 是否有验证码 → 需要手动处理

---

## 🔍 详细诊断

### 检查 Cookie 状态

```bash
# 查看 Cookie 文件
ls -la .zhihu-cookies.json

# 查看 Cookie 内容（前20行）
head -20 .zhihu-cookies.json
```

**有效的 Cookie 应包含：**
- `z_c0` - 用户令牌
- `_zap` - 会话ID
- 其他知乎相关 Cookie

### 手动测试登录

1. 打开浏览器访问 https://www.zhihu.com
2. 使用你的账户登录
3. 访问测试链接 https://www.zhihu.com/question/490365386
4. 确认能看到回答列表

如果手动访问也看不到回答，说明：
- 问题可能需要登录才能查看
- 问题被删除或不存在

---

## 🛠️ 高级修复

### 方案 1：增加等待时间

编辑 `zhihu-scraper.js`，找到 `waitForSelector`，增加超时时间：

```javascript
await this.page.waitForSelector(selector, { timeout: 30000 }); // 从5秒改为30秒
```

### 方案 2：禁用无头模式（查看实际运行）

编辑 `zhihu-scraper.js`，找到 `chromium.launch`：

```javascript
this.browser = await chromium.launch({
  headless: false,  // 改为 false，显示浏览器
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

运行后，你可以看到浏览器实际操作，观察哪里出了问题。

### 方案 3：手动检查页面选择器

1. 运行调试工具：
```bash
node debug-zhihu.js <URL>
```

2. 浏览器打开期间（30秒内）：
   - 右键点击回答 → 检查元素
   - 查看回答容器的 class 名称
   - 更新 `zhihu-scraper.js` 中的选择器

3. 更新选择器：

编辑 `zhihu-scraper.js`，找到 `possibleSelectors`：

```javascript
const possibleSelectors = [
  '.List-item',           // 原选择器
  '.YourNewSelector',     // 添加新选择器
  // ... 其他选择器
];
```

### 方案 4：清除浏览器缓存

```bash
# 删除 Playwright 缓存
rm -rf ~/.cache/ms-playwright

# 重新安装浏览器
npx playwright install chromium
```

---

## 🚨 常见错误

### 错误 1：Cookie 加载但未登录

**症状：**
```
✓ 成功加载 26 个 Cookie
⚠ 未登录状态
```

**原因：** Cookie 已过期

**解决：**
```bash
rm .zhihu-cookies.json
node login-zhihu.js
```

### 错误 2：找不到回答元素

**症状：**
```
未找到回答列表
提取完成，共 0 个有效回答
```

**原因：** 页面选择器失效

**解决：**
1. 运行 `node debug-zhihu.js <URL>`
2. 查看诊断输出
3. 更新选择器（见方案3）

### 错误 3：网络超时

**症状：**
```
页面加载失败: Timeout 60000ms exceeded
```

**原因：** 网络慢或不稳定

**解决：**
1. 检查网络连接
2. 增加超时时间（见方案1）
3. 使用代理（如果在国外）

### 错误 4：反爬虫检测

**症状：**
- 页面显示验证码
- 访问被限制

**解决：**
1. 降低爬取频率
2. 增加延迟时间
3. 使用真实浏览器模式（headless: false）
4. 更换IP地址

---

## 📊 检查清单

在报告问题前，请确认：

- [ ] 已重新登录（`node login-zhihu.js`）
- [ ] Cookie 文件存在且有效
- [ ] 运行了诊断工具（`node debug-zhihu.js`）
- [ ] 查看了截图 `debug-screenshot.png`
- [ ] 手动访问链接确认页面存在
- [ ] 尝试了其他问题链接
- [ ] 检查了网络连接

---

## 🔗 相关文件

- `login-zhihu.js` - 登录工具
- `debug-zhihu.js` - 诊断工具
- `zhihu-scraper.js` - 爬虫主文件
- `.zhihu-cookies.json` - Cookie 存储
- `COOKIE_GUIDE.md` - Cookie 详细指南

---

## 💡 预防措施

### 1. 定期刷新 Cookie

Cookie 会过期，建议每周重新登录：

```bash
# 加入定时任务
crontab -e

# 每周一早上9点重新登录（需手动完成登录）
0 9 * * 1 cd /path/to/project && node login-zhihu.js
```

### 2. 使用独立测试账号

- 不要使用主账号频繁爬取
- 创建专门的测试账号
- 遵守知乎的使用条款

### 3. 添加延迟

避免触发反爬虫：

```javascript
// 在 .env 文件中设置
ANALYZER_DELAY=3000  // 3秒延迟
```

### 4. 限制爬取数量

不要一次爬取太多：

```bash
# 先测试少量
MAX_ANALYZE=5 node zhihu-analyzer.js <URL>
```

---

## 🆘 获取帮助

如果以上方法都不行：

1. **查看截图**
   ```bash
   open debug-screenshot.png  # macOS
   xdg-open debug-screenshot.png  # Linux
   ```

2. **收集诊断信息**
   ```bash
   node debug-zhihu.js <URL> > debug-output.txt 2>&1
   ```

3. **提交 Issue**
   - 附上 `debug-output.txt`
   - 附上 `debug-screenshot.png`
   - 说明你的操作系统和 Node 版本
   - 提供问题链接（如果不敏感）

---

## ✅ 成功标志

爬取成功时应该看到：

```
✓ 已登录状态
✓ 找到回答列表（选择器: .List-item）
已滚动 5 次，当前可见 25 个回答...
已加载所有回答
提取完成，共 156 个有效回答
✓ 成功爬取 156 个回答
```

---

**最常见的问题就是 Cookie 过期，99% 的情况重新登录即可解决！**

```bash
rm .zhihu-cookies.json && node login-zhihu.js
```
