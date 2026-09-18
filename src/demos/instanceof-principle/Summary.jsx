/* =========================================================
 * 🎯 面试总结：instanceof 原理与实现
 * 作用域挂在 .iof-summary 下，样式自带一份（懒加载不依赖其它主题）。
 * ========================================================= */

// 高频追问点（模块级常量、未导出，不与组件同文件导出，符合 react-refresh 约定）
const IMPL_NOTES = [
  {
    q: 'instanceof 为什么对原始类型返回 false？',
    a: '原始值（number / string / null 等）没有 [[Prototype]]，无从爬链。判断原始类型该用 typeof；注意 new Number(1) instanceof Number 是 true，因为它是包装对象。',
  },
  {
    q: '[] instanceof Object 为什么是 true？',
    a: '原型链是 [] → Array.prototype → Object.prototype → null，中途经过 Object.prototype，所以命中。凡是对象，几乎都 instanceof Object（Object.create(null) 除外）。',
  },
  {
    q: '为什么跨 iframe 会失效？怎么解决？',
    a: '每个 window / realm 有独立的一套内置构造器，iframe 里的 Array.prototype 和主窗口的不是同一个引用，比较自然 false。解决：Array.isArray() 或 Object.prototype.toString.call()，它们不依赖构造器引用。',
  },
  {
    q: 'Symbol.hasInstance 是什么？',
    a: 'instanceof 会先检查右侧对象有没有这个方法，有就调用它、用它的返回值。可以给普通对象自定义「什么算我的实例」，也意味着 instanceof 的结果可被人为改写，不是绝对可靠。',
  },
  {
    q: 'instanceof 能判断自定义类的继承吗？',
    a: '能，这正是它最有价值的场景。class Student extends Person，则 new Student() instanceof Person 为 true，因为 Student.prototype 的 [[Prototype]] 指向 Person.prototype，原型链上能找到。',
  },
  {
    q: 'Object.create(null) instanceof Object 为什么是 false？',
    a: '它是不带原型的「纯字典对象」，[[Prototype]] 直接是 null，第一步就到链尾。这类对象也调不了 toString / hasOwnProperty，常用来做无污染的 map。',
  },
  {
    q: 'Function instanceof Function 为什么是 true？',
    a: 'Function 构造器的 [[Prototype]] 指向它自己的 Function.prototype（历史设计），所以沿链第一环就命中。同理 Object instanceof Function 也是 true（Object 本身是个函数对象）。',
  },
]

const COMPARE = [
  ['原理', '读取值的内部「类型标签」', '沿原型链查找 B.prototype 的引用', '读取 Object.prototype.toString 的内部标签'],
  ['擅长', '原始类型（除 null）+ function', '引用类型 / 自定义类的继承关系', '8 种类型全分得清，最准'],
  ['[] 数组', '返回 "object" ❌ 分不出', '[] instanceof Array → true ✅', "'[object Array]' ✅"],
  ['null', '返回 "object" ❌', 'null instanceof Object → false', "'[object Null]' ✅"],
  ['原始类型', '✅ 正好用它判断', '❌ 一律 false（没有原型链）', '✅（会先装箱）'],
  ['跨 iframe', '可靠', '❌ 失效（构造器不是同一个）', '可靠'],
  ['可被篡改', '否', '是（Symbol.hasInstance / 改原型链）', '是（改 Symbol.toStringTag）'],
]

export default function Summary() {
  return (
    <div className="demo-wrap iof-root iof-summary">
      <section className="iof-block">
        <h3>🧠 一句话本质</h3>
        <p className="iof-lead">
          <code>a instanceof B</code> 判断的是：<b>B.prototype 是否出现在 a 的原型链上</b>。
          实现就是从 <code>a</code> 的 <code>[[Prototype]]</code> 出发，一路向上遍历原型链，
          只要有一环<b>引用相等</b>于 <code>B.prototype</code> 就返回 <code>true</code>；
          走到原型链尽头（<code>null</code>）仍没找到就返回 <code>false</code>。
          它比的是<b>对象引用</b>，不是类型名字符串。
        </p>
      </section>

      <section className="iof-block">
        <h3>📐 规范里的完整流程（OrdinaryHasInstance）</h3>
        <ol className="iof-steps">
          <li>若 <code>B</code> 不是对象 → 抛 <b>TypeError</b>。</li>
          <li>若 <code>B</code> 有 <code>@@hasInstance</code>（<code>Symbol.hasInstance</code>）→ 调用它并返回结果（可自定义）。</li>
          <li>取 <code>proto = B.prototype</code>；若 <code>proto</code> 不是对象 → 抛 <b>TypeError</b>。</li>
          <li>若 <code>a</code> 不是对象（原始类型）→ 返回 <b>false</b>。</li>
          <li>循环：<code>a = a.[[Prototype]]</code>，若 <code>a === proto</code> 返回 <b>true</b>；若 <code>a === null</code> 返回 <b>false</b>。</li>
        </ol>
      </section>

      <section className="iof-block">
        <h3>🔍 typeof vs instanceof vs toString（怎么选）</h3>
        <table className="iof-compare">
          <thead>
            <tr><th>维度</th><th>typeof</th><th>instanceof</th><th>Object.prototype.toString.call</th></tr>
          </thead>
          <tbody>
            {COMPARE.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="iof-note">
          选型口诀：<b>原始类型用 typeof，精确判类型用 toString，判继承关系才用 instanceof</b>；
          判数组优先 <code>Array.isArray()</code>（跨 iframe 也准）。
        </p>
      </section>

      <section className="iof-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="iof-list">
          {IMPL_NOTES.map((n) => (
            <li key={n.q}><b>{n.q}</b>{n.a}</li>
          ))}
        </ul>
      </section>

      <section className="iof-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="iof-quote">
          <p>
            "instanceof 的原理是<b>沿原型链查找</b>：<code>{'a instanceof B'}</code> 会从 a 的原型开始，
            逐个判断是否<b>引用相等</b>于 <code>B.prototype</code>，命中返回 true，一直走到 <code>null</code>
            还没命中就返回 false。所以它只对<b>引用类型</b>有意义，原始类型直接 false。"
          </p>
          <p>
            "手写就三步：<b>①</b> 拦掉原始值和 null 直接返回 false；<b>②</b> 取 <code>Ctor.prototype</code> 作为目标，
            不是对象就抛 TypeError；<b>③</b> 用 <code>Object.getPrototypeOf</code> 从 obj 的原型开始循环向上比对。
            更严谨的话还要先判断 <code>Symbol.hasInstance</code>，因为原生 instanceof 会优先调用它。"
          </p>
          <p>
            "它有两个坑：一是<b>跨 iframe / 跨 realm 失效</b>，因为两个 window 各有一套构造器，原型引用不相等，
            这时该用 <code>Array.isArray</code> 或 <code>Object.prototype.toString.call</code>；
            二是结果<b>可被篡改</b>——改掉原型链或定义 <code>Symbol.hasInstance</code> 都能影响判断，所以它不是绝对可靠的类型检测。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
