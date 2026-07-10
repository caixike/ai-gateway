export const CSS_CONTENT = `
:root {
  --c-primary: #4f6ef7;
  --c-primary-hover: #3b5de7;
  --c-primary-glow: rgba(79,110,247,.12);
  --c-text: #1f2937;
  --c-text-dark: #111827;
  --c-text-secondary: #4b5563;
  --c-text-muted: #6b7280;
  --c-text-light: #9ca3af;
  --c-bg: #f0f2f5;
  --c-bg-white: #fff;
  --c-bg-light: #f3f4f6;
  --c-bg-alt: #fafbfc;
  --c-border: #e5e7eb;
  --c-border-dark: #d1d5db;
  --c-success: #16a34a;
  --c-success-bg: #f0fdf4;
  --c-success-text: #166534;
  --c-danger: #dc2626;
  --c-danger-bg: #fef2f2;
  --c-danger-text: #991b1b;
  --c-info-bg: #eef2ff;
  --c-info-text: #3730a3;
  --c-overlay: rgba(0,0,0,.35);
  --c-header-bg: rgba(255,255,255,.93);
  --c-shadow-light: rgba(0,0,0,.05);
  --c-shadow: rgba(0,0,0,.15);
}

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  background: var(--c-bg);
  color: var(--c-text);
  line-height: 1.5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.ct {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  width: 100%;
}

hd {
  background: var(--c-header-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--c-border);
  padding: 12px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  display: block;
}

hd .ct {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

hd h1 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--c-text-dark);
}

hd h1 i {
  color: var(--c-primary);
  margin-right: 6px;
}

hd .nav {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: .8rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all .12s;
  text-decoration: none;
  white-space: nowrap;
}

.btn-p { background: var(--c-primary); color: var(--c-bg-white); }
.btn-p:hover { background: var(--c-primary-hover); }

.btn-s { background: var(--c-bg-light); color: var(--c-text-secondary); }
.btn-s:hover { background: var(--c-border); }

.btn-d { background: var(--c-danger-bg); color: var(--c-danger); }
.btn-d:hover { background: #fee2e2; }

.btn-g { background: var(--c-success-bg); color: var(--c-success); }
.btn-g:hover { background: #dcfce7; }

.btn-gh { background: transparent; color: var(--c-text-light); padding: 4px 8px; }
.btn-gh:hover { background: var(--c-bg-light); }

.btn-xs { padding: 3px 8px; font-size: .75rem; }

.card {
  background: var(--c-bg-white);
  border-radius: 10px;
  box-shadow: 0 1px 3px var(--c-shadow-light);
  padding: 20px;
  margin-bottom: 14px;
  border: 1px solid var(--c-border);
}

.card-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--c-bg-light);
}

.card-hd h2 {
  font-size: .95rem;
  font-weight: 600;
  color: var(--c-text-dark);
}

.card-hd h2 i {
  color: var(--c-primary);
  margin-right: 6px;
  width: 16px;
  text-align: center;
}

footer {
  display: block;
  margin-top: auto;
  background: var(--c-bg-white);
  border-top: 1px solid var(--c-border);
  padding: 14px 0;
  text-align: center;
  color: var(--c-text-light);
  font-size: .8rem;
}

footer a { color: inherit; text-decoration: none; }
footer a:hover { text-decoration: underline; }

input,
textarea,
select {
  width: 100%;
  padding: 6px 9px;
  border: 1px solid var(--c-border-dark);
  border-radius: 5px;
  font-size: .84rem;
  transition: border-color .12s;
  outline: none;
  font-family: inherit;
  background: var(--c-bg-white);
}

input:focus,
textarea:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 2px var(--c-primary-glow);
}

textarea {
  resize: vertical;
  min-height: 44px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: .78rem;
}

label {
  display: block;
  font-size: .75rem;
  font-weight: 600;
  color: var(--c-text-muted);
  margin-bottom: 2px;
}

.fg { margin-bottom: 8px; }

.fr {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.fr3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.fa {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.tg {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 18px;
  flex-shrink: 0;
}

.tg input { opacity: 0; width: 0; height: 0; }

.tg .sl {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--c-border-dark);
  border-radius: 18px;
  transition: .2s;
}

.tg .sl::before {
  content: "";
  position: absolute;
  height: 12px;
  width: 12px;
  left: 3px;
  bottom: 3px;
  background: var(--c-bg-white);
  border-radius: 50%;
  transition: .2s;
}

.tg input:checked + .sl { background: var(--c-primary); }
.tg input:checked + .sl::before { transform: translateX(16px); }

.bd {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 7px;
  border-radius: 10px;
  font-size: .7rem;
  font-weight: 500;
  white-space: nowrap;
}

.bd-on { background: #dcfce7; color: var(--c-success); }
.bd-off { background: var(--c-bg-light); color: var(--c-text-light); }
.bd-info { background: var(--c-info-bg); color: var(--c-primary); }

.tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: .76rem;
  background: #f9fafb;
  color: var(--c-text-secondary);
  border: 1px solid var(--c-border);
  cursor: pointer;
  transition: border-color .12s;
}

.tag:hover { border-color: var(--c-border-dark); }
.tag i { font-size: .6rem; color: var(--c-text-light); }

.g2 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.mw {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}

.pi {
  border: 1px solid var(--c-border);
  border-radius: 8px;
  overflow: hidden;
}

.pi:hover { border-color: var(--c-border-dark); }

.ps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  cursor: pointer;
  background: var(--c-bg-alt);
}

.ps:hover { background: var(--c-bg-light); }

.ps .l {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.ps .l h3 {
  font-size: .85rem;
  font-weight: 600;
  white-space: nowrap;
}

.ps .l .pu {
  font-size: .73rem;
  color: var(--c-text-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.ps .l .pu i.cp {
  font-size: .7rem;
  cursor: pointer;
  color: var(--c-text-light);
  padding: 1px;
}

.ps .l .pu i.cp:hover { color: var(--c-primary); }

.pd {
  padding: 12px;
  display: none;
  border-top: 1px solid var(--c-bg-light);
}

.pd.open { display: block; }

.pd .fr { grid-template-columns: 1fr 1.5fr; }
.pd .fr3 { grid-template-columns: 1fr 1fr 70px; }

.ki {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 0;
  border-bottom: 1px solid #f9fafb;
  flex-wrap: wrap;
}

.ki .kv {
  min-width: 0;
  flex: 1 1 60%;
}

.ki:last-child { border-bottom: none; }

.kv {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: .8rem;
  color: var(--c-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.kv i.cp {
  font-size: .75rem;
  cursor: pointer;
  color: var(--c-text-light);
}

.kv i.cp:hover { color: var(--c-primary); }

.sg {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.n {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--c-primary);
}

.al {
  padding: 7px 10px;
  border-radius: 5px;
  font-size: .8rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.al-s { background: var(--c-success-bg); color: var(--c-success-text); }
.al-e { background: var(--c-danger-bg); color: var(--c-danger-text); }
.al-i { background: var(--c-info-bg); color: var(--c-info-text); }

.tc { text-align: center; }

/* Margin */
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 6px; }
.mb-2 { margin-bottom: 8px; }

.fc {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Flex utilities */
.fx1 { flex: 1; }
.fx-s0 { flex-shrink: 0; }
.flex-col { display: flex; flex-direction: column; }
/*.jc-sb { justify-content: space-between; }*/
.jc-c { justify-content: center; }

/* Gap sizes */
.gp3 { gap: 3px; }
.gp4 { gap: 4px; }
.gp6 { gap: 6px; }
.gp8 { gap: 8px; }

/* Font utilities */
.fw-4 { font-weight: 400; }
.fw-6 { font-weight: 600; }
.fw-7 { font-weight: 700; }
.fs-xs { font-size: .75rem; }
.fs-sm { font-size: .82rem; }
.fs-s { font-size: .85rem; }
.fs-xxs { font-size: .65rem; }

/* Width utilities */
.w12 { width: 12px; }
.w14 { width: 14px; }
.w16 { width: 16px; }

/* Color utilities */
.c-p { color: var(--c-primary); }
.c-l { color: var(--c-text-light); }
.c-muted { color: var(--c-text-muted); }
.c-s { color: var(--c-success); }
.c-d { color: var(--c-danger); }

/* Display utilities */
.va-m { vertical-align: middle; }

/* Padding utilities */
.p-14 { padding: 14px; }
.p-10-12 { padding: 10px 12px; }

.fw { width: 100%; }

.mu {
  color: var(--c-text-light);
  font-size: .8rem;
}

.cd {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: .8rem;
  background: var(--c-bg-light);
  padding: 1px 4px;
  border-radius: 3px;
}

.ov {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cp {
  cursor: pointer;
  user-select: none;
}

.gp {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.modal-o {
  position: fixed;
  inset: 0;
  background: var(--c-overlay);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: var(--c-bg-white);
  border-radius: 10px;
  box-shadow: 0 20px 60px var(--c-shadow);
  width: 90%;
  max-width: 400px;
  padding: 22px;
  animation: mi .15s ease;
}

.modal h3 {
  font-size: .95rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.modal p {
  font-size: .84rem;
  color: var(--c-text-muted);
  margin-bottom: 14px;
}

.modal .fa { margin-top: 14px; margin-bottom: 0; }
.modal select { margin-bottom: 8px; }

@keyframes mi {
  from { opacity: 0; transform: scale(.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.mk {
  background: var(--c-bg-light);
  border: 1px solid var(--c-border);
  border-radius: 5px;
  padding: 8px 10px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: .8rem;
  word-break: break-all;
  user-select: all;
  margin: 6px 0;
}

.hd { display: none !important; }

/* ===== 高频复用工具类 ===== */

/* 间距 — 高频复用 */
.mb-3 { margin-bottom: 3px; }
.mb-4 { margin-bottom: 4px; }
.mb-10 { margin-bottom: 10px; }
.mt-6 { margin-top: 6px; }
.m-16-0 { margin: 16px 0; }

/* 表单 */
.select-sm { flex: 1; padding: 7px 8px; border: 1px solid var(--c-border-dark); border-radius: 6px; font-size: .82rem; background: var(--c-bg-white); }
.input-mt-6 { margin-top: 6px; }

/* 文字 */
.fs-1 { font-size: 1rem; }
.fs-65 { font-size: .65rem; }
.fs-77 { font-size: .77rem; }
.fs-88 { font-size: .88rem; }
.gap-8 { gap: 8px; }

/* 复制图标 */
.copy-icon { font-size: .65rem; color: var(--c-text-light); }

/* 登录页 */
.login-wrapper { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 110px); padding: 20px; }
.login-card { width: 100%; max-width: 360px; padding: 24px; }

/* 管理后台面板 */
.add-form-panel { padding: 14px; background: var(--c-bg-alt); border-radius: 8px; border: 1px dashed var(--c-border-dark); width: calc(50% - 5px); }
.mdl-list-panel { flex: 1; padding: 14px; background: var(--c-bg-alt); border-radius: 8px; border: 1px dashed var(--c-border-dark); max-height: 420px; overflow-y: auto; }
.af-w { display: flex; gap: 12px; margin-bottom: 12px; }
.toast { position: fixed; top: 14px; right: 14px; z-index: 9998; min-width: 260px; }

/* JS 动态生成的 HTML 用 */
.mdl-item { padding: 5px 8px; border: 1px solid var(--c-border); border-radius: 6px; font-size: .82rem; display: flex; align-items: center; gap: 6px; }
.mdl-item .fx1 { white-space: normal; overflow-wrap: break-word; }
.mdl-item i:first-child { color: var(--c-text-secondary); width: 14px; flex-shrink: 0; }
.mdl-add-btn { flex-shrink: 0; padding: 1px 5px; font-size: .9rem; line-height: 1; }
.grid-2-gap6 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }

@media (max-width: 768px) {
  .sg { flex-direction: column; }
  .fr,
  .fr3,
  .pd .fr,
  .pd .fr3 { grid-template-columns: 1fr; }
  .g2 { grid-template-columns: 1fr; }
	  .gp { grid-template-columns: 1fr; }
	  .grid-2-gap6 { grid-template-columns: 1fr; }
	  .af-w { flex-direction: column; }
  .add-form-panel { width: 100%; }
  .ki { flex-wrap: wrap; }
  .ki > div:first-child { flex: 1 1 100%; overflow: hidden; }
  .ki > .fc { margin-top: 4px; }
}
`