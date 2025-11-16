# 知乎问题回答分析工具

一个强大的工具，用于获取知乎问题下的所有回答，并使用 AI（Claude 或 Gemini）分析找出最有价值的回答。

## ⚠️ 重要提示：知乎反爬虫

知乎有**严格的反爬虫机制**，自动化爬虫很容易被检测。**强烈推荐使用本地 HTML 解析方案**：

### 推荐方案（100% 可靠）✅

```bash
# 1. 在浏览器中打开知乎问题页面，登录并滚动加载所有回答
# 2. Ctrl+S (Windows) 或 Cmd+S (Mac) 保存页面为 HTML 文件
# 3. 解析本地 HTML
npm run parse-html zhihu-question.html

# 4. AI 分析
npm run analyze
```

详细说明见 [ANTI_CRAWLER_GUIDE.md](./ANTI_CRAWLER_GUIDE.md)

---

## ✨ 功能特性

- 📄 **本地 HTML 解析**: 最可靠的方案，100% 绕过反爬虫（推荐）
- 🕷️ **Stealth 爬虫**: 反反爬虫技术，隐藏自动化特征（备选）
- 🔐 **登录支持**: Cookie 管理，确保获取完整内容
- ⏰ **时间排序**: 自动按发布时间倒序排列回答
- 🤖 **多 AI 支持**: 支持 Claude 和 Gemini 两种 AI 服务，可自由切换
- 📊 **详细报告**: 生成包含评分、优缺点分析的 Markdown 报告
- 💾 **数据保存**: 保存原始数据和分析结果，方便后续使用
- ⚙️ **环境配置**: 使用 dotenv 管理 API 密钥
- 🛡️ **反爬虫应对**: 提供多种方案应对知乎反爬虫

## 🎯 评分维度

AI 会从以下 5 个维度对每个回答进行评分（每项 1-10 分）：

1. **深度**: 分析是否深入，是否有独到见解
2. **准确性**: 内容是否准确可靠，是否有事实依据
3. **实用性**: 对读者是否有实际帮助和指导意义
4. **完整性**: 是否全面回答了问题，论述是否完整
5. **表达质量**: 逻辑是否清晰，表达是否流畅

## 📋 前置要求

