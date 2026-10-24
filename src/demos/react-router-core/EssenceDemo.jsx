import { useState } from 'react'
import { DEMO_URLS, matchPathname } from './shared.js'

/* =========================================================
 * ① 三个标签的职责实跑
 * ---------------------------------------------------------
 * 上半部分：地址栏换 URL，三个标签一步步"各干各的活"，
 *          每一步都把它此刻的输入/输出摊开给你看。
 * 下半部分：极简三列表（本质 + Vue 对应）+ 三张职责卡
 *          （点开看细节）+ JSX → JS 翻译开关。
 * ========================================================= */

const TAG_CARDS = [
  {
    key: 'browser',
    name: '<BrowserRouter>',
    step: 'Step 1 · 提供地址',
    oneLiner: '把"地址栏"接进 React 的数据提供者',
    vue: 'createRouter({ history: createWebHistory() }) + app.use(router)',
    points: [
      '底层是 window.history（pushState + popstate），地址栏一变就触发重渲染',
      '把当前 location 通过 React Context 往下传，所以它必须包在最外层',
      '自己不渲染任何东西，只渲染 children —— 它是"数据源"，不是"路由器"',
      '换成 HashRouter / MemoryRouter 只换这一层，下面的 Routes/Route 一行不用改',
    ],
    trap: '它只负责"现在地址是什么"，完全不负责"该显示什么"。别指望它做匹配。',
  },
  {
    key: 'routes',
    name: '<Routes>',
    step: 'Step 2 · 做选择',
    oneLiner: '拿 location 去配置里挑出唯一命中的那一条',
    vue: '没有对应标签：Vue Router 的匹配在 router 内部隐式完成',
    points: [
      '整个应用通常只需要一个 <Routes>：它把嵌套 Route 摊平成完整路径，一次性算出整条匹配链',
      '命中顺序按"具体度"排名：静态段 > :动态段 > * 通配',
      '每次地址变化都重新匹配一遍，命中的那条渲染它的 element',
      '没命中的 Route 不是 display:none，而是根本不进渲染树（没有 DOM）',
    ],
    trap: '它自己也不产生 DOM，只决定"渲染谁"。嵌套层级也不靠写多个 <Routes>，而是靠每层的 <Outlet /> 把下一层渲染出来。',
  },
  {
    key: 'route',
    name: '<Route>',
    step: 'Step 3 · 候选答案',
    oneLiner: '一条 { path → element } 的映射记录，是配置不是视图',
    vue: 'routes: [{ path, component }] 数组里的一条',
    points: [
      'path 写相对路径（子路由不以 / 开头）；index 表达"父路径本身"',
      '* 是 splat 兜底，剩余路径可用 useParams()["*"] 取到',
      'element 要传"元素"：<Home />；传组件函数 Home 会报错',
      '不写 element 时 v6 默认渲染 <Outlet />，这正是那段模板"能跑"的原因',
    ],
    trap: '写 100 条 Route 也不会多出一个 DOM 节点，它只是给 <Routes> 看的配置。',
  },
]

/* 🧩 极简三列表：一行讲清"本质 + Vue 对应"，先建整体印象再进细节 */
const ESSENCE_TABLE = [
  {
    tag: '<BrowserRouter>',
    essence: '一个 Context Provider：监听 history 变化，把当前 location 往下传给所有子组件',
    vue: 'createRouter({ history: createWebHistory() }) + app.use(router)',
  },
  {
    tag: '<Routes>',
    essence: '一个匹配器：location 一变就重新匹配一遍，只渲染命中的那一条分支',
    vue: 'Vue 内部的路由匹配阶段（没有对应标签，是隐式发生的）',
  },
  {
    tag: '<Route>',
    essence: '一条映射记录 { path → component }，自己不渲染任何 DOM',
    vue: 'routes: [{ path, component }] 里的一条',
  },
  {
    tag: '<Outlet>',
    essence: '子路由的"插槽"（你通常看不到，但父路由必需）',
    vue: '<router-view />',
  },
]

