import { useEffect, useState } from 'react'

/* =========================================================
 * ⚔️ 实跑对拍：Cookie / localStorage / sessionStorage 当场真读写
 * ---------------------------------------------------------
 * 全部调用真实浏览器 API，写的都是 ws_demo_ 前缀的键，可一键清理：
 * ① 三存储读写台：写一次值，三处分别回读，看谁存下了
 * ② 容量实测：超 4KB 的 cookie 被浏览器静默丢弃 vs 1MB localStorage
 *    秒写 vs 循环灌数据撑爆配额（抛 QuotaExceededError 后自动善后）
 * ③ 请求头模拟：点「发起请求」，同域请求里只有 Cookie 自动上行
 * ④ 跨标签广播：别的标签页改 localStorage 会收到 storage 事件，
 *    sessionStorage 各标签页隔离、永远收不到
 * ========================================================= */

const TOKEN_KEY = 'ws_demo_token'
const PING_KEY = 'ws_demo_ping'
const QUOTA_PREFIX = 'ws_demo_quota_'

function readCookie(key) {
  const pair = document.cookie.split('; ').find((p) => p.startsWith(`${key}=`))
  return pair ? pair.slice(key.length + 1) : null
}

function readAll() {
  return {
    ls: localStorage.getItem(TOKEN_KEY),
    ss: sessionStorage.getItem(TOKEN_KEY),
    ck: readCookie(TOKEN_KEY),
  }
}

