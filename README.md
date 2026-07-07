# AI Gateway

基于 Cloudflare Workers + Hono 的 AI 提供商 API 代理网关，统一 `/v1` 接口转发，支持多 Key 轮询、健康检查与自动故障转移。

## 功能与特性

- **统一 API 接口** — 所有 AI 提供商通过 `https://你的域名/v1/` 访问，兼容 OpenAI / Anthropic 协议
- **多 Key 轮询 + 健康检查** — 每个提供商可配置多个 API Key，请求随机打乱；失败 Key 自动降权，连续失败 5 次后进入冷却
- **Key 自动恢复** — 降权 Key 冷却 5 分钟后自动获得一次试用机会，成功则恢复权重，失败则重新冷却
- **多提供商管理** — 内置 DeepSeek / OpenAI / Anthropic / Gemini，支持自定义添加
- **两级启用控制** — 提供商级别 + 模型级别的启用/禁用
- **转发 Key 认证** — 生成 `sk_cf_*` 格式的 API Key，支持有效期管理
- **模型连接测试** — 管理后台手动测试模型是否可连接（通过服务端代理，无跨域限制）
- **管理后台** — 卡片式 UI，移动端自适应，无需前端构建

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

## 使用方法

- **API BASE URL**：`https://你的域名/v1`
- **API KEY**：在管理后台手动生成，格式为：`sk_cf_<KEY>`
- **模型ID**：`提供商ID/模型ID`，提供商ID在设置中自定义，如：
  - `deepseek/deepseek-chat`
  - `openai/gpt-4o`
  - `anthropic/claude-sonnet-4-20250514`

## 项目结构

```
ai-gateway/
├── src/
│   ├── index.ts       # 入口，路由注册
│   ├── types.ts       # 类型定义
│   ├── config.ts      # 默认配置
│   ├── storage.ts     # KV 存储层
│   ├── auth.ts        # 认证系统
│   ├── proxy.ts       # API 转发核心（Key 轮询 + 健康检查 + 自动恢复）
│   ├── admin.ts       # 管理 API（含服务端 Key/模型测试代理）
│   ├── pages.ts       # 前端页面模板
│   ├── pages.css.ts   # 样式
│   └── shared.js.ts   # 共享 JS 工具函数
├── wrangler.toml
├── package.json
├── tsconfig.json
└── .github/workflows/deploy.yml
```

## License

Apache 2.0

## 星星走起

## Star History

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=yutian81/ai-gateway&type=date&legend=top-left&sealed_token=ss5l0FbgLFED_spRh5MGVvFPQXDCPXMWds6_dNkiuSrV1ESAvtN32rTu3h59YAu1cUWg2yKcFf1bZLX5Q4Cic1RgaLixtg_F81tOAvMEnoYRi4nE_plSMwSC-JC3lCGiTCwGBdd1yRwsXgV9owq1Jll7i2NnNKEx6b30mK7nspfrbAFBFYvCXLjR9P7W)](https://www.star-history.com/?repos=yutian81%2Fai-gateway&type=date&legend=top-left)
