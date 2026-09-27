/* =========================================================
 * 🎯 面试总结：React Fiber 架构
 * 作用域挂在 .fib-summary 下，样式自带一份（懒加载不依赖其它主题）。
 * ========================================================= */

// 高频追问点（模块级常量、未导出，不与组件同文件导出，符合 react-refresh 约定）
const NOTES = [
  {
    q: 'Fiber 到底是什么？是一个节点还是一种架构？',
    a: '两层含义：① 数据结构上，Fiber 是一个 FiberNode 对象，保存组件的类型、props、state、副作用、优先级，并用 child/sibling/return 三根指针把整棵树连成链表；② 架构上，Fiber 是 React 16 重写的协调引擎，把同步递归的渲染改造成「可中断、可恢复、可分优先级」的异步渲染。前者是后者的实现基础。',
  },
  {
    q: '为什么旧的 Stack Reconciler 不可中断？',
    a: '它用递归（调用栈）自顶向下比对整棵树，调用栈一旦压进去就无法中途弹出再恢复，只能一口气跑完。组件树很大时，这个长任务会独占主线程，浏览器无法绘制、无法响应输入，就出现掉帧和卡顿。',
  },
  {
    q: 'Fiber 是怎么做到可中断的？',
    a: '把递归改写成「链表 + while 循环」。每个工作单元处理完都返回下一个单元（nextUnitOfWork），控制权交回主循环；循环每转一圈问一次 shouldYield()，当前帧时间（约 5ms）用完就 return，把主线程还给浏览器，下一帧再从 nextUnitOfWork 接着跑。进度保存在 Fiber 链表上，所以能暂停也能恢复。',
  },
  {
    q: '为什么非要用「链表」结构？只是为了可中断吗？',
    a: '核心是为了「可中断 + 可恢复」，而链表真正解决的是更难的「恢复」。中断本身不难（while 里 return 就停了），难的是停下来后怎么记住「停在哪、下一帧从哪接着走」。递归的遍历进度存在 JS 调用栈里——引擎私有、你碰不到，一旦 return，栈帧和局部变量全销毁，没法冻结再解冻。链表把遍历状态从不可控的调用栈搬到可控的堆内存：每个 FiberNode 用 child/sibling/return 三根指针显式记录「下一步去哪」，再用一个 nextUnitOfWork 当书签，循环退出时位置一点不丢。附带好处：FiberNode 是信息饱满的工作单元对象（存 props/state/hooks/flags/lanes/alternate），天然支撑双缓存与「优先级打断时丢弃半成品树重来」。（React 试过用生成器 function* 暂停/恢复，但有开销、嵌套复杂、难以支持按优先级丢弃重来，最终手写链表遍历。）',
  },
  {
    q: '时间切片的「一帧」大概多久？为什么 JS 只用 5ms？',
    a: '基于 60fps 假设：一帧约 1000/60 ≈ 16.6ms。React 把这 16.6ms 切成两块——约 5ms 给 work loop 跑 JS（源码常量 frameYieldMs = 5），剩下约 11ms 留给浏览器绘制、响应输入、跑其他任务。故意只用 5ms 是留足余量，避免占满一帧反而掉帧。两点注意：① 这 5ms 是 JS 执行时间，不含浏览器绘制；② 高刷屏（90/120fps）一帧更短（约 11ms/8ms），但 React 默认仍按 5ms 走，暂未动态适配刷新率。',
  },
  {
    q: 'shouldYield() 是按「时间」还是「节点数」让出的？',
    a: '按时间，不是节点数。它判断的是「当前帧分给 JS 的额度（约 5ms）用完没」，用完就 return 让出主线程，下一帧从 nextUnitOfWork 接着跑。所以让出边界是时间片，而不是固定处理 N 个节点——这意味着若单个大组件的一次 beginWork 就超过 5ms，也得等这一步做完才检查、才让出（React 无法在一个工作单元内部再切分），所以单个节点太重仍可能造成小卡顿。',
  },
  {
    q: '什么是双缓存（Double Buffering）？',
    a: '名字借自图形学的 double buffering：内存里同时保留两棵 Fiber 树——current（当前屏幕上正显示的）和 workInProgress（简称 wip，正在后台构建的下一棵）。更新时不碰 current，只在 wip 上做 diff、打 flags、建新节点，全部构建完再一次性切过去，所以屏幕上永远不会出现「渲染到一半」的中间态。两根关键指针别混：① alternate——挂在每个 FiberNode 上，指向另一棵树里「和自己对应的那个节点」（两棵树的对应节点互相指对方），作用是节点复用：更新时顺着它把旧节点的 props/state/DOM/hooks 拿过来，只改变化部分，没有对应节点（首次挂载/新增）才新建；② root.current——挂在 FiberRoot 上，指向「当前哪棵树是显示中的」，commit 结束那一刻执行 root.current = wip 树，一根指针翻转就让整棵 wip 上屏、变成新的 current。翻转后旧 current 不销毁，留作下一次构建 wip 时的 alternate 继续复用，两棵树就这样来回倒、反复共享内存。',
  },
  {
    q: 'render 阶段和 commit 阶段的区别？',
    a: 'render 阶段（beginWork 向下 + completeWork 向上）是可中断的，计算哪些节点需要变更、打上 flags（增删改），不碰真实 DOM；commit 阶段是把 render 的副作用一次性同步应用到 DOM，这一步不可中断（否则用户会看到不一致的界面）。commit 又分 before mutation / mutation / layout 三个子阶段。',
  },
  {
    q: 'work loop 遍历到底在做什么？就是在找哪些节点变了吗？',
    a: '一句话：work loop 既在「找」、也在「准备」，两件事在同一次遍历里同时完成。「找」——每走到一个节点，beginWork（向下「递」）拿新 props/state 和旧的 diff，找出哪些需要更新；「准备」——同一趟顺手把「将来怎么改」的料备齐：给要动的节点打 flags（Placement 插入 / Update 更新 / Deletion 删除）、执行函数组件 render 和 hooks、在 completeWork（向上「归」）里为新节点创建 DOM 实例（还没插入页面）、并把子节点 flags 冒泡汇总给父节点，最终构建出整棵 workInProgress 影子树。关键：遍历 ≠ 修改，走完只产出「哪里增删改 + 改所需的料」都算好的一棵树，真实 DOM 一个字没动；真正落地是 commit 阶段一次性、同步、不可中断地做——因为「找 + 准备」可以暂停，「改 DOM」不能改一半停下（否则用户会看到半截 UI）。',
  },
  {
    q: 'Lanes 优先级是怎么工作的？',
    a: 'React 用 31 位二进制位（lanes）表示不同优先级，如 SyncLane、InputContinuousLane、DefaultLane、TransitionLane、IdleLane。高优先级更新（用户输入）可以打断正在进行的低优先级渲染（如 transition 动画），先完成自己，被中断的低优先级任务之后重新开始或复用。优先级是「可中断」真正发挥价值的前提。',
  },
  {
    q: 'key 和 Fiber 复用有什么关系？',
    a: 'beginWork 做 diff 时，同层子节点靠 key 判断「新旧是否是同一个」，命中就能复用旧 Fiber（及其 state、DOM），否则销毁重建。这也是为什么列表要用稳定的 key、不要用 index——key 变了会导致 Fiber 无法复用，state 丢失、性能变差。',
  },
]

