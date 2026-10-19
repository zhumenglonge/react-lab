import { useState } from 'react'

/* =========================================================
 * ② 字段本质与陷阱：三组可切换的对拍
 * ---------------------------------------------------------
 * A) Cache-Control 取值台：点不同指令，看"发不发请求 / 谁能缓存"
 * B) Expires vs Cache-Control：切"客户端时钟准 / 不准"，
 *    演示 Expires 用绝对时间会被客户端时钟带偏，max-age 相对时间免疫
 * C) Last-Modified vs ETag：切场景，演示 Last-Modified 的两个盲区
 *    （秒级粒度、改了又改回原样）与 ETag 内容指纹的精确
 * ========================================================= */

/* ---------- A) Cache-Control 取值 ---------- */
const CC_VALUES = [
  {
    key: 'max-age',
    label: 'max-age=3600',
    request: '不发（有效期内）',
    who: '浏览器 + CDN',
    tone: 'success',
    desc: '从收到响应的时刻起缓存 1 小时。用的是相对时长，不受客户端时钟影响，优先级高于 Expires。',
  },
  {
    key: 'no-cache',
    label: 'no-cache',
    request: '每次都要问服务器（协商）',
    who: '浏览器 + CDN（但需回源校验）',
    tone: 'warning',
    desc: '⚠️ 高频陷阱：no-cache 不是"不缓存"，而是"可以存，但每次用之前必须回服务器协商确认"。它禁用的是强缓存，不是缓存本身。',
  },
  {
    key: 'no-store',
    label: 'no-store',
    request: '每次都全新下载',
    who: '谁都不许存',
    tone: 'danger',
    desc: '真正的完全不缓存：既不写本地、也不写 CDN，每次重新下载。敏感页面（含隐私/支付）才用它。',
  },
  {
    key: 'public',
    label: 'public',
    request: '看 max-age',
    who: '浏览器 + 中间代理/CDN 都能缓存',
    tone: 'accent',
    desc: '响应可被任何缓存节点存储，包括共享的 CDN / 反向代理。适合公共静态资源。',
  },
  {
    key: 'private',
    label: 'private',
    request: '看 max-age',
    who: '只允许浏览器，代理不许存',
    tone: 'accent',
    desc: '响应只属于单个用户（如带 Cookie 的个人数据），中间代理不得缓存。这是默认行为。',
  },
  {
    key: 'immutable',
    label: 'immutable',
    request: '有效期内完全不问',
    who: '浏览器（连协商都跳过）',
    tone: 'success',
    desc: '告诉浏览器"有效期内内容绝不变"，连 304 协商都省了。配合文件名带 hash 的静态资源最佳。',
  },
]

/* ---------- B) Expires vs Cache-Control ---------- */
const CLOCK_CASES = {
  accurate: {
    label: '客户端时钟准确',
    expiresVerdict: 'ok',
    note: '客户端和服务器时间一致，Expires 判断正常。',
  },
  slow: {
    label: '客户端时钟慢了 2 小时',
    expiresVerdict: 'bad',
    note: '服务器认为已过期，但客户端拿自己的（慢的）钟表一比 → 以为"还没到期"，继续用陈旧缓存。',
  },
  fast: {
    label: '客户端时钟快了 2 小时',
    expiresVerdict: 'bad',
    note: '服务器认为还没到期，客户端却以为过期了 → 过早失效，白白回源，浪费带宽。',
  },
}

/* ---------- C) Last-Modified vs ETag ---------- */
const LM_CASES = {
  normal: {
    label: '正常修改（间隔 > 1 秒，内容确实变了）',
    lm: { verdict: 'ok', text: '时间戳前进了 → 判定失效 → 重新下载。判断正确 ✅' },
    etag: { verdict: 'ok', text: '内容哈希变了 → 判定失效 → 重新下载。判断正确 ✅' },
  },
  revert: {
    label: '改了又改回原样（内容最终没变）',
    lm: { verdict: 'bad', text: '文件修改时间戳变了 → 误判"已失效" → 明明内容一样却重新下载，浪费 ❌' },
    etag: { verdict: 'ok', text: '内容哈希没变 → ETag 相同 → 仍返回 304，复用本地 ✅' },
  },
  subsecond: {
    label: '秒内被频繁改动（Last-Modified 粒度只到秒）',
    lm: { verdict: 'bad', text: '同一秒内改了多次，时间戳没变化 → 漏判"未失效" → 用了旧缓存 ❌' },
    etag: { verdict: 'ok', text: '每次内容不同、哈希不同 → 能精确识别到秒级以下的变化 ✅' },
  },
}

