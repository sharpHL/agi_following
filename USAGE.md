# 使用指南

## 快速开始

### 1. 测试爬虫功能（无需API key）

首先测试爬虫是否能正常工作：

```bash
node test-scraper.js https://www.zhihu.com/question/490365386
```

如果成功，你会看到前3个回答的信息。

### 2. 完整分析（需要API key）

#### 获取 Anthropic API Key

1. 访问 https://console.anthropic.com/
2. 注册/登录账户
3. 在 API Keys 页面创建新的 API key
4. 复制 API key

#### 设置环境变量

**方法1: 使用 .env 文件（推荐）**

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 API key
```

**方法2: 临时设置**

```bash
export ANTHROPIC_API_KEY=sk-ant-xxx
```

#### 运行完整分析

```bash
node zhihu-analyzer.js https://www.zhihu.com/question/490365386
```

## 工作流程

### 完整流程

```
┌─────────────┐
│  输入问题URL │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ 步骤1: 爬取回答  │  ← Playwright 浏览器自动化
│ - 启动浏览器    │
│ - 滚动加载      │
│ - 提取数据      │
│ - 按时间排序    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ 步骤2: AI分析    │  ← Claude API
│ - 逐个分析回答  │
│ - 多维度评分    │
│ - 生成摘要      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ 步骤3: 生成报告  │
│ - 排名          │
│ - 详细评分      │
│ - 优缺点分析    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  输出文件        │
│ - answers.json  │
│ - analysis.json │
│ - report.md     │
└─────────────────┘
```

### 分步执行

如果你想分步骤执行（例如先爬取，稍后分析）：

```bash
# 步骤1: 仅爬取
node zhihu-scraper.js https://www.zhihu.com/question/490365386

# 步骤2: 仅分析（需要先有 zhihu_answers.json）
export ANTHROPIC_API_KEY=your-key
node answer-analyzer.js
```

## 参数说明

### zhihu-analyzer.js（主程序）

```bash
node zhihu-analyzer.js <URL> [选项]
```

**必需参数**:
- `<URL>`: 知乎问题链接，例如 `https://www.zhihu.com/question/490365386`

**可选参数**:
- `--max-analyze <数量>`: 最多分析多少个回答，默认 20
  - 每个回答会调用一次 Claude API
  - 建议从小数量开始测试（如 5-10 个）

- `--output-dir <路径>`: 输出目录，默认 `./output`

**示例**:

```bash
# 分析前10个回答
node zhihu-analyzer.js https://www.zhihu.com/question/490365386 --max-analyze 10

# 自定义输出目录
node zhihu-analyzer.js https://www.zhihu.com/question/490365386 --output-dir ./my-results

# 组合使用
node zhihu-analyzer.js https://www.zhihu.com/question/490365386 \
  --max-analyze 15 \
  --output-dir ./results-$(date +%Y%m%d)
```

## 输出文件详解

执行后会在输出目录生成3个文件：

### 1. answers.json - 原始回答数据

包含爬取到的所有回答的完整信息：

```json
{
  "questionUrl": "https://www.zhihu.com/question/490365386",
  "totalAnswers": 156,
  "scrapedAt": "2024-01-15T10:30:00.000Z",
  "answers": [
    {
      "index": 1,
      "author": "张三",
      "content": "完整的回答内容...",
      "timeText": "2023-10-15",
      "voteCount": 1234,
      "commentCount": 56,
      "contentLength": 1500,
      "parsedTime": 1697328000000
    }
  ]
}
```

### 2. analysis.json - AI分析结果

包含每个回答的详细评分：

```json
[
  {
    "index": 1,
    "author": "张三",
    "content": "...",
    "analysis": {
      "depth": 9,
      "accuracy": 8,
      "practicality": 9,
      "completeness": 8,
      "expressionQuality": 8,
      "totalScore": 42,
      "summary": "深入分析了问题本质，提供了实用的解决方案",
      "strengths": [
        "论述深入，有独到见解",
        "结合实际案例"
      ],
      "weaknesses": [
        "部分论述可以更详细"
      ]
    }
  }
]
```

### 3. report.md - Markdown 分析报告

人类可读的报告，包含：
- 问题基本信息
- TOP 10 最有价值回答
- 每个回答的详细评分和分析
- 内容预览

## 常见问题

### Q1: 爬取很慢怎么办？

A: 这是正常的，因为：
- 需要滚动页面加载所有回答
- 添加了延迟避免被反爬虫
- 完整爬取可能需要3-10分钟

### Q2: API 调用费用是多少？

A:
- 每个回答约消耗 1000-2000 tokens
- 使用 Claude 3.5 Sonnet：
  - 输入: $3 / million tokens
  - 输出: $15 / million tokens
- 分析20个回答大约花费 $0.05-0.10

### Q3: 可以分析更多回答吗？

A: 可以，但要注意：
- 增加 `--max-analyze` 数值
- API 调用费用会相应增加
- 分析时间更长

### Q4: 遇到反爬虫怎么办？

A: 可以尝试：
- 增加延迟时间（修改代码中的 `waitForTimeout`）
- 使用代理
- 换个时间段尝试

### Q5: 页面结构变化导致爬取失败？

A: 知乎可能会更新页面结构，需要：
- 检查选择器是否还有效
- 更新 `zhihu-scraper.js` 中的选择器
- 提交 issue 反馈

## 高级用法

### 批量分析多个问题

创建脚本 `batch-analyze.sh`:

```bash
#!/bin/bash

questions=(
  "https://www.zhihu.com/question/490365386"
  "https://www.zhihu.com/question/123456789"
  "https://www.zhihu.com/question/987654321"
)

for url in "${questions[@]}"; do
  echo "分析问题: $url"
  node zhihu-analyzer.js "$url" --output-dir "./output/$(basename $url)"
  echo "完成，等待10秒..."
  sleep 10
done
```

### 定制分析维度

修改 `answer-analyzer.js` 中的提示词，可以自定义评分维度：

```javascript
const prompt = `请分析以下知乎回答的价值。从以下维度评分：

1. **原创性**: 是否有独特观点
2. **专业性**: 是否展现专业知识
3. **通俗性**: 是否易于理解
...
`;
```

### 使用不同的 AI 模型

在 `answer-analyzer.js` 中修改：

```javascript
model: 'claude-3-5-sonnet-20241022',  // 或其他模型
```

可用模型：
- `claude-3-5-sonnet-20241022` - 最新最强（推荐）
- `claude-3-haiku-20240307` - 更快更便宜
- `claude-3-opus-20240229` - 最强但最贵

## 最佳实践

1. **首次使用**：先用 `--max-analyze 5` 测试
2. **网络问题**：在网络稳定时运行
3. **成本控制**：根据需要调整分析数量
4. **数据保存**：定期备份输出文件
5. **遵守规则**：仅用于个人学习研究

## 故障排除步骤

### 1. 检查基础环境

```bash
node --version   # 应该 >= 18.0.0
npm --version
```

### 2. 测试爬虫

```bash
node test-scraper.js https://www.zhihu.com/question/490365386
```

### 3. 检查 API 连接

```bash
export ANTHROPIC_API_KEY=your-key
node -e "const Anthropic = require('@anthropic-ai/sdk'); const c = new Anthropic({apiKey: process.env.ANTHROPIC_API_KEY}); console.log('API OK')"
```

### 4. 查看详细日志

程序会输出详细的进度信息，仔细查看可以定位问题。

## 联系支持

遇到问题？
- 查看 README.md
- 阅读本文档
- 查看代码中的注释
- 提交 GitHub Issue
