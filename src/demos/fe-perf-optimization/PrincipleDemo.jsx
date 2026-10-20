import { useState, useRef, useEffect, useCallback } from 'react'

/* =========================================================
 * ② 本质与陷阱：三组可交互的原理对比
 * ---------------------------------------------------------
 * A. 重排 vs 合成：改 left/width 触发 layout+paint；改 transform 只走合成（GPU）——真跑动画
 * B. 防抖 vs 节流：同一串输入事件，防抖"停下来才执行一次"，节流"固定间隔必执行一次"——实时计数
 * C. 预加载三兄弟：preload / prefetch / preconnect 各自适用场景
 * D. 数据层与轮子：SWR(stale-while-revalidate) 策略 + 性能点↔成熟库(ahooks/React Query)映射
 * E. 构建分包与打包分析：分包策略可视化对比 + webpack/vite 产物分析工具与看什么
 * 交互都在事件处理器/ effect 里做，渲染期无副作用（规避 react-hooks/purity）。
 * ========================================================= */

const SECTIONS = [
  { key: 'reflow', label: 'A · 重排 vs 合成' },
  { key: 'debounce', label: 'B · 防抖 vs 节流' },
  { key: 'preload', label: 'C · 预加载三兄弟' },
  { key: 'libs', label: 'D · 数据层与轮子' },
  { key: 'bundle', label: 'E · 分包与打包分析' },
]

