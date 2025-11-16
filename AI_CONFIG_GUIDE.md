# AI 配置指南

本工具支持使用 Claude 或 Gemini 两种 AI 服务来分析知乎回答。本指南将帮助你选择和配置合适的 AI 服务。

## 🤖 支持的 AI 服务

### Claude（Anthropic）

**优点：**
- ✅ 分析质量高，理解能力强
- ✅ 输出格式稳定，JSON 解析成功率高
- ✅ 支持多个模型选择

**缺点：**
- ❌ 费用相对较高
- ❌ 需要绑定信用卡

**定价：**
- Claude 3.5 Sonnet: $3/1M输入 + $15/1M输出
- Claude 3 Haiku: $0.25/1M输入 + $1.25/1M输出（最便宜）
- Claude 3 Opus: $15/1M输入 + $75/1M输出（最贵最强）

**获取 API Key：**
1. 访问 https://console.anthropic.com/
2. 注册/登录账户
3. 点击 "API Keys"
4. 创建新的 API Key
5. 复制 Key（只显示一次）

### Gemini（Google）

**优点：**
- ✅ 免费额度丰富（每天60次/分钟，1500次/天）
- ✅ 无需绑定信用卡
- ✅ 速度较快

**缺点：**
- ❌ 输出格式不太稳定（需要多次解析）
- ❌ 理解能力略低于 Claude

**定价：**
- Gemini 1.5 Flash: 免费额度内使用（推荐）
- Gemini 1.5 Pro: 超出免费额度后 $0.35/1M 输入

**获取 API Key：**
1. 访问 https://aistudio.google.com/app/apikey
2. 登录 Google 账户
3. 点击 "Create API Key"
4. 选择项目或创建新项目
5. 复制 API Key

---

## ⚙️ 配置方法

### 方法 1：使用 .env 文件（推荐）

1. **复制示例配置文件**

```bash
cp .env.example .env
```

2. **编辑 .env 文件**

使用任意文本编辑器打开 `.env` 文件：

```bash
nano .env
# 或
code .env
# 或
vim .env
```

3. **配置 AI 服务**

**选择 Claude:**

```bash
# AI 服务选择
AI_PROVIDER=claude

# Claude API 密钥
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx

# 可选：指定模型（默认使用 claude-3-5-sonnet-20241022）
# AI_MODEL=claude-3-haiku-20240307
```

**选择 Gemini:**

```bash
# AI 服务选择
AI_PROVIDER=gemini

# Gemini API 密钥
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx

# 可选：指定模型（默认使用 gemini-1.5-flash）
# AI_MODEL=gemini-1.5-pro
```

### 方法 2：使用环境变量

适合临时测试或 CI/CD 环境：

**使用 Claude:**

```bash
export AI_PROVIDER=claude
export ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
node zhihu-analyzer.js <URL>
```

**使用 Gemini:**

```bash
export AI_PROVIDER=gemini
export GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx
node zhihu-analyzer.js <URL>
```

---

## 🎯 模型选择

### Claude 模型对比

| 模型 | 成本 | 质量 | 速度 | 推荐场景 |
|------|------|------|------|---------|
| claude-3-5-sonnet-20241022 | 中 | ⭐⭐⭐⭐⭐ | 中 | 默认推荐，平衡性能和成本 |
| claude-3-haiku-20240307 | 低 | ⭐⭐⭐⭐ | 快 | 预算有限，大量分析 |
| claude-3-opus-20240229 | 高 | ⭐⭐⭐⭐⭐ | 慢 | 要求最高质量 |

### Gemini 模型对比

| 模型 | 成本 | 质量 | 速度 | 推荐场景 |
|------|------|------|------|---------|
| gemini-1.5-flash | 免费 | ⭐⭐⭐⭐ | 快 | 默认推荐，免费额度内使用 |
| gemini-1.5-pro | 低 | ⭐⭐⭐⭐⭐ | 中 | 需要更高质量分析 |
| gemini-pro | 免费 | ⭐⭐⭐ | 快 | 旧版本，不推荐 |

### 指定模型

在 `.env` 文件中添加：

```bash
AI_MODEL=模型名称
```

例如：

```bash
# 使用 Claude Haiku（便宜快速）
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your-key
AI_MODEL=claude-3-haiku-20240307

# 使用 Gemini Pro（高质量）
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key
AI_MODEL=gemini-1.5-pro
```

---

## 💡 选择建议

### 新手用户

