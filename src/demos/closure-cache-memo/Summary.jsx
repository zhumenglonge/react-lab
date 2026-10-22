/* =========================================================
 * 🎯 面试总结：闭包缓存 & 累加
 * 作用域挂在 .clo-summary 下，样式随本主题懒加载，不依赖其它主题。
 * ========================================================= */

// 高频追问点（模块级常量，未导出，符合 react-refresh 约定）
const NOTES = [
  {
    q: '为什么外层函数都 return 了，total 还没销毁？',
    a: '因为返回的内层函数还引用着 total，引擎必须保住这份词法环境，否则内层函数就没法正常工作。只要内层函数活着（被变量、数组、回调持有），它出生时那层作用域里的被引用变量就一直活着。',
  },
  {
    q: '这段脚本执行完了，闭包里的 age 会被回收吗？',
    a: '不会——它的存活期就是整个页面的存活期，直到页面卸载、文档被销毁才会连带释放。执行上下文出栈只说明"栈上那份没了"，被内层引用的变量早已搬进堆上的闭包环境。只要引用链顶端还可达——person 声明在 script 顶层，就挂在 GC Root 上——链底的 age 就动不了，而全局根只有文档销毁才消失。而且存活只看引用链、不看你用没用过：哪怕把 person.growUp() 那一行删掉，age 照样活着。',
  },
  {
    q: '那怎么写才能让它真的被回收？',
    a: '把持有者从顶层降级成局部变量：用 IIFE 包一层（执行完 p 出栈 → growUp 不可达 → 下一次 GC 连带 age 回收）；或者顶层改用 let 并在用完置 null（写成 const 连 person = null 都做不到，会 TypeError）；跟着对象生命周期走的就换 WeakMap。想确认到底回收没，用 Heap Snapshot 看 Retainers 引用链（实测路线在"本质与陷阱"那一栏）。',
  },
  {
    q: '调用两次 createAccumulator()，累加会串吗？',
    a: '不会。每次调用都新建一份独立的 total 和内层函数。要"共享"就得把 cache/total 提到模块级作用域做单例，或用 WeakMap 按 key 复用同一实例——这本身就是常见追问。',
  },
  {
    q: 'memoize 的缓存能无限存吗？有什么风险？',
    a: '不能。无限存会内存泄漏，生产级缓存要加容量上限 + 淘汰策略（LRU：超过 N 条踢掉最久没用的）。另外对象参数用 JSON.stringify 当 key 会失真或开销大，需要约定基本类型或用嵌套 Map。',
  },
  {
    q: '闭包和 this / 箭头函数有什么关联？',
    a: '箭头函数没有自己的 this，靠作用域链向外找——这套"向外层找被记住的绑定"的机制和闭包同源。防抖节流用箭头函数时，timer 依然关在闭包里，跟 this 无关。',
  },
  {
    q: 'React Hooks 为什么算闭包的应用？',
    a: '每个组件函数渲染时，useState/useMemo 读写的状态并不是存在函数里，而是 React 用 Fiber 节点为"这个组件位置"维护的一份持久状态；而闭包陷阱（useEffect 里读到旧的 state）正是"内层函数记住了那次渲染的作用域"的直接体现。',
  },
  {
    q: '怎么主动打破/释放一个闭包？',
    a: '把持有内层函数的引用置空（给定时器回调赋 null、移除事件监听、组件卸载时清理），让内层函数先被判死，它拽着的词法环境才会连带回收。这是内存泄漏排查的关键动作；声明阶段能做的则是"别把它挂到全局上"（见上一题的 IIFE 写法）。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap clo-root clo-summary">
      <section className="clo-block">
        <h3>🧠 一句话本质</h3>
        <p className="clo-lead">
          <b>闭包让一个函数拥有了"私有且持久"的状态。</b>累加器和缓存函数都是同一个骨架：
          <b>外层函数放一个私有变量（total / cache）→ 内层函数读写它 → 返回内层函数</b>。
          题目要累加就 <code>total += step</code>，要缓存就用 <code>Map</code> 存结果，
          <b>记住变量</b>这件事是共通的。
        </p>
      </section>

      <section className="clo-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="clo-quote">
          <p>
            "<b>累加器</b>这样写：外层函数里 <code>let total = 0</code>，返回一个内层函数，
            内层函数每次把入参加到 total 上再 return。关键在于——外层函数执行完，
            <code>total</code> 本该销毁，但因为被返回的函数<b>引用</b>着，它作为闭包的一部分
            <b>一直活在内存里</b>，所以多次调用能<b>连续累加</b>，而且外面<b>碰不到也改不了</b> total，
            相当于一个私有成员变量。"
          </p>
          <p>
            "<b>缓存函数（memoize）</b>是同一个原理：外层放一个 <code>const cache = new Map()</code>，
            返回的内层函数先用参数当 key 查缓存，<b>命中就直接返回旧结果</b>，没命中才真正计算并把结果
            写回 cache。计算结果被闭包<b>记住</b>了，重复调用同一参数就省掉了重复开销——这就是<b>用空间换时间</b>。"
          </p>
          <p>
            "再补两点边界：一是<b>每次调用外层函数会得到独立的一份状态</b>（多实例隔离）；
            二是闭包状态<b>只在内存里</b>，刷新即丢、要持久化得换 localStorage/LRU，
            生产缓存还要<b>加容量上限防止内存泄漏</b>。防抖节流、React Hooks 本质都是这套闭包存状态的用法。"
          </p>
        </blockquote>
      </section>

      <section className="clo-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="clo-list">
          {NOTES.map((n) => (
            <li key={n.q}>
              <b>{n.q}</b>
              {n.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="clo-block">
        <h3>✍️ 30 秒手写最小版（面试现场可直接敲）</h3>
        <pre className="clo-code clo-code-full">{`// 累加器
const makeAcc = () => { let t = 0; return (n) => (t += n); };
const acc = makeAcc(); acc(5); acc(3); // 8

// 缓存（memoize）
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const res = fn(...args);
    cache.set(key, res);
    return res;
  };
};`}</pre>
      </section>
    </div>
  )
}
