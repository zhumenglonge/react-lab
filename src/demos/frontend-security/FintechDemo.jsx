/* =========================================================
 * 🏦 金融前端专项：钱相关的代码要额外盯的几件事
 * ---------------------------------------------------------
 * 金融/支付场景，除通用 Web 安全外，代码层面还要重点考虑：
 * 数据脱敏、金额精度、防重复/幂等、防重放加签、越权、密钥、
 * 二次确认与风控、审计。核心思想同样是「前端只展示，说了算的在后端」。
 * ========================================================= */

const ITEMS = [
  {
    icon: '🙈',
    title: '敏感数据脱敏展示',
    desc: '卡号、手机号、身份证、余额等在展示与日志里一律掩码，最小可见原则。',
    code: `// 卡号只留末 4 位\nmaskCard('6222020012345678') // 6222 02** **** 5678\n// 手机号 138****8888；身份证、邮箱同理\n// 后端不下发明文，前端拿到的就该是脱敏值`,
  },
  {
    icon: '💰',
    title: '金额禁用浮点',
    desc: 'JS 的 0.1 + 0.2 !== 0.3，绝不能拿 Number 直接算钱。用「分」为单位的整数，或字符串大数 / decimal 库。',
    code: `0.1 + 0.2 // 0.30000000000000004  ❌\n\n// ✅ 以「分」为单位用整数运算，展示时再除 100\nconst fee = 1050 + 200          // 单位：分\n// ✅ 或 decimal.js / big.js 处理精确小数`,
  },
  {
    icon: '🔁',
    title: '防重复提交 & 幂等',
    desc: '按钮点击后置灰 + loading，配合唯一幂等键（idempotency key）保证同一笔只处理一次。',
    code: `// 前端：pending 期间禁止再次触发\nif (submitting) return\nsetSubmitting(true)\nconst key = uuid()             // 幂等键随请求带上\ntry { await pay({ ...form, idempotencyKey: key }) } finally { setSubmitting(false) }`,
  },
  {
    icon: '✍️',
    title: '关键参数加签、防篡改',
    desc: '金额、账户、优惠等关键字段前端不可信，服务端以自己数据库的值重算；请求可带 sign 供后端验签。',
    code: `// ❌ 把真实金额交给前端传，改包即改价\n{ goodsId: 1, amount: 0.01 }\n// ✅ 只传标识，金额后端按订单重算 + 验签`,
  },
  {
    icon: '🔐',
    title: '越权：前端只做 UI，鉴权在后端',
    desc: '隐藏按钮 ≠ 权限控制。水平越权（看别人账单）、垂直越权（普通用户调管理员接口）都要后端逐请求校验。',
    code: `// 前端隐藏入口只为体验，不是安全\n// ✅ 每个接口后端校验 token 对应的用户/角色是否有权`,
  },
  {
    icon: '🕵️',
    title: '密钥 / 加密的位置',
    desc: '对称密钥、第三方私钥绝不能进前端包。前端「加密」多为混淆或传输层 HTTPS，真正的加解密/签名在后端。',
    code: `// ❌ const APP_SECRET = '...'  打包即泄露\n// ✅ 需要签名摘要的走后端接口；前端只做展示与交互`,
  },
  {
    icon: '⏱️',
    title: '防重放：时间戳 + nonce + 时效',
    desc: '敏感交易请求带 ts 与一次性 nonce，服务端校验时间窗口并对 nonce 去重。',
    code: `send({ ...body, ts: Date.now(), nonce: uuid(), sign })\n// 服务端：|now - ts| 超限拒绝；nonce 命中缓存则判定为重放`,
  },
  {
    icon: '🧾',
    title: '二次确认与可追溯',
    desc: '大额转账、改绑卡等要二次确认（短信/人脸/PIN），关键操作留审计日志，前端配合清晰的确认与回执。',
    code: `// 转账前弹确认框，明细清楚（收款方/金额/手续费）\n// 提交后展示订单号 / 回执，便于对账与申诉`,
  },
]

export default function FintechDemo() {
  return (
    <div className="demo-wrap sec-root sec-fintech">
      <div className="demo-header">
        <h2>🏦 金融前端专项：跟「钱」有关的代码要盯紧</h2>
        <p className="demo-sub">
          金融/支付场景对安全的容忍度极低。除通用 Web 防护外，代码层面还要额外守住
          <b>脱敏、精度、幂等、加签、越权、密钥、防重放、可追溯</b>八件事。
        </p>
      </div>

      <div className="sec-fin-grid">
        {ITEMS.map((it) => (
          <div className="sec-fin-card" key={it.title}>
            <div className="sec-fin-head">
              <span className="sec-fin-icon">{it.icon}</span>
              <span className="sec-fin-title">{it.title}</span>
            </div>
            <p className="sec-fin-desc">{it.desc}</p>
            <pre className="code">{it.code}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}
