# OpenCode 多 CDN 反代部署指南

给自己搭建 OpenCode CDN 反向代理，扩充镜像地址，分散请求压力。

## 原理

在每个 CDN 平台上创建一个服务，将你的自定义域名指向 `https://opencode.ai`，路径原样透传。客户端请求 `/zen/v1/chat/completions` → CDN → `https://opencode.ai/zen/v1/chat/completions`。

## 通用要求

- **自定义域名**（各平台都要求将域名 CNAME 到它们的 CDN 节点）
- **SSL 证书**（各平台都自动签发，无需自己准备）
- **Host Header** 必须设为 `opencode.ai`，否则源站无法识别请求

## Cloudflare Workers

```js
export default {
  async fetch(request) {
    const url = new URL(request.url)
    const target = new URL(`https://opencode.ai${url.pathname}${url.search}`)
    return fetch(target, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    })
  }
}
```

**部署：**
1. Cloudflare Dashboard → Workers & Pages → 创建 Worker → 粘贴代码 → 保存并部署
2. Worker → **Settings** → **Triggers** → **Custom Domain** → 绑定你的域名（如 `opencode-cf.yourdomain.com`）
3. 将 `https://opencode-cf.yourdomain.com/zen/v1` 加入 `OPENCODE_MIRRORS_URL`

> 如需加速，可在 Worker 中开启 **Smart Routing** 或使用 `request.cf.resolveOverride`。

## Fastly

Fastly 无需写代码，纯配置即可。

1. **Create a new service** → 取名（如 `opencode-proxy`）
2. **Domains** → 添加你的自定义域名（如 `opencode-fastly.yourdomain.com`）
3. **Backends** → 添加：
   - Address: `opencode.ai`
   - Port: `443`
   - Use TLS: ✅
4. **Hosts** → **Override host** 设为 `opencode.ai`（**关键**，否则 Fastly 会把你的域名传给源站，导致 404）
5. 保存并 **Activate**（部署到全网节点）
6. 在域名 DNS 管理处添加 CNAME 记录指向 `your-service.global.fastly.net`

> Fastly 的免费额度包含每月 $50 的流量，个人使用绰绰有余。

## Gcore

Gcore 同样无需写代码。

1. **CDN** → **Create CDN Resource**
2. **Origin** → 选 **Your origin**：
   - Origin type: HTTP Website
   - IP / Domain: `opencode.ai`
   - Protocol: HTTPS
3. **Host header** → 设为 `opencode.ai`（同上，避免 Host 冲突）
4. **Domain** → 绑定你的自定义域名（如 `opencode-gcore.yourdomain.com`）
5. **Caching** → 建议：
   - Caching Mode: **No caching**（API 响应不应缓存）
   - 或自定义规则：仅缓存 `GET /zen/v1/models` 60 秒（模型列表变化不频繁）
6. 创建后在域名 DNS 管理处添加 CNAME 记录指向 Gcore 提供的 CDN 域名

> Gcore 有永久免费 CDN 额度（1TB/月流量），很适合此用途。

## 验证部署

反代部署完成后，测试连通性：

```bash
# 测试模型列表
curl -s https://你的域名/zen/v1/models -H "Authorization: Bearer public"

# 测试聊天补全
curl -s https://你的域名/zen/v1/chat/completions \
  -H "Authorization: Bearer public" \
  -H "Content-Type: application/json" \
  -d '{"model":"hy3-free","messages":[{"role":"user","content":"hi"}],"max_tokens":1}'
```

模型列表应返回 JSON 数组，聊天应返回非空响应。

## 添加到项目

部署好的镜像地址写入环境变量时，**必须包含 `/zen/v1` 路径**，因为项目代码会在此基础上拼接 `/chat/completions`、`/models` 等子路径。

### 本地开发 `.dev.vars`

```
OPENCODE_MIRRORS_URL=https://opencode-cf.yourdomain.com/zen/v1,https://opencode-fastly.yourdomain.com/zen/v1
```

### Cloudflare Dashboard（手动部署）

Worker → **Settings** → **Variables** → 添加 `OPENCODE_MIRRORS_URL`

```
https://opencode-cf.yourdomain.com/zen/v1
https://opencode-fastly.yourdomain.com/zen/v1
```

### GitHub Actions Variables（CI 部署）

仓库 → Settings → Secrets and variables → Actions → Variables → 新增 `OPENCODE_MIRRORS_URL`

内容同上（每行一个 URL），部署时追加到默认三个镜像地址之后，全局去重。

## 注意事项

### HTTP 状态码排查

| 现象 | 原因 | 解决 |
|---|---|---|
| `404` | Host Header 未覆盖 | 检查 Override host 设置 |
| `403` | 缺少 Authorization 头 | 请求必须带 `Bearer public` |
| `502` | 源站连接失败 | 检查域名解析和防火墙 |
| `521` | CDN 无法连接源站 | 确认源站 `opencode.ai` 可达 |
| 超时 | DNS 或 SSL 协商慢 | 检查 CDN 节点区域是否靠近源站 |

### 流量和费用

| 平台 | 免费额度 | 超出后 |
|---|---|---|
| Cloudflare Workers | 10 万请求/天 | $0.30/百万请求 |
| Fastly | $50/月流量 | 按量计费 |
| Gcore | 1TB/月 | 按量计费 |

### 为什么不建议 Vercel / Netlify / Render

| 平台 | 原因 |
|---|---|
| Vercel | Serverless Function 超时 10s（免费）/ 60s（Pro），流式 AI 响应必然超时 |
| Netlify | 同 Vercel，不支持 SSE 流透传 |
| Render | 冷启动慢（5-10s），高频率 API 调用体验差 |

## 架构参考

```
客户端 → API Gateway (ai-gateway Worker)
            ├── 官方地址 (https://opencode.ai/zen/v1) ← 有 Key 时优先
            ├── Cloudflare 镜像 ← 随机起点
            ├── Fastly 镜像
            └── Gcore 镜像
                  ↓ 失败顺序切换
              最终返回响应
```

`resolveOpenCodeUrls()` 读取环境变量，按换行/逗号分割，去重后作为镜像列表。每次请求随机起点，网络错误/超时/任意非 2xx 响应都切换下一个镜像。全部失败时保留官方地址的 HTTP 错误返回客户端。