- Node.js >= 18.0.0
- AI API Key（以下任选其一）
  - Claude API Key（从 [Anthropic Console](https://console.anthropic.com/) 获取）
  - Gemini API Key（从 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取）

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 安装浏览器（Playwright）

```bash
npm run install-browsers
```

### 3. 配置 API Key

创建 `.env` 文件并配置 AI 服务：

```bash
cp .env.example .env
# 编辑 .env 文件
```

**方式一：使用 Claude（推荐）**

在 `.env` 文件中设置：
```bash
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your-claude-api-key-here
```

**方式二：使用 Gemini（免费额度更多）**

在 `.env` 文件中设置：
```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here
```

也可以直接设置环境变量：

```bash
# 使用 Claude
export AI_PROVIDER=claude
export ANTHROPIC_API_KEY=your-key

# 或使用 Gemini
export AI_PROVIDER=gemini
export GEMINI_API_KEY=your-key
```

### 4. 登录知乎（可选但强烈推荐）

⚠️ **重要**：知乎需要登录才能查看完整内容，未登录可能只能看到部分回答。

**方式一：使用自动登录工具（推荐）**

```bash
npm run login
# 或
node login-zhihu.js
```

工具会打开浏览器，你需要：
1. 在浏览器中完成登录
2. 按回车键保存 Cookie
3. 工具会自动测试 Cookie 是否有效

**方式二：手动导出 Cookie**

查看详细说明：[COOKIE_GUIDE.md](./COOKIE_GUIDE.md)

**遇到 Cookie 问题？**

如果 Cookie 登录失败，使用诊断工具：

```bash
# 诊断 Cookie 问题
npm run diagnose

# 清理无效 Cookie（自动过滤非知乎/过期的 Cookie）
npm run diagnose -- --cleanup
```

详细说明见：[COOKIE_FIX_GUIDE.md](./COOKIE_FIX_GUIDE.md)

### 5. 运行分析

```bash
node zhihu-analyzer.js https://www.zhihu.com/question/490365386
```

如果已登录，你会看到 `✓ 已登录状态` 提示。

## 📖 使用方法

### 完整分析（推荐）

分析一个知乎问题的所有回答：

```bash
node zhihu-analyzer.js <问题URL> [选项]
```

**示例**：

```bash
# 基础用法
node zhihu-analyzer.js https://www.zhihu.com/question/490365386

# 分析更多回答
node zhihu-analyzer.js https://www.zhihu.com/question/490365386 --max-analyze 30

# 指定输出目录
node zhihu-analyzer.js https://www.zhihu.com/question/490365386 --output-dir ./my-analysis
```

**选项**：

- `--max-analyze <数量>`: 最多分析多少个回答（默认: 20）
- `--output-dir <路径>`: 输出目录（默认: ./output）
- `--help, -h`: 显示帮助信息

### 分步执行

#### 步骤 1: 仅爬取回答

```bash
node zhihu-scraper.js https://www.zhihu.com/question/490365386
```

这会生成 `zhihu_answers.json` 文件。

#### 步骤 2: 分析已爬取的回答

```bash
node answer-analyzer.js
```

这会读取 `zhihu_answers.json` 并生成分析报告。

## 📁 输出文件

执行完成后，会在输出目录（默认 `./output`）生成以下文件：

```
output/
├── answers.json      # 所有爬取的回答原始数据
├── analysis.json     # AI 分析结果（JSON 格式）
└── report.md         # 分析报告（Markdown 格式）
```

### 输出示例

**answers.json** - 回答数据结构：

```json
{
  "questionUrl": "https://www.zhihu.com/question/490365386",
  "totalAnswers": 156,
  "scrapedAt": "2024-01-15T10:30:00.000Z",
  "answers": [
    {
      "index": 1,
      "author": "张三",
      "content": "回答内容...",
      "timeText": "2023-10-15",
      "voteCount": 1234,
      "commentCount": 56,
      "contentLength": 1500
    }
  ]
}
```

**report.md** - 分析报告包含：

- 问题基本信息
- TOP 10 最有价值回答
- 每个回答的详细评分
- 优缺点分析
- 内容预览

## 🔧 高级配置

### 调整爬取参数

编辑 `zhihu-scraper.js` 中的参数：

```javascript
const maxScrollAttempts = 50;  // 最大滚动次数
const scrollWaitTime = 2000;   // 每次滚动等待时间（毫秒）
```

### 调整分析参数

编辑 `answer-analyzer.js` 中的参数：

```javascript
const delayMs = 2000;  // API 调用间隔（毫秒）
```

### 使用不同的 Claude 模型

在 `answer-analyzer.js` 中修改模型：

```javascript
model: 'claude-3-5-sonnet-20241022',  // 可改为其他模型
```

## 🛠️ 技术栈

- **Playwright**: 浏览器自动化，爬取动态网页
- **Anthropic Claude API**: AI 分析回答价值
- **Node.js**: 运行环境

## ⚠️ 注意事项

1. **登录状态**: 强烈建议先登录知乎（`npm run login`），否则可能只能看到部分回答
2. **Cookie 安全**: Cookie 包含登录凭证，不要分享或提交到版本控制（已在 .gitignore 中）
3. **Cookie 过期**: Cookie 会过期（通常几天到几周），过期后需要重新登录
4. **API 成本**: 每个回答的分析会调用一次 Claude API，建议使用 `--max-analyze` 限制分析数量
5. **爬取速度**: 为避免被反爬虫，程序会适当延迟，完整爬取可能需要几分钟
6. **网络稳定性**: 需要稳定的网络连接访问知乎和 Claude API
7. **合规使用**: 请遵守知乎的服务条款，仅用于个人研究和学习

## 🐛 故障排除

### 浏览器启动失败

```bash
# 重新安装浏览器
npm run install-browsers
```

### API 调用失败

检查：
- API Key 是否正确设置
- 账户是否有余额
- 网络连接是否正常

### 爬取失败

- 检查知乎链接是否正确
- 确认页面是否可以正常访问
- 可能需要添加延迟或调整爬取参数

### 登录相关问题

**提示"未登录状态"：**
```bash
# 重新登录
npm run login
```

**Cookie 过期：**
```bash
# 清除旧 Cookie 并重新登录
rm .zhihu-cookies.json
npm run login
```

**Cookie 数量过多或无效：**
```bash
# 诊断 Cookie 问题
npm run diagnose

# 自动清理无效 Cookie
npm run diagnose -- --cleanup
```

详细说明：[COOKIE_FIX_GUIDE.md](./COOKIE_FIX_GUIDE.md)

**无法看到完整回答：**
- 确保已经登录（运行 `npm run login`）
- 检查 `.zhihu-cookies.json` 文件是否存在
- 查看详细说明：[COOKIE_GUIDE.md](./COOKIE_GUIDE.md)

## 📝 示例输出

```
========================================
   知乎问题分析系统
========================================

【步骤 1/3】爬取知乎回答

启动浏览器...
正在访问: https://www.zhihu.com/question/490365386
✓ 成功爬取 156 个回答

【步骤 2/3】使用AI分析回答价值

将分析前 20 个回答

[1/20] 分析回答: 张三
  总分: 42/50
  摘要: 深入分析了问题本质，提供了实用的解决方案

...

【步骤 3/3】生成分析报告

✓ 报告已生成: ./output/report.md

========================================
   分析完成！
========================================

TOP 3 最有价值的回答：

1. 张三 (42/50分)
   时间: 2023-10-15
   点赞: 1234
   摘要: 深入分析了问题本质，提供了实用的解决方案

2. 李四 (40/50分)
   时间: 2023-10-14
   点赞: 890
   摘要: 从多个角度论述，内容全面且有深度

3. 王五 (38/50分)
   时间: 2023-10-13
   点赞: 756
   摘要: 结合实际案例，实用性强
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Playwright 文档](https://playwright.dev/)
- [Anthropic Claude API 文档](https://docs.anthropic.com/)
- [知乎](https://www.zhihu.com/)

---

**免责声明**: 本工具仅供学习和研究使用，请遵守知乎的服务条款和相关法律法规。
