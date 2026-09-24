/* =========================================================
 * 🎯 面试总结：CSS 选择器与优先级
 * 作用域挂在 .cse-summary 下，样式随本主题懒加载。
 * ========================================================= */

const NOTES = [
  {
    q: 'CSS 有哪些选择器？',
    a: '五大类：基础（标签/类/ID/通配/属性）、组合（后代/子代/相邻兄弟/通用兄弟）、分组与逻辑（逗号、:is/:where/:not）、伪类（:hover/:nth-child 等状态与位置）、伪元素（::before/::after 等虚构片段）。',
  },
  {
    q: '优先级到底怎么比？',
    a: '权重四元组 (内联, ID, 类列, 标签列)，从左到右逐列比，大的赢：内联 > #id > 类/属性/伪类 > 标签/伪元素 > 通配(*)。类、属性、伪类三者同列同权；伪元素按标签计。',
  },
  {
    q: '权重相同怎么办？继承的样式排在哪？',
    a: '权重打平看书写顺序，后来者居上（源码里靠后的赢）。继承不参与权重竞争——任何直接命中元素的声明都压过继承值，哪怕权重为 0。',
  },
  {
    q: ':is() 和 :where() 有什么区别？',
    a: '都是分组简写，差别只在权重：:is() 取参数列表里最高的权重，:where() 恒为 0。想写零侵入的复用样式就用 :where()；:not() 的权重则等于其参数。',
  },
  {
    q: '!important 该怎么看？',
    a: '它跳出正常权重体系直接获胜（important 之间再比权重），但属于破坏层叠可维护性的逃生舱，应优先用 @layer、降低选择器耦合解决；覆盖第三方不可控样式时才动用。',
  },
  {
    q: '实战里怎么调试优先级？',
    a: 'DevTools 的 Styles 面板：被划掉的声明就是输掉竞争的，鼠标悬停选择器会直接显示 Specificity 数值，不用手算。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap cse-root cse-summary">
      <section className="cse-block">
        <h3>🧠 一句话本质</h3>
        <p className="cse-lead">
          <b>选择器管"选中谁"，优先级管"冲突时听谁的"</b>——比的是权重四元组
          <b>（内联, ID, 类列, 标签列）</b>，逐列比大小；打平<b>后来者居上</b>；
          <code>!important</code> 例外掀桌。口诀：<b>ID &gt; 类 &gt; 标签，同权看顺序</b>。
        </p>
      </section>

      <section className="cse-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="cse-list">
          {NOTES.map((n) => (
            <li key={n.q}>
              <b>{n.q}</b>
              {n.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="cse-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="cse-quote">
          <p>
            "选择器我一般分五大类：<b>基础</b>（标签、类、ID、通配、属性）、
            <b>组合</b>（后代、子代、兄弟）、<b>逻辑分组</b>（:is / :where / :not）、
            <b>伪类</b>和<b>伪元素</b>。"
          </p>
          <p>
            "优先级按<b>权重四元组 (内联, ID, 类, 标签)</b> 逐列比较，左列大的直接赢：
            内联 &gt; ID &gt; 类/属性/伪类 &gt; 标签/伪元素，通配符和 :where() 计 0；
            <b>权重相同看书写顺序，后来者居上</b>；继承的样式不参与竞争，任何直接命中都覆盖它。"
          </p>
          <p>
            "两个加分点：一是 <code>:is()</code> 取参数里最高权重、<code>:where()</code> 恒为 0，
            后者适合写零侵入的复用样式；二是 <code>!important</code> 虽然能掀桌，
            但我会优先用 <code>@layer</code> 或调整选择器结构解决冲突，它只留给覆盖第三方样式的场景。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
