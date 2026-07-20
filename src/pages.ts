import { Context } from 'hono'
import { getProviders, getProxyKeys } from './storage'
import { SITE_CONFIG } from './config'
import type { Env } from './types'
import { CSS_CONTENT } from './pages.css'
import { SHARED_JS } from './shared.js'

const H = (title: string) => `
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — ${SITE_CONFIG.title}</title>
  <link rel="icon" href="${SITE_CONFIG.favicon}">
  <link rel="stylesheet" href="${SITE_CONFIG.faCdn}">
  <style>${CSS_CONTENT}</style>
</head>`

// ===== 首页 =====

export async function renderHomePage(c: Context<{ Bindings: Env }>, isLoggedIn: boolean) {
  const providers = await getProviders(c.env)
  const host = c.req.header('host') || 'localhost:8787'

  return c.html(`<!DOCTYPE html><html lang="zh-CN">
${H('首页')}
<body>
<hd><div class="ct">
  <h1><i class="fas fa-cloud"></i>${SITE_CONFIG.title} <span class="fw-4 fs-s c-l">| ${SITE_CONFIG.subtitle}</span></h1>
  <div class="nav">
    ${isLoggedIn
      ? `<a href="/admin" class="btn btn-p"><i class="fas fa-cog"></i>管理</a><a href="/admin/logout" class="btn btn-gh"><i class="fas fa-sign-out-alt"></i>退出</a>`
      : `<a href="/admin/login" class="btn btn-p"><i class="fas fa-sign-in-alt"></i>登录</a>`
    }
  </div>
</div></hd>

<main class="ct" style="padding:24px 16px;">

  <!-- 两卡片总览行 -->
  <div class="sg" style="margin-bottom:14px;">
    <div class="card" style="flex:1;">
      <h2 class="fs-1 fw-7" style="margin-bottom:5px;"><i class="fas fa-cubes c-p"></i> 模型广场</h2>
      <p class="mu fs-77" style="margin-bottom:2px;">
        本站 API 接口：<code class="cd">https://${host}/v1</code> <i class="fas fa-copy cp copy-icon va-m" onclick='copyText("https://${host}/v1",this)'></i>
      </p>
      <p class="mu fs-77">模型名称格式：<code class="cd">提供商ID/模型ID</code></p>
    </div>
    <div class="card" style="flex:1; padding:14px; display:flex; flex-direction:column; justify-content:center;">
      <div class="fc jc-sb" style="margin-bottom:6px;">
        <span class="c-muted" style="font-size:.82rem; display:inline-flex; align-items:center;">
          <i class="fas fa-server" style="color:var(--c-text-light);font-size:.75rem;width:14px;text-align:center;margin-right:4px;"></i> 提供商总计 
          <span class="n" style="font-size:1.2rem; margin-left:4px; margin-right:20px;">${providers.length}</span>
        </span>
        
        <span class="c-muted" style="font-size:.82rem; display:inline-flex; align-items:center;">
          <i class="fas fa-check-circle" style="color:var(--c-success);font-size:.75rem;width:14px;text-align:center;margin-right:4px;"></i> 已启用 
          <span class="n" style="font-size:1.2rem; margin-left:4px;">${providers.filter(p=>p.enabled).length}</span>
        </span>
      </div>
      
      <div class="fc jc-sb">
        <span class="c-muted" style="font-size:.82rem; display:inline-flex; align-items:center;">
          <i class="fas fa-cube" style="color:var(--c-text-light);font-size:.75rem;width:14px;text-align:center;margin-right:4px;"></i> 模型总计 
          <span class="n" style="font-size:1.2rem; margin-left:4px; margin-right:21px;">${providers.reduce((s,p)=>s+p.models.length,0)}</span>
        </span>
        
        <span class="c-muted" style="font-size:.82rem; display:inline-flex; align-items:center;">
          <i class="fas fa-check-circle" style="color:var(--c-success);font-size:.75rem;width:14px;text-align:center;margin-right:4px;"></i> 已启用 
          <span class="n" style="font-size:1.2rem; margin-left:4px;">${providers.filter(p=>p.enabled).reduce((s,p)=>s+p.models.filter(m=>m.enabled).length,0)}</span>
        </span>
      </div>
    </div>
  </div>

  <div class="g2">
    ${providers.filter(p=>p.enabled).map(p=>`
      <div class="card p-14">
        <div class="fc jc-sb" style="margin-bottom:8px;display: flex; justify-content: space-between;">
          <h3 style="font-size:.9rem;font-weight:600;">
            <i class="fas fa-server c-p" style="margin-right:5px;"></i>${p.name} 
            <span class="c-muted fw-4 fs-65" style="padding:1px 5px;border-radius:4px;border:1px solid var(--c-border-dark);vertical-align:middle;">${(p.apiType||'openai')==='anthropic'?'Anthropic':'OpenAI'}</span>
          </h3>
          <span class="bd ${p.enabled?'bd-on':'bd-off'}">${p.enabled?'已启用':'未启用'}</span>
        </div>
        ${p.models.filter(m=>m.enabled).length
          ? `<div class="mw">${p.models.filter(m=>m.enabled).map(m=>`<span class="tag" onclick='copyText("${p.id}/${m.id}",this)'><i class="fas fa-cube"></i>${p.id}/${m.id}</span>`).join('')}</div>`
          : `<p class="mu fs-i" style="margin-top:5px;">暂无启用的模型</p>`
        }
      </div>
    `).join('')}
  </div>
</main>

<footer>
  <div class="ct">&copy; ${new Date().getFullYear()} 
    <a href="${SITE_CONFIG.authorUrl}" target="_blank">${SITE_CONFIG.title}</a> by 
    <a href="${SITE_CONFIG.blogUrl}" target="_blank">${SITE_CONFIG.author}</a>
  </div>
</footer>

<script>
function copyText(t, el) {
  const ic = el.tagName === 'I' ? el : el.querySelector('i')
  const oc = ic.className
  const os = ic.style.color
  navigator.clipboard.writeText(t).then(() => {
    ic.className = 'fas fa-check'
    ic.style.color = '#16a34a'
    setTimeout(() => {
      ic.className = oc
      ic.style.color = os
    }, 3000)
  }).catch(() => {})
}

</script>
</body></html>`)
		}

