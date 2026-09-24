/* =========================================================
 * 🧠 本质 · 权重表 · 陷阱：CSS 选择器与优先级
 * ---------------------------------------------------------
 * 纯静态讲解页，样式作用域挂在 .cse-root 下，随本主题懒加载。
 * ========================================================= */

// 选择器五大家族
const FAMILIES = [
  ['基础', '<code>p</code> <code>.btn</code> <code>#app</code> <code>*</code> <code>[type="text"]</code>', '标签 / 类 / ID / 通配 / 属性，一切组合的地基'],
  ['组合', '<code>.a .b</code>（后代） <code>.a &gt; .b</code>（子代） <code>.a + .b</code>（相邻兄弟） <code>.a ~ .b</code>（通用兄弟）', '描述元素之间的位置关系'],
  ['分组与逻辑', '<code>,</code> <code>:is()</code> <code>:where()</code> <code>:not()</code>', '合并选择器；三兄弟的差别全在权重上（见陷阱）'],
  ['伪类', '<code>:hover</code> <code>:first-child</code> <code>:nth-child(2n)</code> <code>:checked</code> <code>:focus-visible</code>', '元素的状态或位置，权重 = 类'],
  ['伪元素', '<code>::before</code> <code>::after</code> <code>::first-line</code> <code>::selection</code>', '虚构出的"元素片段"，权重 = 标签'],
]

// 权重档位表：四元组 (内联, ID, 类, 标签)
const WEIGHT = [
  ['内联 style', '(1, 0, 0, 0)', '<code>style="…"</code>', '正常权重里最高，只有 !important 能盖过'],
  ['ID 选择器', '(0, 1, 0, 0)', '<code>#app</code>', '一个 ID 顶一整排类'],
  ['类 / 属性 / 伪类', '(0, 0, 1, 0)', '<code>.btn</code> <code>[href]</code> <code>:hover</code>', '三者<b>同列同权</b>，谁也不比谁高'],
  ['标签 / 伪元素', '(0, 0, 0, 1)', '<code>div</code> <code>::before</code>', '最弱的"实在"权重'],
  ['通配 / :where()', '(0, 0, 0, 0)', '<code>*</code> <code>:where(…)</code>', '零权重：只匹配、不参与竞争'],
  ['!important', '——', '<code>color: red !important</code>', '跳出权重体系直接掀桌；important 之间再比权重'],
]

// 高频陷阱
const PITFALLS = [
  {
    t: '继承是"保底"，任何直接命中都赢',
    d: '从父元素继承来的样式不参与权重比较——只要有一条规则直接命中该元素（哪怕权重是 0 的 *），继承值就输。所以"我明明给 body 设了颜色，子元素怎么不生效"多半是被直接规则覆盖了。',
  },
  {
    t: ':is() 取参数最高，:where() 恒为 0',
    d: ':is(h2, #x) 的权重等于 #x（参数里最高的那个），:where(h2, #x) 恒为 0。写复用样式、不想影响别人的覆盖能力时，用 :where() 包一层是"零侵入"的标准姿势。',
  },
  {
    t: '打平不看"谁更具体"，只看书写顺序',
    d: '权重完全相同时，后来者居上——写在样式表后面的赢。所以组件库样式通常放前面、业务覆盖放后面；反过来调顺序能"修好"样式，但那是脆弱解法。',
  },
  {
    t: '!important 是逃生舱，不是日常工具',
    d: '一处 important 逼出处处 important，最终样式表变成互相掀桌的军备竞赛。正解：用 @layer 划分层级、降低选择器耦合、或提高结构合理性。只有在覆盖第三方不可控样式时才值得动用。',
  },
  {
    t: '权重相同 ≠ 选择器长得像',
    d: '.a.b.c（三个类，0,0,3,0）也压不过 #x（0,1,0,0）——逐列比较，左列分出胜负后右列根本不看。别数选择器"长度"，数的是四元组。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap cse-root cse-essence">
      <section className="cse-block">
        <h3>🧠 一句话本质</h3>
        <p className="cse-lead">
          选择器负责<b>选中谁</b>，优先级负责<b>多条规则抢同一属性时听谁的</b>。
          优先级 = 权重四元组 <b>(内联, ID, 类列, 标签列)</b> 从左到右逐列比较，大的赢；
          打平看<b>书写顺序</b>（后来者居上）；<code>!important</code> 跳出体系直接掀桌。
          记法：<b>ID &gt; 类/属性/伪类 &gt; 标签/伪元素 &gt; 通配/继承</b>。
        </p>
      </section>

      <section className="cse-block">
        <h3>🗂️ 选择器五大家族</h3>
        <table className="cse-compare">
          <thead>
            <tr>
              <th>家族</th>
              <th>例子</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {FAMILIES.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
                <td>{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="cse-block">
        <h3>⚖️ 权重档位表（从高到低）</h3>
        <table className="cse-compare">
          <thead>
            <tr>
              <th>档位</th>
              <th>四元组</th>
              <th>例子</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {WEIGHT.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td>
                  <code>{r[1]}</code>
                </td>
                <td dangerouslySetInnerHTML={{ __html: r[2] }} />
                <td dangerouslySetInnerHTML={{ __html: r[3] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="cse-block">
        <h3>⚠️ 高频陷阱</h3>
        <ul className="cse-list">
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
