import { useState } from 'react'

/* =========================================================
 * 🧠 本质与陷阱
 * ---------------------------------------------------------
 * A) 边界辨析：题目里"浏览器缓存"和"三种存储"其实是两套东西
 * B) Cookie 与 Session：储物柜与钥匙的流水线，对比 JWT 方案
 * C) Cookie 安全三件套：HttpOnly / Secure / SameSite 各防什么
 * + 高频陷阱列表（sessionStorage 隔离、cookie 带宽、明文 token…）
 * ========================================================= */

/* ---------- C) Cookie 安全属性 ---------- */
const COOKIE_ATTRS = [
  {
    key: 'httponly',
    label: 'HttpOnly',
    stops: '防 XSS 偷 cookie',
    detail: 'JS 里 document.cookie 读不到这条 cookie（服务器 Set-Cookie 时附加）。攻击者即使注入了脚本，也拿不走会话凭证。',
    demo: '验证：本主题 ① 里用 JS 写的 cookie 能回读，因为它不是 HttpOnly——HttpOnly 只能由服务端 Set-Cookie 设置。',
    tone: 'ok',
  },
  {
    key: 'secure',
    label: 'Secure',
    stops: '防中间人窃听',
    detail: '只在 HTTPS 请求里携带这条 cookie，HTTP 明文通道不带。配合 HSTS 防止降级攻击。SameSite=None 时必须同时带 Secure，否则浏览器直接拒收。',
    demo: '场景：公共 WiFi 下 HTTP 请求被嗅探，没有 Secure 的 cookie 就是裸奔。',
    tone: 'accent',
  },
  {
    key: 'samesite-strict',
    label: 'SameSite=Strict',
    stops: '防 CSRF（最狠）',
    detail: '从任何"外部站点"发起的请求（点链接跳过来也算）都不带这条 cookie。安全性最高，但用户从微信里点你的链接可能要重新登录。',
    demo: 'CSRF 原理：恶意网站诱导浏览器带着你已登录的 cookie 发请求——SameSite 直接把这条路堵死。',
    tone: 'ok',
  },
  {
    key: 'samesite-lax',
    label: 'SameSite=Lax（默认）',
    stops: '防 CSRF（够用）',
    detail: '跨站 POST / iframe / ajax 都不带 cookie，唯独"顶层 GET 导航"（点链接跳过来）会带。2024 起主流浏览器默认值，兼顾安全与体验。',
    demo: '取舍：跳转进来还认登录态，但支付类操作必须再校验，因为 GET 导航也带 cookie。',
    tone: 'accent',
  },
  {
    key: 'samesite-none',
    label: 'SameSite=None; Secure',
    stops: '不防 CSRF（跨站场景才用）',
    detail: '显式允许第三方携带 cookie（如嵌入的第三方登录页），必须搭配 Secure。第三方 Cookie 正被浏览器逐步封禁，面试提到这个趋势是加分项。',
    demo: '趋势：Chrome 也在收紧第三方 cookie，替代思路是 CHAPI / 服务端代理。',
    tone: 'warn',
  },
]

/* ---------- 高频陷阱 ---------- */
const PITFALLS = [
  'sessionStorage 按"标签页"隔离：同源新开一个标签页就是全新空副本（区别于 cookie / localStorage 的同源共享）。复制网址到新标签页会带过去一份快照，之后互不相干。',
  'cookie 不是"存得下就完事"：同域下每个请求——包括 CSS/JS/图片——都自动携带该域全部 cookie。往里塞大对象会白白浪费上行带宽；静态资源域名不设 cookie 就是这个原因。',
  '超 4KB 的 cookie 写入不报错、静默丢弃（RunDemo ② 实测）。存不下时浏览器不会提醒你，只能回读验证。',
  'localStorage 没有过期概念：发版改了缓存结构，老用户读到的还是脏数据。实践做法：存 { version, data }，版本不对就丢弃；读取永远包 try/catch（JSON.parse 可能炸）。',
  'localStorage 里的 token 防不住 XSS：任何注入脚本都能 getItem 拿走。敏感凭证优先 HttpOnly cookie；项目里如果坚持 localStorage + Authorization 头，就必须把 XSS 防护（CSP、转义）做扎实。',
  'clear() 是整个源(one origin)全清：只想删自己那几个键时用 removeItem(key)，别顺手 localStorage.clear() 把别人的数据也扬了。',
  '隐私/无痕模式下存储是一次性的：会话结束即清空，部分浏览器（如 Safari ITP）还会对长期存储做 7 天上限之类的限制——关键状态必须能从服务器恢复，不能只靠端侧。',
]

