/* =========================================================
 * 🧠 本质 · 对比 · 陷阱：type vs interface · any/unknown/never
 * ---------------------------------------------------------
 * 纯静态讲解页，样式作用域挂在 .tti-root 下，随本主题懒加载。
 * ========================================================= */

// type vs interface 能力对比
const ABILITY = [
  ['描述对象 / 类的形状', '✅ 可以', '✅ 可以', '两者都行，这是最主要的共同用途'],
  ['声明合并（同名自动合并）', '❌ 报 Duplicate identifier', '✅ 独有', '给第三方库 / 全局对象打补丁只能靠 interface'],
  ['被 class implements', '⚠️ 需是对象类型', '✅ 原生支持', '面向对象的公共契约首选 interface'],
  ['extends 继承', '⚠️ 用交叉 A & B', '✅ extends', 'interface 可多继承：extends A, B'],
  ['联合类型 A | B', '✅ 独有', '❌ 不支持', 'string | number 这类只能用 type'],
  ['元组 / 映射 / 条件类型', '✅ 独有', '❌ 不支持', 'type 是类型体操的主战场'],
  ['给基础类型起别名', '✅ <code>type ID = string</code>', '❌ 只能描述对象', 'type 能给任何类型起别名'],
  ['性能 / 报错友好度', '复杂类型略慢、报错难读', '对象类型更优', '大型对象契约 interface 报错更清晰、可缓存'],
]

// 定义对象该用哪个
const OBJECT_PICK = [
  ['对象的形状、类的公共契约', '<b>interface</b>', '可声明合并、可被 implements、报错信息更友好，是描述对象/契约的首选'],
  ['联合、交叉、元组、映射、工具类型', '<b>type</b>', '这些能力 interface 根本表达不了'],
  ['库作者对外暴露的对象类型', '<b>interface</b>', '方便使用者用声明合并扩展（如给配置对象补字段）'],
  ['团队内部、二选一即可', '都行，<b>统一就好</b>', '绝大多数对象场景两者可互换，一致性比选择本身更重要'],
]

// any / unknown / never 三者本质
const TRIPLE = [
  ['any', '逃逸舱（既是 top 又是 bottom）', '任何值 ⇄ any 双向都行', '关闭类型检查，会传染；等于局部退回 JS'],
  ['unknown', 'top type（顶类型）', '任何值 → unknown 可以；unknown → 具体类型不行', '类型安全的 any：能收任何值，但用前必须收窄'],
  ['never', 'bottom type（底类型）', 'never → 任何类型可以；任何值 → never 不行', '永不出现的值：抛异常 / 死循环 / 穷尽检查 default'],
]

// 高频陷阱
const PITFALLS = [
  {
    t: 'interface 声明合并可能"悄悄"改类型',
    d: '同名 interface 自动合并是特性也是坑：两处不相干的代码定义了同名 interface，字段会被合并到一起，排查时很懵。业务代码里避免无意的同名 interface；要合并请显式、集中。',
  },
  {
    t: 'type 扩展已有类型只能用交叉 &',
    d: 'type 不能重复声明，扩展要写 type B = A & { extra: string }。交叉合并同名冲突字段时可能得到 never，注意字段类型要兼容。',
  },
  {
    t: 'any 会沿赋值和调用链传染',
    d: '一个 any 流进函数参数、返回值、变量，把周围一片都变成 any，等于白写类型。接收不确定输入用 unknown，逼自己先收窄。',
  },
  {
    t: 'unknown 用前不收窄，一样编译不过',
    d: 'unknown 不是"更好用的 any"——直接访问它的属性/调用会报错。它的价值就是强迫你 typeof / instanceof / 断言收窄，收窄后才是安全的。',
  },
  {
    t: 'never 的穷尽性检查要配合 default 断言',
    d: '在 switch 的 default 分支把参数赋给 never 变量（const _exhaustive: never = x），漏处理某个联合成员时编译期就报错。这是 never 最实用的落地场景。',
  },
  {
    t: '别把 any 当"临时应急"到处 as any',
    d: 'as any 是最危险的操作——它让编译器彻底闭嘴，错了运行时才炸。宁可 as unknown 再收窄，或用类型守卫，尽量杜绝 as any。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap tti-root tti-essence">
      <section className="tti-block">
        <h3>🧠 一句话本质</h3>
        <p className="tti-lead">
          <b>type 与 interface</b> 在「描述对象形状」上大多可互换，分水岭是：
          <b>interface 能声明合并、能被 implements、对象报错更友好</b>；
          <b>type 能表达联合、交叉、元组、映射、条件类型，并给任何类型起别名</b>。
          定义对象/类的公共契约优先 <code>interface</code>，需要类型运算时用 <code>type</code>。
          <br /><br />
          <b>any / unknown / never</b> 是类型系统的三个极端：
          <code>any</code> 是逃逸舱（放弃检查）、<code>unknown</code> 是<b>顶类型</b>（能装任何值，用前必须收窄）、
          <code>never</code> 是<b>底类型</b>（装不下任何值，却能赋给任何类型）。
        </p>
      </section>

      <section className="tti-block">
        <h3>⚔️ type vs interface 能力对比</h3>
        <table className="tti-table">
          <thead>
            <tr><th>能力</th><th>type</th><th>interface</th><th>说明</th></tr>
          </thead>
          <tbody>
            {ABILITY.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
                <td dangerouslySetInnerHTML={{ __html: r[2] }} />
                <td dangerouslySetInnerHTML={{ __html: r[3] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tti-block">
        <h3>🎯 定义对象，到底用哪个？</h3>
        <table className="tti-table">
          <thead>
            <tr><th>场景</th><th>推荐</th><th>理由</th></tr>
          </thead>
          <tbody>
            {OBJECT_PICK.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
                <td dangerouslySetInnerHTML={{ __html: r[2] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tti-block">
        <h3>🚦 any / unknown / never 本质对比</h3>
        <table className="tti-table">
          <thead>
            <tr><th>类型</th><th>在类型系统里的位置</th><th>赋值方向</th><th>用途</th></tr>
          </thead>
          <tbody>
            {TRIPLE.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td>{r[1]}</td>
                <td>{r[2]}</td>
                <td>{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tti-block">
        <h3>⚠️ 高频陷阱</h3>
        <ul className="tti-pit">
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
