/* =========================================================
 * 🧠 本质与陷阱：闭包缓存 & 累加
 * 作用域挂在 .clo-essence 下，样式随本主题懒加载，不依赖其它主题。
 * ========================================================= */

// 高频陷阱清单（模块级常量，未导出，符合 react-refresh 约定）
const PITFALLS = [
  {
    name: 'var 循环 + 异步回调：全部拿到同一个 i',
    detail: 'var 没有块级作用域，回调里引用的都是同一个函数作用域里的 i。解法就是把每个 i 关进各自的闭包：改用 let（for 循环每轮新建绑定），或 IIFE 立即传参封一层。',
  },
  {
    name: '缓存 key 用对象/数组参数会失真',
    detail: 'memoize 常用 JSON.stringify(args) 或 String(args) 当 key，对象参数会退化成 "[object Object]"——不同入参误判成同一次命中。要么约定基本类型参数，要么用 Map 嵌套按引用分层缓存（React 缓存库 react-memoize 也绕不开这题）。',
  },
  {
    name: '闭包不释放 = 内存泄漏',
    detail: '内层函数被长期引用（定时器、全局事件、挂到 DOM 上）时，它 remember 的整个外层作用域都不会回收，大对象跟着一起吊住。不用时主动置 null / 清理监听器。',
  },
  {
    name: '多个实例不共享是特性不是 bug',
    detail: '每次 createAccumulator() 都新建一份 total。面试官若追问"两次调用共享吗"，答案是：同一个函数实例共享，不同实例各算各的——想共享就挂到模块级 Map，或用 WeakMap 按 key 复用实例。',
  },
  {
    name: '状态只活在内存里',
    detail: '闭包缓存刷新即丢、多标签页不同步、无法序列化。要持久化就换 localStorage / IndexedDB / 服务端缓存（LRU），面试时主动说出这条边界是加分项。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap clo-root clo-essence">
      <section className="clo-block">
        <h3>🧠 一句话本质</h3>
        <p className="clo-lead">
          <b>闭包 = 函数 + 它出生时带走的那份作用域。</b>外层函数执行完，
          局部变量本该销毁，但只要内层函数还<b>引用</b>着它们，引擎就必须让它们在堆里
          <b>继续活着</b>——于是"一个函数"顺手就有了<b>私有、持久、外不可见的状态</b>。
          累加器记住的是 total，memoize 记住的是 cache，<b>是同一件事的两种用法</b>。
        </p>
        <p className="clo-lead">
          手写套路三步：<b>① 外层函数声明私有变量 → ② 内层函数读写它 → ③ 返回内层函数</b>。
          题目让累加就 <code>total += step</code>，让缓存就 <code>cache.set/get</code>，骨架完全一样。
        </p>
      </section>

      <section className="clo-block">
        <h3>📊 状态存哪了：四种写法对拍</h3>
        <table className="clo-compare">
          <thead>
            <tr>
              <th>写法</th>
              <th>状态位置</th>
              <th>外部能直接改吗</th>
              <th>多实例隔离</th>
              <th>典型场景</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>全局变量</td>
              <td>全局作用域</td>
              <td>❌ 谁都能读改</td>
              <td>❌ 共用一份</td>
              <td>反面教材</td>
            </tr>
            <tr>
              <td><b>闭包</b>（本题）</td>
              <td>堆上的词法环境</td>
              <td>✅ 只能通过返回的方法</td>
              <td>✅ 每次调用新建一份</td>
              <td>累加器 / memoize / 防抖节流</td>
            </tr>
            <tr>
              <td>class 实例</td>
              <td>this 上的属性</td>
              <td>⚠️ 可访问，# 私有字段才真正封住</td>
              <td>✅ new 一个隔离一份</td>
              <td>需要多个方法协同的状态</td>
            </tr>
            <tr>
              <td>模块级变量</td>
              <td>ES Module 作用域</td>
              <td>✅ import 不到的就是私有</td>
              <td>❌ 全应用单例</td>
              <td>全局缓存单例、计数器埋点</td>
            </tr>
          </tbody>
        </table>
        <p className="clo-tip">
          💡 面试加分句：闭包版本的 total 相当于<b>私有成员变量</b>，返回的方法相当于<b>暴露的接口</b>——
          这和 class 的封装思想同源，只是更轻。
        </p>
      </section>

      <section className="clo-block">
        <h3>🔗 变量到底"存哪了"（追问高发区）</h3>
        <ul className="clo-list">
          <li>
            <b>不是存在函数对象上，也不是留在栈里。</b>执行栈帧销毁后，被内层函数引用的变量
            活在<b>堆上的词法环境（Environment Record）</b>里，由闭包的内层函数通过作用域链持有。
          </li>
          <li>
            <b>回收规则：</b>闭包函数本身被 GC 判死，它拽着的这份作用域才会一起回收。
            所以 setTimeout 的回调、挂在 window 上的函数，会把自己的 outer 一路吊住。
          </li>
          <li>
            <b>引擎是"按需捕获"的：</b>V8 只把内层真正引用到的变量放进词法环境，
            没被引用的局部变量照常销毁——所以说闭包"省内存"是有前提的。
          </li>
        </ul>
      </section>

      <section className="clo-block">
        <h3>⚠️ 高频陷阱清单</h3>
        {PITFALLS.map((p) => (
          <div className="clo-pit" key={p.name}>
            <p className="clo-pit-name">⚠️ {p.name}</p>
            <p className="clo-pit-detail">{p.detail}</p>
          </div>
        ))}
      </section>

      <section className="clo-block">
        <h3>🌍 闭包在真实工程里的样子</h3>
        <ul className="clo-list">
          <li><b>防抖 / 节流：</b>timer 变量活在闭包里——它就是"闭包存状态"最常见的一次实战。</li>
          <li><b>React Hooks：</b>useState / useMemo 的"每次渲染记住自己的值"，靠的正是每个组件函数各自闭包（配合 Fiber）持有的状态。</li>
          <li><b>缓存库：</b>Lodash 的 _.memoize、数据请求的 SWR / React Query 的结果缓存，核心数据结构都是闭包里的 Map。</li>
          <li><b>模块模式 / IIFE：</b>ES Module 普及前，前端用 IIFE + 闭包模拟私有变量和命名空间隔离。</li>
        </ul>
      </section>
    </div>
  )
}
