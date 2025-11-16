# 知乎 Cookie 获取和管理指南

## 为什么需要 Cookie？

知乎的完整内容需要登录才能访问：
- **未登录**：只能看到部分回答，可能被限制或要求登录
- **已登录**：可以看到所有回答，访问完整内容，避免反爬虫限制

## 方法 1：使用自动登录工具（推荐）

这是最简单的方法，工具会自动处理一切。

### 步骤

1. **运行登录工具**

```bash
node login-zhihu.js
```

2. **在打开的浏览器中登录**

工具会自动打开 Chrome 浏览器并访问知乎。你需要：

- 点击右上角"登录"按钮
- 选择登录方式（推荐使用手机验证码）
- 完成登录验证
- 确认看到你的头像（表示已登录）

3. **按回车保存 Cookie**

登录完成后，在终端按回车键，工具会：
- 自动提取 Cookie
- 保存到 `.zhihu-cookies.json` 文件
- 自动测试 Cookie 是否有效

4. **开始使用**

```bash
node zhihu-analyzer.js https://www.zhihu.com/question/490365386
```

### 示例输出

```
========================================
   知乎登录工具
========================================

正在启动浏览器...
✓ 浏览器启动成功

正在打开知乎...
✓ 知乎页面已打开

========================================
请在浏览器中完成以下操作：
1. 点击页面右上角的"登录"按钮
2. 选择登录方式（手机验证码、密码等）
3. 完成登录
4. 确认看到个人头像（表示已登录）
========================================

完成登录后，按回车键继续... [回车]

正在验证登录状态...
✓ 登录状态验证成功！

正在保存 Cookie...
✓ Cookie 已保存到: .zhihu-cookies.json
✓ 共保存 15 个 Cookie

Cookie 信息:
- 总数: 15
- 关键 Cookie: z_c0, _zap

正在测试 Cookie...
✓ Cookie 测试成功！可以正常使用

========================================
   登录成功！
========================================

现在你可以使用以下命令爬取知乎回答：
node zhihu-analyzer.js <问题URL>
```

---

## 方法 2：手动导出 Cookie

如果自动工具不工作，可以手动导出 Cookie。

### 步骤 1：安装浏览器插件

推荐使用以下插件之一：

**Chrome / Edge:**
- [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg)
- [Cookie-Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)

**Firefox:**
- [Cookie-Editor](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)

### 步骤 2：登录知乎

1. 在浏览器中访问 https://www.zhihu.com
2. 登录你的账号
3. 确认已登录（看到个人头像）

### 步骤 3：导出 Cookie

#### 使用 EditThisCookie:

1. 点击浏览器插件图标
2. 点击"导出"按钮（Export）
3. Cookie 会被复制到剪贴板

#### 使用 Cookie-Editor:

1. 点击浏览器插件图标
2. 点击"Export" 标签
3. 选择 "JSON" 格式
4. 点击"Export"复制到剪贴板

### 步骤 4：保存 Cookie

创建文件 `.zhihu-cookies.json`，粘贴导出的内容：

```bash
# 创建文件并粘贴 Cookie
nano .zhihu-cookies.json
# 或使用你喜欢的编辑器
code .zhihu-cookies.json
```

Cookie 格式应该像这样：

```json
[
  {
    "domain": ".zhihu.com",
    "name": "z_c0",
    "value": "2|1:0|10:1234567890|4:z_c0|92:...",
    "path": "/",
    "expires": 1234567890,
    "httpOnly": true,
    "secure": true
  },
  ...
]
```

### 步骤 5：测试 Cookie

```bash
node zhihu-analyzer.js https://www.zhihu.com/question/490365386
```

如果看到 `✓ 已登录状态`，说明 Cookie 有效！

---

## 方法 3：使用开发者工具手动提取

这是最底层的方法，适合熟悉浏览器开发者工具的用户。

### 步骤 1：打开开发者工具

1. 访问 https://www.zhihu.com 并登录
2. 按 F12 打开开发者工具
3. 切换到 "Application" 标签（Chrome）或 "Storage" 标签（Firefox）

### 步骤 2：查看 Cookie

1. 左侧菜单：Cookies → https://www.zhihu.com
2. 你会看到所有 Cookie 列表

### 步骤 3：复制关键 Cookie

最重要的 Cookie：
- `z_c0`: 用户认证令牌
- `_zap`: 会话ID
- `d_c0`: 设备ID

### 步骤 4：构建 JSON

```javascript
// 在浏览器控制台运行这段代码
copy(JSON.stringify(
  document.cookie.split('; ').map(item => {
    const [name, value] = item.split('=');
    return {
      name,
      value,
      domain: '.zhihu.com',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: true,
      sameSite: 'Lax'
    };
  }),
  null,
  2
));
```

这会将 Cookie JSON 复制到剪贴板。

