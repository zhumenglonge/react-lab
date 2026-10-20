/* ==================== 面试总结页 ====================
 * 作用域统一挂在 .fp-summary 下，样式自带一份（懒加载不依赖其它主题）。
 * 目标：把"前端性能优化有哪些方法"答成一套有结构、能量化、有项目落地的框架。
 * ========================================================= */

const ANSWER_FLOW = `开口先给框架：定位瓶颈 → 分阶段开方 → 用指标验证

【加载阶段】资源更快到浏览器
  ├─ 减请求/减体积：HTTP 缓存、Gzip/Brotli、WebP、Tree-shaking、代码分割+路由懒加载
  └─ 加快传输：CDN 就近、HTTP2 多路复用、preload/prefetch/preconnect、SSR/骨架屏直出
        ↓ 瓶颈若在白屏久
【渲染阶段】浏览器更快画出来
  ├─ 少重排多重绘、动画用 transform/opacity 走合成、will-change 提层
  └─ 图片懒加载、长列表虚拟滚动、精简 DOM
        ↓ 瓶颈若在交互卡
【脚本执行】别阻塞主线程
  ├─ 防抖/节流、requestIdleCallback/Web Worker 拆长任务
  └─ React：memo/useMemo/useCallback、状态拆分、稳定 key
        ↓
用 Core Web Vitals 量化：LCP(加载) / CLS(稳定) / INP(交互)`

const CWV = [
  { m: 'LCP', full: '最大内容绘制', q: '加载', target: '≤ 2.5s', how: 'SSR/骨架屏、CDN、preload 首图、压缩体积、缓存' },
  { m: 'CLS', full: '累积布局偏移', q: '视觉稳定性', target: '≤ 0.1', how: '图片/广告预留宽高、避免插入式跳动、字体用 font-display' },
  { m: 'INP', full: '交互到下次绘制', q: '交互响应', target: '≤ 200ms', how: '拆长任务、Web Worker、防抖节流、减少主线程阻塞（已替代 FID）' },
]

const LAYERS = [
  { layer: '网络 & 加载', items: 'HTTP 缓存 · Gzip/Brotli · WebP/AVIF · 代码分割/路由懒加载 · Tree-shaking · CDN · HTTP2 · preload/prefetch/preconnect · SSR/SSG' },
  { layer: '渲染', items: '减少重排 · 动画走 transform/opacity 合成层 · will-change · 图片懒加载 · 虚拟滚动 · 精简 DOM · 关键 CSS 内联' },
  { layer: 'JS 执行', items: '防抖/节流 · requestIdleCallback · Web Worker · 避免长任务 · React memo/useMemo/useCallback · 稳定 key' },
  { layer: '工程 & 体验', items: 'Core Web Vitals 监控 · 分包与 bundle 分析 · 按需 polyfill · 弱网/低端机降级' },
]