export default function PrincipleDemo() {
  const [sec, setSec] = useState('reflow')
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>② 本质与陷阱 · 五组能"跑"出来的原理</h2>
        <p className="desc">
          面试官最爱追问"为什么快"。这五组把最常考的性能原理做成可点可跑的对比——
          动画怎么不卡、输入怎么少触发、资源怎么提前拿、数据层怎么秒开与会用成熟库、产物怎么拆包与分析。
        </p>
      </div>

      <div className="fp-chips fp-sec-chips">
        {SECTIONS.map((s) => (
          <button key={s.key} className={'fp-chip' + (s.key === sec ? ' on' : '')} onClick={() => setSec(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {sec === 'reflow' && <ReflowSection />}
      {sec === 'debounce' && <DebounceSection />}
      {sec === 'preload' && <PreloadSection />}
      {sec === 'libs' && <LibsSection />}
      {sec === 'bundle' && <BundleSection />}
    </div>
  )
}

/* ---------------- A. 重排 vs 合成 ---------------- */
function ReflowSection() {
  const [mode, setMode] = useState('composite')
  const [runId, setRunId] = useState(0)

  const pipeline =
    mode === 'layout'
      ? [
          { stage: 'Layout 布局（重排）', hit: true, note: '改 left/width 逼浏览器重算几何与整棵布局树' },
          { stage: 'Paint 绘制（重绘）', hit: true, note: '几何变了要重新像素填充' },
          { stage: 'Composite 合成', hit: true, note: '最后再合成上屏' },
        ]
      : [
          { stage: 'Layout 布局（重排）', hit: false, note: 'transform 不改几何，跳过布局 ✅' },
          { stage: 'Paint 绘制（重绘）', hit: false, note: '提升为合成层后跳过绘制 ✅' },
          { stage: 'Composite 合成', hit: true, note: '交给 GPU 平移/缩放，主线程不忙 ✅' },
        ]

  return (
    <div className="fp-card">
      <h4>🎬 同样让方块动，代价天差地别</h4>
      <div className="fp-chips">
        <button className={'fp-chip' + (mode === 'layout' ? ' on' : '')} onClick={() => { setMode('layout'); setRunId((r) => r + 1) }}>
          改 left / width（触发重排）
        </button>
        <button className={'fp-chip' + (mode === 'composite' ? ' on' : '')} onClick={() => { setMode('composite'); setRunId((r) => r + 1) }}>
          改 transform（只合成）
        </button>
      </div>

      <div className="fp-stage-area">
        <div className="fp-track">
          <div key={runId} className={'fp-ball fp-ball-' + mode} />
        </div>
        <div className="btn-row">
          <button onClick={() => setRunId((r) => r + 1)}>▶ 重播动画</button>
        </div>
      </div>

      <div className="fp-pipeline">
        {pipeline.map((p) => (
          <div key={p.stage} className={'fp-pl-node' + (p.hit ? ' hit' : ' skip')}>
            <div className="fp-pl-title">
              <span>{p.hit ? '✅' : '⏭️'}</span> {p.stage}
            </div>
            <p className="fp-pl-note">{p.note}</p>
          </div>
        ))}
      </div>

      <p className="fp-card-note">
        <b>结论：</b>动画/位移优先用 <code>transform</code> + <code>opacity</code>（可加 <code>will-change</code> 提前提升合成层），
        它绕开重排与重绘，几乎不吃主线程。而改 <code>left/top/width/height/margin</code> 会触发<b>重排</b>，代价最高。
        另一个陷阱是<b>布局抖动</b>：JS 里"读几何属性 → 写样式"交替（如循环里边取 offsetHeight 边改 style），每次都强制同步重排——
        应<b>批量读、批量写</b>。
      </p>
    </div>
  )
}

/* ---------------- B. 防抖 vs 节流 ---------------- */
function DebounceSection() {
  const [text, setText] = useState('')
  const [counts, setCounts] = useState({ input: 0, debounce: 0, throttle: 0 })

  const debRef = useRef(null)
  const thTimerRef = useRef(null)
  const lastThRef = useRef(0)
  const DEBOUNCE_MS = 500
  const THROTTLE_MS = 800

  useEffect(() => () => {
    clearTimeout(debRef.current)
    clearTimeout(thTimerRef.current)
  }, [])

  const fireDebounce = useCallback(() => setCounts((c) => ({ ...c, debounce: c.debounce + 1 })), [])
  const fireThrottle = useCallback(() => setCounts((c) => ({ ...c, throttle: c.throttle + 1 })), [])

  const onChange = (e) => {
    setText(e.target.value)
    setCounts((c) => ({ ...c, input: c.input + 1 }))

    // 防抖：每次输入重置计时，停止 DEBOUNCE_MS 后才执行一次
    clearTimeout(debRef.current)
    debRef.current = setTimeout(fireDebounce, DEBOUNCE_MS)

    // 节流：每 THROTTLE_MS 必执行一次（ Leading + 尾部补偿）
    const now = performance.now()
    const elapsed = now - lastThRef.current
    if (elapsed >= THROTTLE_MS) {
      lastThRef.current = now
      fireThrottle()
    } else if (!thTimerRef.current) {
      thTimerRef.current = setTimeout(() => {
        thTimerRef.current = null
        lastThRef.current = performance.now()
        fireThrottle()
      }, THROTTLE_MS - elapsed)
    }
  }

  const reset = () => {
    clearTimeout(debRef.current)
    clearTimeout(thTimerRef.current)
    thTimerRef.current = null
    lastThRef.current = 0
    setText('')
    setCounts({ input: 0, debounce: 0, throttle: 0 })
  }

  return (
    <div className="fp-card">
      <h4>⌨️ 连续敲几个字，看谁触发得少</h4>
      <input
        className="fp-input"
        type="text"
        value={text}
        placeholder="在这里快速连续输入……"
        onChange={onChange}
      />
      <div className="btn-row">
        <button className="ghost" onClick={reset}>清空重置</button>
      </div>

      <div className="fp-count-row">
        <div className="fp-count">
          <span className="fp-count-k">原始输入事件</span>
          <span className="fp-count-v">{counts.input}</span>
        </div>
        <div className="fp-count fp-count-deb">
          <span className="fp-count-k">🛡️ 防抖实际执行</span>
          <span className="fp-count-v">{counts.debounce}</span>
          <div className="fp-dots">{Array.from({ length: counts.debounce }).map((_, i) => <i key={i} />)}</div>
        </div>
        <div className="fp-count fp-count-thr">
          <span className="fp-count-k">🚦 节流实际执行</span>
          <span className="fp-count-v">{counts.throttle}</span>
          <div className="fp-dots">{Array.from({ length: counts.throttle }).map((_, i) => <i key={i} />)}</div>
        </div>
      </div>

      <div className="fp-vs">
        <div className="fp-vs-col">
          <div className="fp-vs-head">🛡️ 防抖 Debounce</div>
          <p>事件连续触发时<b>只认最后一下</b>：每次触发重置计时，停下来 N ms 后才执行一次。</p>
          <div className="fp-vs-verdict">适合：搜索框联想、表单校验、窗口 resize 结束后再算。</div>
        </div>
        <div className="fp-vs-col">
          <div className="fp-vs-head">🚦 节流 Throttle</div>
          <p>无论触发多密，<b>固定间隔必执行一次</b>，保证过程中持续有反馈。</p>
          <div className="fp-vs-verdict">适合：滚动加载、拖拽、埋点上报——需要"过程也有响应"。</div>
        </div>
      </div>

      <p className="fp-card-note">
        <b>一句话区分：</b>防抖是"<b>你停下我才干活</b>"，节流是"<b>再忙也每隔一会儿干一次</b>"。
        陷阱：防抖会给<b>每次</b>输入都新建/清除计时器，节流要保证<b>尾部</b>也补一次（否则最后一次操作丢失）；
        组件卸载时都要记得 <code>clearTimeout</code>，避免在已销毁组件上 setState。
      </p>
    </div>
  )
}

/* ---------------- C. 预加载三兄弟 ---------------- */
const PRELOAD_ITEMS = [
  {
    key: 'preload', tag: '<link rel="preload">', tone: 'accent',
    head: '给"当前页马上要用"的关键资源',
    body: '提前用高优先级下载当前页面关键资源（首屏字体、关键 CSS、首图），避免等 HTML 解析到才发现要下——直接压 LCP。',
    when: '确定这一页一定会用到、且是关键路径资源时用。',
  },
  {
    key: 'prefetch', tag: '<link rel="prefetch">', tone: 'success',
    head: '给"下一页可能要用"的资源',
    body: '低优先级、在浏览器空闲时预取未来导航才需要的资源（如点击"详情"后的分包）。用户还没走就先备好。',
    when: '能预测用户下一步去哪（下一页/下一步）时用，别抢当前页带宽。',
  },
  {
    key: 'preconnect', tag: '<link rel="preconnect">', tone: 'warning',
    head: '提前和第三方域名"握手"',
    body: '对后面要用到的域名（CDN、字体、API 域）提前完成 DNS + TCP + TLS 握手，真正请求时省掉建连时间。',
    when: '页面依赖关键第三方域名时用；滥用会白占连接，反而变慢。',
  },
]

function PreloadSection() {
  const [pick, setPick] = useState('preload')
  const item = PRELOAD_ITEMS.find((i) => i.key === pick)
  return (
    <div className="fp-card">
      <h4>🔗 preload / prefetch / preconnect，别混</h4>
      <div className="fp-chips">
        {PRELOAD_ITEMS.map((i) => (
          <button key={i.key} className={'fp-chip' + (i.key === pick ? ' on' : '')} onClick={() => setPick(i.key)}>
            {i.key}
          </button>
        ))}
      </div>

      <div className={'fp-pl-detail fp-pl-' + item.tone}>
        <div className="fp-pl-tag">{item.tag}</div>
        <p className="fp-pl-head">{item.head}</p>
        <p className="fp-pl-body">{item.body}</p>
        <p className="fp-pl-when"><b>什么时候用：</b>{item.when}</p>
      </div>

      <p className="fp-card-note">
        <b>记忆锚点：</b>三者对象不同——<code>preload</code> 是"<b>现在就要、当前页</b>"、
        <code>prefetch</code> 是"<b>以后可能、下一页</b>"、<code>preconnect</code> 不下载内容、只"<b>提前把路修通</b>"。
        答对这组区别，能顺带展示你懂资源优先级。
      </p>
    </div>
  )
}

/* ---------------- D. 数据层与轮子 ---------------- */
/* SWR(stale-while-revalidate) 策略时间线：先秒回旧数据、后台再刷新 */
const SWR_STEPS = [
  { icon: '📥', title: '① 发起请求', text: '组件要一份数据（如列表），先看本地有没有缓存。', tone: 'accent' },
  { icon: '⚡', title: '② 命中缓存，立即回显', text: '有旧数据(stale)就先渲染上屏，用户零等待——这是体感最快的关键。', tone: 'success' },
  { icon: '🔄', title: '③ 后台 revalidate', text: '同时悄悄发真实请求去服务器拿最新数据，不打断当前展示。', tone: 'warning' },
  { icon: '✅', title: '④ 拿到新数据再更新', text: '请求回来若有变化，无感刷新为 fresh，并写回缓存供下次秒开。', tone: 'success' },
]

/* 性能/工程点 → 手写原理 → 成熟库直接用 */
const LIB_MAP = [
  { point: '数据请求 & 缓存', hand: '自己管 loading/error、手写缓存', lib: 'SWR / React Query：请求去重、缓存、轮询、stale-while-revalidate、乐观更新' },
  { point: '数据预请求 prefetch', hand: '预测下一步、提前调接口塞进缓存', lib: 'React Query prefetchQuery / SWR preload' },
  { point: '防抖 / 节流', hand: 'setTimeout 手写（见 B 组）', lib: 'ahooks useDebounceFn / useThrottleFn' },
  { point: '长列表虚拟滚动', hand: '手写 VirtualList（见虚拟滚动主题）', lib: 'ahooks useVirtualList' },
  { point: '元素进入视口（懒加载）', hand: 'new IntersectionObserver(...)', lib: 'ahooks useInViewport / useLazyLoad' },
  { point: '稳定函数引用', hand: 'useCallback + 依赖数组，易漏依赖', lib: 'ahooks useMemoizedFn（免依赖数组、引用永远稳定）' },
  { point: '无限滚动 / 分页', hand: '滚动监听 + 游标拼接', lib: 'SWR Infinite / ahooks useInfiniteScroll' },
]

/* 数据预请求的常见时机 */
const PRE_REQUEST = [
  { icon: '🧭', when: '路由级预取', how: '鼠标 hover 链接 / 下载路由 chunk 时，就把该页要用的接口一起发了' },
  { icon: '📄', when: '分页/列表预取', how: '拿到第 1 页，顺手预取第 2 页；翻页时数据已在缓存' },
  { icon: '🔍', when: '详情预取', how: 'hover 列表某一行，预取该行详情接口，点进去秒开' },
  { icon: '🚀', when: '启动并发预取', how: '登录态、字典、权限等首屏必用数据，app 启动就并发请求，不等组件挂载' },
]

function LibsSection() {
  return (
    <div className="fp-card">
      <h4>🧰 会造轮子，更要会用成熟的轮子</h4>

      <p className="fp-lib-lead">
        面试官问性能优化，<b>只讲手写原理会显得"只会造轮子"</b>。真正加分的是：能说清
        <b>数据层的缓存策略（SWR）</b>，以及<b>项目里直接用了哪个成熟库</b>把这套优化落地。
      </p>

      {/* SWR 策略时间线 */}
      <div className="fp-lib-subtitle">SWR / stale-while-revalidate：先秒回旧数据，后台再刷新</div>
      <div className="fp-swr-flow">
        {SWR_STEPS.map((s) => (
          <div key={s.title} className={'fp-swr-step fp-swr-' + s.tone}>
            <div className="fp-swr-icon">{s.icon}</div>
            <div className="fp-swr-title">{s.title}</div>
            <p className="fp-swr-text">{s.text}</p>
          </div>
        ))}
      </div>
      <p className="fp-card-note">
        <b>一句话：</b>SWR 的核心是"<b>先给你缓存里的旧数据立刻上屏（stale），同时后台拉新数据（revalidate），拿到再无感更新</b>"
        ——把"网络往返"从渲染关键路径里挪走，首屏体感接近秒开。HTTP 头里也有对应的 <code>Cache-Control: stale-while-revalidate</code>，
        库（SWR / React Query）则是把这套策略做成了开箱即用。
      </p>

      {/* 数据预请求 */}
      <div className="fp-lib-subtitle">🔮 数据预请求（prefetch）：别等组件挂载才发接口</div>
      <p className="fp-pre-lead">
        和 <code>preload</code>/<code>prefetch</code> 提前拿资源同理，<b>预请求是"提前把接口发了"</b>：
        预测用户下一步要什么数据，趁空闲先请求并塞进缓存，真正用到时直接命中——配合 SWR/React Query 的缓存几乎零等待。
      </p>
      <div className="fp-pre-list">
        {PRE_REQUEST.map((p) => (
          <div key={p.when} className="fp-pre-item">
            <span className="fp-pre-icon">{p.icon}</span>
            <div>
              <div className="fp-pre-when">{p.when}</div>
              <p className="fp-pre-how">{p.how}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="fp-card-note">
        <b>库怎么用：</b>React Query <code>queryClient.prefetchQuery(key, fn)</code> / <code>useQuery</code> 手动 prefetch；
        SWR 用 <code>preload</code> 或 <code>mutate(key, data, false)</code> 预填缓存。
        <b>陷阱：</b>预取范围要克制（弱网/移动端别浪费带宽）、预测错就是无效请求、给预取数据设较短 <code>staleTime</code> 免得展示过期数据。
      </p>

      {/* 性能点 ↔ 成熟库映射 */}
      <div className="fp-lib-subtitle">性能点 → 手写原理 → 项目里直接用的库</div>
      <table className="fp-compare">
        <thead>
          <tr><th>性能 / 工程点</th><th>手写原理（面试要会）</th><th>成熟库直接用（落地要会说）</th></tr>
        </thead>
        <tbody>
          {LIB_MAP.map((r) => (
            <tr key={r.point}>
              <td>{r.point}</td>
              <td>{r.hand}</td>
              <td><b>{r.lib}</b></td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="fp-card-note">
        <b>答题姿势：</b>先讲原理（证明你懂），再补一句"实际项目我用 <code>ahooks</code> 的 <code>useRequest</code>/
        <code>useVirtualList</code>、数据缓存用 <code>SWR</code>/<code>React Query</code>，不用重复造轮子"——
        <b>既显深度又显工程成熟度</b>。
      </p>
    </div>
  )
}

/* ---------------- E. 构建分包与打包分析 ---------------- */
/* 分包策略：每个策略下产物如何切块 + 对缓存的影响 */
const SPLIT_STRATEGIES = [
  {
    key: 'none', label: '不分包（全打一个包）', tone: 'danger',
    verdict: '❌ 缓存最差：任何一行代码改动，用户都要重下整个包',
    chunks: [
      { name: 'app.[hash].js', size: '2.4 MB', kb: 2458, stable: false, note: '业务 + 三方 + 运行时全糊在一起' },
    ],
  },
  {
    key: 'vendor', label: '抽公共 vendor', tone: 'warning',
    verdict: '🟠 好一些：三方库单独成包，业务改动时 vendor 命中缓存不重下',
    chunks: [
      { name: 'vendor.[contenthash].js', size: '1.6 MB', kb: 1638, stable: true, note: 'react / 三方库，很少变 → 长缓存' },
      { name: 'app.[contenthash].js', size: '0.8 MB', kb: 819, stable: false, note: '业务代码，每次发版变' },
    ],
  },
  {
    key: 'route', label: '路由懒加载分包', tone: 'accent',
    verdict: '🟢 首屏最小：只下入口 + 当前路由，其它路由进页面时才按需加载',
    chunks: [
      { name: 'runtime.js', size: '2 KB', kb: 2, stable: true, note: 'webpack 运行时代码' },
      { name: 'vendor.js', size: '1.6 MB', kb: 1638, stable: true, note: '公共三方' },
      { name: 'home.[hash].js', size: '120 KB', kb: 120, stable: false, note: '当前路由，首屏加载 ✅' },
      { name: 'detail.[hash].js', size: '90 KB', kb: 90, stable: false, note: '点进详情才下 ⏳' },
      { name: 'settings.[hash].js', size: '70 KB', kb: 70, stable: false, note: '进设置页才下 ⏳' },
    ],
  },
  {
    key: 'best', label: '组合最佳实践', tone: 'success',
    verdict: '✅ 长期缓存最优：runtime 单独抽 + vendor 按库拆 + 公共 chunk + 路由分包 + contenthash',
    chunks: [
      { name: 'runtime.[hash].js', size: '2 KB', kb: 2, stable: true, note: '单独抽，避免 hash 牵连其它包失效' },
      { name: 'react.[contenthash].js', size: '40 KB', kb: 40, stable: true, note: 'vendor 按库细分，升级只影响对应包' },
      { name: 'charts.[contenthash].js', size: '600 KB', kb: 600, stable: true, note: '大库(如 echarts)单独拆，按需引入' },
      { name: 'shared.[contenthash].js', size: '80 KB', kb: 80, stable: true, note: '多路由共用模块抽公共，避免重复打包' },
      { name: 'home / detail / … .js', size: '按需', kb: 110, stable: false, note: '路由级动态 import，首屏只下必需' },
    ],
  },
]

const ANALYZE_TOOLS = [
  { tool: 'webpack-bundle-analyzer', how: '生成 treemap 可视化，一眼看出哪个模块占体积最大；npx webpack-bundle-analyzer dist/stats.json' },
  { tool: 'vite-bundle-visualizer / rollup-plugin-visualizer', how: 'Vite 项目用，同样出 treemap，看 gzip / brotli 后的真实传输体积' },
  { tool: 'source-map-explorer', how: '基于 sourcemap 分析产物，定位到具体依赖占比' },
]

function BundleSection() {
  const [pick, setPick] = useState('route')
  const s = SPLIT_STRATEGIES.find((x) => x.key === pick)
  const maxKb = Math.max(...s.chunks.map((c) => c.kb))
  return (
    <div className="fp-card">
      <h4>📦 分包：把一个大包拆成能分别缓存的小包</h4>
      <p className="fp-lib-lead">
        不分包时一个 JS 动辄几 MB，首屏全量下载、且<b>改一行就要重下整包</b>。分包的目标：<b>首屏只下必需的、
        稳定的抽出来长缓存、变化小的不牵连变化大的</b>。切下面策略看产物怎么变。
      </p>

      <div className="fp-chips">
        {SPLIT_STRATEGIES.map((x) => (
          <button key={x.key} className={'fp-chip' + (x.key === pick ? ' on' : '')} onClick={() => setPick(x.key)}>
            {x.label}
          </button>
        ))}
      </div>

      <div className={'fp-strategy-verdict fp-sv-' + s.tone}>{s.verdict}</div>

      <div className="fp-chunk-list">
        {s.chunks.map((c) => (
          <div key={c.name} className="fp-chunk">
            <div className="fp-chunk-head">
              <code className="fp-chunk-name">{c.name}</code>
              <span className="fp-chunk-size">{c.size}</span>
              <span className={'fp-chunk-badge ' + (c.stable ? 'stable' : 'unstable')}>
                {c.stable ? '🔒 稳定·长缓存' : '🔁 易变·会重下'}
              </span>
            </div>
            <div className="fp-chunk-bar"><div className="fp-chunk-fill" style={{ width: Math.max(6, (c.kb / maxKb) * 100) + '%' }} /></div>
            <p className="fp-chunk-note">{c.note}</p>
          </div>
        ))}
      </div>

      {/* webpack 打包分析 */}
      <div className="fp-lib-subtitle">🔬 打包分析：先看清包里装了什么，再决定拆什么</div>
      <p className="fp-pre-lead">
        分包/优化不能拍脑袋，<b>先用工具把产物可视化</b>，看谁最大、有没有重复打包。这是"<b>先测量再优化</b>"的关键一步。
      </p>
      <div className="fp-pre-list">
        {ANALYZE_TOOLS.map((t) => (
          <div key={t.tool} className="fp-pre-item">
            <span className="fp-pre-icon">📊</span>
            <div>
              <div className="fp-pre-when">{t.tool}</div>
              <p className="fp-pre-how">{t.how}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="fp-card-note">
        <b>看什么：</b>① 哪个 chunk 最大、超警告线（webpack 默认 244KB）；② 有没有<b>重复打包</b>同一依赖（多版本）；
        ③ 有没有把大库整个打进来（<code>moment</code> 全量语言包、全量 <code>lodash</code>、全量图标库）；④ 生产环境误引 dev 依赖。
        <b>分析后动作：</b>按需引入、大库 <code>import()</code> 动态拆或走 <code>externals</code>+CDN、换轻量库（<code>dayjs</code>/<code>lodash-es</code> 可 tree-shake）、
        <code>splitChunks</code> 抽公共、图片字体走 CDN。
      </p>
    </div>
  )
}
