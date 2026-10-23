/* =========================================================
 * 🎯 面试总结：手写题话术 + 白板模板 + 高频追问
 * ---------------------------------------------------------
 * 这道手写题的评分点：①点破单线程不可打断 ②让步点用宏任务
 * ③优先队列自己实现 ④能报出 React Fiber/scheduler 的对应物。
 * ========================================================= */

const WHITEBOARD = `// 「循环不闲着 + 新任务优先」白板模板（30 秒写完骨架）
const queue = [];                       // 优先级队列：urgent 在队首

function addTask(fn, { urgent = false } = {}) {
  urgent ? queue.unshift({ fn, urgent })
         : queue.push({ fn, urgent });  // ★ 新任务插队首 = "优先"
}

function loop() {
  while (queue.length && !shouldPause()) {
    const task = queue.shift();
    task.fn();                          // ★ 一直在干活，不闲着
  }
  // ★ 让步点：用宏任务让出一拍，外层新任务才进得来
  setTimeout(loop, 0);                  // 或 MessageChannel，避开 4ms 钳制
}

function shouldPause() {
  // 三种常见策略任选：
  // return queue[0]?.urgent;           // ① 队首是 urgent 就让它先跑（其实上面 while 已天然做到）
  // return Date.now() - start > 50;    // ② 本片超时预算（deadline 模式）
  return false;                          // ③ 每轮宏任务自然清空一轮
}`;

const TALK = `第一步（先定调，10 秒）：
「JS 单线程，正在跑的同步循环不可能被外部打断，所以这道题的解法一定不是『中断』，
 而是『协作式让步』——把循环切片，片与片之间让出事件循环，并留一个优先级队列。」

第二步（讲三件套，30 秒）：
「① 循环切片的粒度：按固定条数（如 5000 项）或固定预算（如 5ms）切；
 ② 切片之间用宏任务接力——setTimeout(0) 或 MessageChannel（React scheduler 同款，
    不受 setTimeout 嵌套 4ms 钳制），千万别只用 await 微任务，那等于没让路；
 ③ 外部新任务通过 addTask(…, { urgent: true }) 进我们的优先级队列（unshift 队首），
    循环每取下一片前先检查队首，urgent 先跑——这就是『优先执行』的实现点。」

第三步（收尾升华，10 秒）：
「响应延迟上界是一片时长，想要更短就减小切片、或改 deadline 模式。
 这其实就是 React Fiber：渲染任务切成 Fiber 节点，每片后 shouldYield() 检查帧预算，
 用户输入这类高优先级更新插队重排。如果允许多线程，Web Worker 才是真并行。」`;

const FOLLOWUPS = [
  {
    q: '为什么不能用 await / Promise 让路？',
    a: 'await 微任务只是把续体排进微任务队列；事件循环规则是"微任务清空前不取下一个宏任务"，所以点击、I/O 这类宏任务依然进不来。让步必须让到宏任务级别（setTimeout / MessageChannel / scheduler.yield）。',
  },
  {
    q: '优先级任务多了怎么扩展？会不会饿死低优先级？',
    a: '单级 urgent 可扩展成多级 bucket（同 React Lanes 思路）或最小堆。会饿死——解法是加龄（等待时长计入优先级）或给 urgent 设配额（每轮最多跑 N 个），必要时给低优先级任务设保底窗口。',
  },
  {
    q: 'setTimeout(0) 有什么坑？',
    a: '① 嵌套 ≥5 层后被钳制到 ≥4ms；② 排在所有微任务之后，不是"立即"；③ 后台标签页节流到 ≥1s（演示计时类逻辑时要记得这点）。追求更低延迟用 MessageChannel 或 scheduler.yield()。',
  },
  {
    q: '切片多大合适？',
    a: '以帧预算倒推：60fps 每帧 ≈16.7ms，留一半给事件响应和渲染，单片 5~8ms 是常见工程取值（React 曾长期用 5ms deadline）。片太细则调度开销占比过高、吞吐骤降。',
  },
  {
    q: '这跟 React Fiber 什么关系？',
    a: '同构问题：Fiber 把一次大 re-render 拆成节点级工作单元，workLoop 每处理一个单元检查剩余时间片，超时就把控制权还给浏览器；priority 更新的渲染任务排进更优先的 lane。所以"可中断渲染"= 本题的循环切片 + 优先级调度。',
  },
  {
    q: '有没有"真中断"的办法？',
    a: '单线程没有。真并行只有 Web Worker（循环跑在别的线程，主线程天然秒响应新任务），代价是 postMessage 通信 + 不能碰 DOM。面试官若追问"能不能不改循环代码"，答案就是 Worker。',
  },
  {
    q: 'Node 里同款写法？',
    a: 'setImmediate 把续片排进 check 阶段、更快穿过 timers/poll 前的排队，常用作让步点；process.nextTick 属于"不让路"的微任务级队列，长任务里递归 nextTick 同样会饿死 I/O。',
  },
];

export default function Summary() {
  return (
    <div className="demo-wrap sp-root">
      <div className="demo-header">
        <h2>🎯 面试总结 · 话术模板与高频追问</h2>
        <p className="demo-sub">
          评分点四个：<b>点破单线程不可打断</b> → <b>宏任务让步点</b> →
          <b>自建优先队列</b> → <b>报出 React Fiber 对应物</b>。全中即满分手写题。
        </p>
      </div>

      {/* ① 话术 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">🗣️ 60 秒答题话术（三步走）</span>
        </div>
        <pre className="sp-code sp-talk">{TALK}</pre>
      </section>

      {/* ② 白板模板 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">✍️ 白板代码模板（背这个骨架）</span>
          <span className="sp-card-src">与 shared.js 的 createQueue + runSliced 同构</span>
        </div>
        <pre className="sp-code">{WHITEBOARD}</pre>
        <p className="sp-hint">
          💡 写完后主动补两句：<b>"生产环境我会把 setTimeout 换成 MessageChannel 或 scheduler.yield，
          避开 4ms 钳制"</b>、<b>"这就是 React Fiber 的 shouldYield 模式"</b>——这是手写题从"写出来"到"写得懂"的分水岭。
        </p>
      </section>

      {/* ③ 追问 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">❓ 高频追问与一句话答法</span>
        </div>
        <ul className="sp-fas">
          {FOLLOWUPS.map((f) => (
            <li key={f.q}>
              <span className="sp-fa-q">Q · {f.q}</span>
              <span className="sp-fa-a">A · {f.a}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ④ 自查 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">✅ 出门检查清单</span>
        </div>
        <ul className="sp-list">
          <li>能徒手写出：<b>优先队列（unshift 队首）+ 切片循环 + setTimeout 让步 + 让步点先清 urgent</b>。</li>
          <li>能解释为什么 <b>await 微任务不算让路</b>（事件循环取宏任务的前提）。</li>
          <li>能报出<b>片时长与帧预算的关系</b>（16.7ms → 单片 5~8ms）以及片太细的调度开销问题。</li>
          <li>能把话题接到 <b>React Fiber / MessageChannel / Web Worker</b> 三层现实映射上。</li>
        </ul>
      </section>
    </div>
  );
}