export default function Summary() {
  return (
    <div className="demo-wrap fp-summary">
      <section className="fp-block">
        <h3>🧠 一句话本质</h3>
        <p className="fp-lead">
          前端性能优化的核心是「<b>少请求、小体积、快传输、不阻塞主线程、按需渲染</b>」。
          答题别乱罗列，按 <b>加载 → 渲染 → 脚本执行</b> 三个阶段定位瓶颈、对症下药，
          最后用 <code>LCP / CLS / INP</code> 量化验证——<b>"先定位再开方"比背 30 条手段高级得多</b>。
        </p>
      </section>

      <section className="fp-block">
        <h3>🚀 分阶段答题主线（开口第一段就报这个框架）</h3>
        <pre className="code">{ANSWER_FLOW}</pre>
      </section>

      <section className="fp-block">
        <h3>📋 四层手段速查表</h3>
        <table className="fp-compare">
          <thead>
            <tr><th>层次</th><th>典型手段</th></tr>
          </thead>
          <tbody>
            {LAYERS.map((l) => (
              <tr key={l.layer}><td>{l.layer}</td><td>{l.items}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="fp-block">
        <h3>📊 Core Web Vitals（量化指标，加分必备）</h3>
        <table className="fp-compare">
          <thead>
            <tr><th>指标</th><th>含义</th><th>管什么</th><th>良好阈值</th><th>主要优化方向</th></tr>
          </thead>
          <tbody>
            {CWV.map((c) => (
              <tr key={c.m}>
                <td>{c.m}</td>
                <td>{c.full}</td>
                <td>{c.q}</td>
                <td><b>{c.target}</b></td>
                <td>{c.how}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="fp-note">
          注：<b>INP 已在 2024 年正式取代 FID</b>，衡量的是"最慢那次交互"的响应，比只看首次交互的 FID 更严——
          答到这一句，说明你在跟进最新标准。
        </p>
      </section>

      <section className="fp-block">
        <h3>⚠️ 三个高频陷阱（答对是加分项）</h3>
        <ul>
          <li><b>重排 ≠ 重绘，代价差很多。</b>改几何（<code>width/left/display</code>）触发<b>重排</b>（reflow，最贵）；只改颜色等外观触发<b>重绘</b>；而 <code>transform/opacity</code> 走<b>合成</b>、两者都跳过——动画首选它。</li>
          <li><b>布局抖动（layout thrashing）。</b>JS 里边读 <code>offsetHeight</code> 边改 <code>style</code> 会强制同步重排；正确做法是<b>批量读、批量写</b>。</li>
          <li><b>memo/useMemo 不是免费的。</b>缓存本身有比较与内存开销，滥用是过度优化；只在"昂贵计算 / 引用稳定传递给 memo 子组件 / 高频渲染列表项"时才用。</li>
        </ul>
      </section>

      <section className="fp-block">
        <h3>🛠️ 项目里怎么落地（追问："你实际做过哪些优化？"）</h3>
        <p className="fp-lead">
          讲一个<b>可量化</b>的案例最有说服力，套路：<b>先说用什么工具定位（Lighthouse/Performance），再说动了哪一层，最后给数字</b>。
        </p>
        <ul>
          <li><b>首屏慢</b> → 路由懒加载 + 组件级代码分割，首屏 JS 从 <code>x MB</code> 降到 <code>y MB</code>；入口 HTML no-cache、带 hash 资源长缓存。</li>
          <li><b>列表卡顿</b> → 万级数据上<b>虚拟滚动</b>只渲染可视区，滚动帧率明显回升。</li>
          <li><b>图片拖后腿</b> → WebP/AVIF + <code>loading="lazy"</code> + 预留宽高（顺带压 CLS）。</li>
          <li><b>交互卡</b> → 高频事件防抖节流、耗时计算挪 Web Worker、React 用 memo 减少无谓重渲染。</li>
        </ul>
      </section>

      <section className="fp-block">
        <h3>❓ 高频追问点</h3>
        <ul>
          <li><b>怎么衡量性能？</b>实验室（Lighthouse 模拟）+ 真实用户监控（RUM 采集 Core Web Vitals）结合，别只信跑分。</li>
          <li><b>懒加载怎么实现？</b>图片用 <code>IntersectionObserver</code>/<code>loading=lazy</code>；路由/组件用动态 <code>import()</code>。</li>
          <li><b>长任务怎么处理？</b>拆小任务、<code>requestIdleCallback</code> 延后、或丢进 <code>Web Worker</code>，保证主线程可响应。</li>
          <li><b>首屏白屏太久先查什么？</b>关键渲染路径——阻塞的 JS/CSS、体积过大的首包、瀑布式串行请求。</li>
          <li><b>为什么不盲目上 HTTP2 域名分片？</b>H2 多路复用后已不需要分片，反而多连接增加开销——老优化在新协议下要重新评估。</li>
          <li><b>实际项目用什么库落地？</b>别只会手写——数据请求与缓存用 <code>SWR</code>/<code>React Query</code>（stale-while-revalidate、请求去重、乐观更新），防抖节流/虚拟滚动/进入视口等用 <code>ahooks</code>（<code>useDebounceFn</code>/<code>useVirtualList</code>/<code>useInViewport</code>）。<b>原理能手写 + 落地会用成熟库</b>才显工程成熟度。</li>
          <li><b>分包怎么拆？</b>目标：首屏只下必需。路由懒加载动态 <code>import()</code> 拆包 + <code>splitChunks</code> 抽公共 vendor（按库细分）+ runtime 单独抽 + 文件名带 <code>contenthash</code> 吃长缓存。<b>怎么知道拆得对不对？</b>用 <code>webpack-bundle-analyzer</code>/vite 的 <code>rollup-plugin-visualizer</code> 看产物 treemap，找最大块与重复依赖。</li>
        </ul>
      </section>

      <section className="fp-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote>
          <p>
            "我一般分三个阶段来答。<b>第一是加载阶段</b>——目标是资源更快到浏览器：用 <b>HTTP 缓存</b>减少重复请求、<b>Gzip/Brotli 和 WebP</b> 压体积、
            <b>路由懒加载 + 代码分割</b>把首屏不用的 JS 拆走、<b>CDN</b> 就近分发，关键资源还可以 <b>preload</b>、首屏用 <b>SSR/骨架屏</b> 直出。"
          </p>
          <p>
            "<b>第二是渲染阶段</b>——目标是浏览器更快画出来：尽量<b>减少重排</b>，动画用 <code>transform/opacity</code> 走合成层而不是改 <code>left/width</code>，
            图片和非首屏内容<b>懒加载</b>，超长列表用<b>虚拟滚动</b>只渲染可视区。"
          </p>
          <p>
            "<b>第三是 JS 执行阶段</b>——别阻塞主线程：高频事件<b>防抖节流</b>，耗时计算放 <b>Web Worker</b> 或用 <code>requestIdleCallback</code>；
            在 React 里用 <code>memo/useMemo/useCallback</code> 减少无谓重渲染。"
          </p>
          <p>
            "最后一定会<b>用指标验证</b>——看 <b>Core Web Vitals</b>：LCP 管加载、CLS 管布局稳定、INP 管交互响应。
            我在项目里就是这么先定位瓶颈再逐层优化，比如把首屏 JS 拆分 + 长列表虚拟滚动后，LCP 和滚动流畅度都有可量化的提升。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