推荐使用 **Gemini**：
- ✅ 免费额度充足
- ✅ 无需绑定信用卡
- ✅ 配置简单

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key
```

### 专业用户

推荐使用 **Claude 3.5 Sonnet**：
- ✅ 分析质量最佳
- ✅ 输出稳定性好
- ✅ 性价比高

```bash
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your-key
AI_MODEL=claude-3-5-sonnet-20241022
```

### 大量分析

推荐使用 **Claude Haiku**：
- ✅ 成本最低（Claude 系列）
- ✅ 速度快
- ✅ 质量尚可

```bash
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your-key
AI_MODEL=claude-3-haiku-20240307
```

---

## 💰 成本估算

假设分析 20 个回答，每个回答 500 字：

### Claude 3.5 Sonnet
- 输入：~50K tokens
- 输出：~20K tokens
- **成本**: ~$0.45

### Claude 3 Haiku
- 输入：~50K tokens
- 输出：~20K tokens
- **成本**: ~$0.04（最便宜）

### Gemini 1.5 Flash
- 在免费额度内
- **成本**: $0（免费）

---

## 🔧 高级配置

### 配置文件完整示例

```bash
# ========================================
# AI 配置
# ========================================

# AI 服务选择（claude 或 gemini）
AI_PROVIDER=claude

# Claude API密钥
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx

# Gemini API密钥（如果使用 Gemini）
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx

# ========================================
# 分析配置
# ========================================

# 最多分析多少个回答（默认20）
MAX_ANALYZE=20

# AI 模型选择（可选）
AI_MODEL=claude-3-5-sonnet-20241022

# ========================================
# 其他配置
# ========================================

# 分析延迟（毫秒，避免 API 限流）
# ANALYZER_DELAY=2000
```

### 切换 AI 服务

只需修改 `.env` 文件中的 `AI_PROVIDER`：

```bash
# 从 Claude 切换到 Gemini
# AI_PROVIDER=claude
AI_PROVIDER=gemini
```

重新运行程序即可：

```bash
node zhihu-analyzer.js <URL>
```

程序会自动使用新的 AI 服务。

---

## ❓ 常见问题

### Q1: 如何知道当前使用的是哪个 AI？

**A:** 运行程序时会显示：

```
使用 AI 提供商: Claude
模型: claude-3-5-sonnet-20241022
```

或

```
使用 AI 提供商: Gemini
模型: gemini-1.5-flash
```

### Q2: 可以同时配置两个 API Key 吗？

**A:** 可以！在 `.env` 中同时配置两个 key：

```bash
AI_PROVIDER=claude  # 当前使用 Claude

# 两个 key 都配置
ANTHROPIC_API_KEY=your-claude-key
GEMINI_API_KEY=your-gemini-key
```

切换时只需修改 `AI_PROVIDER`。

### Q3: 哪个 AI 更好？

**A:** 根据需求选择：
- **质量优先**: Claude 3.5 Sonnet
- **成本优先**: Gemini 1.5 Flash（免费）
- **速度优先**: Claude 3 Haiku 或 Gemini Flash

### Q4: API Key 安全吗？

**A:**
- ✅ `.env` 文件已加入 `.gitignore`，不会被提交
- ✅ Key 仅在本地使用
- ⚠️ 不要将 Key 分享给他人
- ⚠️ 不要提交到公开仓库

### Q5: Gemini 提示配额用尽怎么办？

**A:** Gemini 免费额度限制：
- 每分钟 60 次请求
- 每天 1500 次请求

如果超出：
1. 等待配额重置（每天重置）
2. 切换到 Claude
3. 升级到 Gemini 付费版

### Q6: API 调用失败怎么办？

**A:** 检查：

1. **API Key 是否正确**
```bash
# 检查 key 格式
Claude: sk-ant-api03-...
Gemini: AIzaSy...
```

2. **网络连接**
```bash
# 测试连接
ping api.anthropic.com
ping generativelanguage.googleapis.com
```

3. **账户余额**（Claude）
   - 登录 console.anthropic.com
   - 查看 "Usage" 页面

4. **配额限制**（Gemini）
   - 检查是否超出每日限制
   - 查看 Google Cloud Console

---

## 🔗 相关链接

### Claude
- [官方文档](https://docs.anthropic.com/)
- [API 控制台](https://console.anthropic.com/)
- [定价说明](https://www.anthropic.com/api)

### Gemini
- [官方文档](https://ai.google.dev/docs)
- [API Studio](https://aistudio.google.com/)
- [快速开始](https://ai.google.dev/tutorials/get_started_node)

---

## 🎉 快速测试

### 测试 Claude

```bash
# 配置
echo "AI_PROVIDER=claude" > .env
echo "ANTHROPIC_API_KEY=your-key" >> .env

# 运行
node test-scraper.js
```

### 测试 Gemini

```bash
# 配置
echo "AI_PROVIDER=gemini" > .env
echo "GEMINI_API_KEY=your-key" >> .env

# 运行
node test-scraper.js
```

---

**建议配置（新手）：**

```bash
# .env 文件
AI_PROVIDER=gemini
GEMINI_API_KEY=你的Gemini-API-Key
MAX_ANALYZE=10
```

这样可以免费分析，快速上手！🚀