### 步骤 5：保存并测试

将复制的内容保存到 `.zhihu-cookies.json`，然后测试。

---

## Cookie 管理

### 查看 Cookie 信息

```bash
node -e "const cm = require('./cookie-manager'); const c = new cm(); c.loadCookies().then(() => console.log(c.getInfo()));"
```

### 清除 Cookie

```bash
node -e "const cm = require('./cookie-manager'); const c = new cm(); c.clearCookies();"
```

或直接删除文件：

```bash
rm .zhihu-cookies.json
```

### Cookie 过期了怎么办？

如果看到"未登录状态"提示，说明 Cookie 可能过期了：

```bash
# 重新登录
node login-zhihu.js
```

---

## 常见问题

### Q1: Cookie 保存在哪里？

A: 默认保存在项目根目录的 `.zhihu-cookies.json` 文件

### Q2: Cookie 会过期吗？

A: 会的，通常几天到几周。过期后需要重新登录。

### Q3: Cookie 安全吗？

A: Cookie 包含你的登录凭证，请：
- ✅ 不要分享给他人
- ✅ 不要提交到 Git（已在 .gitignore 中）
- ✅ 定期更换密码

### Q4: 可以不用 Cookie 吗？

A: 可以，但：
- 只能看到部分回答
- 可能被反爬虫限制
- 数据不完整

### Q5: 登录工具打不开浏览器？

A: 确保已安装浏览器：

```bash
npx playwright install chromium
```

### Q6: 多个账号怎么办？

A: 可以使用不同的 Cookie 文件：

```bash
# 使用账号 1
node zhihu-analyzer.js <URL> --cookie-file .cookies-account1.json

# 使用账号 2
node zhihu-analyzer.js <URL> --cookie-file .cookies-account2.json
```

### Q7: Cookie 测试失败怎么办？

尝试以下方法：

1. 重新登录
```bash
node login-zhihu.js
```

2. 清除旧 Cookie
```bash
rm .zhihu-cookies.json
node login-zhihu.js
```

3. 手动导出 Cookie（方法 2）

4. 检查网络连接

---

## 无 Cookie 模式

如果你不想使用 Cookie，可以禁用：

```javascript
// 在代码中
const scraper = new ZhihuScraper(url, { useCookies: false });
```

注意：这种模式下功能可能受限。

---

## 最佳实践

1. **定期更新**：Cookie 会过期，建议每周重新登录一次

2. **安全存储**：不要将 Cookie 文件提交到版本控制

3. **账号安全**：
   - 使用独立的测试账号
   - 不要用主账号频繁爬取
   - 遵守知乎的使用条款

4. **频率控制**：
   - 不要过于频繁地请求
   - 添加适当延迟
   - 避免被封号

---

## 技术细节

### Cookie 存储格式

```json
[
  {
    "name": "Cookie 名称",
    "value": "Cookie 值",
    "domain": "域名（如 .zhihu.com）",
    "path": "路径（通常是 /）",
    "expires": "过期时间（Unix 时间戳，-1 表示会话）",
    "httpOnly": "是否仅 HTTP（布尔值）",
    "secure": "是否仅 HTTPS（布尔值）",
    "sameSite": "SameSite 属性（Strict/Lax/None）"
  }
]
```

### 关键 Cookie 说明

| Cookie 名 | 用途 | 重要性 |
|-----------|------|--------|
| z_c0 | 用户认证令牌 | ★★★★★ |
| _zap | 会话标识 | ★★★★☆ |
| d_c0 | 设备标识 | ★★★☆☆ |
| _xsrf | CSRF 防护 | ★★★☆☆ |

---

## 故障排除

### 问题：提示"未登录状态"

**解决方案：**

1. 检查 Cookie 文件是否存在
```bash
ls -la .zhihu-cookies.json
```

2. 检查 Cookie 内容是否有效
```bash
cat .zhihu-cookies.json | head -20
```

3. 重新登录
```bash
node login-zhihu.js
```

### 问题：登录后立即过期

**可能原因：**
- Cookie 格式不正确
- 网络问题
- 知乎检测到异常

**解决方案：**
- 使用自动登录工具（方法 1）
- 确保网络稳定
- 使用真实的 User-Agent

### 问题：浏览器无法启动

**解决方案：**

```bash
# 重新安装浏览器
npx playwright install chromium --force

# 如果还不行，尝试安装依赖
npx playwright install-deps chromium
```

---

## 总结

推荐方法优先级：

1. ⭐⭐⭐⭐⭐ **方法 1**：自动登录工具（最简单、最可靠）
2. ⭐⭐⭐⭐☆ **方法 2**：浏览器插件导出（简单、直观）
3. ⭐⭐⭐☆☆ **方法 3**：开发者工具手动提取（技术性强）

选择适合你的方法，开始爬取吧！🚀
