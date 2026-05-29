# CreatorFlow 多平台内容智能发布助手

CreatorFlow 是一个面向创作者和新媒体运营的多平台内容发布工具。用户输入一份主稿后，系统会自动生成适合公众号、知乎、B站、小红书的标题、摘要、正文结构、标签和发布前检查项，并支持一键模拟发布。

## 选题方向

题目二：多平台内容发布工具。

创作者经常需要把同一份内容同步发布到多个平台，但不同平台的标题长度、正文结构、标签体系、互动方式和读者预期不同，直接复制会降低阅读体验，也会增加重复劳动。CreatorFlow 的目标是把“主稿到多平台发布稿”的流程产品化。

## 在线 Demo / 视频

- 在线仓库：提交后填写公开 GitHub 或 Gitee 地址
- Demo 视频：提交后填写 B 站、网盘或其他外部可访问链接
- 产品需求分析：[docs/REQUIREMENTS_ANALYSIS.md](./docs/REQUIREMENTS_ANALYSIS.md)
- PR 拆分计划：[docs/PR_PLAN.md](./docs/PR_PLAN.md)
- Demo 讲解稿：[docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md)

建议 Demo 覆盖：

1. 输入一篇通用内容。
2. 切换公众号、知乎、B站、小红书预览。
3. 展示标题、摘要、正文、标签和检查项的差异。
4. 点击“模拟一键发布”，查看发布记录。
5. 简要说明平台适配器架构如何扩展更多平台。

## 核心功能

- AI 平台爆款规律分析：模拟分析不同平台优质内容的标题、开头、结构、标签和风险点。
- 真实 AI 接入：支持通过本地代理调用 OpenAI-compatible 大模型接口生成平台策略和发布稿。
- 参考样本分析：用户可粘贴优质内容样本，AI 只分析结构规律，不复制原文。
- 一份主稿，多平台自动适配。
- 公众号：偏长文结构，强调背景、方法、总结。
- 知乎：结论先行，强调问题意识和论证链路。
- B站：生成视频简介和看点时间轴。
- 小红书：生成短句、清单化表达和分发标签。
- 发布前检查：标题长度、正文字数、标签、平台风格。
- 直接编辑与版本回退：用户可直接在平台稿上修改、保存版本，并回退到历史版本或 AI 版本。
- 导出全部平台稿：生成 Markdown 发布包，便于复制到各平台后台。
- 内容指标：字数、标题长度、标签数、结构块。
- 发布总览：展示平台数、已发布、发布中、手动版本数量。
- 模拟一键发布：通过 MockPublisher 生成发布中、已模拟发布等状态，便于演示完整流程。
- 本地存储：刷新页面后保留编辑内容和发布记录。

## 使用方式

本项目基础功能为纯前端静态应用，无需安装依赖。

直接打开：

```text
index.html
```

也可以使用任意静态文件服务器运行，例如：

```bash
python -m http.server 5173
```

然后访问：

```text
http://localhost:5173
```

如需体验真实大模型生成，请使用本地代理服务启动，避免在浏览器前端暴露 API Key：

方式一：创建本地 `.env` 文件，推荐。

```text
AI_API_BASE_URL=https://your-openai-compatible-endpoint/v1
AI_API_KEY=your_api_key
AI_MODEL=mimo-v2.5-pro
PORT=5173
```

然后启动：

```bat
node server.js
```

方式二：只在当前终端临时设置。

```bat
set AI_API_BASE_URL=https://your-openai-compatible-endpoint/v1
set AI_API_KEY=your_api_key
set AI_MODEL=your_model_name
node server.js
```

然后访问：

```text
http://127.0.0.1:5173
```

如果 5173 端口已被占用，服务会自动尝试：

```text
http://127.0.0.1:5174
```

页面中的“AI渲染”会请求本地 `/api/generate`。如果 API 未配置或调用失败，系统会保留本地模拟结果。

## 项目结构

```text
.
├── index.html
├── src
│   ├── app.js
│   ├── platforms.js
│   └── styles.css
├── docs
│   ├── DEMO_SCRIPT.md
│   └── PR_PLAN.md
└── README.md
```

