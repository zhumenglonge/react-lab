/* =========================================================
 * 🎯 面试总结：TS 基础原子类型
 * 作用域挂在 .tsb-summary 下，样式随本主题懒加载。
 * ========================================================= */

const NOTES = [
  {
    q: 'TS 有哪些基础（原子）类型？',
    a: '7 种基础原子类型，和 JS 的 7 种原始值对应：string、number、boolean、null、undefined、symbol、bigint。此外 TS 还有编译期专有的特殊类型：any、unknown、void、never；数组、对象、字面量、元组、enum 等都是由原子类型组合出来的。',
  },
  {
    q: '这些类型和 JS 的 typeof 结果一致吗？',
    a: '大多一致（string/number/boolean/undefined/symbol/bigint 的 typeof 就是同名），但有两个经典坑：typeof null === "object"（历史遗留 bug），typeof NaN === "number"。而且 TS 类型编译后被擦除，运行时只剩 typeof 能判断。',
  },
  {
    q: 'any 和 unknown 的区别？',
    a: 'any 完全关闭检查且会沿赋值/调用传染，等于局部退回 JS；unknown 是「类型安全的 any」，能接收任何值但使用前必须 typeof / instanceof / 断言收窄。处理外部输入（接口返回、JSON.parse）一律先当 unknown。',
  },
  {
    q: 'void 和 never 的区别？',
    a: 'void 表示函数「返回了但没有有意义的值」，运行时其实是 undefined；never 表示「永远不会有值」——抛异常、死循环、穷尽性检查的 default 分支。never 是所有类型的子类型，可赋给任何类型，反之不行。',
  },
  {
    q: 'null 和 undefined 在 TS 里怎么处理？',
    a: '开 strictNullChecks（strict 默认包含）后，null / undefined 不能随便赋给其它类型，必须显式写联合类型如 string | null。这能在编译期消灭一大类空值 bug。',
  },
  {
    q: '什么是字面量类型和类型拓宽？',
    a: '字面量类型是把具体的值当类型，如 "up" | "down"、1。const 声明会保留最窄的字面量类型；let 声明会「拓宽」成 string / number。想固定字面量集合用 const + as const，或显式标注联合字面量类型。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap tsb-root tsb-summary">
      <section className="tsb-block">
        <h3>🧠 一句话本质</h3>
        <p className="tsb-lead">
          TS 的<b>基础原子类型有 7 种</b>——<code>string</code>、<code>number</code>、
          <code>boolean</code>、<code>null</code>、<code>undefined</code>、<code>symbol</code>、
          <code>bigint</code>，与 JS 的原始值一一对应。之上还有<b>编译期专有</b>的
          <code>any</code> / <code>unknown</code> / <code>void</code> / <code>never</code>，
          以及由它们组合出的数组、对象、字面量、enum 等。所有类型<b>编译后全部擦除</b>。
        </p>
      </section>

      <section className="tsb-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="tsb-list">
          {NOTES.map((n) => (
            <li key={n.q}>
              <b>{n.q}</b>
              {n.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="tsb-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="tsb-quote">
          <p>
            "TS 的<b>基础原子类型有 7 种</b>，和 JS 的原始值对应：<code>string</code>、
            <code>number</code>、<code>boolean</code>、<code>null</code>、<code>undefined</code>、
            <code>symbol</code>、<code>bigint</code>。"
          </p>
          <p>
            "在这之上 TS 加了几个<b>编译期专有</b>的特殊类型：<code>any</code>（关闭检查、会传染）、
            <code>unknown</code>（安全版 any，用前必须收窄）、<code>void</code>（函数无返回值）、
            <code>never</code>（永远不会有值，比如抛异常）。数组、对象、元组、字面量、enum 这些
            都是由原子类型<b>组合</b>出来的，不算原子类型。"
          </p>
          <p>
            "有两个容易考的坑：<code>typeof null</code> 是 <code>"object"</code>（历史 bug），
            <code>NaN</code> 属于 <code>number</code>。另外这些类型<b>编译后全被擦除</b>，
            运行时只能靠 typeof 判断——所以我平时接收外部数据会先用 <code>unknown</code> 再收窄。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
