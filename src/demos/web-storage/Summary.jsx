import { useState } from 'react'

/* =========================================================
 * 🎯 面试总结
 * ---------------------------------------------------------
 * 一句话本质 → 三者对比表 → 选型决策 → 30 秒话术 → 高频追问
 * FOLLOWUPS 等含 JSX 的数据必须放组件文件内（react-refresh 约束）
 * ========================================================= */

const COMPARE_ROWS = [
  ['容量', '约 4KB（单条）', '约 5MB', '约 5MB'],
  ['生命周期', '设 Expires/Max-Age 按约定；不设则浏览器会话结束', '永久，手动清除才消失', '当前标签页；刷新保留，关闭即销毁'],
  ['随 HTTP 请求自动上行', '✅ 同域每个请求都带（含静态资源）', '❌ 纯本地', '❌ 纯本地'],
  ['作用域', '同域名（可按 domain/path 收窄），子域可共享', '同源共享，所有标签页', '同源 + 单标签页，跨标签不共享'],
  ['API', '手动读写 document.cookie 字符串', 'getItem / setItem / removeItem / clear', '同左'],
  ['典型用途', '会话凭证（sessionId）、埋点', '主题偏好、接口数据缓存、Redux 状态持久化', '表单草稿、单流程步骤状态'],
]

const FOLLOWUPS = [
  {
    q: 'Cookie 和 Session 有什么区别？',
    a: <>Session 是<b>服务端</b>存储（内存 / Redis），Cookie 是<b>客户端</b>一小段文本。登录链路里服务端生成 sessionId，用 <code>Set-Cookie</code> 发给浏览器；之后请求自动带 cookie，服务端凭 ID 找回 Session。所以"踢人下线"容易（服务端删 session），而 JWT 要额外做黑名单。</>,
  },
  {
    q: '登录 token 该存 Cookie 还是 localStorage？',
    a: <> trade-off 是 XSS vs CSRF：localStorage 里的 token 一封 XSS 邮件就被 <code>getItem</code> 偷走，但天然没有 CSRF；HttpOnly cookie 抗 XSS 窃取，却要 SameSite + CSRF token 防跨站伪造请求。金融场景我的答案是：<b>HttpOnly + Secure + SameSite 的 cookie 存凭证，敏感操作再叠一层短时效二次验证</b>。</>,
  },
  {
    q: '怎么实现跨标签页同步（比如一处登出全域登出）？',
    a: <>原生三选一：<code>storage</code> 事件（只在别的标签页触发，本主题 ④ 实测过）、BroadcastChannel、或服务端推送（WebSocket/SSE）。轻量方案就是监听 storage 事件比对 key，别为了同步引一个库。</>,
  },
  {
    q: 'Cookie 太多/太大会有什么问题？',
    a: <>同域下每个请求（包括 CSS/JS/图片）都背着一整套 cookie，纯浪费上行带宽，甚至可能触发网关的 header 大小限制。解法：静态资源用独立无 cookie 域名、按 domain/path 收窄 cookie 作用域、大状态挪服务端 session 只留 ID。</>,
  },
  {
    q: '说说 SameSite 的三个取值？',
    a: <>Strict：任何跨站请求都不带 cookie（从外部点链接进来也不带，体验最差）；Lax（现默认）：顶层 GET 导航放行，跨站 POST/iframe/ajax 一律不带；None：显式允许第三方携带，必须同时 <code>Secure</code>。None 正在被浏览器逐步封禁第三方 cookie 的大趋势里收窄。</>,
  },
  {
    q: '浏览器"缓存"和"存储"是一回事吗？（开场辨析题）',
    a: <>不是。HTTP 缓存（强缓存 Cache-Control / 协商缓存 ETag）缓存的是<b>响应资源</b>，由服务端响应头控制；Cookie/localStorage/sessionStorage 存的是<b>业务数据</b>，由前端 JS 控制。答题时先说这句边界，再进三者对比，不会跑题。</>,
  },
  {
    q: 'localStorage 有 5MB 就万事大吉吗？',
    a: <>三件事要防：① 同步 API，大量读写阻塞主线程；② 没有过期机制，要自己存 {'{ version, data }'} 并 try/catch；③ 配额按源计算且共享——别的键占了位置你写入就抛 <code>QuotaExceededError</code>（本主题 ② 当场灌爆过）。超大二进制应该走 IndexedDB 或 OPFS。</>,
  },
]

