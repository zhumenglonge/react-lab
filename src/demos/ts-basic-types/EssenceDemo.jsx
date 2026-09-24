/* =========================================================
 * 🧠 本质 · 全景 · 陷阱：TS 基础原子类型
 * ---------------------------------------------------------
 * 纯静态讲解页，样式作用域挂在 .tsb-root 下，随本主题懒加载。
 * ========================================================= */

// 7 种基础原子类型（对应 JS 的 7 种原始值）
const PRIMITIVES = [
  ['string', '<code>let s: string = "hi"</code>', '字符串。还能收窄成字面量类型 <code>"hi"</code>'],
  ['number', '<code>let n: number = 42</code>', '所有数字（整数/浮点/十六进制/<code>NaN</code>/<code>Infinity</code>），JS 只有一种数字类型'],
  ['boolean', '<code>let b: boolean = true</code>', 'true / false'],
  ['null', '<code>let x: null = null</code>', '空值。strict 下需显式 <code>| null</code> 才能赋'],
  ['undefined', '<code>let u: undefined = undefined</code>', '未定义。同样受 strictNullChecks 约束'],
  ['symbol', '<code>let sym: symbol = Symbol("id")</code>', 'ES6 唯一值，常作对象唯一键；<code>unique symbol</code> 是更窄的字面量类型'],
  ['bigint', '<code>let big: bigint = 10n</code>', 'ES2020 任意精度整数，typeof 独立为 <code>"bigint"</code>'],
]

// 编译期专有的特殊类型（没有运行时 typeof 对应）
const SPECIAL = [
  ['any', '关闭类型检查，能赋任何值也能做任何操作，<b>会传染</b>。等于局部退回 JS'],
  ['unknown', '<b>类型安全的 any</b>：能接收任何值，但用之前必须 typeof / instanceof / 断言收窄'],
  ['void', '函数<b>没有返回值</b>（运行时其实返回 undefined）。和返回 never 的函数不同'],
  ['never', '<b>永远不会有值</b>：抛异常、死循环、穷尽检查的 default。是所有类型的子类型'],
  ['object', '泛指「非原始值」——数组、函数、普通对象都算。日常更常用具体的 interface / type'],
]

// 由原子类型组合出来的「非原子」类型（顺带厘清边界）
const COMPOSED = [
  ['字面量类型', '<code>type Dir = "up" | "down"</code>、<code>type One = 1</code> —— 值本身当类型'],
  ['联合 / 交叉', '<code>string | number</code>（其一）、<code>A & B</code>（同时满足）'],
  ['数组 / 元组', '<code>number[]</code> 或 <code>Array&lt;number&gt;</code>；元组 <code>[string, number]</code> 定长定序'],
  ['函数类型', '<code>(a: number) =&gt; string</code>'],
  ['enum', '<code>enum Status { Idle, Run }</code> —— 注意它会<b>编译出真实对象</b>，不是纯类型'],
]

// let / const 与字面量拓宽
const WIDENING = [
  ['<code>const s = "hi"</code>', '类型是字面量 <code>"hi"</code>', 'const 不可再赋值，TS 保留最窄的字面量类型'],
  ['<code>let s = "hi"</code>', '类型拓宽为 <code>string</code>', 'let 之后可能变成别的字符串，TS 主动拓宽'],
  ['<code>const arr = ["a"]</code>', '<code>string[]</code>', '数组元素仍会拓宽（除非 as const）'],
  ['<code>const o = { a: 1 } as const</code>', '<code>{ readonly a: 1 }</code>', 'as const 冻结成只读字面量，不拓宽'],
]

// 高频陷阱
const PITFALLS = [
  {
    t: 'typeof null === "object"，但 TS 里 null 是独立类型',
    d: '这是 JS 第一版遗留 bug，运行时 typeof 分不清 null 和对象。TS 类型系统里 null 和 object 毫无关系，别被 typeof 结果误导。判断 null 用 === null。',
  },
  {
    t: 'NaN / Infinity 都是 number，不是独立类型',
    d: 'typeof NaN 是 "number"，TS 里 NaN 也归 number。判断 NaN 只能用 Number.isNaN()（不要用 === NaN，它永远 false）。',
  },
  {
    t: 'any 会传染，unknown 才安全',
    d: '一个 any 顺着赋值和调用链把周围都变成 any，等于白写类型。接收不确定输入时用 unknown，编译器强迫你先收窄再用。',
  },
  {
    t: 'void ≠ never',
    d: 'void 是「返回了，但没有有意义的值」（运行时是 undefined）；never 是「根本回不来」（抛异常/死循环）。函数签名别写混。',
  },
  {
    t: 'let 会拓宽字面量，const 不会',
    d: 'const x = "hi" 的类型是 "hi"，let x = "hi" 拓宽成 string。想要固定字面量集合时用 const + as const，或显式标注联合字面量类型。',
  },
  {
    t: 'enum 不是「纯类型」，会产出运行时代码',
    d: '类型擦除只针对 interface / type / 类型标注。enum 会编译成一个真实的 IIFE 对象存在于运行时。追求零运行时开销可改用 as const 对象 + 联合字面量类型。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap tsb-root tsb-essence">
      <section className="tsb-block">
        <h3>🧠 一句话本质</h3>
        <p className="tsb-lead">
          TS 的<b>基础原子类型有 7 种</b>，和 JS 的 7 种原始值一一对应：
          <code>string</code>、<code>number</code>、<code>boolean</code>、<code>null</code>、
          <code>undefined</code>、<code>symbol</code>、<code>bigint</code>。
          在这之上 TS 还加了几个<b>编译期专有</b>的特殊类型——
          <code>any</code> / <code>unknown</code> / <code>void</code> / <code>never</code>，
          它们没有运行时对应物；再往上的数组、对象、字面量、enum 等都是<b>组合类型</b>，
          由原子类型拼出来。所有类型最终<b>编译后全部擦除</b>，产物是纯 JS。
        </p>
      </section>

      <section className="tsb-block">
        <h3>🧱 7 种基础原子类型</h3>
        <table className="tsb-table">
          <thead>
            <tr><th>类型</th><th>声明示例</th><th>说明</th></tr>
          </thead>
          <tbody>
            {PRIMITIVES.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
                <td dangerouslySetInnerHTML={{ __html: r[2] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tsb-block">
        <h3>🎭 编译期专有的特殊类型</h3>
        <table className="tsb-table">
          <thead>
            <tr><th>类型</th><th>含义</th></tr>
          </thead>
          <tbody>
            {SPECIAL.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tsb-block">
        <h3>🧩 组合类型（由原子类型拼出，非原子）</h3>
        <table className="tsb-table">
          <thead>
            <tr><th>类别</th><th>写法与说明</th></tr>
          </thead>
          <tbody>
            {COMPOSED.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tsb-block">
        <h3>📐 let / const 与字面量拓宽</h3>
        <table className="tsb-table">
          <thead>
            <tr><th>写法</th><th>推断类型</th><th>原因</th></tr>
          </thead>
          <tbody>
            {WIDENING.map((r) => (
              <tr key={r[0]}>
                <td dangerouslySetInnerHTML={{ __html: r[0] }} />
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
                <td dangerouslySetInnerHTML={{ __html: r[2] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tsb-block">
        <h3>⚠️ 高频陷阱</h3>
        <ul className="tsb-pit">
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
