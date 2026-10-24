import { useState } from 'react'
import { DEMO_URLS, matchPathname } from './shared.js'

/* =========================================================
 * ② 匹配规则与部署陷阱：三组对拍
 * ---------------------------------------------------------
 * A) 布局路由三写法：写 Outlet / 忘了 Outlet / 不写 element
 * B) 匹配优先级台：静态段 vs :id vs * 谁先命中（含 score）
 * C) BrowserRouter vs basename vs HashRouter：
 *    部署在 GitHub Pages 子路径 /react-lab/ 下"刷新"会发生什么
 * ========================================================= */

/* ---------- A) 布局路由三写法 ---------- */
const OUTLET_CASES = [
  {
    key: 'ok',
    label: '写对：父路由包一层 + <Outlet />',
    jsx: `<Route path="/" element={<Layout />}>
  <Route index element={<Home />} />
  <Route path="topic/:id" element={<TopicPage />} />
</Route>`,
    layout: `function Layout() {
  return (
    <>
      <Nav />
      <Outlet />   {/* 子路由从这里冒出来 */}
    </>
  )
}`,
    render: `<Layout>
  <Nav />
  <Outlet /> → <TopicPage id="react-fiber" />
</Layout>`,
    tone: 'ok',
    verdict: '✅ 子路由正常出现',
    note: '<Outlet /> 就是 Vue 的 <router-view /> —— 子路由的出口。',
  },
  {
    key: 'forget',
    label: '漏写：Layout 里忘了 <Outlet />',
    jsx: `<Route path="/" element={<Layout />}>
  <Route index element={<Home />} />
  <Route path="topic/:id" element={<TopicPage />} />
</Route>`,
    layout: `function Layout() {
  return (
    <>
      <Nav />
      {/* 👈 这里本该有 <Outlet /> */}
    </>
  )
}`,
    render: `<Layout>
  <Nav />
</Layout>`,
    tone: 'bad',
    verdict: '❌ 路由全配对了，页面上却只剩导航栏',
    note: 'v6 最贵的坑：匹配成功 ≠ 渲染出来，中间必须有一条 Outlet 出口。Vue 侧对应的错误就是"忘了写 <router-view>"。',
  },
  {
    key: 'none',
    label: '不写 element（最初那段模板的写法）',
    jsx: `<Route path="/">
  <Route index element={<Home />} />
  <Route path="topic/:id" element={<TopicPage />} />
</Route>`,
    layout: null,
    render: `<Outlet />   ← 这是 v6 自动帮你补的
  → <Home />`,
    tone: 'warn',
    verdict: '⚠️ 能跑，但等于放弃了布局能力',
    note: '父路由省略 element 时 v6 默认渲染 <Outlet />，所以那段模板"竟然还有页面"。它再把 index 和 /* 同时指向 MainPage，于是"任何路径都是同一页"——写了个空壳路由。',
  },
]

/* ---------- B) 陷阱清单 ---------- */
const TRAPS = [
  {
    title: 'index 不能有 children',
    detail:
      'index 表达"父路径本身"，它自己就是终点。硬往里塞子 Route 会直接抛错。需要二级页面就再包一层布局路由。',
  },
  {
    title: ':id 什么都吃，必须自己校验',
    detail:
      '/topic/随便乱写 也能命中。参数只是字符串，存不存在得页内查（本知识库的 topics.find(t => t.id === id) 就是干这个的），查不到要自己转 404。',
  },
  {
    title: 'element={Home} ❌ / element={<Home />} ✅',
    detail:
      'element 要的是"已经创建好的元素"。传组件函数等于把函数当 React 元素交给渲染器，页面直接报错。可以记成：element 的值必须长得像 JSX。',
  },
  {
    title: '<a href> 做站内跳转 = 整页刷新',
    detail:
      '浏览器重新请求 HTML、重新下载并执行 JS、丢光内存里的 state。站内跳转用 <Link>/<NavLink> 或 useNavigate()（即 Vue 的 <router-link>/router.push）。',
  },
  {
    title: '子路由别写绝对路径',
    detail:
      '子路由以 / 开头就是绝对路径，v6 要求它必须以"父路径拼起来的结果"开头，否则报错。统一写相对路径（topic/:id）最省心。',
  },
]

/* ---------- C) 部署对拍 ---------- */
const HOST_CASES = [
  {
    key: 'browser',
    label: 'BrowserRouter（没写 basename）',
    address: 'https://zhumenglonge.github.io/react-lab/topic/react-fiber',
    request: 'GET /react-lab/topic/react-fiber',
    tone: 'bad',
    verdict: '❌ 刷新直接 404',
    text: '静态服务器上根本没有 /react-lab/topic/react-fiber 这个文件；而且前端拿到的 pathname 是 /react-lab/topic/...，和路由表里的 /topic/... 也对不上，双重失败。',
  },
  {
    key: 'basename',
    label: 'BrowserRouter basename="/react-lab/"',
    address: 'https://zhumenglonge.github.io/react-lab/topic/react-fiber',
    request: 'GET /react-lab/topic/react-fiber',
    tone: 'warn',
    verdict: '⚠️ 匹配对上了，刷新依然 404',
    text: 'basename 只解决"前端怎么理解这段路径"，解决不了"服务器上有没有这个文件"。静态托管必须配服务端 rewrite（nginx try_files / 404.html 转发回 index.html）才救得回来。',
  },
  {
    key: 'hash',
    label: 'HashRouter',
    address: 'https://zhumenglonge.github.io/react-lab/#/topic/react-fiber',
    request: 'GET /react-lab/index.html',
    tone: 'ok',
    verdict: '✅ 刷新永远 200',
    text: '# 后面的部分不会发给服务器，浏览器永远只请求 index.html，路由全在前端完成。代价是 URL 里多一个 #、SEO 不友好。',
  },
]

