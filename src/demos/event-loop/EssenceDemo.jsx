/* =========================================================
 * 🧠 本质与陷阱：Event Loop 事件循环
 * 作用域挂在 .el-essence 下，样式随本主题懒加载，不依赖其它主题。
 * ========================================================= */

// 微任务 vs 宏任务 常见成员（模块级常量，未导出，符合 react-refresh 约定）
const MICRO_TASKS = [
  'Promise.then / catch / finally 回调',
  'async 函数 await 之下的续体',
  'queueMicrotask(fn)',
  'MutationObserver 回调',
  '（Node）process.nextTick —— 优先级最高，早于所有微任务',
]
const MACRO_TASKS = [
  'setTimeout / setInterval 回调',
  'setImmediate（Node）',
  'requestAnimationFrame（浏览器，渲染前）',
  'I/O 回调、UI 渲染事件、postMessage',
  '脚本本身的 <script> 整体 = 第一个宏任务',
]

// Node vs 浏览器 差异（追问高发）
const ENV_DIFF = [
  {
    dim: '微任务时机',
    browser: '每个宏任务执行完，一次性清空整条微任务队列。',
    node: '同样在宏任务之间清微任务，但 process.nextTick 队列先于普通微任务被清空。',
  },
  {
    dim: '宏任务划分',
    browser: '一条宏任务队列，取一个→清微任务→再取一个。',
    node: '按阶段（phase）组织：timers → poll → check(setImmediate) → close，每个阶段之间清微任务。',
  },
  {
    dim: 'setTimeout(0) vs Promise',
    browser: 'Promise 微任务一定先于 setTimeout 宏任务。',
    node: '结论相同（微任务先），但 1ms 以下会被钳制成 1ms；且 nextTick 比 Promise 还靠前。',
  },
  {
    dim: '独有 API',
    browser: 'requestAnimationFrame 绑定屏幕刷新，专门服务视觉更新。',
    node: 'setImmediate 在 poll 阶段之后执行；nextTick 用于"当前同步栈一结束就立刻做"。',
  },
]

