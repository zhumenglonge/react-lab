/* =========================================================
 * 🎯 面试总结：React Router 三个标签
 * ---------------------------------------------------------
 * 三段式：速查表 → 职责链口述 → 高频追问 → 话术模板
 * ========================================================= */

const TAG_TABLE = [
  {
    tag: '<BrowserRouter>',
    duty: '数据源：把地址栏读成 location，经 Context 下发',
    one: '现在地址是什么',
    vue: 'createRouter({ history: createWebHistory() }) + app.use(router)',
    miss: 'useLocation / useNavigate 直接报错，<Routes> 拿不到地址',
  },
  {
    tag: '<Routes>',
    duty: '匹配器：拿 location 去配置里挑出唯一命中项',
    one: '该显示谁',
    vue: '无对应标签（Vue 在 router 内部隐式匹配）',
    miss: '里面所有 Route 都成了摆设，页面空白',
  },
  {
    tag: '<Route>',
    duty: '配置项：一条 { path → element } 记录',
    one: '候选答案',
    vue: 'routes 数组里的一项 { path, component }',
    miss: '没有候选，直接 404 / 空白',
  },
  {
    tag: '<Outlet />',
    duty: '出口：子路由渲染到父组件的位置',
    one: '插槽',
    vue: '<router-view />',
    miss: '子路由匹配成功了也显示不出来（最高频的坑）',
  },
]

const CHAIN = [
  '地址变化：点 <Link>、手输 URL、前进/后退',
  'BrowserRouter 的 history 监听器收到变化，更新 Context 里的 location',
  'Routes 拿到新 location，把嵌套 Route 摊平成完整路径，按“具体度”排名找出整条匹配链',
  '取最优的一条，渲染它的 element；没命中的 Route 根本不进渲染树',
  '若 element 里有 <Outlet />，再按匹配链把下一层渲染出来（逐层递归）',
]

const QA = [
  {
    q: 'BrowserRouter / HashRouter / MemoryRouter 怎么选？',
    a: '三者只差"history 从哪来"：BrowserRouter 用 HTML5 history（URL 干净，需要服务端 rewrite 兜底）；HashRouter 用 # 片段（静态托管友好，刷新永不 404）；MemoryRouter 把历史存在内存里（测试、React Native、SSR 用，地址栏不动）。下面的 Routes/Route 写法完全一样，只换最外层一个标签。',
  },
  {
    q: 'React Router v6 和 v5 有什么区别？',
    a: '四条：① <Switch> 换成 <Routes>；② 渲染方式从 component/render/children 统一成 element={<X />}；③ 嵌套路由改成"集中式声明 + <Outlet /> 出口"（更接近 Vue 的 children）；④ 新增相对路径与 index 路由，路由匹配改为按具体度排名而不是书写顺序。导航 API 也从 useHistory 换成 useNavigate。',
  },
  {
    q: 'React Router v6 和 v5 / Vue Router 比，结构上最大的不同？',
    a: 'React 是“一个 <Routes> 算完整条匹配链，再靠 <Outlet /> 逐层吐出”；Vue 是每层 <router-view /> 各自对照 children 匹配。所以 React 侧常出现“只写了一个 Routes 就能层层嵌套”的写法，嵌套层数全靠 Route 的父子关系和 Outlet 决定。',
  },
  {
    q: '路由守卫 / 登录鉴权怎么做？',
    a: 'React Router 没有 beforeEach 那种钩子。常用两种：① 写一个守卫组件包住路由，内部判断后 return <Navigate to="/login" replace />；② v6.4+ 的数据路由用 loader 里 throw redirect()。前者最通用，面试答第一种即可，并补一句"刷新后的鉴权状态要从 localStorage/token 里恢复"。',
  },
  {
    q: '路由懒加载怎么配合？',
    a: 'React.lazy(() => import(...)) + 外层 <Suspense fallback>，本质就是动态 import 的代码分割（Vue 侧是 () => import()）。本知识库的 registry.js 就是这么做的：每个主题一个 chunk，点进去才下载。',
  },
  {
    q: '路由传参有几种方式？',
    a: '三种：① 动态段 /topic/:id → useParams()，刷新还在；② 查询串 ?tab=run → useSearchParams()，刷新还在；③ state（navigate("/x", { state }) 或 <Link state>）→ useLocation().state，刷新就丢。对应 Vue 的 params/query，第三种对应 router.push 的 state。',
  },
  {
    q: '为什么刷新子页面就 404？',
    a: '因为请求先到服务器，而服务器上并没有 /topic/xxx 这个物理文件。要么用 HashRouter，要么让服务端把未命中的路径 rewrite 回 index.html（nginx try_files、Vercel rewrites、GitHub Pages 用 404.html 转发）。这是"前端路由 vs 服务端路由"的分界线，答到这一层就够深了。',
  },
  {
    q: '怎么监听路由变化做埋点 / 滚动复位？',
    a: 'v6 没有 onRouteChange 事件，拿 useLocation() 再用 useEffect 依赖 pathname 即可（Vue 侧是 watch($route)）。滚动复位别用 useEffect 直接 window.scrollTo，放到 useLayoutEffect 里更稳，避免先闪一下旧位置。',
  },
  {
    q: '那个"标签写了好像没反应"的直觉对吗？',
    a: '对了一半：<Routes> 和 <Route> 都不产生任何 DOM，它们只是给路由器读的配置，所以你在 Elements 面板里永远搜不到 route 标签。真正落到 DOM 的是被命中的那个 element。<Outlet /> 也是个"空组件"，它只是个占位出口。',
  },
]

