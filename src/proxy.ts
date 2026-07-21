import { Context } from 'hono'
import { getProvider, getProviders, getModelPool, getModelPools } from './storage'
import { KV_KEYS, KEY_HEALTH_COOLDOWN_MS, KEY_HEALTH_MAX_FAILURES, POOL_MODEL_COOLDOWN_MS, POOL_MODEL_MAX_FAILURES } from './config'
import type { Env, ModelPool, ProxyRequestBody } from './types'
import { isOpenCodeProvider, proxyOpenCodeRequest, resolveOpenCodeUrls } from './opencode'

// ===== Key 健康状态类型和辅助函数 =====

interface KeyHealth {
  failures: number
  lastFailed: boolean
  demotedAt?: number  // 首次达到降权阈值的时间戳 (Date.now())
}
type HealthMap = Record<string, KeyHealth>

const HEALTH_KEY = (providerId: string) => KV_KEYS.KEY_HEALTH_PREFIX + providerId

async function readHealth(env: Env, providerId: string): Promise<HealthMap> {
  const raw = await env.KV.get(HEALTH_KEY(providerId))
  return raw ? JSON.parse(raw) : {}
}

async function writeHealth(env: Env, providerId: string, health: HealthMap): Promise<void> {
  // 只保存有失败记录的 key，避免 KV 膨胀
  const filtered: HealthMap = {}
  for (const [k, v] of Object.entries(health)) {
    if (v.failures > 0) filtered[k] = v
  }
  if (Object.keys(filtered).length > 0) {
    await env.KV.put(HEALTH_KEY(providerId), JSON.stringify(filtered))
  } else {
    // 全部健康，删除 KV 条目
    await env.KV.delete(HEALTH_KEY(providerId)).catch(() => {})
  }
}

/** 解析模型 ID，如 "deepseek/deepseek-chat" → { providerId, modelId } */
function parseModelId(model: string): { providerId: string; modelId: string } | null {
  const slashIndex = model.indexOf('/')
  if (slashIndex === -1) return null
  return {
    providerId: model.substring(0, slashIndex),
    modelId: model.substring(slashIndex + 1),
  }
}