export default function RunDemo() {
  // ① 读写台
  const [input, setInput] = useState('abc123')
  const [store, setStore] = useState(readAll)
  const [writeNote, setWriteNote] = useState('')

  // ② 容量实测日志
  const [capLogs, setCapLogs] = useState([])

  // ③ 请求头模拟
  const [reqLines, setReqLines] = useState([])

  // ④ 跨标签广播
  const [broadcasts, setBroadcasts] = useState([])
  const [pingSent, setPingSent] = useState(0)

  // 真实监听 storage 事件：只在"别的标签页"改动同源 localStorage 时触发
  useEffect(() => {
    const onStorage = (e) => {
      setBroadcasts((list) => [
        ...list.slice(-7),
        { id: `${e.key}-${list.length}`, text: `📡 收到其他标签页的 storage 事件：key=${e.key ?? '(清空)'}，新值=${e.newValue ?? 'null'}`, tone: 'ok' },
      ])
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const pushCapLog = (log) => setCapLogs((list) => [...list, log])

  const writeAll = () => {
    const value = input.trim() || 'abc123'
    localStorage.setItem(TOKEN_KEY, value)
    sessionStorage.setItem(TOKEN_KEY, value)
    document.cookie = `${TOKEN_KEY}=${value}; path=/; max-age=86400`
    setStore(readAll())
    setWriteNote(`已用真实 API 写入三处（cookie 带 max-age=86400）。试试刷新页面、再开一个新标签页对比谁能活下来。`)
  }

  const clearAll = () => {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`
    setStore({ ls: null, ss: null, ck: null })
    setWriteNote('三处已清空。')
  }

  // 写一个指定大小的 cookie，回读验证浏览器是否真的存下
  const tryCookie = (kb) => {
    const payload = 'x'.repeat(kb * 1024)
    document.cookie = `ws_demo_big=${payload}; path=/; max-age=600`
    const stored = document.cookie.split('; ').some((p) => p.startsWith('ws_demo_big='))
    if (stored) document.cookie = 'ws_demo_big=; path=/; max-age=0'
    pushCapLog({
      target: `Cookie 写 ${kb}KB`,
      ok: stored,
      verdict: stored
        ? '✅ 存下了（回读 document.cookie 能找到该键）'
        : '❌ 被浏览器静默丢弃：写入不报错，但 document.cookie 里根本没有它（单条约 4KB 上限）',
    })
  }

  const tryLocalStorage = () => {
    const chunk = 'x'.repeat(1024 * 1024)
    try {
      localStorage.setItem('ws_demo_1mb', chunk)
      const size = localStorage.getItem('ws_demo_1mb').length
      localStorage.removeItem('ws_demo_1mb')
      pushCapLog({ target: 'localStorage 写 1MB', ok: true, verdict: `✅ 瞬间写入，回读长度 ${size.toLocaleString()} 字符（≈1MB），已随手删除` })
    } catch (err) {
      pushCapLog({ target: 'localStorage 写 1MB', ok: false, verdict: `❌ ${err.name}：${err.message}` })
    }
  }

  // 循环灌 256KB 直到配额爆炸，finally 里把写进去的键全部删掉
  const fillQuota = () => {
    const chunk = 'x'.repeat(256 * 1024)
    const written = []
    try {
      for (let i = 0; i < 96; i += 1) {
        const key = `${QUOTA_PREFIX}${i}`
        localStorage.setItem(key, chunk)
        written.push(key)
      }
      pushCapLog({ target: 'localStorage 灌到爆', ok: true, verdict: `写了 ${(written.length * 0.25).toFixed(2)}MB 还没炸（配额比想象大），已清理` })
    } catch (err) {
      pushCapLog({
        target: 'localStorage 灌到爆',
        ok: false,
        verdict: `💥 ${err.name}：写到约 ${(written.length * 0.25).toFixed(2)}MB 配额爆炸（一般 5MB 左右）。本次写入的临时键已全部清理`,
      })
    } finally {
      written.forEach((key) => localStorage.removeItem(key))
    }
  }

  // 拼一次"真实将要发出去"的请求头：只有 cookie 会出现在里面
  const fireRequest = () => {
    const cookieHeader = document.cookie.trim()
    const lines = [
      { text: 'GET /api/user/profile HTTP/1.1', tone: 'plain' },
      { text: 'Host: shop.example.com', tone: 'plain' },
    ]
    if (cookieHeader) {
      lines.push({ text: `Cookie: ${cookieHeader.length > 120 ? `${cookieHeader.slice(0, 120)}…` : cookieHeader}`, note: '↑ 自动附加：你的 fetch/axios 代码里并没有写这一行', tone: 'ok' })
    } else {
      lines.push({ text: '（没有 Cookie 头：当前域下 document.cookie 为空，先用 ① 写入一个）', tone: 'bad' })
    }
    lines.push({ text: `localStorage['${TOKEN_KEY}'] = ${store.ls ?? 'null'}`, note: '↑ 不会出现在请求里：服务器完全看不见它', tone: 'mute' })
    lines.push({ text: `sessionStorage['${TOKEN_KEY}'] = ${store.ss ?? 'null'}`, note: '↑ 同上，关闭标签页就没了', tone: 'mute' })
    setReqLines(lines)
  }

  const sendPing = (where) => {
    const next = pingSent + 1
    setPingSent(next)
    if (where === 'local') {
      localStorage.setItem(PING_KEY, String(next))
      setBroadcasts((list) => [
        ...list.slice(-7),
        { id: `send-${next}`, text: `📤 本标签页向 localStorage 写入 ${PING_KEY}=${next}。注意：自己触发的那次不会收到 storage 事件（规范如此），要另一个标签页来收`, tone: 'send' },
      ])
    } else {
      sessionStorage.setItem(PING_KEY, String(next))
      setBroadcasts((list) => [
        ...list.slice(-7),
        { id: `ss-${next}`, text: `🔒 本标签页向 sessionStorage 写入 ${PING_KEY}=${next}。别的标签页有一份独立的 sessionStorage，永远看不到这条`, tone: 'bad' },
      ])
    }
  }

  const storages = [
    { name: 'localStorage', value: store.ls, api: 'localStorage.setItem/getItem' },
    { name: 'sessionStorage', value: store.ss, api: 'sessionStorage.setItem/getItem' },
    { name: 'Cookie', value: store.ck, api: 'document.cookie = "k=v; path=/"' },
  ]

  return (
    <div className="demo-wrap ws-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 三种存储当场读写</h2>
        <p className="ws-sub">
          这页<b>不是示意图</b>：每个按钮都在真的调用 <code>document.cookie</code> /{' '}
          <code>localStorage</code> / <code>sessionStorage</code>（键统一 <code>ws_demo_</code> 前缀，可一键清理）。
          亲手跑一遍，比背十遍对比表都牢。
        </p>
      </div>

      {/* ① 三存储读写台 */}
      <section className="ws-card">
        <div className="ws-card-head">
          <span className="ws-card-title">① 三存储读写台</span>
          <code className="ws-card-src">同一个值写三处，看谁存下了、谁能活过刷新</code>
        </div>
        <div className="btn-row ws-toolbar">
          <label className="ws-field">
            值 =
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="abc123" />
          </label>
          <button className="ws-primary" onClick={writeAll}>▶ 写入三处</button>
          <button className="ghost" onClick={clearAll}>↺ 清空三处</button>
        </div>
        <div className="ws-readout">
          {storages.map((s) => (
            <div className="ws-readrow" key={s.name}>
              <b>{s.name}</b>
              <code>{s.api}</code>
              <span className={s.value ? 'ws-have' : 'ws-none'}>
                {s.value ? `✅ 回读到：${s.value}` : '（空的 / 未存）'}
              </span>
            </div>
          ))}
        </div>
        {writeNote && <p className="ws-note">{writeNote}</p>}
        <p className="ws-tip">
          💡 验证生命周期：<b>刷新本页</b> → 三者都在（cookie 带 max-age、sessionStorage 同标签页刷新保留）；
          <b>新开一个标签页打开本站</b> → cookie / localStorage 的值还在，sessionStorage 是新的空副本。
        </p>
      </section>

      {/* ② 容量实测 */}
      <section className="ws-card">
        <div className="ws-card-head">
          <span className="ws-card-title">② 容量实测：4KB vs 5MB</span>
          <code className="ws-card-src">超标的 cookie 被"静默丢弃"——写入根本不报错</code>
        </div>
        <div className="btn-row">
          <button className="ghost" onClick={() => tryCookie(3)}>写 3KB cookie</button>
          <button className="ghost" onClick={() => tryCookie(5)}>写 5KB cookie</button>
          <button className="ghost" onClick={tryLocalStorage}>写 1MB localStorage</button>
          <button className="ghost" onClick={fillQuota}>💥 localStorage 灌到爆</button>
        </div>
        {capLogs.length ? (
          <div className="ws-logs">
            {capLogs.map((log, i) => (
              <p className={log.ok ? 'ws-event ws-ok' : 'ws-event ws-bad'} key={i}>
                <b>{log.target}</b> → {log.verdict}
              </p>
            ))}
          </div>
        ) : (
          <p className="ws-empty">先点「写 3KB」再点「写 5KB」：同一个 API，一个成功一个悄无声息地失败，这就是 cookie 的 4KB 单条上限。</p>
        )}
      </section>

      {/* ③ 请求头模拟 */}
      <section className="ws-card">
        <div className="ws-card-head">
          <span className="ws-card-title">③ 谁会跟着请求上服务器？</span>
          <code className="ws-card-src">只有 Cookie：同域每个请求（含图片 / JS）都自动带</code>
        </div>
        <div className="btn-row">
          <button className="ws-primary" onClick={fireRequest}>▶ 发起一次 GET /api/user/profile</button>
        </div>
        {reqLines.length ? (
          <pre className="ws-req">
            {reqLines.map((line, i) => (
              <span key={i} className={`ws-req-${line.tone}`}>
                {line.text}
                {line.note && <em>{'  // '}{line.note}</em>}
                {'\n'}
              </span>
            ))}
          </pre>
        ) : (
          <p className="ws-empty">先在 ① 里写入一个 token，再来点这个按钮——看请求头里那行自动冒出来的 Cookie。</p>
        )}
      </section>

      {/* ④ 跨标签广播 */}
      <section className="ws-card">
        <div className="ws-card-head">
          <span className="ws-card-title">④ 跨标签页通信：storage 事件真实监听中</span>
          <code className="ws-card-src">window.addEventListener('storage', ...) —— 只在别的标签页触发</code>
        </div>
        <div className="btn-row">
          <button className="ws-primary" onClick={() => sendPing('local')}>📡 用 localStorage 广播（已发 {pingSent} 次）</button>
          <button className="ghost" onClick={() => sendPing('session')}>🔒 用 sessionStorage 广播（对照组）</button>
        </div>
        {broadcasts.length ? (
          <div className="ws-logs">
            {broadcasts.map((b) => (
              <p className={`ws-event ${b.tone === 'ok' ? 'ws-ok' : b.tone === 'bad' ? 'ws-bad' : ''}`} key={b.id}>
                {b.text}
              </p>
            ))}
          </div>
        ) : (
          <p className="ws-empty">
            操作指引：把本页在<b>第二个标签页</b>也打开（同源即可），一边点「用 localStorage 广播」，
            另一边的日志区会<b>真的</b>滚出 storage 事件——而 sessionStorage 那条永远不会跨页出现。
          </p>
        )}
        <p className="ws-tip">
          💡 这就是"不引入任何库做跨标签页同步"（如同步登录/登出状态）的原生方案；更正式的替代是 BroadcastChannel API。
        </p>
      </section>
    </div>
  )
}
