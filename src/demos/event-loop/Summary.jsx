/* =========================================================
 * 🎯 面试总结：Event Loop 事件循环
 * 作用域挂在 .el-summary 下，样式随本主题懒加载，不依赖其它主题。
 * ========================================================= */

// 高频追问点（模块级常量，未导出，符合 react-refresh 约定）
const NOTES = [
  {
    q: '为什么 JS 是单线程，还要搞事件循环？',
    a: 'JS 最初为浏览器脚本设计，DOM 操作必须单线程——多线程同时改一个页面会冲突。单线程又要处理网络、定时、I/O 这类耗时事，不能把它们放主线程上阻塞，于是用事件循环：耗时操作交给底层多线程（浏览器/Node runtime）异步执行，完成后把回调塞进任务队列，主线程按"先微后宏"的节奏不断取出执行。单线程指"执行 JS 的主线程"，异步的活其实由别的线程干，只是回调回到主线程跑。',
  },
  {
    q: '宏任务和微任务到底怎么排执行顺序？',
    a: '记住三步：① 先执行完整个调用栈（所有同步代码）；② 栈一清空，就把微任务队列从头到尾全部清空——过程中新产生的微任务也在本轮一起处理完；③ 微任务空了，才从宏任务队列取一个执行，取完回到第②步再清微任务。所以比例是"一个宏任务 : 一整轮微任务"。',
  },
  {
    q: 'setTimeout(fn, 0) 会立刻执行吗？和 Promise 谁先？',
    a: '不会立刻，也不会先于 Promise。setTimeout 的回调是宏任务，哪怕延迟 0ms，也要等同步代码 + 当前全部微任务清空后才执行，Promise.then 一定排在它前面。而且 setTimeout 有最小延迟（嵌套 ≥4ms、后台标签 ≥1s），0 只是"尽快入队"的意思。',
  },
  {
    q: 'await 后面算同步还是微任务？',
    a: 'await 之前的函数体照常同步执行；await 表达式会让出，之后的代码相当于放进一个 .then 回调，是微任务。关键细节：如果 await 的是一个已经 resolve 的 Promise（或同步返回的函数），它后面的续体会在"当前同步栈结束"时就入队，往往比后面才登记的 Promise.then 更早执行——这就是 async1 end 比 promise 先打印的原因。',
  },
  {
    q: '链式 .then() 的输出顺序为什么容易错？',
    a: '因为下一环不是同步入队的。P.then(a).then(b)：同步阶段只把 a 放进微任务队列，b 要等 a 执行完、这一环 resolve 后才追加到队尾。所以如果有另一条 P.then(c)，c 早在同步阶段就入队了，最终顺序是 a → c → b，而不是直觉的 a → b → c。',
  },
  {
    q: 'Node 和浏览器的事件循环有什么不同？',
    a: '核心一致（先微后宏），差异在：浏览器只有一个宏任务队列，取一个清一批微任务；Node 按阶段组织（timers → poll → check → close），每个阶段之间清微任务。Node 还多了两个队列：process.nextTick 优先级最高，早于所有 Promise 微任务；setImmediate 在 poll 之后的 check 阶段执行。另外 Node 对 1ms 以内的 setTimeout 会钳制成 1ms。',
  },
  {
    q: 'process.nextTick 是微任务吗？',
    a: '严格说不是。它有自己独立的队列，且在每个宏任务、每个事件循环阶段切换时都被优先清空——比 Promise 微任务还靠前。风险是在递归里无限 nextTick 会让后续 I/O 饿死（老 Node 的经典坑），这也是官方推荐优先用 queueMicrotask 的原因。',
  },
  {
    q: 'requestAnimationFrame 属于哪一类？',
    a: '它是浏览器专用的"渲染节拍"宏任务，回调在每一帧渲染之前执行，频率跟屏幕刷新对齐（约 16.7ms / 60fps）。所以纯视觉更新（动画、滚动跟随）优先用 rAF 而不是 setTimeout——更跟手、不掉帧、后台标签还会自动暂停省电。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap el-root el-summary">
      <section className="el-block">
        <h3>🧠 一句话本质</h3>
        <p className="el-lead">
          <b>单线程 + 两条队列 + 一个循环。</b>同步代码走调用栈，异步回调分<b>微任务</b>（Promise/await/queueMicrotask）
          和<b>宏任务</b>（定时器/I/O/渲染）；每轮循环<b>先跑完同步、再清空全部微任务、最后只取一个宏任务</b>。
          做题时永远先问一句：<b>这行代码是同步、微任务、还是宏任务？什么时候入队？</b>
        </p>
      </section>

      <section className="el-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="el-quote">
          <p>
            "JS 是<b>单线程</b>的，用<b>事件循环</b>调度异步。任务分三类：<b>同步</b>直接在调用栈执行；
            <b>微任务</b>包括 Promise.then、await 后续、queueMicrotask；<b>宏任务</b>包括 setTimeout、setInterval、I/O、渲染事件。"
          </p>
          <p>
            "执行顺序是：<b>先跑完整个同步调用栈</b>，然后<b>一次性清空整条微任务队列</b>（连过程中新增的也算进来），
            微任务空了<b>才从宏任务队列取一个</b>执行，取完再回去清微任务——如此循环。所以 Promise 永远比同期的 setTimeout 先跑。"
          </p>
          <p>
            "几个易错点：<b>await 之下的代码是微任务</b>，不是同步等待；<b>链式 .then 的下一环要等上一环 resolve 才入队</b>，
            会被别的早入队的微任务插队。Node 里还多了 <b>process.nextTick（优先级高于 Promise）</b> 和按阶段（timers/poll/check）流转的宏任务，
            这是它和浏览器最大的区别。"
          </p>
        </blockquote>
      </section>

      <section className="el-block">
        <h3>❓ 高频追问清单</h3>
        {NOTES.map((n) => (
          <div className="el-note" key={n.q}>
            <p className="el-note-q">❓ {n.q}</p>
            <p className="el-note-a">{n.a}</p>
          </div>
        ))}
      </section>

      <section className="el-block">
        <h3>🎁 加分收尾（主动说）</h3>
        <ul className="el-list">
          <li>"我会用一句话验证顺序：<b>同步 → 微任务全清 → 一个宏任务 → 再微任务全清</b>，做题时逐个标注每行属于哪类、何时入队，基本不会错。"</li>
          <li>"工程上，<b>微任务优先级高但不能滥用</b>——递归微任务会饿死宏任务和渲染；UI 更新该用 <b>requestAnimationFrame</b> 对齐帧率。"</li>
          <li>"这也是 React 的抓手：Fiber 把渲染拆成<b>可中断的小任务</b>，本质就是借事件循环/rAF 在空闲时切片执行，避免一个大渲染卡住主线程。"</li>
          <li>"Node 侧我会补一句 <b>nextTick vs setImmediate vs Promise</b> 的优先级和阶段模型，说明我不是只背浏览器那套。"</li>
        </ul>
      </section>
    </div>
  )
}
