# 知乎问题回答分析工具

一个强大的工具，用于爬取知乎问题下的所有回答，并使用 Claude AI 分析找出最有价值的回答。

## ✨ 功能特性

- 🕷️ **完整爬取**: 使用 Playwright 模拟真实浏览器，爬取问题下的所有回答
- ⏰ **时间排序**: 自动按发布时间倒序排列回答
- 🤖 **AI 分析**: 使用 Claude AI 从多个维度评估回答价值
- 📊 **详细报告**: 生成包含评分、优缺点分析的 Markdown 报告
- 💾 **数据保存**: 保存原始数据和分析结果，方便后续使用

## 🎯 评分维度

AI 会从以下 5 个维度对每个回答进行评分（每项 1-10 分）：

1. **深度**: 分析是否深入，是否有独到见解
2. **准确性**: 内容是否准确可靠，是否有事实依据
3. **实用性**: 对读者是否有实际帮助和指导意义
4. **完整性**: 是否全面回答了问题，论述是否完整
5. **表达质量**: 逻辑是否清晰，表达是否流畅

## 📋 前置要求

- Node.js >= 18.0.0
- Anthropic API Key（Claude API）

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

创建 `.env` 文件并添加你的 Claude API Key：

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key
```

或者直接设置环境变量：

```bash
export ANTHROPIC_API_KEY=your-api-key-here
```

### 4. 运行分析

```bash
node zhihu-analyzer.js https://www.zhihu.com/question/490365386
```

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

1. **API 成本**: 每个回答的分析会调用一次 Claude API，建议使用 `--max-analyze` 限制分析数量
2. **爬取速度**: 为避免被反爬虫，程序会适当延迟，完整爬取可能需要几分钟
3. **网络稳定性**: 需要稳定的网络连接访问知乎和 Claude API
4. **合规使用**: 请遵守知乎的服务条款，仅用于个人研究和学习

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