## 架构设计

系统分为三层：

1. 内容输入层：采集主标题、正文、目标受众、语气、标签和互动引导配置。
2. AI 策略层：分析平台优质内容特征，形成标题规律、开头方式、结构模板、标签策略和风险提醒。
3. 平台适配层：每个平台由一个 Adapter 描述自己的标题限制、理想长度、内容结构和改写策略。
4. 发布编排层：统一读取各平台草稿，执行模拟发布，并保存发布记录。

平台适配器位于 `src/platforms.js`。新增平台时，只需要增加一个新的 Adapter：

```js
export const platformAdapters = {
  newPlatform: {
    id: "newPlatform",
    name: "新平台",
    accent: "#126b67",
    profile: "平台内容风格说明",
    maxTitle: 30,
    idealLength: [200, 800],
    sections: ["标题", "摘要", "正文", "标签"],
    adapt(input, options) {
      return buildDraft(this, title, summary, body, input, options);
    },
  },
};
```

未来接入真实发布时，可把当前的模拟发布替换为发布服务：

- `Publisher.publish(platformId, draft)`：统一发布入口。
- `MockPublisher`：比赛 Demo 使用的本地模拟发布器。
- `WechatDraftPublisher`：后续可接公众号草稿箱能力。
- `PlatformSharePublisher`：后续可接小红书、视频号等分享式发布能力。
- `CredentialStore`：保存平台授权信息。
- `PublishJob`：管理发布队列、重试、失败原因和回滚。
- `Webhook/Callback`：接收平台发布结果。

## AI 能力设计

当前版本使用本地规则模拟 AI 改写，确保离线可演示、响应稳定。真实生产版本可接入大模型：

- 模型选择：使用响应快、成本低的模型处理标题、摘要、标签；使用更强模型处理长文重写和风格迁移。
- 上下文获取：输入主稿、平台画像、目标受众、历史优质样例、平台限制、平台爆款策略。
- 误差控制：保留原始观点，不虚构事实；输出前使用规则检查标题长度、敏感表达和格式要求。
- 人机协同：AI 生成草稿，用户确认后再发布。

当前仓库已提供 `server.js` 作为 OpenAI-compatible API 代理。若小米 API 或其他模型服务兼容 `/chat/completions`，只需配置 `AI_API_BASE_URL`、`AI_API_KEY`、`AI_MODEL` 即可接入；若接口格式不同，可在 `server.js` 的 `handleGenerate` 中替换请求适配逻辑。

## 三天开发计划

### 5月29日

- 完成需求拆解、用户痛点分析和信息架构。
- 搭建静态应用结构。
- 实现主稿输入、平台切换和基础预览。

### 5月30日

- 完成四个平台的适配策略。
- 增加标签、指标、发布前检查和本地存储。
- 完成模拟一键发布流程。

### 5月31日

- 优化交互和响应式布局。
- 补齐 README、Demo 脚本和 PR 说明。
- 录制 Demo 视频并提交公开仓库。

## 提交规范建议

为满足评审要求，建议使用多个小 PR：

- PR 1：初始化项目结构与基础页面。
- PR 2：实现平台适配器和多平台预览。
- PR 3：实现模拟发布、检查项和本地存储。
- PR 4：补充 README、Demo 脚本和架构说明。

每个 PR 标题应一句话说明新增或修改内容，描述中包含功能描述、实现思路和测试方式。

## 测试方式

- 打开 `index.html`，确认页面可正常加载。
- 修改标题、正文、目标受众，确认四个平台预览实时更新。
- 切换平台卡片，确认预览、检查项和指标同步变化。
- 点击“导出全部稿”，确认下载 Markdown 发布包。
- 点击“模拟一键发布”，确认发布记录生成。
- 刷新页面，确认内容和发布记录保留。

## 第三方依赖说明

当前版本未引入第三方库或框架，所有核心功能均由项目代码实现。真实 AI 接入使用 Node.js 内置能力实现本地代理。