/** 测试模型连接，发送最小请求验证 */
export async function testModelConnection(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  apiType?: 'openai' | 'anthropic'
): Promise<{ success: boolean; message: string; statusCode?: number }> {
  try {
    const cleanBase = baseUrl.replace(/\/$/, '')
    const endpoint = apiType === 'anthropic' ? 'messages' : 'chat/completions'
    const url = `${cleanBase}/${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiType === 'anthropic') {
      headers['x-api-key'] = apiKey
      headers['anthropic-version'] = '2023-06-01'
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (response.ok) {
      return { success: true, message: '连接成功', statusCode: response.status }
    }

    let errorBody = ''
    try {
      const errorData = await response.json() as { error?: { message?: string } }
      errorBody = errorData?.error?.message || JSON.stringify(errorData)
    } catch {
      errorBody = await response.text()
    }

    return {
      success: false,
      message: `HTTP ${response.status}: ${errorBody.substring(0, 200)}`,
      statusCode: response.status,
    }
  } catch (err) {
    const error = err as Error
    return {
      success: false,
      message: `连接失败: ${error.message?.substring(0, 200) || '未知错误'}`,
    }
  }
}

// ===== 模型池支持 =====

/** 按健康状态排序模型池中的模型 */
function sortPoolModels(
  models: string[],
  health: Record<string, { failures: number; lastFailedAt?: number }>
): string[] {
  const scored = models.map(fullId => {
    const h = health[fullId]
    if (!h || h.failures === 0) return { id: fullId, score: 0 }

    const failures = h.failures || 0
    const lastFailed = h.lastFailedAt || 0

    if (failures >= POOL_MODEL_MAX_FAILURES && Date.now() - lastFailed < POOL_MODEL_COOLDOWN_MS) {
      return { id: fullId, score: 100 } // 冷却中
    }
    if (failures >= POOL_MODEL_MAX_FAILURES) {
      return { id: fullId, score: 50 } // 冷却到期
    }
    return { id: fullId, score: 10 } // 有过失败
  })

  return scored.sort((a, b) => a.score - b.score).map(s => s.id)
}

/** 对单个模型尝试请求转发（使用其第一个健康 key） */
async function tryForwardModel(
  c: Context<{ Bindings: Env }>,
  provider: { baseUrl: string; apiType?: string },
  modelId: string,
  body: ProxyRequestBody,
  enabledKeys: Array<{ key: string; enabled: boolean }>
): Promise<{ success: boolean; response?: Response; error?: Response | null }> {
  const forwardBody = { ...body, model: modelId }
  const url = new URL(c.req.url)
  const subPath = url.pathname.replace(/^\/v1\//, '') || 'chat/completions'
  const cleanBase = provider.baseUrl.replace(/\/$/, '')
  const forwardUrl = `${cleanBase}/${subPath}${url.search}`

  for (const keyEntry of enabledKeys) {
    try {
      const forwardHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (provider.apiType === 'anthropic') {
        forwardHeaders['x-api-key'] = keyEntry.key
        forwardHeaders['anthropic-version'] = '2023-06-01'
      } else {
        forwardHeaders['Authorization'] = `Bearer ${keyEntry.key}`
      }

      const response = await fetch(forwardUrl, {
        method: c.req.method,
        headers: forwardHeaders,
        body: JSON.stringify(forwardBody),
        signal: AbortSignal.timeout(60000),
      })

      if (response.ok) {
        const responseHeaders: Record<string, string> = {
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
          'Cache-Control': 'no-store',
          'X-Pool-Model': modelId,
        }
        return {
          success: true,
          response: new Response(response.body, {
            status: response.status,
            headers: responseHeaders,
          }),
        }
      }

      if (response.status === 429) continue
      if (response.status === 401 || response.status === 403 || response.status >= 500) {
        continue
      }
      return { success: false, error: response }
    } catch {
      continue
    }
  }

  return { success: false, error: null }
}

/** 处理模型池请求：按健康状态轮询池内所有模型 */
async function handlePoolProxy(c: Context<{ Bindings: Env }>, pool: ModelPool, body: ProxyRequestBody) {
  const poolHealthKey = KV_KEYS.POOL_HEALTH_PREFIX + pool.id
  const raw = await c.env.KV.get(poolHealthKey)
  const poolHealth: Record<string, { failures: number; lastFailedAt?: number }> = raw ? JSON.parse(raw) : {}

  // 按健康状态排序模型：健康优先，冷却中排后
  const sortedModels = sortPoolModels(pool.models, poolHealth)

  let lastError: Response | null = null
  let lastErrorDetail = ''

  for (const fullModelId of sortedModels) {
    const parsed = parseModelId(fullModelId)
    if (!parsed) continue

    const { providerId, modelId } = parsed
    const provider = await getProvider(c.env, providerId)
    if (!provider || !provider.enabled) continue

    const modelConfig = provider.models.find(m => m.id === modelId)
    if (!modelConfig || !modelConfig.enabled) continue

    const enabledKeys = provider.apiKeys.filter(k => k.enabled)
    if (enabledKeys.length === 0) continue

    const result = await tryForwardModel(c, provider, modelId, body, enabledKeys)
    if (result.success) {
      // 成功：清除该模型的健康记录
      delete poolHealth[fullModelId]
      await c.env.KV.put(poolHealthKey, JSON.stringify(poolHealth))
      return result.response
    }

    // 失败：记录健康状态
    const h = poolHealth[fullModelId] || { failures: 0 }
    h.failures++
    h.lastFailedAt = Date.now()
    poolHealth[fullModelId] = h
    await c.env.KV.put(poolHealthKey, JSON.stringify(poolHealth))
    if (result.error) {
      lastError = result.error
      try { lastErrorDetail = await result.error.text() } catch {}
    }
  }

  // 全部失败
  return c.json({
    error: {
      message: `模型池 "${pool.id}" 中所有模型均尝试失败`,
      type: 'pool_exhausted',
      detail: lastErrorDetail.substring(0, 500),
    },
  }, 502)
}

/** 处理 /v1/chat/completions 等 API 转发 */
export async function handleProxy(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json<ProxyRequestBody>()
    const model = body.model

    if (!model) {
      return c.json({ error: { message: '缺少 model 参数', type: 'invalid_request_error' } }, 400)
    }

    // === 模型池支持：如果 model 是模型池 ID，走池代理 ===
    const pool = await getModelPool(c.env, model)
    if (pool && pool.enabled) {
      return handlePoolProxy(c, pool, body)
    }

    const parsed = parseModelId(model)
    if (!parsed) {
      return c.json({
        error: {
          message: `模型格式错误 "${model}"，请使用 提供商ID/模型ID 格式`,
          type: 'invalid_request_error',
        },
      }, 400)
    }

    const { providerId, modelId } = parsed
    const provider = await getProvider(c.env, providerId)

    if (!provider) {
      return c.json({
        error: { message: `提供商 "${providerId}" 不存在`, type: 'invalid_request_error' },
      }, 404)
    }

    if (!provider.enabled) {
      return c.json({
        error: { message: `提供商 "${provider.name}" 已禁用`, type: 'provider_disabled' },
      }, 403)
    }

    const modelConfig = provider.models.find((m) => m.id === modelId)
    if (!modelConfig) {
      return c.json({
        error: { message: `模型 "${modelId}" 未在提供商 "${provider.name}" 中配置`, type: 'invalid_request_error' },
      }, 404)
    }
    if (!modelConfig.enabled) {
      return c.json({
        error: { message: `模型 "${modelId}" 已禁用`, type: 'model_disabled' },
      }, 403)
    }

    const enabledKeys = provider.apiKeys.filter(k => k.enabled)
    const forwardBody = { ...body, model: modelId }
    const url = new URL(c.req.url)
    const subPath = url.pathname.replace(/^\/v1\//, '') || 'chat/completions'

    if (isOpenCodeProvider(providerId)) {
      const response = await proxyOpenCodeRequest({
        baseUrl: provider.baseUrl,
        apiKeys: enabledKeys,
        method: c.req.method,
        subPath,
        search: url.search,
        body: JSON.stringify(forwardBody),
        mirrorUrls: resolveOpenCodeUrls(c.env),
      })
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }

    if (enabledKeys.length === 0) {
      return c.json({
        error: { message: `提供商 "${provider.name}" 未配置可用的 API Key`, type: 'configuration_error' },
      }, 500)
    }

    const cleanBase = provider.baseUrl.replace(/\/$/, '')
    const forwardUrl = `${cleanBase}/${subPath}${url.search}`

    // 按健康状态排序 key：健康→洗牌，不健康→末尾，冷却到期→试用，连续失败3次→降权排除
    const healthData = await readHealth(c.env, providerId)
    const healthy: number[] = []
    const unhealthy: number[] = []
    const probation: number[] = []
    const demoted: number[] = []

    if (enabledKeys.length === 1) {
      // 只有一个 key，跳过健康检查，直接使用
      healthy.push(0)
    } else {
      for (let i = 0; i < enabledKeys.length; i++) {
        const h = healthData[enabledKeys[i].key]
        if (h && h.failures >= KEY_HEALTH_MAX_FAILURES) {
          // 兼容旧数据：无 demotedAt 视为现在刚降权，统一走冷却逻辑
          if (!h.demotedAt) {
            h.demotedAt = Date.now()
          }
          if (Date.now() - h.demotedAt >= KEY_HEALTH_COOLDOWN_MS) {
            probation.push(i)  // 冷却到期，进入试用组
          } else {
            demoted.push(i)    // 仍在冷却，继续保持降权
          }
        } else if (h && h.lastFailed) {
          unhealthy.push(i)
        } else {
          healthy.push(i)
        }
      }
    }

    // Fisher-Yates 洗牌（仅健康 key）
    for (let i = healthy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [healthy[i], healthy[j]] = [healthy[j], healthy[i]]
    }

    const keyOrder = [...healthy, ...unhealthy, ...probation]

    // 所有 key 都在冷却中时，降级尝试 demoted key（修复旧数据缺失 demotedAt 的死循环）
    if (keyOrder.length === 0 && demoted.length > 0) {
      keyOrder.push(...demoted)
      console.log(`[proxy] ${providerId}: all keys demoted, falling back to ${demoted.length} key(s)`)
    }

    if (demoted.length > 0 || probation.length > 0) {
      console.log(`[proxy] ${providerId}: ${demoted.length} key(s) demoted, ${probation.length} key(s) on probation (cooldown expired)`)
    }

    let lastError: Response | null = null
    let healthUpdated = false

    for (const keyIndex of keyOrder) {
      const apiKey = enabledKeys[keyIndex].key
      try {
        const forwardHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (provider.apiType === 'anthropic') {
          forwardHeaders['x-api-key'] = apiKey
          forwardHeaders['anthropic-version'] = '2023-06-01'
        } else {
          forwardHeaders['Authorization'] = `Bearer ${apiKey}`
        }

        const response = await fetch(forwardUrl, {
          method: c.req.method,
          headers: forwardHeaders,
          body: JSON.stringify(forwardBody),
          signal: AbortSignal.timeout(60000),
        })

        if (response.ok) {
          // 成功：重置健康状态
          if (healthData[apiKey]?.failures > 0) {
            delete healthData[apiKey]
            healthUpdated = true
          }
          if (healthUpdated) await writeHealth(c.env, providerId, healthData)

          const responseHeaders: Record<string, string> = {
            'Content-Type': response.headers.get('Content-Type') || 'application/json',
            'Cache-Control': 'no-store',
          }
          return new Response(response.body, {
            status: response.status,
            headers: responseHeaders,
          })
        }

        // 429 限流：跳过当前 key，不标记失败
        if (response.status === 429) {
          lastError = response
          continue
        }

        // 401/403/5xx 尝试下一个 key（标记失败）
        if (response.status === 401 || response.status === 403 || response.status >= 500) {
          const h = healthData[apiKey] || { failures: 0, lastFailed: false }
          h.failures++
          h.lastFailed = true
          if (h.failures >= KEY_HEALTH_MAX_FAILURES) {
            h.demotedAt = Date.now()  // 达到降权阈值或试用失败，重置冷却计时
          }
          healthData[apiKey] = h
          healthUpdated = true
          lastError = response
          continue
        }

        // 其他错误（400/404 等）直接返回
        const errorData = await response.json().catch(async () => ({ error: { message: await response.text() } }))
        return c.json(errorData, response.status as Parameters<typeof c.json>[1])
      } catch (err) {
        const error = err as Error
        // 网络错误也标记为失败
        const h = healthData[apiKey] || { failures: 0, lastFailed: false }
        h.failures++
        h.lastFailed = true
        if (h.failures >= KEY_HEALTH_MAX_FAILURES) {
          h.demotedAt = Date.now()  // 达到降权阈值或试用失败，重置冷却计时
        }
        healthData[apiKey] = h
        healthUpdated = true
        lastError = new Response(JSON.stringify({
          error: { message: error.message || '请求失败', type: 'proxy_error' },
        }), { status: 502 })
        continue
      }
    }

    // 写回健康状态
    if (healthUpdated) await writeHealth(c.env, providerId, healthData)

    // 所有 key 均失败
    if (lastError) {
      const errorBody = await lastError.text().catch(() => '所有 API Key 均失败')
      return c.json({
        error: {
          message: `所有 API Key 已用完，最后一次错误: HTTP ${lastError.status}`,
          type: 'key_exhausted',
          detail: errorBody.substring(0, 500),
        },
      }, (lastError.status || 502) as Parameters<typeof c.json>[1])
    }

    return c.json({
      error: { message: '没有可用的 API Key', type: 'configuration_error' },
    }, 500)
  } catch (err) {
    const error = err as Error
    return c.json({
      error: { message: error.message || '代理转发内部错误', type: 'server_error' },
    }, 500)
  }
}

/** 处理 /v1/models — 返回所有已启用的模型（含提供商前缀） */
export async function handleModels(c: Context<{ Bindings: Env }>) {
  const providers = await getProviders(c.env)
  const modelPools = await getModelPools(c.env)

  const models: Array<{
    id: string
    provider: string
    provider_name: string
    object: string
    created: number
    owned_by: string
  }> = []

  for (const provider of providers) {
    if (!provider.enabled) continue
    for (const model of provider.models) {
      if (!model.enabled) continue
      models.push({
        id: `${provider.id}/${model.id}`,
        provider: provider.id,
        provider_name: provider.name,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: provider.id,
      })
    }
  }

  // 列出模型池
  for (const pool of modelPools) {
    if (!pool.enabled) continue
    models.push({
      id: pool.id,
      provider: 'pool',
      provider_name: pool.name || pool.id,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'pool',
    })
  }

  return c.json({
    object: 'list',
    data: models,
  })
}