export async function renderLoginPage(c: Context<{ Bindings: Env }>) {
    return c.html(`<!DOCTYPE html><html lang="zh-CN">
${H('登录')}
<body>
<hd><div class="ct">
  <h1><i class="fas fa-cloud"></i>${SITE_CONFIG.title}</h1>
  <div class="nav"><a href="/" class="btn btn-gh"><i class="fas fa-home"></i>首页</a></div>
</div></hd>
<div class="login-wrapper">
  <div class="card login-card">
    <h2 class="tc fs-1 mb-3"><i class="fas fa-lock c-p"></i> 管理员登录</h2>
    <p class="tc mu mb-2">账号由 Cloudflare 环境变量配置</p>
    <div id="er" class="al al-e hd mb-2"><i class="fas fa-exclamation-circle"></i><span id="em"></span></div>
    <div class="fg m-16-0"><label><i class="fas fa-user"></i> 用户名</label><input type="text" class="input-mt-6" id="u" placeholder="请输入用户名"></div>
    <div class="fg m-16-0"><label><i class="fas fa-lock"></i> 密码</label><input type="password" class="input-mt-6" id="p" placeholder="请输入密码" onkeydown="if(event.key==='Enter')l()"></div>
    <button class="btn btn-p fw jc-c" style="padding:7px;" onclick="l()"><i class="fas fa-sign-in-alt"></i> 登录</button>
  </div>
</div>
<script>
async function l() {
  const u = document.getElementById('u').value.trim(), p = document.getElementById('p').value
  const er = document.getElementById('er'), em = document.getElementById('em')
  if (!u || !p) { em.textContent = '请填写用户名和密码'; er.classList.remove('hd'); return }
  try {
    const r = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    })
    const d = await r.json()
    if (d.success) window.location.href = '/admin'
    else { em.textContent = d.message || '登录失败'; er.classList.remove('hd') }
  } catch (e) { em.textContent = '网络错误'; er.classList.remove('hd') }
}
</script>
</body></html>`)
	}

// ===== 管理后台 =====