export default function Summary() {
  const [open, setOpen] = useState(0)

  return (
    <div className="ws-summary">
      <section className="ws-block">
        <h3>一句话本质（先声夺人）</h3>
        <blockquote>
          <p>
            Cookie / localStorage / sessionStorage 是浏览器三种端侧 KV 存储，差别就在三个维度：
            <b>生命周期、容量、是否自动参与 HTTP 请求</b>；而"浏览器缓存"（强缓存/协商缓存）是
            HTTP 层缓存<b>响应资源</b>的另一套体系——开口第一句先把这两件事分开，就赢了一半。
          </p>
        </blockquote>
      </section>

      <section className="ws-block">
        <h3>三者对比表（主体背这个）</h3>
        <table className="ws-compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>Cookie</th>
              <th>localStorage</th>
              <th>sessionStorage</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map(([dim, cookie, ls, ss]) => (
              <tr key={dim}>
                <td>{dim}</td>
                <td>{cookie}</td>
                <td>{ls}</td>
                <td>{ss}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ws-note ws-note-block">
          <b>记忆钩子：</b>Cookie 是"邮差"（每次上门都跟着走，但口袋小）；localStorage 是"仓库"（大到永久）；sessionStorage 是"随身包"（只陪这一个标签页）。
        </p>
      </section>

      <section className="ws-block">
        <h3>选型决策（工程视角加分）</h3>
        <ul>
          <li>服务端要识别身份 → <b>cookie</b>（HttpOnly + Secure + SameSite，只装 sessionId，别装业务数据）</li>
          <li>持久化的用户偏好 / 接口数据缓存 / Redux 持久化 → <b>localStorage</b>（带 version 字段 + try/catch）</li>
          <li>单流程临时状态（表单草稿、向导步骤）→ <b>sessionStorage</b>（关页自动清，不留垃圾）</li>
          <li>大二进制 / 结构化数据 → <b>IndexedDB</b>（异步不阻塞，配额更大）</li>
          <li>静态资源的重复下载 → 交给 <b>HTTP 缓存策略</b>，不在业务代码里操心</li>
        </ul>
      </section>

      <section className="ws-block">
        <h3>30 秒收束话术（背下来）</h3>
        <blockquote>
          <p>
            "选型上我的习惯是：需要服务端识别身份用 cookie，配 HttpOnly 加 SameSite，里面只放
            sessionId；持久化的用户偏好和接口数据用 localStorage，带版本号并 try/catch；单流程的
            临时状态用 sessionStorage，关页自动清。而 HTML/JS/CSS 的重复加载问题属于 HTTP 缓存
            的范畴，用 Cache-Control 强缓存加 ETag 协商缓存解决，不需要业务代码介入。另外跨标签页
            同步状态可以直接用 localStorage 的 storage 事件，不用引额外库。"
          </p>
        </blockquote>
      </section>

      <section className="ws-block">
        <h3>高频追问（点开看答法）</h3>
        <div className="ws-faq">
          {FOLLOWUPS.map((item, i) => (
            <div className={i === open ? 'ws-faq-item open' : 'ws-faq-item'} key={item.q}>
              <button className="ws-faq-q" onClick={() => setOpen(i === open ? -1 : i)}>
                <span className="ws-faq-mark">{i === open ? '▾' : '▸'}</span> {item.q}
              </button>
              {i === open && <p className="ws-faq-a">{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="ws-block">
        <h3>关联主题</h3>
        <ul>
          <li>网络层缓存（强缓存 / 协商缓存 / 200·304 决策流水线）→ 「HTTP 缓存」主题</li>
          <li>CSRF / XSS 完整攻防（含防御代码）→ 「前端安全」主题</li>
          <li>Redux 状态持久化到 localStorage 的实践 → 「Redux 核心原理」主题</li>
        </ul>
      </section>
    </div>
  )
}
