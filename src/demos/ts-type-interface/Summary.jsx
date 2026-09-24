/* =========================================================
 * 🎯 面试总结：type vs interface · any/unknown/never
 * 作用域挂在 .tti-summary 下，样式随本主题懒加载。
 * ========================================================= */

const NOTES = [
  {
    q: 'type 和 interface 有什么区别？',
    a: '描述对象形状时大多可互换。区别：interface 支持声明合并（同名自动合并）、能被 class implements、对象类型报错更友好；type 能表达联合、交叉、元组、映射、条件类型，还能给任何类型（含基础类型）起别名。type 不能重复声明，扩展只能用交叉 &。',
  },
  {
    q: '定义一个对象，用哪种更合适？',
    a: '优先 interface——它是描述对象/类公共契约的首选，可被 implements、可声明合并、报错友好，也方便库使用者扩展。只有当你需要联合、交叉、元组、映射等类型运算时才用 type。团队里二选一保持统一即可，一致性比选择本身更重要。',
  },
  {
    q: '同名的 interface 会合并吗？',
    a: '会。这叫「声明合并」，是 interface 独有的能力：两个同名 interface 的字段会合并成一个类型。典型用途是给第三方库或全局对象（如 Window）打补丁追加字段。type 则不行，同名重复定义会报 Duplicate identifier。',
  },
  {
    q: 'any / unknown / never 的区别？',
    a: 'any 是逃逸舱，关闭检查且会传染，任何值和 any 可双向赋值；unknown 是顶类型（top type），能接收任何值但使用前必须 typeof/instanceof/断言收窄；never 是底类型（bottom type），装不下任何值，却能赋给任何类型，用于抛异常函数和穷尽性检查。',
  },
  {
    q: '什么时候用 unknown 而不是 any？',
    a: '接收一切不确定的外部输入时——接口返回、JSON.parse、事件参数、用户输入。unknown 和 any 一样能装任何值，但它强迫你先收窄再用，把「先检查再操作」变成编译期硬性要求，避免 any 那样把错误漏到运行时。',
  },
  {
    q: 'never 有什么实际用途？',
    a: '最常见是穷尽性检查：在处理联合类型的 switch 的 default 分支写 const _exhaustive: never = x，一旦漏掉某个联合成员，编译期就报错，保证分支覆盖完整。此外抛异常的函数、死循环函数的返回类型也标 never。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap tti-root tti-summary">
      <section className="tti-block">
        <h3>🧠 一句话本质</h3>
        <p className="tti-lead">
          <b>对象契约用 interface，类型运算用 type</b>；interface 能<b>声明合并</b>（同名自动合并），
          type 不能重复声明。<b>any 放弃检查、unknown 是顶类型（用前必收窄）、never 是底类型
          （装不下值却能赋给任何类型）</b>。接收外部输入用 unknown，穷尽性检查用 never，尽量别用 any。
        </p>
      </section>

      <section className="tti-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="tti-list">
          {NOTES.map((n) => (
            <li key={n.q}>
              <b>{n.q}</b>
              {n.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="tti-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="tti-quote">
          <p>
            "<b>type 和 interface</b> 在描述对象形状上大多能互换。区别是：<b>interface 支持声明合并</b>——
            同名的两个 interface 字段会自动合并，还能被 class implements，对象类型的报错也更友好；
            <b>type 能写联合、交叉、元组、映射、条件类型</b>，还能给任何类型起别名，但不能重复声明，
            扩展只能用交叉 <code>&</code>。"
          </p>
          <p>
            "所以<b>定义对象我优先用 interface</b>，尤其是对外暴露的契约，方便别人扩展；需要类型运算时才用
            <b>type</b>。同名 interface 会合并这个特性，常用来给第三方库或全局对象打补丁。"
          </p>
          <p>
            "<b>any / unknown / never</b> 是三个极端：<code>any</code> 是逃逸舱，关闭检查还会传染；
            <code>unknown</code> 是<b>顶类型</b>，能收任何值但用前必须收窄，处理接口返回、JSON.parse
            这类外部输入我都用它；<code>never</code> 是<b>底类型</b>，装不下任何值却能赋给任何类型，
            我主要用它做<b>穷尽性检查</b>——switch 的 default 里断言 never，漏了分支编译期就报错。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