// 高频陷阱
const PITFALLS = [
  {
    name: 'Promise.resolve().then() ≠ 立即执行',
    detail: '.then 里的代码是微任务，要等当前同步栈清空后才跑。链式 .then 更绕：下一环要等上一环 resolve 后才入队，所以会被同层另一个更早入队的微任务（如 promise3）插队。',
  },
  {
    name: 'await 之后不是同步',
    detail: 'await 之前的函数体是同步的，await 表达式本身会让出，之后的代码相当于塞进 .then 回调，变成微任务。别把 async 函数当成"跑到 await 就同步等待"。',
  },
  {
    name: '微任务里再产生微任务，会一直插队',
    detail: '清空微任务队列的判定是"队列长度是否为 0"，过程中新入队的微任务会在本轮一并处理——极端写法（递归微任务）能把宏任务饿死，浏览器为此设了 10 层嵌套上限。',
  },
  {
    name: 'setTimeout(0) 不是 0 毫秒后执行',
    detail: '它只是"尽快入宏任务队列"，真正执行要等同步 + 当前微任务全部清空，嵌套超时还被钳制到 ≥4ms；后台标签页更会被钉到 ≥1s。',
  },
  {
    name: '把 nextTick 当微任务乱用（Node）',
    detail: 'process.nextTick 严格说不是微任务队列，而是独立的、优先级更高的队列；在循环里无限 nextTick 会阻塞 I/O（老 Node 的著名坑）。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap el-root el-essence">
      <section className="el-block">
        <h3>🧠 一句话本质</h3>
        <p className="el-lead">
          JS 是<b>单线程</b>的，靠<b>事件循环（Event Loop）</b>在同一根线程上调度成百上千个异步任务：
          <b>同步代码进调用栈立刻执行</b>，异步回调被分到<b>微任务队列</b>和<b>宏任务队列</b>；
          每轮循环的节奏是——
          <b>跑完整个调用栈 → 清空所有微任务 → 取一个宏任务 →（再清微任务）</b>，如此往复。
        </p>
      </section>

      {/* 先纠个偏 */}
      <section className="el-block">
        <h3>❓ 先纠个偏：事件循环解决的不是"单线程"</h3>
        <p className="el-lead">
          很多说法是"Event Loop 为了解决 JS 单线程的问题"——这话<b>只对了一半</b>。
          <b>单线程是天生设定、不是要修的 bug</b>：JS 最初为浏览器脚本设计，DOM 操作必须单线程，
          两个线程同时改同一页面会冲突。事件循环真正要解决的矛盾是——
          <b>只有一根线程，却要做网络/定时/IO 这些耗时的事，还不能把它堵死。</b>
        </p>
        <div className="el-myth">
          <div className="el-myth-row el-myth-wrong">
            <span className="el-myth-tag">❌ 误解</span>
            <span>事件循环让 JS 变成了多线程 / 解决了单线程。</span>
          </div>
          <div className="el-myth-row el-myth-right">
            <span className="el-myth-tag">✅ 正解</span>
            <span>
              事件循环让<b>唯一的这根主线程</b>在<b>不被阻塞</b>的前提下处理并发——
              耗时的活交给底层多线程（浏览器后台 / Node 的 libuv 线程池）异步执行，
              做完把回调塞进队列，事件循环再逐个捞回主线程执行。
            </span>
          </div>
        </div>
        <p className="el-tip">
          💡 一句话话术：<b>"JS 单线程是约束，Event Loop 不是把它变成多线程，而是让单线程做到非阻塞异步。"</b>
          真正的"并行"发生在底层线程，回到 JS 主线程的只是<b>回调</b>——所以主线程依然是一次只干一件事。
        </p>
      </section>

      {/* 概念图 */}
      <section className="el-block">
        <h3>🗺️ 概念图：一轮事件循环长什么样</h3>
        <div className="el-diagram">
          <div className="el-node el-node-stack">
            <p className="el-node-title">⚙️ 调用栈 Call Stack</p>
            <p className="el-node-desc">同步代码在这里逐行执行，栈清空 = 同步阶段结束</p>
          </div>
          <div className="el-arrow">↓ 栈清空后，先看向 ↓</div>

          <div className="el-row">
            <div className="el-node el-node-micro">
              <p className="el-node-title">🟦 微任务队列 Microtask</p>
              <p className="el-node-desc">Promise.then、await 续体、queueMicrotask、MutationObserver</p>
              <p className="el-node-flag">✅ 一次性<b>全部清空</b>（含过程中新增的）</p>
            </div>
            <div className="el-arrow el-arrow-h">→ 空了才 →</div>
            <div className="el-node el-node-macro">
              <p className="el-node-title">🟨 宏任务队列 Macrotask</p>
              <p className="el-node-desc">setTimeout/setInterval、I/O、UI 事件、rAF</p>
              <p className="el-node-flag">⏳ 每轮<b>只取一个</b>执行</p>
            </div>
          </div>

          <div className="el-arrow el-loop">↺ 取完这 1 个宏任务，回到"清空微任务"，再取下一个宏任务 —— 循环不止</div>
          <p className="el-render-note">
            🖌️ 浏览器还会在合适时机（约每 16.7ms / 60fps）插入一次<b>渲染</b>，
            <code>requestAnimationFrame</code> 的回调就排在这一步之前。
          </p>
        </div>
      </section>

      {/* 微 vs 宏 成员表 */}
      <section className="el-block">
        <h3>📊 谁在微任务、谁在宏任务</h3>
        <div className="el-members">
          <div className="el-member-col el-member-micro">
            <p className="el-member-title">🟦 微任务（优先级高，先清空）</p>
            <ul className="el-list">
              {MICRO_TASKS.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <div className="el-member-col el-member-macro">
            <p className="el-member-title">🟨 宏任务（每轮取一个）</p>
            <ul className="el-list">
              {MACRO_TASKS.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </div>
        <p className="el-tip">
          💡 记忆锚点：<b>Promise 全家 + await 续体 = 微任务</b>；<b>定时器 + I/O + 渲染事件 = 宏任务</b>。
          微任务是"插队办完所有加急件"，宏任务是"叫号窗口，一次只叫一个号，叫完还得先看加急件"。
        </p>
      </section>

      {/* Node vs 浏览器 */}
      <section className="el-block">
        <h3>🌍 Node vs 浏览器：差异对拍表</h3>
        <p className="el-lead">
          核心模型一致（先微后宏），分歧在<b>微任务怎么分优先级</b>、<b>宏任务怎么组织</b>。面试被追问差异时，能报出<b>阶段名</b>就是加分项。
        </p>
        <table className="el-compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>🌐 浏览器</th>
              <th>🟢 Node</th>
            </tr>
          </thead>
          <tbody>
            {ENV_DIFF.map((d) => (
              <tr key={d.dim}>
                <td>{d.dim}</td>
                <td>{d.browser}</td>
                <td>{d.node}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="el-tip">
          🟢 Node 宏任务按阶段流转：<code>timers</code>（到点的 setTimeout）→ <code>poll</code>（I/O）→
          <code>check</code>（setImmediate）→ <code>close</code>；<b>每个阶段之间</b>清空 nextTick 与微任务。
          顺序记忆：<b>nextTick &gt; Promise 微任务 &gt; 下一阶段宏任务</b>。
        </p>
      </section>

      {/* 陷阱 */}
      <section className="el-block">
        <h3>⚠️ 高频陷阱清单</h3>
        {PITFALLS.map((p) => (
          <div className="el-pit" key={p.name}>
            <p className="el-pit-name">⚠️ {p.name}</p>
            <p className="el-pit-detail">{p.detail}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
