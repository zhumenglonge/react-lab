/* =========================================================
 * 🎯 面试总结：CSS 常用布局
 * 作用域挂在 .cl-summary 下，样式随本主题懒加载。
 * ========================================================= */

const NOTES = [
  {
    q: 'CSS 有哪些常用的布局方式？',
    a: '按发展顺序：① 标准文档流（block/inline/inline-block）；② 浮动 float 布局；③ 定位 position（relative/absolute/fixed/sticky）；④ Flexbox 弹性布局（一维）；⑤ Grid 网格布局（二维）；再配合媒体查询做响应式。现代开发主力是 Flex + Grid + 定位，浮动基本退居历史。',
  },
  {
    q: 'Flex 和 Grid 有什么区别？什么时候用哪个？',
    a: 'Flex 是一维布局，一次只处理一行或一列，从内容出发决定如何填满容器，擅长对齐和分配空间；Grid 是二维布局，同时控制行和列，从容器出发先画格子再放内容，擅长整页骨架和规整的行列区域。经验法则：一条线排列用 Flex，又行又列用 Grid，实际常嵌套使用。',
  },
  {
    q: '什么是浮动塌陷？怎么清除浮动？',
    a: 'float 子元素脱离文档流，父容器计算高度时算不到它，导致父盒高度塌陷。清除方法：给父级加 overflow:hidden 触发 BFC、使用 clearfix 伪元素、或父级也浮动；最彻底的是改用 flex/grid，它们不存在塌陷问题。',
  },
  {
    q: 'BFC 是什么？怎么触发？',
    a: 'BFC（块格式化上下文）是一个独立的渲染区域，内部布局不影响外部。触发条件：overflow 非 visible、display:flow-root/inline-block/table-cell、position:absolute/fixed、float 非 none、根元素等。用途：清除浮动、防止 margin 塌陷、实现两栏自适应（左浮动 + 右栏 BFC）。',
  },
  {
    q: 'position 的 relative / absolute / fixed / sticky 区别？',
    a: 'relative 相对自身原位置偏移、不脱流、仍占位；absolute 相对最近的非 static 祖先偏移、脱流不占位；fixed 相对视口固定、滚动不动；sticky 在相对与固定之间切换，到达阈值前像 relative、之后像 fixed。absolute/fixed 常以 relative 的父元素作定位参照。',
  },
  {
    q: '水平垂直居中怎么做？',
    a: '首选 Flex：父级 display:flex + justify-content:center + align-items:center；或 Grid：display:grid + place-items:center；老方案是绝对定位 + transform:translate(-50%,-50%)。margin:0 auto 只能水平居中。',
  },
  {
    q: '经典三栏布局（两侧定宽、中间自适应）怎么实现？',
    a: '现代用 Grid 一行搞定：grid-template-columns: 200px 1fr 200px；或用 Flex，两侧定宽、中间 flex:1。历史上考圣杯/双飞翼布局：float + margin，DOM 顺序中间在前，需要清浮动，较繁琐。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap cl-root cl-summary">
      <section className="cl-block">
        <h3>🧠 一句话本质</h3>
        <p className="cl-lead">
          CSS 布局就是<b>决定盒子在页面里怎么摆</b>。手段从早到晚是{' '}
          <b>文档流 → 浮动 → 定位 → Flex → Grid</b>；现代主力是{' '}
          <b>Flex 管一维、Grid 管二维、position 管叠加锚定</b>，再用{' '}
          <b>媒体查询</b>做响应式，浮动因清浮动麻烦已基本被替代。
        </p>
      </section>

      <section className="cl-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="cl-list">
          {NOTES.map((n) => (
            <li key={n.q}>
              <b>{n.q}</b>
              {n.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="cl-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="cl-quote">
          <p>
            "CSS 常用布局按发展有这么几种：<b>标准文档流</b>（块级竖排、行内横排、inline-block）、
            <b>浮动布局</b>、<b>定位布局</b>（relative/absolute/fixed/sticky），以及现代的{' '}
            <b>Flexbox 弹性布局</b>和 <b>Grid 网格布局</b>，再配合<b>媒体查询</b>实现响应式。"
          </p>
          <p>
            "现在项目里主力是 <b>Flex 和 Grid</b>：Flex 是<b>一维</b>布局，一次管一行或一列，
            靠主轴/交叉轴做对齐和空间分配，适合导航、居中等；Grid 是<b>二维</b>布局，
            先定义行列轨道再往里放内容，适合整页骨架和卡片墙。一句话——<b>一条线用 Flex，
            又行又列用 Grid</b>，两者经常嵌套。"
          </p>
          <p>
            "延伸几个经典考点：浮动会<b>脱离文档流导致父容器高度塌陷</b>，要靠{' '}
            <b>清除浮动</b>（overflow:hidden 触发 BFC、clearfix）解决；<b>position</b> 里 absolute
            相对最近的非 static 祖先、fixed 相对视口、sticky 是相对和固定的过渡；居中首选{' '}
            <code>flex + justify/align-items:center</code> 或 <code>grid + place-items:center</code>；
            经典三栏用 <code>grid-template-columns: 200px 1fr 200px</code> 一行就能实现。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