export async function renderAdminPage(c: Context<{ Bindings: Env }>) {
  const providers = await getProviders(c.env)
  const proxyKeys = await getProxyKeys(c.env)

  return c.html(`<!DOCTYPE html><html lang="zh-CN">
${H('管理')}
<body>
<hd><div class="ct">
  <h1><i class="fas fa-cloud"></i>${SITE_CONFIG.title}<span class="c-l" style="font-size:14px;font-weight:normal;margin-left:5px;">| 统一的 AI 管理平台</span></h1>
  <div class="nav"><a href="/" class="btn btn-gh"><i class="fas fa-home"></i>首页</a><a href="/admin/logout" class="btn btn-gh"><i class="fas fa-sign-out-alt"></i>退出</a></div>
</div></hd>

<main class="ct" style="padding:14px 16px;">
<div id="toast" class="hd toast"></div>

<!-- 提供商 -->
<div class="card" style="margin-top:10px;">
  <div class="card-hd">
    <h2><i class="fas fa-server"></i>提供商</h2>
    <button class="btn btn-p btn-xs" onclick="showAdd()"><i class="fas fa-plus"></i> 添加</button>
  </div>

  <!-- 添加表单 -->
  <div class="af-w">
	  <div id="af" class="hd add-form-panel">
    <h3 class="fs-88 mb-10"><i class="fas fa-plus-circle c-p"></i> 添加新提供商</h3>
    <div class="fr">
      <div class="fg"><label>名称</label><input type="text" id="anm" placeholder="DeepSeek"></div>
      <div class="fg"><label>ID</label><input type="text" id="aid" placeholder="deepseek"></div>
    </div>
    <div class="fg"><label>API 地址</label><input type="url" id="aurl" placeholder="https://api.deepseek.com"></div>
    <div class="fg">
      <label>API 格式</label>
      <select id="afmt" class="select-sm">
        <option value="openai">OpenAI 兼容</option>
        <option value="anthropic">Anthropic 兼容</option>
      </select>
    </div>
    <div class="fg"><label>API Keys</label>
      <div id="akeys">
        <div class="fc mb-4"><input type="text" placeholder="sk-xxx" class="fx1 aki">
          <label class="tg"><input type="checkbox" checked class="ake"><span class="sl"></span></label>
          <button class="btn btn-gh btn-xs" onclick="testNewAKey(this)" title="测试"><i class="fas fa-plug"></i></button>
          <button class="btn btn-gh btn-xs" onclick="this.parentElement.remove()"><i class="fas fa-times c-l"></i></button>
        </div>
      </div>
      <button class="btn btn-gh btn-xs" onclick="addAKeyRow()"><i class="fas fa-plus"></i> 添加 Key</button>
    </div>
    <div class="fg"><label>模型 ID <span class="mu">（支持多个）</span></label>
      <div id="amodels">
        <div class="fc mb-4"><input type="text" placeholder="deepseek-chat" class="fx1 ami">
          <label class="tg"><input type="checkbox" checked class="ame"><span class="sl"></span></label>
          <button class="btn btn-gh btn-xs" onclick="testNewMdl(this)" title="测试"><i class="fas fa-plug"></i></button>
          <button class="btn btn-gh btn-xs" onclick="this.parentElement.remove()"><i class="fas fa-times c-l"></i></button>
        </div>
      </div>
      <button class="btn btn-gh btn-xs" onclick="addMdlRow()"><i class="fas fa-plus"></i> 添加模型</button>
    </div>
    <div class="fc mt-8 gap-8">
      <label class="tg"><input type="checkbox" checked id="aen"><span class="sl"></span></label>
      <span class="mu">启用</span>
      <span class="fx1"></span>
      <button class="btn btn-g btn-xs" onclick="createProv()"><i class="fas fa-check"></i> 创建</button>
      <button class="btn btn-gh btn-xs" onclick="hideAdd()">取消</button>
    </div>
    <div id="atestR" class="mt-1"></div>
  </div>
  <div id="amc" class="hd mdl-list-panel">
    <h3 class="fs-88 mb-10"><i class="fas fa-cube c-p"></i> 可用模型</h3>
    <div id="amcl"></div>
  </div>
  </div>

  <!-- 列表 -->
  <div class="gp" id="plist">
    ${providers.map(p=>`
    <div class="pi" data-id="${p.id}">
      <div class="ps" onclick="tog('${p.id}')">
        <div class="l">
          <i class="fas fa-chevron-right c-l fs-65" style="transition:transform .12s;" id="ch-${p.id}"></i>
          <div><h3>${p.name}</h3>
            <div class="pu"><i class="fas fa-link"></i>
              <span class="ov">${p.baseUrl}</span>
              <i class="fas fa-copy cp" onclick="event.stopPropagation();copyText('${p.baseUrl}',this)"></i>
            </div>
          </div>
        </div>
        <div class="fc fx-s0">
          <label class="tg" onclick="event.stopPropagation()">
            <input type="checkbox" ${p.enabled?'checked':''} id="en-${p.id}" onchange="togglePb('${p.id}',this.checked)">
            <span class="sl"></span>
          </label>
          <span class="bd ${p.enabled?'bd-on':'bd-off'}">${p.enabled?'已启用':'未启用'}</span>
        </div>
      </div>
      <div class="pd" id="dt-${p.id}">
        <div class="fr">
          <div class="fg"><label>名称</label><input type="text" id="nm-${p.id}" value="${p.name}"></div>
          <div class="fg">
            <label>ID</label><input type="text" value="${p.id}" disabled style="background:var(--c-bg-alt);">
          </div>
        </div>
        <div class="fg"><label>API 地址</label><input type="url" id="url-${p.id}" value="${p.baseUrl}"></div>
        <div class="fg"><label>API 格式</label>
          <select id="at-${p.id}" class="select-sm">
            <option value="openai" ${(p.apiType||'openai')==='openai'?'selected':''}>OpenAI 兼容</option>
            <option value="anthropic" ${p.apiType==='anthropic'?'selected':''}>Anthropic 兼容</option>
          </select>
        </div>
        <div class="fg"><label>API Keys</label>
          <div id="keys-${p.id}">${p.apiKeys.map((k, ki)=>`
            <div class="fc mb-3" data-kidx="${ki}">
              <input type="text" value="${k.key}" class="fx1" id="k-${p.id}-${ki}" placeholder="API Key">
              <label class="tg"><input type="checkbox" ${k.enabled?'checked':''} id="ken-${p.id}-${ki}"><span class="sl"></span></label>
              <button class="btn btn-gh btn-xs" onclick="testKeyRow('${p.id}',${ki})" title="测试"><i class="fas fa-plug"></i></button>
              <button class="btn btn-gh btn-xs" onclick="rmKeyRow('${p.id}',${ki})"><i class="fas fa-times c-l"></i></button>
            </div>`).join('')}
          </div>
          <div class="fc mt-1">
            <input type="text" id="nk-${p.id}" placeholder="API Key" class="fx1">
            <button class="btn btn-gh btn-xs" onclick="addKeyRow('${p.id}')"><i class="fas fa-plus"></i> 添加</button>
          </div>
        </div>
        <div class="fg">
          <label>模型</label>
          <div id="ml-${p.id}">${p.models.map((m,mi)=>`
            <div class="fc mb-3" data-idx="${mi}">
              <input type="text" value="${m.id}" class="fx1" id="mid-${p.id}-${mi}" placeholder="模型 ID">
              <label class="tg"><input type="checkbox" ${m.enabled?'checked':''} id="men-${p.id}-${mi}"><span class="sl"></span></label>
              <button class="btn btn-gh btn-xs" onclick="testMdl('${p.id}','${m.id}',${mi})" title="测试"><i class="fas fa-plug"></i></button>
              <button class="btn btn-gh btn-xs" onclick="rmMdl('${p.id}',${mi})"><i class="fas fa-times c-l"></i></button>
            </div>`).join('')}
          </div>
          <div class="fc mt-1">
            <input type="text" id="nmid-${p.id}" placeholder="模型 ID" class="fx1">
            <button class="btn btn-gh btn-xs" onclick="addMdl('${p.id}')"><i class="fas fa-plus"></i> 添加</button></div>
        </div>
        <div class="fc gap-8 mt-2">
          <span class="fx1"></span>
          <button class="btn btn-g btn-xs" onclick="save('${p.id}')"><i class="fas fa-save"></i> 保存</button>
          <button class="btn btn-d btn-xs" onclick="del('${p.id}')"><i class="fas fa-trash"></i> 删除</button>
        </div>
        <div id="tr-${p.id}" class="mt-1"></div>
      </div>
    </div>`).join('')}
  </div>
</div>

<!-- 转发 Key -->
<div class="card">
  <div class="card-hd">
    <h2><i class="fas fa-key"></i>API Key 列表</h2>
    <button class="btn btn-p btn-xs" onclick="genKey()"><i class="fas fa-plus"></i> 生成</button>
  </div>
  ${proxyKeys.length===0?'<p class="mu fs-i">暂无转发 Key</p>':''}
  ${proxyKeys.map(k=>`
    <div class="ki" data-id="${k.id}">
      <div>
        <div class="kv"><i class="fas fa-key c-p w12"></i> 
          <span id="kv-${k.id}" data-full="${k.key}">${k.key.length>12?k.key.substring(0,8)+'****'+k.key.substring(k.key.length-4):k.key}</span> 
          <i class="fas fa-eye cp" onclick="toggleKeyVis('${k.id}')" title="显示/隐藏"></i> 
          <i class="fas fa-copy cp" onclick='copyText("${k.key}",this)'></i>
        </div>
        <div class="mu" style="font-size:.72rem;">${k.name} · 创建日期：${new Date(k.createdAt).toLocaleDateString()} · 有效截止：${k.expiresAt?new Date(k.expiresAt).toLocaleDateString():'永久'}</div>
      </div>
      <div class="fc"><label class="tg">
        <input type="checkbox" ${k.enabled?'checked':''} onchange="toggleProxyKey('${k.id}',this.checked)">
        <span class="sl"></span></label><span class="bd ${k.enabled?'bd-on':'bd-off'}">${k.enabled?'已启用':'已禁用'}</span>
        <button class="btn btn-gh btn-xs" onclick="rmKey('${k.id}')"><i class="fas fa-trash c-l"></i></button>
      </div>
    </div>`).join('')}
</div>
</main>

<div id="modal" class="modal-o hd" onclick="if(event.target===this)closeM()">
  <div class="modal" id="mc"></div>
</div>

<footer>
  <div class="ct">&copy; ${new Date().getFullYear()} 
    <a href="${SITE_CONFIG.authorUrl}" target="_blank">${SITE_CONFIG.title}</a> by 
    <a href="${SITE_CONFIG.blogUrl}" target="_blank">${SITE_CONFIG.author}</a>
  </div>
</footer>

<script>${SHARED_JS}
// copy
function copyText(t, el) {
  const i = el.tagName === 'I' ? el : (el.querySelector('i') || el.parentElement?.querySelector('i'))
  if (!i) { navigator.clipboard.writeText(t).catch(() => {}); return }
  const oc = i.className
  const os = i.style.color
  navigator.clipboard.writeText(t).then(() => {
    i.className = 'fas fa-check'
    i.style.color = '#16a34a'
    setTimeout(() => {
      i.className = oc
      i.style.color = os
    }, 3000)
  }).catch(() => {})
}

// modal
function showM(h) { document.getElementById('mc').innerHTML = h; document.getElementById('modal').classList.remove('hd') }
function closeM() { document.getElementById('modal').classList.add('hd') }
function cM(msg) {
  return new Promise(r => {
    showM('<h3><i class="fas fa-question-circle c-p"></i> 确认</h3><p>' + msg + '</p><div class="fa"><button class="btn btn-s" onclick="closeM();r(false)">取消</button><button class="btn btn-p" onclick="closeM();r(true)">确定</button></div>')
    window.r = r
  })
}
function pM(msg, def) {
  return new Promise(r => {
    showM('<h3><i class="fas fa-pen c-p"></i> ' + msg + '</h3><div class="fg"><input type="text" id="pv" value="' + (def || '') + '" placeholder="请输入"></div><div class="fa"><button class="btn btn-s" id="pMc">取消</button><button class="btn btn-p" id="pMo">确定</button></div>')
    window.r = r
    const inp = document.getElementById('pv')
    if (inp) {
      inp.focus()
      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { closeM(); r(inp.value.trim()) }
      })
    }
    document.getElementById('pMc').addEventListener('click', function() { closeM(); r(null) })
    document.getElementById('pMo').addEventListener('click', function() { closeM(); r(inp.value.trim()) })
  })
}
function aM(msg, t) {
  const i = t === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'
  const c = t === 'success' ? '#16a34a' : '#dc2626'
  showM('<h3><i class="fas ' + i + '" style="color:' + c + ';"></i> ' + (t === 'success' ? '成功' : '提示') + '</h3><p>' + msg + '</p><div class="fa"><button class="btn btn-p" onclick="closeM()">确定</button></div>')
}

function toast(msg, t) {
  const el = document.getElementById('toast')
  const i = t === 'success' ? 'fa-check-circle' : 'fa-times-circle'
  const bg = t === 'success' ? '#f0fdf4' : '#fef2f2'
  const c = t === 'success' ? '#166534' : '#991b1b'
  el.innerHTML = '<div class="al" style="background:' + bg + ';color:' + c + ';"><i class="fas ' + i + '"></i> ' + msg + '</div>'
  el.classList.remove('hd')
  setTimeout(() => el.classList.add('hd'), 3000)
}

// providers
function tog(id) {
  const d = document.getElementById('dt-' + id), c = document.getElementById('ch-' + id)
  d.classList.toggle('open')
  c.style.transform = d.classList.contains('open') ? 'rotate(90deg)' : ''
}

function showAdd() { document.getElementById('af').classList.remove('hd') }
function hideAdd() { document.getElementById('af').classList.add('hd'); document.getElementById('amc').classList.add('hd') }

// provider api keys (add form)
function addAKeyRow() {
  const c = document.getElementById('akeys')
  const d = document.createElement('div')
  d.className = 'fc mb-4'
  d.innerHTML = '<input type="text" placeholder="sk-xxx" class="fx1 aki"><label class="tg"><input type="checkbox" checked class="ake"><span class="sl"></span></label><button class="btn btn-gh btn-xs" onclick="testNewAKey(this)" title="测试"><i class="fas fa-plug"></i></button><button class="btn btn-gh btn-xs" onclick="this.parentElement.remove()"><i class="fas fa-times c-l"></i></button>'
  c.appendChild(d)
}

function renderModelGrid(models, editId, providerId) {
  if (providerId === 'opencode') {
    models = (models || []).filter(function(m) {
      return m && typeof m.id === 'string' && /^[A-Za-z0-9._:/-]+$/.test(m.id) && (m.id === 'big-pickle' || m.id.endsWith('-free'))
    })
  }
  if (!models || models.length === 0) return '<span class="mu">未返回模型列表</span>'
  var h = models.map(function(m) {
    var modelId = String(m.id || '')
    var safeId = escapeHtml(modelId)
    var addFn = editId
      ? "addMdlToEdit('" + modelId + "','" + editId + "')"
      : "addMdlToForm('" + modelId + "')"
    return '<div class="mdl-item">' +
      '<i class="fas fa-cube"></i>' +
			'<span class="fx1 cp ov" onclick="copyText(\\'' + modelId + '\\',this)">' + safeId + '</span>' +
      '<button class="btn btn-gh btn-xs mdl-add-btn" onclick="' + addFn + '" title="添加到表单">+</button></div>'
  }).join('')
  return '<div class="grid-2-gap6">' + h + '</div>'
}

function testNewAKey(btn) {
  const inp = btn.parentElement.querySelector('.aki'), k = inp.value.trim()
  if (!k) { toast('请输入 API Key', 'error'); return }
  const url = document.getElementById('aurl').value.trim()
  if (!url) { toast('请先填写 API 地址', 'error'); return }
  const apiType = document.getElementById('afmt').value
  const tr = document.getElementById('atestR')
  showSpinner(tr)
    const providerId = document.getElementById('aid').value.trim()
    testKeyConnection(url, apiType, k, providerId).then(function(result) {
      if (result.success && result.data) {
        document.getElementById('amcl').innerHTML = renderModelGrid(result.data.data || [], null, providerId)
      document.getElementById('amc').classList.remove('hd')
    } else {
      document.getElementById('amc').classList.add('hd')
    }
    showResult(tr, result.success, result.success ? '' : 'HTTP ' + result.status)
  })
}

let mdlCount = 1
function addMdlRow() {
  const c = document.getElementById('amodels')
  const d = document.createElement('div')
  d.className = 'fc mb-4'
  d.innerHTML = '<input type="text" placeholder="deepseek-chat" class="fx1 ami"><label class="tg"><input type="checkbox" checked class="ame"><span class="sl"></span></label><button class="btn btn-gh btn-xs" onclick="testNewMdl(this)"><i class="fas fa-plug"></i></button><button class="btn btn-gh btn-xs" onclick="this.parentElement.remove()"><i class="fas fa-times c-l"></i></button>'
  c.appendChild(d)
}

function addMdlToForm(mid) {
  const c = document.getElementById('amodels')
  const d = document.createElement('div')
  d.className = 'fc mb-4'
  d.innerHTML = '<input type="text" value="' + escapeHtml(mid) + '" class="fx1 ami"><label class="tg"><input type="checkbox" checked class="ame"><span class="sl"></span></label><button class="btn btn-gh btn-xs" onclick="testNewMdl(this)"><i class="fas fa-plug"></i></button><button class="btn btn-gh btn-xs" onclick="this.parentElement.remove()"><i class="fas fa-times c-l"></i></button>'
  c.appendChild(d)
}

function testNewMdl(btn) {
  const inp = btn.parentElement.querySelector('.ami'), mid = inp.value.trim()
  if (!mid) { toast('请输入模型 ID', 'error'); return }
  const url = document.getElementById('aurl').value.trim()
    const akeys = document.querySelectorAll('#akeys .aki')
    const configuredKey = Array.from(akeys).map(function(inp) { return inp.value.trim() }).filter(Boolean)[0] || ''
    const apiType = document.getElementById('afmt').value
    const tr = document.getElementById('atestR')
    showSpinner(tr)
  const providerId = document.getElementById('aid').value.trim()
  const apiKey = configuredKey || (providerId === 'opencode' ? '' : 'dummy')
  testModelConnection(url, apiType, apiKey, mid, providerId).then(function(result) {
    showResult(tr, result.success, result.success ? '' : 'HTTP ' + result.status)
  })
}

async function createProv() {
  const nm = document.getElementById('anm').value.trim(), id = document.getElementById('aid').value.trim()
  const url = document.getElementById('aurl').value.trim(), apiType = document.getElementById('afmt').value
  const aki = document.querySelectorAll('#akeys .aki')
  const keys = Array.from(aki).map((inp, i) => {
    const k = inp.value.trim()
    const en = inp.parentElement.querySelector('.ake')?.checked ?? true
    return k ? { key: k, enabled: en } : null
  }).filter(Boolean)
  const ami = document.querySelectorAll('#amodels .ami')
  const models = Array.from(ami).map(inp => {
    const mid = inp.value.trim()
    const en = inp.parentElement.querySelector('.ame')?.checked ?? true
    return mid ? { id: mid, enabled: en } : null
  }).filter(Boolean)
  const enabled = document.getElementById('aen').checked
  if (!nm || !id || !url) { toast('请填写名称、ID 和 API 地址', 'error'); return }
  const r = await fetch('/admin/api/providers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name: nm, baseUrl: url, apiType, apiKeys: keys, models, enabled })
  })
  const d = await r.json()
  if (d.success) { toast('已创建', 'success'); location.reload() }
  else toast(d.message || '创建失败', 'error')
}

// provider api keys (edit)
function getKeys(id) {
  const c = document.getElementById('keys-' + id)
  const items = c.querySelectorAll('[data-kidx]')
  return Array.from(items).map(item => {
    const idx = parseInt(item.dataset.kidx)
    const k = document.getElementById('k-' + id + '-' + idx).value.trim()
    const en = document.getElementById('ken-' + id + '-' + idx).checked
    return k ? { key: k, enabled: en } : null
  }).filter(Boolean)
}

function addKeyRow(id) {
  const inp = document.getElementById('nk-' + id), k = inp.value.trim()
  if (!k) { toast('请输入 API Key', 'error'); return }
  const c = document.getElementById('keys-' + id), cnt = c.querySelectorAll('[data-kidx]').length
  const d = document.createElement('div')
  d.className = 'fc mb-3'
  d.dataset.kidx = cnt
  d.innerHTML = '<input type="text" value="' + k + '" class="fx1" id="k-' + id + '-' + cnt + '" placeholder="API Key"><label class="tg"><input type="checkbox" checked id="ken-' + id + '-' + cnt + '"><span class="sl"></span></label><button class="btn btn-gh btn-xs" onclick="testKeyRow(\\'' + id + '\\',' + cnt + ')" title="测试"><i class="fas fa-plug"></i></button><button class="btn btn-gh btn-xs" onclick="rmKeyRow(\\'' + id + '\\',' + cnt + ')"><i class="fas fa-times c-l"></i></button>'
  c.appendChild(d)
  inp.value = ''
  inp.focus()
}

function rmKeyRow(id, idx) {
  const c = document.getElementById('keys-' + id)
  c.querySelectorAll('[data-kidx]').forEach(item => {
    if (parseInt(item.dataset.kidx) === idx) item.remove()
  })
}

async function testKeyRow(id, idx) {
  const k = document.getElementById('k-' + id + '-' + idx).value.trim()
  const url = document.getElementById('url-' + id).value.trim()
  if (!k) { toast('请输入 API Key', 'error'); return }
  const apiType = document.getElementById('at-' + id).value
  const tr = document.getElementById('tr-' + id)
  showSpinner(tr)
  const result = await testKeyConnection(url, apiType, k, id)
  showResult(tr, result.success, result.success ? '' : 'HTTP ' + result.status)
  if (result.success && result.data) {
    showEditModelsList(id, result.data.data || [])
  }
}

function showEditModelsList(id, models) {
  const cid = 'mel-' + id
  let el = document.getElementById(cid)
  if (!el) {
    el = document.createElement('div')
    el.id = cid
    el.className = 'fg'
    const pd = document.getElementById('dt-' + id)
    const sections = pd.querySelectorAll('.fg')
    for (var i = 0; i < sections.length; i++) {
      var lbl = sections[i].querySelector('label')
      if (lbl && lbl.textContent === '模型') {
        pd.insertBefore(el, sections[i])
        break
      }
    }
  }
  el.innerHTML = '<label>可用模型 <span class="mu">（点击 + 添加到下方）</span></label>' + renderModelGrid(models, id, id)
}

function addMdlToEdit(id, mid) {
  document.getElementById('nmid-' + id).value = mid
  addMdl(id)
}

function getMdl(id) {
  const c = document.getElementById('ml-' + id), items = c.querySelectorAll('[data-idx]')
  return Array.from(items).map(item => {
    const idx = parseInt(item.dataset.idx), mid = document.getElementById('mid-' + id + '-' + idx).value.trim()
    const en = document.getElementById('men-' + id + '-' + idx).checked
    return mid ? { id: mid, enabled: en } : null
  }).filter(Boolean)
}

async function save(id) {
  const nm = document.getElementById('nm-' + id).value.trim(), url = document.getElementById('url-' + id).value.trim()
  const apiType = document.getElementById('at-' + id).value
  const keys = getKeys(id)
  const models = getMdl(id), enabled = document.getElementById('en-' + id).checked
  const r = await fetch('/admin/api/providers/' + encodeURIComponent(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nm, baseUrl: url, apiType, apiKeys: keys, models, enabled })
  })
  const d = await r.json()
  if (d.success) { toast('已保存', 'success'); location.reload() }
  else toast(d.message || '保存失败', 'error')
}

async function del(id) {
  if (!(await cM('确定要删除此提供商？'))) return
  const r = await fetch('/admin/api/providers/' + encodeURIComponent(id), { method: 'DELETE' })
  const d = await r.json()
  if (d.success) { toast('已删除', 'success'); location.reload() }
  else toast(d.message || '删除失败', 'error')
}

function addMdl(id) {
  const inp = document.getElementById('nmid-' + id), mid = inp.value.trim()
  if (!mid) { toast('请输入模型 ID', 'error'); return }
  const c = document.getElementById('ml-' + id), cnt = c.querySelectorAll('[data-idx]').length
  const d = document.createElement('div')
  d.className = 'fc mb-3'
  d.dataset.idx = cnt
  d.innerHTML = '<input type="text" value="' + escapeHtml(mid) + '" class="fx1" id="mid-' + escapeHtml(id) + '-' + cnt + '" placeholder="模型 ID"><label class="tg"><input type="checkbox" checked id="men-' + escapeHtml(id) + '-' + cnt + '"><span class="sl"></span></label><button class="btn btn-gh btn-xs" id="tm-' + escapeHtml(id) + '-' + cnt + '"><i class="fas fa-plug"></i></button><button class="btn btn-gh btn-xs" id="rm-' + escapeHtml(id) + '-' + cnt + '"><i class="fas fa-times c-l"></i></button>'
  c.appendChild(d)
  document.getElementById('tm-' + id + '-' + cnt).addEventListener('click', function() { testMdl(id, mid, cnt) })
  document.getElementById('rm-' + id + '-' + cnt).addEventListener('click', function() { rmMdl(id, cnt) })
  inp.value = ''
}

function rmMdl(id, idx) {
  const c = document.getElementById('ml-' + id)
  c.querySelectorAll('[data-idx]').forEach(item => {
    if (parseInt(item.dataset.idx) === idx) item.remove()
  })
}

async function testMdl(id, mid, idx) {
  const tr = document.getElementById('tr-' + id)
  showSpinner(tr)
  try {
    const r = await fetch('/admin/api/providers/' + encodeURIComponent(id) + '/test-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId: mid })
    })
    const d = await r.json()
    if (d.success && d.data) {
      showResult(tr, d.data.success, d.data.success ? '' : (d.data.message || '连接失败'))
    } else {
      showResult(tr, false, d.message || '测试失败')
    }
  } catch (e) { showResult(tr, false, '请求失败') }
}

// proxy keys
async function genKey() {
  const name = await pM('输入 Key 名称（可选）')
  if (name === null) return
  showM('<h3><i class="fas fa-key c-p"></i> 生成转发 Key</h3><div class="fg"><label>有效期</label><select id="exp"><option value="30d">30 天</option><option value="90d">90 天</option><option value="180d">180 天</option><option value="1y">1 年</option><option value="forever" selected>永久</option></select></div><div class="fa"><button class="btn btn-s" id="gKc">取消</button><button class="btn btn-p" id="gKo">生成</button></div>')
  document.getElementById('gKc').addEventListener('click', closeM)
  document.getElementById('gKo').addEventListener('click', function() { doGenKey(document.getElementById('exp').value, name) })
}

async function doGenKey(exp, name) {
  closeM()
  const nm = name || ''
  const r = await fetch('/admin/api/proxy-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nm, expiresIn: exp })
  })
  const d = await r.json()
  if (d.success && d.data) {
    showM('<h3><i class="fas fa-check-circle c-s"></i> 生成成功</h3><p>请妥善保存，切勿泄露：</p><div class="mk">' + d.data.key + '</div><div class="fa"><button class="btn btn-p" onclick="closeM();location.reload()">关闭</button></div>')
  } else toast(d.message || '生成失败', 'error')
}

async function rmKey(id) {
  if (!(await cM('确定要删除此 Key？'))) return
  const r = await fetch('/admin/api/proxy-keys/' + encodeURIComponent(id), { method: 'DELETE' })
  const d = await r.json()
  if (d.success) { toast('已删除', 'success'); location.reload() }
  else toast(d.message || '删除失败', 'error')
}

// proxy key list interactions
async function togglePb(id, checked) {
  const pi = document.querySelector('.pi[data-id="' + id + '"]')
  if (!pi) return
  const b = pi.querySelector('.ps .bd')
  if (b) { b.textContent = checked ? '已启用' : '未启用'; b.className = 'bd ' + (checked ? 'bd-on' : 'bd-off') }
  const r = await fetch('/admin/api/providers/' + encodeURIComponent(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: checked })
  })
  const d = await r.json()
  if (!d.success) toast(d.message || '操作失败', 'error')
}

function toggleKeyVis(id) {
  const el = document.getElementById('kv-' + id)
  const full = el.dataset.full
  if (el.textContent.includes('****')) {
    el.textContent = full
  } else {
    el.textContent = full.length > 12
      ? full.substring(0, 8) + '****' + full.substring(full.length - 4)
      : full
  }
}

async function toggleProxyKey(id, checked) {
  const r = await fetch('/admin/api/proxy-keys/' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: checked })
  })
  const d = await r.json()
  if (d.success) {
    const ki = document.querySelector('.ki[data-id="' + id + '"]')
    if (ki) {
      const b = ki.querySelector('.fc .bd')
      if (b) { b.textContent = checked ? '已启用' : '已禁用'; b.className = 'bd ' + (checked ? 'bd-on' : 'bd-off') }
    }
  } else toast(d.message || '操作失败', 'error')
}
</script>
</body></html>`)
}