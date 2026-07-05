# AI Gateway

基于 Cloudflare Workers + Hono 的 AI 提供商 API 代理网关，统一 `/v1` 接口转发，支持多 Key 轮询、健康检查与自动故障转移。

## 功能与特性

- **统一 API 接口** — 所有 AI 提供商通过 `https://你的域名/v1/` 访问，兼容 OpenAI / Anthropic 协议
- **多 Key 轮询 + 健康检查** — 每个提供商可配置多个 API Key，请求随机打乱；失败 Key 自动降权，连续失败 3 次后排除轮询
- **多提供商管理** — 内置 DeepSeek / OpenAI / Anthropic / Gemini，支持自定义添加
- **两级启用控制** — 提供商级别 + 模型级别的启用/禁用
- **转发 Key 认证** — 生成 `sk_cf_*` 格式的 API Key，支持有效期管理
- **模型连接测试** — 管理后台手动测试模型是否可连接
- **管理后台** — 现代化卡片式 UI，移动端自适应

## 技术栈

- **运行时**：Cloudflare Workers
- **框架**：[Hono](https://hono.dev/) v4
- **存储**：Cloudflare Workers KV
- **语言**：TypeScript

## 本地开发

```bash
# 克隆项目
git clone <你的仓库地址>
cd ai-gateway
npm install

# 创建 .dev.vars（已 .gitignore）
echo ADMIN_USERNAME=admin >> .dev.vars
echo ADMIN_PASSWORD=your-password >> .dev.vars

# 启动本地开发服务器
npm run dev
```

## 部署

### 方式一：手动部署

1. 在 Cloudflare Dashboard → **Workers & Pages** → 点击 **创建** → **Workers** → **连接到 Git**
2. 选择你的 GitHub 仓库，在构建设置中使用默认选项，点击**保存并部署**
3. Cloudflare Pages 会自动构建并部署 Worker，同时自动创建 `KV` 命名空间并绑定
4. 部署完成后，进入 Worker 页面 → **Settings** → **Variables**，添加：
   - `ADMIN_USERNAME` — 管理后台登录用户名
   - `ADMIN_PASSWORD` — 管理后台登录密码
- 建议：绑定一个自定义域名

### 方式二：GitHub Actions 自动部署

1. Fork 或推送代码到你的 GitHub 仓库

2. 在 GitHub 仓库 Settings → **Secrets and variables** → **Actions** 中配置：
   - **Secrets**：`CF_API_TOKEN`（Cloudflare API Token，权限需包含 Workers 编辑）
   - **Variables**：`ADMIN_USERNAME`、`ADMIN_PASSWORD`

3. 在 GitHub 仓库 Actions 页面手动触发 **Deploy to Cloudflare Workers** 工作流，或推送到 `main` 分支自动触发

> 工作流会在 CI 中自动生成 `wrangler.toml`（含 KV 绑定和 ADMIN 凭据），无需手动配置 Dashboard。

## 项目结构

```
ai-gateway/
├── src/
│   ├── index.ts     # 入口，路由注册
│   ├── types.ts     # 类型定义
│   ├── config.ts    # 默认配置
│   ├── storage.ts   # KV 存储层
│   ├── auth.ts      # 认证系统
│   ├── proxy.ts     # API 转发核心（Key 轮询 + 健康检查）
│   ├── admin.ts     # 管理 API
│   └── pages.ts     # 前端页面模板
├── wrangler.toml
├── package.json
├── tsconfig.json
└── .github/workflows/deploy.yml
```

## License

MIT