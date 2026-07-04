# AI Gateway

基于 Cloudflare Workers + Hono 的 AI 提供商 API 代理网关。

统一 `/v1` 接口转发，支持多 AI 提供商、API Key 轮询与失败重试、两级启用/禁用（提供商+模型）、模型连接测试，并内置现代化管理后台。

## 功能特性

- 🚀 **统一 API 接口**：所有 AI 提供商通过 `https://你的域名/v1/` 访问，兼容 OpenAI / Anthropic 协议
- 🔄 **多 Key 轮询 + 失败重试**：每个提供商可配置多个 API Key，请求随机选 Key，遇 401/403/429/5xx 自动切换下一个
- 🏢 **多提供商管理**：内置 4 个主流 AI 提供商，支持自定义添加任意 OpenAI / Anthropic 兼容服务
- ✅ **两级启用控制**：提供商级别 + 模型级别的启用/禁用
- 🔑 **转发 Key 认证**：生成 `sk_cf_*` 格式的 API Key 用于转发鉴权，支持有效期、启用/禁用
- 🔌 **模型连接测试**：在管理后台手动测试模型是否可连接
- 🌐 **美观管理界面**：现代化卡片式 UI，Font Awesome 图标，移动端自适应
- 🔒 **Session 管理**：管理后台基于 Cookie Session 认证（SHA-256 哈希校验，7 天有效期）

## 内置提供商

| ID | 名称 | API 地址 | 协议类型 |
|----|------|---------|---------|
| `deepseek` | DeepSeek | https://api.deepseek.com | openai |
| `openai` | OpenAI | https://api.openai.com/v1 | openai |
| `anthropic` | Anthropic | https://api.anthropic.com/v1 | anthropic |
| `gemini` | Google Gemini | https://generativelanguage.googleapis.com/v1 | openai |

> 首次访问时自动写入以上默认提供商与一个测试转发 Key，可在管理后台修改或删除。

## 技术栈

- **运行时**：Cloudflare Workers
- **框架**：[Hono](https://hono.dev/) v4
- **存储**：Cloudflare Workers KV（命名空间绑定 `AI_GATEWAY`）
- **语言**：TypeScript（严格模式）
- **构建/部署**：Wrangler v4

## 快速部署

### 前置条件

- Node.js 18+
- npm
- Cloudflare 账号

### 部署步骤

#### 1. 克隆项目

```bash
git clone <你的仓库地址>
cd ai-gateway
npm install
```

#### 2. 创建 KV Namespace

```bash
npx wrangler kv namespace create AI_GATEWAY
```

将返回的 `id` 填入 `wrangler.toml`（如需在多个环境使用，请参考 Wrangler 文档配置 `preview_id`）：

```toml
[[kv_namespaces]]
binding = "AI_GATEWAY"
id = "你的 KV namespace id"
```

> `wrangler.toml` 中已配置 `binding = "AI_GATEWAY"`，Wrangler 也会按名称自动解析。

#### 3. 配置管理员环境变量

在 Cloudflare Dashboard 中设置 Worker 环境变量（Variables）：

| 变量名 | 说明 |
|--------|------|
| `ADMIN_USERNAME` | 管理后台登录用户名 |
| `ADMIN_PASSWORD` | 管理后台登录密码 |

进入 Cloudflare Dashboard → Workers & Pages → `ai-gateway` → **Settings** → **Variables**，添加以上环境变量。

#### 4. 部署

```bash
npm run deploy
```

#### 5. 配置提供商

访问 `https://你的域名/admin`，使用设置的管理员账号登录后：

1. 为每个提供商填写 API Key（可配置多个，逐个添加）
2. 添加或删除模型 ID
3. 启用需要的提供商和模型
4. 生成转发 API Key（`sk_cf_*`），可选有效期：30天 / 90天 / 180天 / 1年 / 永久

## GitHub Actions 自动部署

项目包含 GitHub Actions 工作流 (`.github/workflows/deploy.yml`)，在推送到 `main` 或 `master` 分支时自动部署，也支持手动触发。

### 配置步骤

1. 在 GitHub 仓库 Settings → **Secrets and variables** → **Actions** 中添加：
   - `CF_API_TOKEN`：Cloudflare API Token（权限：Workers 编辑）
   - `CF_ACCOUNT_ID`（可选）：Cloudflare Account ID，用于明确指定部署目标账号

2. 推送代码到 `main` 分支即可触发自动部署

> 管理员账号密码等敏感信息**不存储在代码或 KV 中**，需在 Cloudflare Dashboard 手动设置 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`。

## 本地开发

```bash
npm run dev
```

本地开发时，在项目根目录创建 `.dev.vars` 文件配置环境变量（已被 `.gitignore` 忽略）：

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
```

其他可用脚本：

```bash
npm run build       # 类型检查 + 干运行部署（不发布）
npm run type-check  # 仅 TypeScript 类型检查
```

## 使用示例

### 获取模型列表

```bash
curl https://你的域名/v1/models \
  -H "Authorization: Bearer sk_cf_xxx"
```

### 发起聊天请求（OpenAI 兼容）

```bash
curl https://你的域名/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_cf_xxx" \
  -d '{
    "model": "deepseek/deepseek-chat",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Anthropic 兼容请求

```bash
curl https://你的域名/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_cf_xxx" \
  -d '{
    "model": "anthropic/claude-sonnet-4-20250514",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 1024
  }'
```

> 模型格式统一为 `提供商ID/模型ID`。请求体原样透传到对应提供商，Authorization 头会被替换为该提供商的 API Key（Anthropic 使用 `x-api-key` + `anthropic-version` 头）。

## 项目结构

```
ai-gateway/
├── src/
│   ├── index.ts     # 入口，路由注册与全局中间件
│   ├── types.ts     # 类型定义
│   ├── config.ts    # 默认配置、KV key、有效期选项
│   ├── storage.ts   # KV 存储层（Provider / ProxyKey / Session CRUD）
│   ├── auth.ts      # 认证系统（Session + 转发 Key 中间件）
│   ├── proxy.ts     # API 转发核心（路由、Key 轮询、模型测试）
│   ├── admin.ts     # 管理 API 处理函数
│   └── pages.ts     # 前端页面模板（首页/登录/管理后台）
├── wrangler.toml    # Cloudflare Workers 配置
├── package.json
├── tsconfig.json
├── .github/workflows/deploy.yml  # 自动部署工作流
├── README.md
└── API.md
```

## License

MIT