export default function EssenceDemo() {
  const [attr, setAttr] = useState('httponly')
  const current = COOKIE_ATTRS.find((a) => a.key === attr)

  return (
    <div className="demo-wrap ws-root">
      <div className="demo-header">
        <h2>🧠 本质与陷阱 · 先把"缓存"和"存储"掰开</h2>
        <p className="ws-sub">
          面试官说"浏览器缓存"时可能指两件事：HTTP 层缓存<b>响应资源</b>，端侧 API 存<b>业务数据</b>。
          开场先把边界说清，再展开三者对比，逻辑就立住了。
        </p>
      </div>

      {/* A) 边界辨析 */}
      <section className="ws-card">
        <h4>A｜「浏览器缓存」vs「浏览器存储」：两套体系 <span className="ws-tag">开场辨析</span></h4>
        <div className="ws-vs">
          <div className="ws-vs-col">
            <p className="ws-vs-head">🗄️ HTTP 缓存（网络层）</p>
            <p>缓存对象：HTML / JS / CSS / 图片这些<b>响应资源</b></p>
            <p>谁来控：服务端响应头 <code>Cache-Control</code> / <code>ETag</code>，前端 JS 插手不了</p>
            <p>命中效果：200 (from disk cache) / 304，省的是下载</p>
            <p className="ws-vs-verdict">细节见「HTTP 缓存」主题（强缓存 vs 协商缓存）</p>
          </div>
          <div className="ws-vs-col">
            <p className="ws-vs-head">🍪 端侧存储（本主题）</p>
            <p>存对象：<b>业务数据</b>——登录态、用户偏好、表单草稿</p>
            <p>谁来控：前端 JS API（<code>setItem</code> / <code>document.cookie</code>）</p>
            <p>其中只有 cookie 会自动参与 HTTP 请求，另两个是纯本地</p>
            <p className="ws-vs-verdict">三者本质是"给 JS 用的 KV 存储"，尺寸/生命周期各不相同</p>
          </div>
        </div>
      </section>

      {/* B) Cookie 与 Session */}
      <section className="ws-card">
        <h4>B｜Cookie 和 Session 的关系：柜子与钥匙 <span className="ws-tag">高频追问</span></h4>
        <div className="ws-steps">
          {[
            '① 用户提交账号密码（POST /login）',
            '② 服务器创建 Session（存服务端内存 / Redis），生成 sessionId',
            '③ 响应头 Set-Cookie: sessionId=abc → 浏览器存下这条 cookie',
            '④ 之后同域每个请求自动携带 Cookie: sessionId=abc',
            '⑤ 服务器拿 sessionId 找回对应 Session → 认出"你是你"',
          ].map((text) => (
            <span className="ws-step" key={text}>{text}</span>
          ))}
        </div>
        <p className="ws-tip">
          💡 一句话本质：<b>Session 数据在服务端，Cookie 只是装钥匙的信封</b>。客户端看到的从来不是"你的登录状态"，只有一个随机 ID。
        </p>
        <div className="ws-vs">
          <div className="ws-vs-col">
            <p className="ws-vs-head">传统 Session + Cookie</p>
            <p>服务端有状态：每台机器都要存 session（分布式要 Redis 共享）</p>
            <p>可随时服务端注销（删 session 即失效）</p>
            <p>水平扩容时靠共享存储兜底</p>
          </div>
          <div className="ws-vs-col">
            <p className="ws-vs-head">现代 JWT / Token</p>
            <p>服务端无状态：签名自证，水平扩容友好</p>
            <p>注销难：要拉黑名单或短过期 + refresh token</p>
            <p>前端常存 localStorage，手动加 <code>Authorization</code> 头（不自动上行）</p>
          </div>
        </div>
      </section>

      {/* C) Cookie 安全三件套 */}
      <section className="ws-card">
        <h4>C｜Cookie 安全三件套：各防哪种攻击 <span className="ws-tag">点切换看详情</span></h4>
        <div className="ws-chips">
          {COOKIE_ATTRS.map((a) => (
            <button key={a.key} className={a.key === attr ? 'ws-chip on' : 'ws-chip'} onClick={() => setAttr(a.key)}>
              {a.label}
            </button>
          ))}
        </div>
        <div className={`ws-attr ws-attr-${current.tone}`}>
          <p className="ws-attr-head">
            <code>{current.label}</code> —— 防的是：<b>{current.stops}</b>
          </p>
          <p className="ws-attr-desc">{current.detail}</p>
          <p className="ws-note">{current.demo}</p>
        </div>
      </section>

      {/* D) 陷阱列表 */}
      <section className="ws-card">
        <h4>D｜高频陷阱清单 <span className="ws-tag">踩过的坑都能当案例讲</span></h4>
        <ul className="ws-pitfalls">
          {PITFALLS.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
