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
    detail: '内层函数被长期引用（定时器、全局事件、挂到 DOM 上、或干脆是顶层的一个 const）时，它 remember 的整个外层作用域都不会回收，大对象跟着一起吊住。不用时主动置 null / 清理监听器；判定到底回收没，看下一节的堆快照实测。',
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
        <h3>🔬 实测：闭包变量到底回收了没（DevTools Heap Snapshot）</h3>
        <p className="clo-lead">
          "什么时候销毁"不用背结论，堆快照里能直接看见。判据只有一条：
          <b>从 GC Root 顺着引用链能不能走到它</b>——走得通就是活的，跟代码执行完没执行完、
          跟那个函数你到底调用过没有，都<b>没有关系</b>。
        </p>

        <p className="clo-lead">先准备一段只差封装方式的对照样本（仓库里的 <code>src/index.html</code> 就是 A 版本，外面套一层 IIFE 即 B 版本）：</p>
        <pre className="clo-code clo-code-full">{`const Person = () => {
  let age = 1;
  return { growUp: () => { age++ } };   // 箭头函数一样有闭包，照样捕获 age
};

// A. 回收不掉：person 声明在 <script> 顶层
const person = Person();
person.growUp();
// 引用链：全局词法环境(GC Root) → person → {growUp} → Context → age
// 哪怕把 person.growUp() 这行删掉，age 照样活着；
// 而且写成 const 连 person = null 都做不到（TypeError），只能等页面卸载。

// B. 可以回收：把持有者降级成局部变量（IIFE）
(function () {
  let p = Person();
  p.growUp();
})();
// IIFE 返回后 p 出栈 → growUp 不可达 → 下一次 GC 连带 age 一起回收`}</pre>

        <p className="clo-tip">
          ⏳ 把 A 版本的存活期说清楚：<b>它的存活期就是整个页面的存活期</b>。
          脚本执行完了、标签页切走了、好几分钟没人碰——这些<b>都不构成回收理由</b>，
          GC 扫到它依旧判定"可达"而放过去；只有<b>页面卸载、文档被销毁</b>（关 tab、导航离开）那一刻，
          全局词法环境整个消失，<code>person</code> 才连同 <code>age</code> 一起释放。
          这就是 B 版本存在的意义：把持有者关进局部作用域，才能等到一个"能死"的时机。
        </p>

        <p className="clo-lead">实测路线六步，A/B 各跑一遍对比着看：</p>
        <ol className="clo-list">
          <li>
            <b>开面板：</b>DevTools（F12）→ <b>Memory</b> → 选 <b>Heap snapshot</b> →
            <b>Take snapshot</b> 拍第一张当基线。
          </li>
          <li>
            <b>拍之前先手动 GC：</b>点 Memory 面板左上角的<b>垃圾桶图标</b>强制回收。
            跳过这步，"已经不可达但还没回收"的对象会留在快照里，你会误判成"回收不掉"。
          </li>
          <li>
            <b>执行动作：</b>打开 A 版本页面（或跑一遍 B 的 IIFE），回 DevTools 拍第二张。
          </li>
          <li>
            <b>切 Comparison 视图：</b>看两张快照之间新增（<b>+#</b>）的对象；
            顺手把中间那张用 <b>Snapshot 列的 ×</b> 删掉——留在面板里的旧快照本身就是强引用。
          </li>
          <li>
            <b>定位闭包容器：</b>在 Class filter 里搜 <code>{'system / Context'}</code>，
            V8 就是把闭包捕获的变量装在这类节点里；展开能看到 <code>age</code> 属性（累加后是 2）。
          </li>
          <li>
            <b>看 Retainers（决定性一步）：</b>选中那个 Context，下方 <b>Retainers</b> 面板会画出它
            一路到 GC Root 的完整链路。<b>A 版本</b>顶端挂着 <code>{'global / Script'}</code>，
            说明根上攥着它 → 回收不掉；<b>B 版本</b>同一个位置压根搜不到这个 Context → 已被回收。
          </li>
        </ol>

        <p className="clo-tip">
          ⚠️ 三个会骗你的地方：① 在 Console 里手敲过 <code>person</code>、用过 <code>{'$_ / copy()'}</code>，
          Console 自己就成了引用源，本来能回收的闭包会被判成活（假阳性），测前先 <code>clear()</code>；
          ② <code>age</code> 是小整数时是内联值，不一定生成独立节点，把样本换成
          <code>{`let age = { name: 'age' }`}</code> 这类对象值更好定位；③ 快照之间的差值不等于泄漏，
          要连着拍三张看只增不减才算。
        </p>
        <p className="clo-tip">
          💡 面试收尾句："闭包里的变量<b>不是到点销毁，而是等到再也引用不到时交给 GC 回收</b>；
          是死是活我用 <b>Heap Snapshot 的 Retainers</b> 查过引用链，顶端挂在谁上一眼就看出来了。"
        </p>
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
