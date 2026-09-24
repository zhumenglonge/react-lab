import { useState } from 'react'

/* =========================================================
 * 🛡️ 攻击 vs 防御：常见 Web 攻击面 & 前端能做的防护
 * ---------------------------------------------------------
 * 点击每道攻击展开「原理 + 前端手段 + 代码片段」。
 * 一条主线：前端不可信，前端安全是「纵深防御」的一层，
 * 目标是收敛攻击面、抬高攻击成本，真正的兜底永远在后端。
 * ========================================================= */

const ATTACKS = [
  {
    name: 'XSS 跨站脚本',
    tag: '注入类',
    how: '把恶意脚本注入页面并被执行（存储型 / 反射型 / DOM 型），可窃取 Cookie、Token、伪造操作。',
    defense: [
      '绝不把不可信数据当 HTML 注入；慎用 dangerouslySetInnerHTML / v-html / innerHTML。',
      '输出前转义（实体编码）；富文本先经过白名单过滤（DOMPurify / sanitize-html）。',
      '配 CSP 响应头限制脚本来源；Cookie 加 HttpOnly 让脚本读不到。',
    ],
    code: `// ❌ 危险：用户输入直接进 DOM\nelement.innerHTML = userInput\n\n// ✅ React 默认转义文本节点\n<span>{userInput}</span>\n\n// ✅ 富文本必须消毒\nimport DOMPurify from 'dompurify'\n<span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />`,
  },
  {
    name: 'CSRF 跨站请求伪造',
    tag: '会话类',
    how: '诱导已登录用户在第三方页面「带着 Cookie」发起非预期请求（转账、改密码）。',
    defense: [
      'Cookie 设 SameSite=Lax/Strict，跨站默认不携带。',
      '关键请求校验 CSRF Token（同步令牌 / 双重提交 Cookie）。',
      '校验 Origin / Referer 头；避免只靠 Cookie 做身份凭证。',
      '写操作用 POST，语义上幂等的 GET 不触发副作用。',
    ],
    code: `# ✅ 服务端下发的 Cookie 属性\nSet-Cookie: sessionId=abc; HttpOnly; Secure; SameSite=Lax\n\n// ✅ 请求头带自定义 token（浏览器不会自动加，攻击者伪造不了）\naxios.defaults.headers.common['X-CSRF-Token'] = csrfToken`,
  },
  {
    name: '点击劫持 Clickjacking',
    tag: '界面类',
    how: '把真实页面嵌进透明 iframe，盖在诱饵按钮上，用户「以为点 A 实则点 B」。',
    defense: [
      '响应头 X-Frame-Options: DENY / SAMEORIGIN。',
      'CSP 的 frame-ancestors 指令精确控制可嵌套来源。',
      '敏感操作二次确认 / framebusting（辅助，不作主力）。',
    ],
    code: `# ✅ HTTP 响应头\nX-Frame-Options: SAMEORIGIN\nContent-Security-Policy: frame-ancestors 'self'`,
  },
  {
    name: '中间人 / 传输窃听 MITM',
    tag: '传输类',
    how: '公共 WiFi 等场景下，明文 HTTP 被嗅探或篡改。',
    defense: [
      '全站 HTTPS（TLS），HTTP 强制 301 跳转。',
      '开启 HSTS，杜绝降级到明文。',
      '关键静态资源加 SRI（Subresource Integrity）校验哈希。',
    ],
    code: `<!-- ✅ 外链脚本用 SRI，内容被篡改则拒绝执行 -->\n<script src="https://cdn/x.js"\n  integrity="sha384-oqVu..."\n  crossorigin="anonymous"></script>`,
  },
  {
    name: '敏感信息泄露 / 密钥硬编码',
    tag: '数据类',
    how: '把 API Key、私钥、内网地址写进前端代码，打包后人人可下载查看。',
    defense: [
      '前端没有「保密」一说——构建产物全部可见，密钥只能放后端。',
      '区分「前端可安全暴露」的公开 Key 与「必须后端保管」的 Secret Key。',
      '生产关闭 sourcemap，去掉日志里的敏感字段，脱敏后再展示。',
    ],
    code: `// ❌ 致命：私钥进了前端包，等于公开\nconst SECRET = 'sk_live_xxx'\n\n// ✅ 需要密钥的调用一律走自家后端代理`,
  },
  {
    name: '重放攻击 / 参数篡改',
    tag: '交易类',
    how: '抓包后原样重发或改掉金额、数量再发（金融场景致命）。',
    defense: [
      '请求带 timestamp + nonce + 签名（sign），服务端校验时效与去重。',
      '金额、订单号等关键参数不允许由前端说了算，后端以己方数据重算。',
      '幂等键防重复提交。',
    ],
    code: `// ✅ 前端只负责按约定加签（密钥走后端下发/协商）\nconst sign = md5(JSON.stringify(body) + ts + nonce + appSecret)\nsend({ ...body, ts, nonce, sign })`,
  },
  {
    name: '依赖投毒 / 供应链',
    tag: '构建类',
    how: '被劫持或仿冒的 npm 包在 install / build 时植入恶意代码。',
    defense: [
      '锁定 lockfile，私有源 + 代理白名单。',
      '定期 npm audit / 用 Snyk、Dependabot 扫已知漏洞。',
      '锁版本、审查新增依赖、CI 里做完整性校验。',
    ],
    code: `# ✅ 安装带审计\nnpm ci            # 严格按 lockfile\nnpm audit --production\n# 用 lockfileVersion + integrity 保证包未被篡改`,
  },
  {
    name: '暴力破解 / 撞库 / 爬虫',
    tag: '滥用类',
    how: '高频尝试口令、用泄露库撞账号、恶意爬取数据。',
    defense: [
      '登录失败次数限制 + 验证码 / 滑块 / 图形码。',
      '接口限流（前端配合做防抖节流、按钮置灰防连点）。',
      '风控 + 设备指纹识别异常行为（核心仍由后端/风控系统兜）。',
    ],
    code: `// ✅ 提交按钮防连点（前端侧的粗粒度限流）\nconst [pending, setPending] = useState(false)\nif (pending) return\nsetPending(true)\ntry { await api.login(form) } finally { setPending(false) }`,
  },
]

export default function AttackDemo() {
  const [open, setOpen] = useState(0)

  return (
    <div className="demo-wrap sec-root">
      <div className="demo-header">
        <h2>🛡️ 常见攻击面 &amp; 前端能做的防护</h2>
        <p className="demo-sub">
          一条主线：<b>浏览器里的一切都可被篡改，前端不可信</b>。前端安全的价值是
          <b>收敛攻击面、抬高攻击成本、保护用户侧</b>，而<b>真正的鉴权与校验兜底永远在后端</b>。
          点击每一栏展开原理与代码。
        </p>
      </div>

      <div className="sec-acc">
        {ATTACKS.map((a, i) => {
          const isOpen = open === i
          return (
            <div className={'sec-item' + (isOpen ? ' sec-item-open' : '')} key={a.name}>
              <button className="sec-item-head" onClick={() => setOpen(isOpen ? -1 : i)}>
                <span className="sec-item-title">{a.name}</span>
                <span className="sec-tag">{a.tag}</span>
                <span className="sec-caret">{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div className="sec-item-body">
                  <p className="sec-how">
                    <b>原理：</b>
                    {a.how}
                  </p>
                  <p className="sec-def-label">✅ 前端防护手段</p>
                  <ul className="sec-list">
                    {a.defense.map((d, k) => (
                      <li key={k}>{d}</li>
                    ))}
                  </ul>
                  <pre className="code">{a.code}</pre>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
