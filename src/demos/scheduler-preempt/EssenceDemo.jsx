import './styles.css'

/* =========================================================
 * 🧠 本质与陷阱：为什么不能被"打断"，以及让步点怎么选
 * ---------------------------------------------------------
 * 把实跑对拍背后的原理拆开：单线程铁律、四种让步方式、
 * 优先级队列规则、"假抢占 vs 真并行"、面试必答陷阱。
 * ========================================================= */

const YIELD_WAYS = [
  {
    name: 'setTimeout(fn, 0)',
    kind: '宏任务',
    yields: '✅ 完整让出：本轮微任务清完后进下一轮',
    cost: '最小延迟 ≈1ms；嵌套 ≥5 层后被浏览器钳制 ≥4ms',
    verdict: '本题默认答案，兼容性最好',
    good: true,
  },
  {
    name: 'Promise.resolve().then / await 微任务',
    kind: '微任务',
    yields: '❌ 不让出：微任务清空前永不取宏任务，点击进不来',
    cost: '几乎零延迟，但页面该卡还是卡',
    verdict: '「假异步」——实跑对拍 B 组就是它',
    good: false,
  },
  {
    name: 'MessageChannel port2.postMessage',
    kind: '宏任务',
    yields: '✅ 完整让出',
    cost: '比 setTimeout 快（不受 4ms 钳制）',
    verdict: 'React scheduler 源码的浏览器让步方式',
    good: true,
  },
  {
    name: 'requestAnimationFrame',
    kind: '渲染回调',
    yields: '⚠️ 下一帧前执行；后台标签页直接停摆',
    cost: '跟刷新率走（60Hz ≈ 16.7ms 一档）',
    verdict: '和"每帧预算"强相关的任务才用它',
    good: null,
  },
  {
    name: 'scheduler.yield()（新）',
    kind: '宏任务',
    yields: '✅ 让出但保留优先级，放回队列而非队尾',
    cost: '需要 polyfill / Chrome 较新版本',
    verdict: '2024 年起 React 官方推荐的让步原语',
    good: true,
  },
]