const COMPARE = [
  ['遍历方式', '递归（调用栈）', '链表 + while 循环'],
  ['能否中断', '❌ 不可中断，一口气跑完', '✅ 可在切片边界暂停/恢复'],
  ['优先级', '❌ 无，先到先跑完', '✅ Lanes，高优先级可插队'],
  ['状态保存', '调用栈里，无法保留', 'FiberNode 上，可持久保存'],
  ['主线程', '长任务独占 → 掉帧卡顿', '分片让出 → 保持响应'],
  ['对应版本', 'React 15 及以前', 'React 16+（并发能力的基础）'],
]

const PHASES = [
  ['① trigger / 触发更新', 'setState、useState 的 dispatch、forceUpdate 等发起更新，给对应 Fiber 标记 lanes 优先级，从根节点开始调度。'],
  ['② render 阶段（可中断）', '从 root 开始 workLoop：beginWork 自顶向下「递」（diff、创建/标记子节点、打 flags），completeWork 自底向上「归」（创建/更新 DOM 实例、冒泡 flags）。构建 workInProgress 树。时间不够就让出，之后接着跑；被高优先级打断则可能丢弃重来。'],
  ['③ commit 阶段（不可中断）', '把 workInProgress 树上收集的副作用一次性同步提交到真实 DOM，分 before mutation / mutation（增删改 DOM）/ layout（ref、useLayoutEffect）三个子阶段。结束后 root.current 切换到新树。'],
]

