/* =========================================================
 * 🎯 面试总结：CSS 盒模型
 * 作用域挂在 .cbm-summary 下，样式随本主题懒加载。
 * ========================================================= */

const NOTES = [
  {
    q: '盒模型由哪几层组成？',
    a: '从内到外：content（内容）→ padding（内边距）→ border（边框）→ margin（外边距）。margin 是透明的，只负责把别的盒子推开。',
  },
  {
    q: '标准盒模型和 IE 盒模型的区别？',
    a: '区别只在 width 量到哪一层：标准（content-box，CSS 默认）width 只算 content，总宽 = width + 2×padding + 2×border；IE（border-box）width 算到 border 外沿，总宽就是 width 本身。box-sizing 属性切换。',
  },
  {
    q: '为什么现代项目都全局 border-box？',
    a: '所见即所得：给盒子加 padding/border 不会把布局撑爆，响应式和组件化开发里尺寸可控。常见做法是 *, *::before, *::after { box-sizing: border-box }（Tailwind、各大 reset 都这么干）。',
  },
  {
    q: '什么是 margin 塌陷？怎么解决？',
    a: '垂直方向相邻的 margin 会合并取最大值（30px + 20px = 30px）；父子之间没有 border/padding 阻隔时子元素 margin 还会穿透父元素。解决：父元素加 padding/border、触发 BFC（overflow: hidden 等）、或改用 flex/grid 的 gap——它们不存在塌陷。',
  },
  {
    q: 'offsetWidth、clientWidth、getBoundingClientRect 区别？',
    a: 'offsetWidth = border 外沿（取整）；clientWidth = content + padding（不含 border、滚动条）；getBoundingClientRect 返回浮点精度的边框盒，且包含 transform，做位置/碰撞判断用它。',
  },
  {
    q: '如何让一个盒子水平垂直居中？',
    a: '首选 flex：父级 display: flex + justify-content: center + align-items: center；grid 一行 place-items: center；老方案是绝对定位 + transform: translate(-50%, -50%)。margin: 0 auto 只能水平居中。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap cbm-root cbm-summary">
      <section className="cbm-block">
        <h3>🧠 一句话本质</h3>
        <p className="cbm-lead">
          万物皆盒：<b>content → padding → border → margin</b> 四层由内到外。
          标准盒模型与 IE 盒模型的分歧只有一件事——<b>width 量到哪一层</b>：
          content-box 量内容（padding/border 向外撑大），border-box 量到边框（总宽所见即所得），
          用 <code>box-sizing</code> 切换。
        </p>
      </section>

      <section className="cbm-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="cbm-list">
          {NOTES.map((n) => (
            <li key={n.q}>
              <b>{n.q}</b>
              {n.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="cbm-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="cbm-quote">
          <p>
            "盒模型是每个元素渲染成的矩形盒子，从内到外分四层：
            <b>content、padding、border、margin</b>。"
          </p>
          <p>
            "它有两种计算方式：<b>标准盒模型</b> box-sizing 默认 content-box，width 只指内容区，
            实际占位是 width + 2×padding + 2×border；<b>IE 盒模型</b> border-box 的 width
            包含 padding 和 border，盒子总宽所见即所得。现代项目基本全局设 border-box，
            因为加内边距不会撑爆布局。"
          </p>
          <p>
            "延伸两个常考点：一是 <b>margin 塌陷</b>——垂直相邻外边距合并取最大值，
            父子间还会穿透，可以用 BFC、padding 隔开或直接用 flex/grid 的 gap 规避；
            二是尺寸 API 的选择——<code>offsetWidth</code> 量到 border 外沿但取整，
            <code>clientWidth</code> 量到 padding，精确计算和含 transform 的场景用
            <code>getBoundingClientRect()</code>。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