const TRAPS = [
  {
    trap: '把 await 微任务当成"让出线程"',
    truth: '微任务队列不清空，事件循环永远轮不到宏任务（点击/I/O）。切片之间必须用宏任务让步，实跑对拍 B 组演示了这一点。',
  },
  {
    trap: 'setTimeout(…, 0) 真能 0ms',
    truth: 'HTML 规范：嵌套层级 ≥5 后最小延迟钳到 4ms；另外它排在所有微任务之后，"0ms"只是"尽快"。',
  },
  {
    trap: '切片越细越流畅',
    truth: '每一片都是一次完整的宏任务调度，片太细（比如 1ms 一片）光排队就排死了——吞吐骤降。工程上取 5ms 量级（React 的 frame deadline 思路）。',
  },
  {
    trap: 'urgent 无限插队，循环饿死',
    truth: '队首永远插 urgent 的话，循环任务可能永远轮不到。需要"加龄"（等太久自动升权）或给 urgent 设配额——这正是面试追问「低优先级饿死怎么治」的答案。',
  },
  {
    trap: 'rAF 当万能让步点',
    truth: '后台标签页 rAF 不触发（帧都不画了），用 rAF 续片的任务在切后台后会整体停摆；setTimeout 只是被节流（≥1s），不会停。',
  },
  {
    trap: '想用一个 flag 变量"中断"循环',
    truth: 'loopRunning = false 这种外置开关，只有在循环自己检查它的间隙才可能被改——而同线程里没人能在那个间隙执行赋值。flag 轮询 = 还是让步点，不是抢占。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap sp-root">
      <div className="demo-header">
        <h2>🧠 本质与陷阱 · 让步点、优先级与"抢占有没有"</h2>
        <p className="demo-sub">
          这道题考三件事的叠加：<b>单线程事件循环</b>（什么时候能插队）、
          <b>优先级队列</b>（来了urgent谁先跑）、<b>时间切片</b>（循环怎么拆才不算死循环）。
        </p>
      </div>

      {/* ① 铁律 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">📜 三条铁律（答题的地基）</span>
        </div>
        <ul className="sp-list">
          <li><b>调用栈不空，事件循环不转。</b>正在执行的同步代码（包括 while 循环）在 JS 里无法被任何新任务打断——"优先执行新任务"的前提是循环<b>自己主动歇一口气</b>。</li>
          <li><b>异步写法 ≠ 让出路。</b>用微任务接力（await / .then）续循环，只是把长任务切成一串微任务，宏任务队列照旧堵着；必须让出到<b>下一轮事件循环</b>（宏任务级让步）。</li>
          <li><b>"优先"靠的是自家队列。</b>浏览器/Node 的宏任务队列不是优先级队列（先来先服务）。想让新任务优先，就得自己收编它：外层任务一到就<b>入你的优先队列（插队首）</b>，循环在让步点检查它。</li>
        </ul>
      </section>

      {/* ② 让步方式对拍表 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">⚖️ 五种"让出方式"对拍</span>
          <span className="sp-card-src">对应实跑对拍 B/C 两组</span>
        </div>
        <table className="sp-table">
          <thead>
            <tr>
              <th>让步方式</th><th>任务类别</th><th>真的让出事件循环？</th><th>延迟/代价</th><th>定位</th>
            </tr>
          </thead>
          <tbody>
            {YIELD_WAYS.map((y) => (
              <tr key={y.name} className={y.good === true ? 'sp-row-good' : y.good === false ? 'sp-row-bad' : ''}>
                <td><code>{y.name}</code></td>
                <td>{y.kind}</td>
                <td>{y.yields}</td>
                <td>{y.cost}</td>
                <td>{y.verdict}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ③ 手写骨架拆解 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">🔍 手写答案的三个组件（对照 shared.js）</span>
        </div>
        <div className="sp-cols">
          <div className="sp-col-card">
            <h3>① 优先级队列</h3>
            <p>数组 + <code>unshift</code>（urgent 插队首）/ <code>push</code>（普通任务排队尾）。
              追问「优先级很多档怎么办」：多级 bucket 队列或最小堆，取队首只看堆顶。</p>
          </div>
          <div className="sp-col-card">
            <h3>② 循环切片</h3>
            <p>把 <code>while(true)</code> 改成"每次只干一片（如 50ms 或 N 个元素）"，
              片与片之间用 <code>setTimeout(step, 0)</code> 接力——循环"没闲着"（每片都在忙），
              但主线程每片之间有空窗。</p>
          </div>
          <div className="sp-col-card">
            <h3>③ 让步点检查</h3>
            <p>每片开始前：<code>while (队首是 urgent) 先跑掉</code>。
              响应延迟的上界 = 一片的时长；想要更稳，用"到点就切"（deadline 模式，React Fiber 同款）替代定长切片。</p>
          </div>
        </div>
      </section>

      {/* ④ 抢占真相 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">🕳️ 本质追问：这到底算不算"抢占"？</span>
        </div>
        <table className="sp-table">
          <thead>
            <tr><th>方案</th><th>机制</th><th>中断粒度</th><th>代价</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><b>协作式让步</b>（本题正解）</td>
              <td>循环自己切片机、自己检查优先队列</td>
              <td>让步点之间（≈一片时长）</td>
              <td>代码要改造；忘切就退化成长任务</td>
            </tr>
            <tr>
              <td><b>Web Worker</b></td>
              <td>循环搬去另一条线程真并行跑</td>
              <td>主线程天然随时响应新任务</td>
              <td>通信靠 postMessage，不能碰 DOM</td>
            </tr>
            <tr>
              <td><b>生成器 + next()</b></td>
              <td>循环写成 generator，调度器决定何时推进</td>
              <td>yield 处（仍是协作式）</td>
              <td>本质还是让步点，只是把控制权交给外部调度器</td>
            </tr>
            <tr>
              <td><b>OS 级抢占</b></td>
              <td>不存在于 JS：引擎不会在两条字节码之间切任务</td>
              <td>—</td>
              <td>答"JS 没有真抢占"即可加分</td>
            </tr>
          </tbody>
        </table>
        <p className="sp-hint">
          💡 面试金句：<b>"JS 单线程没有真抢占，所谓中断长任务，全是协作式让步——
          React Fiber 把渲染工作链改成可暂停的链表遍历，用的就是这一招。"</b>
        </p>
      </section>

      {/* ⑤ 陷阱清单 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">⚠️ 六个高频陷阱</span>
        </div>
        <ul className="sp-traps">
          {TRAPS.map((t) => (
            <li key={t.trap}>
              <span className="sp-trap-name">🕳️ {t.trap}</span>
              <span className="sp-trap-truth">✅ {t.truth}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ⑥ 现实映射 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">🗺️ 这套机制在真实世界里的样子</span>
        </div>
        <ul className="sp-list">
          <li><b>React Fiber</b>：渲染切成 Fiber 节点级的"片"，每片后检查 <code>shouldYield()</code>（16.6ms 帧预算），高优先级更新（用户输入）插队重新调度——和本题同构，答完题主动提它能串起知识网。</li>
          <li><b>React scheduler 包</b>：浏览器里用 MessageChannel 做让步宏任务，避免 setTimeout 4ms 钳制。</li>
          <li><b>requestIdleCallback</b>：反过来——浏览器主动把"空闲片段"分给低优先级任务，超时未跑会被强制补执行。</li>
          <li><b>Node 端同款</b>：<code>setImmediate</code> 进 check 阶段、<code>process.nextTick</code> 是微任务级"不让路"，规律与浏览器一致。</li>
        </ul>
      </section>
    </div>
  );
}
