/* =========================================================
 * 🧠 本质 · 结构 · 陷阱：CSS 常用布局
 * ---------------------------------------------------------
 * 纯静态讲解页：六大布局手段一览、Flex vs Grid、四种定位、
 * BFC、经典三栏布局方案对比 + 高频陷阱。
 * 样式作用域挂在 .cl-root 下，随本主题懒加载。
 * ========================================================= */

// 常用布局手段一览
const METHODS = [
  ['标准文档流（Normal Flow）', 'block 竖排独占一行、inline 横排、inline-block 横排可设宽高', '最基础的默认排布；正文、表单、纵向堆叠的模块', 'CSS 初始值，无需声明'],
  ['浮动布局（Float）', 'float 让元素脱离文档流向左/右贴，文字环绕', '早期多栏、图片环绕；现在基本被 flex/grid 取代', '⚠️ 必须清除浮动，否则父盒塌陷'],
  ['弹性布局（Flexbox）', '一维布局：主轴 + 交叉轴，容器/项目两级属性控制对齐分配', '导航栏、工具条、居中、等分/两端对齐的一排元素', '现代一维首选，alignment 极强'],
  ['网格布局（Grid）', '二维布局：先定义行/列轨道，再把内容放进单元格', '整页骨架、卡片墙、仪表盘等行列都规整的区域', '现代二维首选，模板化强'],
  ['定位布局（Position）', 'relative/absolute/fixed/sticky 配合 top/left 精确摆放', '弹层、下拉、角标、悬浮按钮、图钉、层叠覆盖', '脱离常规流，做叠加与锚定'],
  ['响应式辅助', '媒体查询 @media + flex/grid 的自适应 + rem/vw 单位 + container query', '一套代码适配手机/平板/桌面', '不是独立布局，而是让布局随视口变化'],
]

// Flex vs Grid
const FLEX_VS_GRID = [
  ['维度', '一维：一次只管一行<b>或</b>一列', '二维：同时管行<b>和</b>列'],
  ['布局起点', '从<b>内容</b>出发：项目决定如何填满容器', '从<b>容器</b>出发：先画格子再往里放内容'],
  ['对齐能力', '强：justify/align + 主轴顺序、伸缩、换行', '强：区域划分 + 单元格内对齐 + 跨行跨列'],
  ['典型场景', '一排按钮、居中一个盒子、弹性导航', '整页布局、九宫格卡片、表格化界面'],
  ['经验法则', '一条线排 → Flex；又行又列 → Grid', '两者可嵌套：Grid 定骨架，内部用 Flex'],
]

// 四种定位
const POSITION = [
  ['static', '默认值，跟随文档流，top/left 无效'],
  ['relative', '相对自身原位置偏移，<b>不脱流</b>，仍占原空间；常作 absolute 的定位参照'],
  ['absolute', '相对最近的非 static 祖先偏移，<b>脱离文档流</b>，不占位'],
  ['fixed', '相对视口偏移，脱流，滚动时钉住不动（顶栏、悬浮按钮）'],
  ['sticky', '相对滚动容器在阈值内"粘"住，是 relative + fixed 的过渡态，脱流前仍占位'],
]

// 经典三栏（两翼固定 + 中间自适应）方案
const HOLY = [
  ['float + margin（双飞翼/圣杯）', '左右浮动 + 中间 margin 留位；老面试高频', '要清浮动、DOM 顺序需中间在前，繁琐'],
  ['Flex', 'display:flex，两侧定宽、中间 flex:1', '✅ 主流方案，简单且能垂直居中'],
  ['Grid', 'grid-template-columns: 200px 1fr 200px', '✅ 最直观，一行定义三栏'],
  ['absolute 定位', '左右绝对定位、中间 margin 留白', '脱流、不适配内容高度，很少用'],
]

const PITFALLS = [
  {
    t: '浮动必须清除，否则父容器高度塌陷',
    d: 'float 子元素脱离文档流，父盒算不到其高度。解法：父级 overflow:hidden / 触发 BFC、加 clearfix 伪元素、或干脆改用 flex/grid（不存在塌陷）。',
  },
  {
    t: 'inline-block 之间会有 4px 空白缝隙',
    d: '换行符/空格被当成词间空格渲染。解法：父级 font-size:0、或用 margin-left 负值、或直接用 flex 排。',
  },
  {
    t: 'flex 子项溢出：min-width 默认 auto 而非 0',
    d: '项目内容很长时 flex-basis 撑不开、拒绝收缩导致溢出。给子项加 min-width: 0（或 overflow:hidden）才允许它缩到内容以下，text-overflow 才能生效。',
  },
  {
    t: 'justify-content / align-items 作用轴随 flex-direction 变',
    d: 'justify 管主轴、align 管交叉轴；direction 切成 column 后，"水平居中"就变成了"垂直居中"。搞混轴向是 flex 最常见的错。',
  },
  {
    t: 'absolute 找不到定位参照会跟着视口/文档跑',
    d: 'position:absolute 相对最近的非 static 祖先；若祖先全是 static，就以初始包含块（视口/文档）为基准导致错位。记得给参照父级加 position:relative。',
  },
  {
    t: 'Grid 的 1fr 与 auto、minmax 混淆',
    d: '1fr 是"剩余空间等分份额"，会被内容撑大；auto 按内容收缩；要限制最小/最大用 minmax(min, max)，避免长文本把列顶爆。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap cl-root cl-essence">
      <section className="cl-block">
        <h3>🧠 一句话本质</h3>
        <p className="cl-lead">
          CSS 布局就是<b>决定盒子在页面里怎么摆</b>。手段从早到晚依次是：
          <b>文档流 → 浮动 → 定位 → Flex → Grid</b>。现代开发主力是 <b>Flex（一维）</b>和{' '}
          <b>Grid（二维）</b>，配合<b>定位（position）</b>做叠加与锚定、<b>媒体查询</b>做响应式；
          浮动因清除麻烦已基本退居历史。
        </p>
      </section>

      <section className="cl-block">
        <h3>🧩 六大常用布局手段</h3>
        <table className="cl-compare">
          <thead>
            <tr>
              <th>布局方式</th>
              <th>核心机制</th>
              <th>典型场景</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {METHODS.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
                <td>{r[2]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[3] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="cl-block">
        <h3>⚔️ Flex vs Grid（几乎必问）</h3>
        <table className="cl-compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>Flexbox</th>
              <th>Grid</th>
            </tr>
          </thead>
          <tbody>
            {FLEX_VS_GRID.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
                <td dangerouslySetInnerHTML={{ __html: r[2] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="cl-block">
        <h3>🎯 position 四种定位取值</h3>
        <table className="cl-compare">
          <thead>
            <tr>
              <th>取值</th>
              <th>参照谁 / 是否占位</th>
            </tr>
          </thead>
          <tbody>
            {POSITION.map((r) => (
              <tr key={r[0]}>
                <td>
                  <code>{r[0]}</code>
                </td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="cl-block">
        <h3>🏛️ 经典三栏布局（两侧定宽 + 中间自适应）方案演进</h3>
        <table className="cl-compare">
          <thead>
            <tr>
              <th>方案</th>
              <th>做法</th>
              <th>评价</th>
            </tr>
          </thead>
          <tbody>
            {HOLY.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
                <td dangerouslySetInnerHTML={{ __html: r[2] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="cl-block">
        <h3>⚠️ 高频陷阱</h3>
        <ul className="cl-list">
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