function verdictClass(v) {
  return v === 'ok' ? 'hc-v-ok' : 'hc-v-bad'
}

export default function FieldDemo() {
  const [cc, setCc] = useState('max-age')
  const [clock, setClock] = useState('slow')
  const [lmCase, setLmCase] = useState('revert')

  const activeCc = CC_VALUES.find((c) => c.key === cc)
  const activeClock = CLOCK_CASES[clock]
  const activeLm = LM_CASES[lmCase]

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>② 字段本质与陷阱</h2>
        <p className="desc">
          缓存的四个关键请求/响应头，面试最爱挖三个坑：<code>no-cache≠不缓存</code>、
          <code>Expires 怕客户端时钟不准</code>、<code>Last-Modified 粒度只到秒</code>。逐组点着对比。
        </p>
      </div>

      {/* A) Cache-Control 取值台 */}
      <section className="hc-card">
        <h4>A · Cache-Control 取值台 <span className="hc-tag">强缓存核心</span></h4>
        <div className="hc-chips">
          {CC_VALUES.map((c) => (
            <button
              key={c.key}
              className={'hc-chip' + (c.key === cc ? ' on' : '')}
              onClick={() => setCc(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className={'hc-cc-detail hc-cc-' + activeCc.tone}>
          <div className="hc-cc-grid">
            <div><span className="hc-k">发不发请求</span><b>{activeCc.request}</b></div>
            <div><span className="hc-k">谁能缓存</span><b>{activeCc.who}</b></div>
          </div>
          <p className="hc-cc-desc">{activeCc.desc}</p>
        </div>
      </section>

      {/* B) Expires vs Cache-Control */}
      <section className="hc-card">
        <h4>B · Expires vs Cache-Control <span className="hc-tag">绝对 vs 相对时间</span></h4>
        <div className="hc-chips">
          {Object.entries(CLOCK_CASES).map(([k, v]) => (
            <button
              key={k}
              className={'hc-chip' + (k === clock ? ' on' : '')}
              onClick={() => setClock(k)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="hc-vs">
          <div className={'hc-vs-col ' + verdictClass(activeClock.expiresVerdict)}>
            <div className="hc-vs-head">⏰ Expires（绝对时间）</div>
            <p>服务器直接写死一个到期时刻，如 <code>Expires: Wed, 21 Oct 2026 07:28:00 GMT</code>。</p>
            <p className="hc-vs-verdict">{activeClock.note}</p>
          </div>
          <div className="hc-vs-col hc-v-ok">
            <div className="hc-vs-head">🎯 Cache-Control: max-age（相对时间）</div>
            <p>只写"存下来之后再过 3600 秒过期"，以<b>收到响应的本地时刻</b>起算。</p>
            <p className="hc-vs-verdict">不依赖"钟表是否准"，天然免疫客户端时钟偏差 → 所以它取代了 Expires。</p>
          </div>
        </div>
        <p className="hc-card-note">
          加分点：<b>两者同时存在时，Cache-Control 优先级更高</b>（HTTP/1.1 覆盖 HTTP/1.0 的 Expires）。
        </p>
      </section>

      {/* C) Last-Modified vs ETag */}
      <section className="hc-card">
        <h4>C · Last-Modified vs ETag <span className="hc-tag">协商缓存双字段</span></h4>
        <div className="hc-chips">
          {Object.entries(LM_CASES).map(([k, v]) => (
            <button
              key={k}
              className={'hc-chip' + (k === lmCase ? ' on' : '')}
              onClick={() => setLmCase(k)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="hc-vs">
          <div className={'hc-vs-col ' + verdictClass(activeLm.lm.verdict)}>
            <div className="hc-vs-head">🗓️ Last-Modified / If-Modified-Since</div>
            <p className="hc-vs-verdict">{activeLm.lm.text}</p>
          </div>
          <div className={'hc-vs-col ' + verdictClass(activeLm.etag.verdict)}>
            <div className="hc-vs-head">🔐 ETag / If-None-Match</div>
            <p className="hc-vs-verdict">{activeLm.etag.text}</p>
          </div>
        </div>
        <p className="hc-card-note">
          结论：ETag 是<b>内容指纹</b>，能解决 Last-Modified 的"秒级粒度"和"改了又改回原样"两个盲区，
          更精确；代价是服务器要算哈希。<b>两者同时存在时 ETag 优先</b>。
        </p>
      </section>
    </div>
  )
}
