/* =========================================================
 * 🎯 面试总结：前端安全 & 攻击防护
 * 作用域挂在 .sec-summary 下，样式随本主题懒加载。
 * ========================================================= */

// 分层防御：按层记忆「有哪些手段」
const LAYERS = [
  ['传输层', '全站 HTTPS/TLS、HTTP 跳转、HSTS、证书校验、静态资源 SRI'],
  ['存储层', '敏感数据不落 localStorage；Token 优先 HttpOnly Cookie；必要时内存态 + 短时效'],
  ['代码层', '输出转义/消毒防 XSS、禁用 eval/Function/innerHTML、生产关 sourcemap、去敏感日志'],
  ['响应头', 'CSP、X-Frame-Options、X-Content-Type-Options: nosniff、Referrer-Policy'],
  ['会话层', 'SameSite Cookie、CSRF Token、校验 Origin、登录态失效与限流'],
  ['请求层', '参数加签 + timestamp + nonce 防篡改/重放、幂等键、前端限流防抖'],
  ['依赖层', 'lockfile + npm ci、audit/SCA 扫描、审查新依赖、锁定版本'],
  ['交互层', '危险操作二次确认、验证码/滑块、按钮防连点、脱敏展示'],
]

const NOTES = [
  {
    q: '前端做加密有没有意义？密钥能放前端吗？',
    a: '密钥放前端 = 公开，任何「需要保密的密钥」都必须留在后端。前端的加密/混淆只能抬高成本、防君子不防小人，真正的机密性与签名校验靠后端 + HTTPS 传输层，不能把「前端加密」当安全边界。',
  },
  {
    q: 'JWT 存 localStorage 还是 Cookie？',
    a: 'localStorage 简单但会被 XSS 直接读走；放 HttpOnly + Secure + SameSite Cookie 能挡住 XSS 读取，但要额外防 CSRF。没有银弹：核心是缩短时效、配合 CSP 收敛 XSS、关键操作二次校验。',
  },
  {
    q: '隐藏按钮 / 前端校验算安全控制吗？',
    a: '不算。前端一切可绕过（改 DOM、直接调接口），权限与数据校验必须在后端逐请求做；前端校验只为体验，前端隐藏入口只是「不给误操作」，不是防攻击。',
  },
  {
    q: '防 XSS 和防 CSRF 的关键差别？',
    a: 'XSS 防的是「注入并执行脚本」——靠输出转义 + 消毒 + CSP + HttpOnly；CSRF 防的是「借用户身份伪造请求」——靠 SameSite Cookie + CSRF Token + 校验 Origin。一个管内容不被注入，一个管请求是不是自愿发的。',
  },
  {
    q: '金融场景你最看重哪几点？',
    a: '金额不用浮点、关键参数不信任前端（后端重算 + 加签）、防重复提交与幂等、防重放（ts+nonce+sign）、敏感数据脱敏、越权后端校验、大额二次确认 + 审计。一句话：钱说了算的逻辑一定在后端。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap sec-root sec-summary">
      <section className="sec-block">
        <h3>🧠 一句话本质</h3>
        <p className="sec-lead">
          前端安全的总前提：<b>浏览器运行在攻击者的地盘上，客户端的一切都可被篡改——前端不可信</b>。
          所以它是<b>纵深防御</b>里的一环，负责<b>收敛攻击面、抬高成本、保护用户侧</b>，
          而身份鉴权、数据校验、金额计算这些<b>真正的安全边界必须落在后端</b>。
        </p>
      </section>

      <section className="sec-block">
        <h3>🧱 分层防御清单（「有哪些手段」）</h3>
        <table className="sec-compare">
          <thead>
            <tr>
              <th>层</th>
              <th>常用手段</th>
            </tr>
          </thead>
          <tbody>
            {LAYERS.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td>{r[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="sec-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="sec-list">
          {NOTES.map((n) => (
            <li key={n.q}>
              <b>{n.q}</b>
              {n.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="sec-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="sec-quote">
          <p>
            "我理解前端安全的前提是<b>零信任——前端跑在用户浏览器里，任何校验、任何数据都可能被篡改，
            所以真正的安全边界一定在后端</b>，前端做的是纵深防御的一层，目标是减少攻击面、抬高攻击成本、保护用户侧。"
          </p>
          <p>
            "具体我会分层看：传输层全站 <b>HTTPS + HSTS + SRI</b>；防 <b>XSS</b> 靠输出转义、富文本用
            DOMPurify 消毒、配 <b>CSP</b> 和 HttpOnly Cookie；防 <b>CSRF</b> 靠 SameSite Cookie 加 CSRF Token、
            校验 Origin；防点击劫持用 <b>X-Frame-Options / frame-ancestors</b>；请求侧用
            <b>时间戳 + nonce + 加签</b>防篡改和重放；依赖侧 lockfile + 定期 audit。"
          </p>
          <p>
            "金融场景我会再强调三点：<b>金额绝不用浮点、关键参数不信前端而由后端重算、敏感操作要幂等 + 二次确认 +
            脱敏展示</b>，而且<b>密钥永远不进前端包</b>——很多候选人会把「前端加密」当安全措施，其实它只是混淆，
            兜底还得靠后端和传输层。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