export default function Summary() {
  return (
    <div className="demo-wrap fib-root fib-summary">
      <section className="fib-block">
        <h3>🧠 一句话本质</h3>
        <p className="fib-lead">
          Fiber 把「一次同步递归、不可打断」的渲染，改造成「<b>把组件树拆成一个个可暂停的工作单元（FiberNode），
          用链表串起来，在 while 循环里处理一个就让出一次主线程</b>」的可中断渲染。
          它既是一种<b>数据结构</b>（带 child/sibling/return 指针的节点），也是一套<b>新的协调架构</b>，
          是 React 16+ 并发特性（时间切片、优先级调度、Suspense、useTransition）的地基。
        </p>
      </section>

      <section className="fib-block">
        <h3>🔁 渲染三大阶段</h3>
        <ul className="fib-steps">
          {PHASES.map((p) => (
            <li key={p[0]}><b>{p[0]}</b>{p[1]}</li>
          ))}
        </ul>
      </section>

      <section className="fib-block">
        <h3>⚖️ Stack Reconciler vs Fiber</h3>
        <table className="fib-compare">
          <thead>
            <tr><th>维度</th><th>Stack（旧）</th><th>Fiber（新）</th></tr>
          </thead>
          <tbody>
            {COMPARE.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="fib-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="fib-list">
          {NOTES.map((n) => (
            <li key={n.q}><b>{n.q}</b>{n.a}</li>
          ))}
        </ul>
      </section>

      <section className="fib-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="fib-quote">
          <p>
            "Fiber 是 React 16 重写的<b>协调引擎</b>。老的 Stack Reconciler 用<b>递归</b>比对整棵树，
            调用栈压下去就没法中途恢复，只能一口气跑完，大组件树会长时间独占主线程导致<b>卡顿掉帧</b>。"
          </p>
          <p>
            "Fiber 的核心是把递归改成<b>链表 + 循环</b>：每个组件对应一个 FiberNode，用 <code>child / sibling / return</code>
            三根指针连成链表；渲染时在一个 <code>while</code> 循环里逐个处理工作单元，每处理完一个就问一句
            <code>shouldYield()</code>——当前帧分给 JS 的额度（约 5ms，剩下约 11ms 留给浏览器）用完就<b>让出主线程</b>给浏览器绘制和响应输入，下一帧再<b>从断点接着跑</b>。
            进度都保存在 Fiber 上，所以能暂停、能恢复、甚至能丢弃重来。"
          </p>
          <p>
            "配套还有两个关键设计：一是<b>双缓存</b>，内存里维护 current 和 workInProgress 两棵树，
            更新在后者上做、完成后一次性切换 <code>root.current</code>，避免渲染到一半的中间态上屏；
            二是<b>Lanes 优先级</b>，用二进制位表示不同优先级，让高优先级更新（用户输入）能<b>打断</b>低优先级渲染（transition）。
            整个流程分<b>可中断的 render 阶段</b>和<b>不可中断的 commit 阶段</b>，这套架构也是 Suspense、useTransition 等并发特性的基础。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