export default function Summary() {
  return (
    <div className="rr-summary">
      <section className="rr-block">
        <h3>🎯 一句话答题</h3>
        <p className="rr-lead">
          React Router 是一棵<b>组件树</b>，不是一份路由表：<b>BrowserRouter</b>{' '}
          负责把地址栏读成 location（数据源），<b>Routes</b> 拿 location
          去匹配挑出唯一命中的分支（匹配器），<b>Route</b> 是
          “哪条路径对应哪个 element”的配置项，<b>Outlet</b>{' '}
          是子路由的出口。前两个都不产生 DOM，所以第一次读会觉得“标签写了却没反应”。
        </p>
      </section>

      <section className="rr-block">
        <h3>📋 三个标签速查（含写错会怎样）</h3>
        <table className="rr-compare">
          <thead>
            <tr>
              <th>标签</th>
              <th>职责</th>
              <th>一句话</th>
              <th>Vue 对应</th>
              <th>漏了会怎样</th>
            </tr>
          </thead>
          <tbody>
            {TAG_TABLE.map((r) => (
              <tr key={r.tag}>
                <td><code>{r.tag}</code></td>
                <td>{r.duty}</td>
                <td><b>{r.one}</b></td>
                <td>{r.vue}</td>
                <td>{r.miss}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rr-block">
        <h3>🔗 一次地址变化的完整职责链（口述这 5 步最加分）</h3>
        <ol className="rr-chain">
          {CHAIN.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="rr-note">
          记忆口诀：<b>Router 报站名 → Routes 查时刻表 → Route 是表上的每一行 → Outlet 是把乘客送到门口的那道门</b>。
        </p>
      </section>

      <section className="rr-block">
        <h3>❓ 高频追问</h3>
        <div className="rr-qa">
          {QA.map((item, i) => (
            <details key={item.q} open={i === 0}>
              <summary>
                <span className="rr-qa-idx">Q{i + 1}</span>
                {item.q}
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rr-block">
        <h3>🛠 项目落点（能直接说自己的活）</h3>
        <ul className="rr-list">
          <li>
            <b>这个知识库为什么不用 react-router：</b>部署在 GitHub Pages 子路径
            <code> /react-lab/ </code>下，App.jsx 手写了约 20 行 hashchange 路由，刷新永远 200、零服务端配置；主题页用 <code>registry.js</code> 注册 + React.lazy 按需加载，等价于路由级代码分割。
          </li>
          <li>
            <b>如果换成 react-router：</b>改 4 处即可 —— HashRouter 包根、<code>/</code> 与 <code>/topic/:id</code> 两条路由、<code>useParams()</code> 取 id、<code>useNavigate()</code> 替代现在的 <code>goto()</code>。
          </li>
          <li>
            <b>踩过的坑：</b>曾经用 <code>&lt;a href="#/topic/x"&gt;</code>{' '}
            做跳转导致整页刷新、状态全丢，后来统一改成 <code>location.hash</code> + 状态同步（对应 <code>&lt;Link&gt;</code> 的思路）。
          </li>
        </ul>
      </section>

      <blockquote>
        <p>
          面试官问“说说这三个标签”，别背 API，按<b>数据流</b>讲：地址变化 → BrowserRouter
          把 location 广播出去 → Routes 按具体度排名挑一条 → 命中的 Route 的 element
          进渲染树 → 里面若还有 Outlet 就继续递归。
        </p>
        <p>
          被追问“怎么保证不白屏/不 404”，补两句就够：<b>父路由必须有 Outlet</b>、<b>静态托管要么 HashRouter，要么服务端把未知路径 rewrite 回 index.html</b>。
        </p>
      </blockquote>
    </div>
  )
}