const JSX_VERSION = `<BrowserRouter>
  <Routes>
    <Route path="/" element={<Layout />}>                  {/* 布局层：内部要有 <Outlet /> */}
      <Route index element={<Home />} />                   {/* 就是 "/" 本身 */}
      <Route path="topic/:id" element={<TopicPage />} />   {/* 子路由写相对路径 */}
      <Route path="*" element={<NotFound />} />            {/* 404 兜底 */}
    </Route>
  </Routes>
</BrowserRouter>`

const JS_VERSION = `import { createElement as h } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

h(BrowserRouter, null,
  h(Routes, null,
    h(Route, { path: '/', element: h(Layout) },
      h(Route, { index: true, element: h(Home) }),
      h(Route, { path: 'topic/:id', element: h(TopicPage) }),
      h(Route, { path: '*', element: h(NotFound) }),
    ),
  ),
)

// 结论：所谓"三个标签"就是三次函数调用。
// BrowserRouter 提供 location → Routes 收到这堆配置挑一个 →
// Route 的每个 props 只是配置项，一个都不会落地成 DOM。`

export default function EssenceDemo() {
  const [url, setUrl] = useState(DEMO_URLS[0].url)
  const [openTag, setOpenTag] = useState('browser')
  const [showJs, setShowJs] = useState(false)

  const { pathname, results, hit, shadowed, render } = matchPathname(url)
  const card = TAG_CARDS.find((c) => c.key === openTag)

  return (
    <div className="demo-wrap rr-essence">
      <div className="demo-header">
        <h3>三个标签，三个工种：一个提供地址、一个做选择、一个当候选</h3>
        <p className="desc">
          点地址栏换路径，看 Router → Routes → Route
          各自在这一刻算出什么（匹配器是本页手写的迷你版，规则同 v6）
        </p>
      </div>

      {/* ---------- 地址栏 ---------- */}
      <div className="rr-urlbar" role="group" aria-label="模拟地址栏">
        <span className="rr-urlbar-chrome">
          <i className="rr-dot" />
          <i className="rr-dot" />
          <i className="rr-dot" />
        </span>
        <span className="rr-urlbar-host">https://zhumenglonge.github.io</span>
        <span className="rr-urlbar-path">{pathname}</span>
      </div>

      <div className="rr-url-chips">
        {DEMO_URLS.map((d) => (
          <button
            key={d.url}
            className={d.url === url ? 'rr-chip on' : 'rr-chip'}
            onClick={() => setUrl(d.url)}
            title={d.hint}
          >
            {d.url}
          </button>
        ))}
      </div>
      <p className="rr-hint">
        💡 {DEMO_URLS.find((d) => d.url === url)?.hint}
      </p>

      {/* ---------- 三步骤流水线 ---------- */}
      <div className="rr-pipeline">
        {/* Step 1 */}
        <section className="rr-step">
          <header className="rr-step-head">
            <span className="rr-step-badge">1</span>
            <div>
              <div className="rr-step-name">&lt;BrowserRouter&gt; 报地址</div>
              <div className="rr-step-sub">把地址栏读成 location，塞进 Context</div>
            </div>
          </header>
          <pre className="code rr-code-sm">{`location = {
  pathname: "${pathname}",
  search: "",
  hash: "",
}`}</pre>
          <p className="rr-step-note">
            往下传之后，任何一层组件 <code>useLocation()</code> 都能读到这个对象。
          </p>
        </section>

        {/* Step 2 */}
        <section className="rr-step">
          <header className="rr-step-head">
            <span className="rr-step-badge">2</span>
            <div>
              <div className="rr-step-name">&lt;Routes&gt; 做匹配</div>
              <div className="rr-step-sub">
                遍历 Route 配置，按具体度排名，取第一名
              </div>
            </div>
          </header>
          <ul className="rr-match-list">
            {results.map((r) => (
              <li
                key={r.key}
                className={[
                  'rr-match',
                  r.matched ? 'is-hit' : 'is-miss',
                  hit?.key === r.key ? 'is-winner' : '',
                  shadowed.some((s) => s.key === r.key) ? 'is-shadowed' : '',
                ].join(' ')}
              >
                <span className="rr-match-flag">
                  {hit?.key === r.key ? '✅ 命中' : r.matched ? '⚠️ 也匹配' : '❌ 不匹配'}
                </span>
                <span className="rr-match-label">{r.label}</span>
                <span className="rr-match-score">具体度 {r.score}</span>
                <span className="rr-match-reason">{r.reason}</span>
              </li>
            ))}
          </ul>
          <p className="rr-step-note">
            ⚠️ 注意 <code>*</code> 和 <code>:id</code> 可能"同时匹配"，但 v6
            先按具体度排序再取最优，不是谁写在前面谁赢。
          </p>
        </section>

        {/* Step 3 */}
        <section className="rr-step">
          <header className="rr-step-head">
            <span className="rr-step-badge">3</span>
            <div>
              <div className="rr-step-name">&lt;Route&gt; 交出自己</div>
              <div className="rr-step-sub">只有冠军的 element 进渲染树</div>
            </div>
          </header>
          <pre className="code rr-code-sm">{render}</pre>
          <p className="rr-step-note">
            其余 Route 什么也不渲染 —— 不是隐藏，是压根没进渲染树。
          </p>
        </section>
      </div>

      <p className="rr-analogy">
        🧠 一句话记忆：<b>Router 报站名 → Routes 查时刻表 → Route 是表上的每一行</b>
        。站名只有一个，时刻表只挑出一班，其余班次今天不发车。
      </p>

      {/* ---------- 极简对照表 ---------- */}
      <div className="rr-table-wrap">
        <div className="rr-table-head">
          🧩 一张表看懂三个标签的本职
          <span>（第二列里"产不产生 DOM"就是它们真正的分界线）</span>
        </div>
        <table className="rr-compare rr-essence-table">
          <thead>
            <tr>
              <th>标签</th>
              <th>本质</th>
              <th>Vue 对应</th>
            </tr>
          </thead>
          <tbody>
            {ESSENCE_TABLE.map((r) => (
              <tr key={r.tag}>
                <td>
                  <code>{r.tag}</code>
                </td>
                <td>{r.essence}</td>
                <td>{r.vue}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rr-table-foot">
          读法：三个标签里只有被命中的 <code>element</code>{' '}
          会真的落到页面上，其余全是不产生 DOM 的配置；<b>Outlet 不写也不会报错，只会白屏</b>，所以它最容易被漏掉。
        </p>
      </div>

      {/* ---------- 职责卡 ---------- */}
      <div className="rr-sub-head">👇 再点开单个标签看细节</div>
      <div className="rr-tag-cards">
        {TAG_CARDS.map((c) => (
          <button
            key={c.key}
            className={c.key === openTag ? 'rr-tag-card on' : 'rr-tag-card'}
            onClick={() => setOpenTag(c.key)}
          >
            <span className="rr-tag-step">{c.step}</span>
            <span className="rr-tag-name">{c.name}</span>
            <span className="rr-tag-one">{c.oneLiner}</span>
          </button>
        ))}
      </div>

      <div className="rr-tag-detail">
        <h4>{card.name} 到底在干什么</h4>
        <div className="rr-kv">
          <span className="rr-k">Vue 里的同位体</span>
          <span className="rr-v">{card.vue}</span>
        </div>
        <ul>
          {card.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="rr-tag-trap">🪤 {card.trap}</p>
      </div>

      {/* ---------- JSX → JS ---------- */}
      <div className="rr-code-switch">
        <button className={!showJs ? 'rr-chip on' : 'rr-chip'} onClick={() => setShowJs(false)}>
          看 JSX 写法
        </button>
        <button className={showJs ? 'rr-chip on' : 'rr-chip'} onClick={() => setShowJs(true)}>
          翻译成 JS（破除神秘感）
        </button>
      </div>
      <pre className="code">{showJs ? JS_VERSION : JSX_VERSION}</pre>
      <p className="tip">
        觉得标签陌生时就这样翻译一次：<code>&lt;A x=&#123;1&#125;&gt;</code> 等价于{' '}
        <code>h(A, &#123; x: 1 &#125;)</code>。标签名 = 组件函数，属性 = 一个对象，
        子节点 = 第三个参数。<code>Route</code> 只是"收到的 props 长得像路由配置"的组件而已。
      </p>
    </div>
  )
}
