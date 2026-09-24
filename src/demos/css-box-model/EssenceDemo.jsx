/* =========================================================
 * 🧠 本质 · 结构 · 陷阱：CSS 盒模型
 * ---------------------------------------------------------
 * 纯静态讲解页 + 一个纯 CSS 画的四层结构图，
 * 样式作用域挂在 .cbm-root 下，随本主题懒加载。
 * ========================================================= */

// 标准盒模型 vs IE 盒模型
const SIZING = [
  ['width 的含义', '仅 <b>content</b> 的宽', '<b>content + padding + border</b> 的总宽'],
  ['设置 padding/border 后', '盒子<b>被撑大</b>，布局容易被顶歪', '盒子<b>总宽不变</b>，内容区被压缩'],
  ['总宽公式', 'width + 2×padding + 2×border', 'width（内容 = max(0, width − 2p − 2b)）'],
  ['box-sizing 值', 'content-box（<b>CSS 默认值</b>）', 'border-box'],
  ['现代实践', '需要精确控制内容尺寸时', '几乎全局标配：<code>*, *::before, *::after { box-sizing: border-box }</code>'],
]

// 常用盒尺寸 API
const METRICS = [
  ['offsetWidth / offsetHeight', 'border 外沿尺寸（content + padding + border），取整'],
  ['clientWidth / clientHeight', 'padding 内沿尺寸（content + padding，不含 border 和滚动条）'],
  ['scrollWidth / scrollHeight', '内容完整尺寸（含溢出被裁剪的部分）'],
  ['getBoundingClientRect()', '浮点精度的边框盒尺寸，含 transform 效果，做碰撞/定位判断用它'],
]

// 高频陷阱
const PITFALLS = [
  {
    t: 'margin 塌陷：垂直相邻外边距会合并',
    d: '上下相邻块的 margin-bottom 与 margin-top 取 max 而不是相加；父子间没有 border/padding 隔开时，子元素的 margin-top 还会"穿透"父元素。解法：给父元素加 padding/border、触发 BFC（如 overflow: hidden）、或改用 gap（flex/grid 不存在塌陷）。',
  },
  {
    t: 'margin: auto 只保证水平居中',
    d: '块级元素 margin: 0 auto 能水平居中是因为水平剩余空间会被均分；垂直方向没有"剩余空间"概念，auto 算作 0。垂直居中要靠 flex（align-items: center）、grid（place-items: center）或定位。',
  },
  {
    t: '百分比 padding / margin 参照的是父元素「宽度」',
    d: 'padding-top: 10% 是父元素 width 的 10%，不是 height——这个反直觉的点常被用来做等比例占位（aspect-ratio 出现之前的经典技巧）。',
  },
  {
    t: '行内非替换元素不吃垂直尺寸',
    d: 'span 这类行内元素设置 width/height、垂直 margin 都无效（水平 padding/margin 有效但不影响行高布局）。要控制尺寸先 display: inline-block 或 block。',
  },
  {
    t: 'offsetWidth 是整数，布局计算会失真',
    d: 'offset* / client* 系列都四舍五入取整，亚像素布局下会累积误差；需要精确值时用 getBoundingClientRect()（浮点，且包含 transform）。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap cbm-root cbm-essence">
      <section className="cbm-block">
        <h3>🧠 一句话本质</h3>
        <p className="cbm-lead">
          每个元素都是一个矩形盒子，从内到外四层：<b>content → padding → border → margin</b>。
          两种盒模型的区别只在一件事上：<b>width 到底量到哪一层</b>——标准盒模型（content-box）
          量到内容为止，padding/border 额外向外撑；IE 盒模型（border-box）量到边框为止，
          总宽所见即所得。用 <code>box-sizing</code> 切换。
        </p>
      </section>

      {/* ---------- 纯 CSS 四层结构图 ---------- */}
      <section className="cbm-block">
        <h3>🧅 盒子四层结构（由外到内）</h3>
        <div className="cbm-diagram">
          <div className="cbm-layer cbm-layer-margin">
            <span className="cbm-layer-tag">margin 外边距（透明，隔开别人）</span>
            <div className="cbm-layer cbm-layer-border">
              <span className="cbm-layer-tag">border 边框（可见的边界）</span>
              <div className="cbm-layer cbm-layer-padding">
                <span className="cbm-layer-tag">padding 内边距（内容和边框的呼吸区）</span>
                <div className="cbm-layer cbm-layer-content">content 内容区</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cbm-block">
        <h3>⚔️ 标准盒模型 vs IE 盒模型</h3>
        <table className="cbm-compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>标准（content-box）</th>
              <th>IE（border-box）</th>
            </tr>
          </thead>
          <tbody>
            {SIZING.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
                <td dangerouslySetInnerHTML={{ __html: r[2] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="cbm-block">
        <h3>📐 常用盒尺寸 API</h3>
        <table className="cbm-compare">
          <thead>
            <tr>
              <th>API</th>
              <th>量的是哪一层</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((r) => (
              <tr key={r[0]}>
                <td>
                  <code>{r[0]}</code>
                </td>
                <td>{r[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="cbm-block">
        <h3>⚠️ 高频陷阱</h3>
        <ul className="cbm-list">
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
