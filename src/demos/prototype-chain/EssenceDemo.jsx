import { NEW_STEPS, TRIANGLE } from './shared.js'

/* =========================================================
 * 🧠 本质 · 三角关系 · 陷阱：原型链与继承
 * ---------------------------------------------------------
 * 静态讲解页 + 纯 CSS 三角关系图，样式作用域挂在 .ptc-root 下。
 * ========================================================= */

// ES5 继承 vs class
const INHERIT = [
  ['继承实例属性', '<code>Parent.call(this, …)</code> 偷构造函数', '<code>super(…)</code>（必须先调用才能用 this）'],
  ['继承原型方法', '<code>Child.prototype = Object.create(Parent.prototype)</code>', '<code>class Child extends Parent</code> 一行'],
  ['constructor 修复', '要手动 <code>Child.prototype.constructor = Child</code>', '引擎自动处理'],
  ['调用方式', '普通函数，可不加 new（this 会丢）', '必须 new，否则 TypeError'],
  ['本质', '接线：把子原型的 __proto__ 指到父原型', '完全相同的接线，只是语法糖'],
]

// 特殊关系（面试爱考）
const SPECIALS = [
  ['Object.prototype.__proto__ === null', '原型链的尽头，null 没有原型'],
  ['Function.__proto__ === Function.prototype', '「鸡生蛋」：Function 自己构造自己'],
  ['Object.__proto__ === Function.prototype', 'Object 构造函数也是函数，由 Function 构造'],
  ['fn.__proto__ === Function.prototype', '所有函数（含 class）都从 Function.prototype 来'],
  ['箭头函数没有 prototype', '所以不能被 new；它的 this 由外层作用域决定'],
]

// 高频陷阱
const PITFALLS = [
  {
    t: '__proto__ 不是标准写法',
    d: '它是历史遗留的访问器，正式代码用 Object.getPrototypeOf(obj) / Object.setPrototypeOf()（后者性能差，尽量用 Object.create 或 class 代替）。面试口头说 __proto__ 没问题，写代码要换标准 API。',
  },
  {
    t: '原型是共享引用，不是拷贝',
    d: '改 Person.prototype 立刻影响所有已创建实例（它们存的是引用）。这既是优点（省内存），也是风险——给 Object.prototype 乱加属性就是「原型污染」，所有对象都会被 for...in 扫出来。',
  },
  {
    t: 'for...in 会把原型链上的可枚举属性带出来',
    d: '这就是 for...in 遍历对象要配 hasOwnProperty 过滤的原因（参见「for...in vs for...of」主题）。原型上的方法默认不可枚举，所以平时看不到，但 Object.create 接出来的链上谁加了可枚举属性都会漏进来。',
  },
  {
    t: 'ES5 继承别写 Child.prototype = new Parent()',
    d: '老式「原型链继承」会执行一次 Parent，把实例属性（如 tags 数组）挂到 Child.prototype 上被所有子实例共享——改一个全都变。寄生组合继承用 Object.create 只接线不执行，才避开这个坑。',
  },
  {
    t: '自有属性遮蔽原型属性，delete 也删不掉原型上的',
    d: 'p.name = "x" 是新建自有属性，不是修改原型；delete p.name 只删自有属性，原型上的 sayHi 依然沿链可见。想真正覆盖行为，要么赋值遮蔽，要么动原型本身。',
  },
  {
    t: 'instanceof 跨 iframe / 跨 realm 失效',
    d: '两个 window 各有一套 Array.prototype，引用不相等，iframe 里的数组 instanceof 主 window 的 Array 是 false。跨 realm 判断用 Array.isArray 或 Object.prototype.toString.call。详见「instanceof 原理与实现」主题。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap ptc-root ptc-essence">
      <section className="ptc-block">
        <h3>🧠 一句话本质</h3>
        <p className="ptc-lead">
          每个对象都有一根隐式原型线 <code>__proto__</code>，<code>new</code> 的那一刻被接到
          构造函数的 <code>prototype</code> 上；这些线一环扣一环向上，直到{' '}
          <code>Object.prototype → null</code>，就是<b>原型链</b>。
          它的工作方式只有一条：<b>找属性 = 沿链爬楼梯</b>——自身没有就上一环再问，
          爬到 null 为止。继承的本质不是复制代码，而是<b>接线</b>。
        </p>
      </section>

      {/* ---------- 三角关系图 ---------- */}
      <section className="ptc-block">
        <h3>🔺 三角关系：prototype / __proto__ / constructor</h3>
        <div className="ptc-triangle">
          <div className="ptc-tri-node ptc-tri-fn">
            <b>Person</b>（构造函数）
          </div>
          <div className="ptc-tri-mid">
            <div className="ptc-tri-edge">
              <span className="ptc-tri-label">.prototype →</span>
              <span className="ptc-tri-label ptc-tri-label-back">← .constructor</span>
            </div>
          </div>
          <div className="ptc-tri-node ptc-tri-proto">
            <b>Person.prototype</b>（原型对象：sayHi 住这里）
          </div>
          <div className="ptc-tri-mid">
            <div className="ptc-tri-edge">
              <span className="ptc-tri-label">↑ __proto__（new 时接线）</span>
            </div>
          </div>
          <div className="ptc-tri-node ptc-tri-inst">
            <b>p</b>（实例：name 住这里）
          </div>
        </div>
        <table className="ptc-compare">
          <thead>
            <tr>
              <th>角色</th>
              <th>是什么</th>
              <th>要点</th>
            </tr>
          </thead>
          <tbody>
            {TRIANGLE.map((r) => (
              <tr key={r[0]}>
                <td>
                  <code>{r[0]}</code>
                </td>
                <td>{r[1]}</td>
                <td>{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="ptc-block">
        <h3>🏗️ new 一个对象时发生的四步</h3>
        <table className="ptc-compare">
          <thead>
            <tr>
              <th>步骤</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {NEW_STEPS.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td>{r[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="ptc-block">
        <h3>⚔️ ES5 寄生组合继承 vs class extends</h3>
        <table className="ptc-compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>ES5</th>
              <th>ES6 class</th>
            </tr>
          </thead>
          <tbody>
            {INHERIT.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
                <td dangerouslySetInnerHTML={{ __html: r[2] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="ptc-block">
        <h3>🌀 特殊关系（背下来直接加分）</h3>
        <ul className="ptc-list">
          {SPECIALS.map((r) => (
            <li key={r[0]}>
              <code>{r[0]}</code>
              {r[1]}
            </li>
          ))}
        </ul>
      </section>

      <section className="ptc-block">
        <h3>⚠️ 高频陷阱</h3>
        <ul className="ptc-list">
          {PITFALLS.map((p) => (
            <li key={p.t}>
              <b>{p.t}</b>
              {p.d}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