export default function MatchDemo() {
  const [outletCase, setOutletCase] = useState('ok')
  const [url, setUrl] = useState(DEMO_URLS[1].url)
  const [hostCase, setHostCase] = useState('hash')

  const outlet = OUTLET_CASES.find((c) => c.key === outletCase)
  const host = HOST_CASES.find((c) => c.key === hostCase)
  const { results, hit, shadowed } = matchPathname(url)

  return (
    <div className="demo-wrap rr-match-demo">
      <div className="demo-header">
        <h3>四个"配置全对但页面不对"的现场</h3>
        <p className="desc">
          路由题真正的难点不在标签名字，而在这四件事：插槽、优先级、参数、部署
        </p>
      </div>

      {/* ============ A) 布局路由 + Outlet ============ */}
      <section className="rr-block">
        <h4>A · 父路由为什么必须配 &lt;Outlet /&gt;</h4>
        <div className="rr-chips">
          {OUTLET_CASES.map((c) => (
            <button
              key={c.key}
              className={c.key === outletCase ? 'rr-chip on' : 'rr-chip'}
              onClick={() => setOutletCase(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="rr-vs-2">
          <div className="rr-col">
            <div className="rr-col-head">路由配置</div>
            <pre className="code rr-code-sm">{outlet.jsx}</pre>
            {outlet.layout && (
              <>
                <div className="rr-col-head">布局组件</div>
                <pre className="code rr-code-sm">{outlet.layout}</pre>
              </>
            )}
          </div>
          <div className="rr-col">
            <div className="rr-col-head">实际渲染出来的树</div>
            <pre className="code rr-code-sm">{outlet.render}</pre>
            <div className={`rr-verdict is-${outlet.tone}`}>
              <b>{outlet.verdict}</b>
              <p>{outlet.note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ B) 匹配优先级 ============ */}
      <section className="rr-block">
        <h4>B · 谁先命中：静态段 &gt; :id &gt; *</h4>
        <div className="rr-chips">
          {DEMO_URLS.map((d) => (
            <button
              key={d.url}
              className={d.url === url ? 'rr-chip on' : 'rr-chip'}
              onClick={() => setUrl(d.url)}
            >
              {d.url}
            </button>
          ))}
        </div>

        <div className="rr-rank">
          {[...results]
            .sort((a, b) => b.score - a.score)
            .map((r) => (
              <div
                key={r.key}
                className={[
                  'rr-rank-row',
                  hit?.key === r.key ? 'is-winner' : '',
                  r.matched ? 'is-hit' : 'is-miss',
                ].join(' ')}
              >
                <span className="rr-rank-flag">
                  {hit?.key === r.key ? '🏆 胜出' : r.matched ? '匹配但被压住' : '不匹配'}
                </span>
                <code className="rr-rank-path">{r.label}</code>
                <span className="rr-rank-score">{r.score} 分</span>
              </div>
            ))}
        </div>
        <p className="rr-hint">
          {hit
            ? `当前 ${url} → 命中 ${hit.label}${
                shadowed.length ? `；${shadowed.map((s) => s.label).join('、')} 也匹配但被更具体的路由压住` : ''
              }`
            : '没有任何路由命中（真实项目里就是整页空白）'}
        </p>

        <ul className="rr-trap-list">
          {TRAPS.map((t) => (
            <li key={t.title}>
              <b>{t.title}</b>
              <span>{t.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ============ C) 部署对拍 ============ */}
      <section className="rr-block">
        <h4>C · 部署到 GitHub Pages 子路径后，刷新会发生什么</h4>
        <div className="rr-chips">
          {HOST_CASES.map((c) => (
            <button
              key={c.key}
              className={c.key === hostCase ? 'rr-chip on' : 'rr-chip'}
              onClick={() => setHostCase(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="rr-urlbar">
          <span className="rr-urlbar-chrome">
            <i className="rr-dot" />
            <i className="rr-dot" />
            <i className="rr-dot" />
          </span>
          <span className="rr-urlbar-path">{host.address}</span>
        </div>

        <div className="rr-request">
          <span className="rr-k">刷新时浏览器发出</span>
          <code>{host.request}</code>
        </div>

        <div className={`rr-verdict is-${host.tone}`}>
          <b>{host.verdict}</b>
          <p>{host.text}</p>
        </div>

        <p className="tip">
          💡 这也是本知识库不用 react-router-dom 的原因：部署在{' '}
          <code>/react-lab/</code> 子路径的静态 Pages 上，App.jsx
          里手写的 hash 路由（<code>#/topic/xxx</code>）刷新永远 200，零服务端配置。
          面试时被问"为什么不用 react-router"，这就是最硬的理由。
        </p>
      </section>
    </div>
  )
}
