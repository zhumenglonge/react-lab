import { useState, useEffect } from 'react'

/* =========================================================
 * ④ 浏览器渲染：关键渲染路径（Critical Rendering Path）
 * ---------------------------------------------------------
 * HTML/CSS → DOM/CSSOM → 渲染树 → 布局 → 绘制 → 合成，六步。
 * 顶部管线点步骤，下方画板给出该步的可视化。
 * 局部小组件 Tree 不导出（满足 react-refresh 只导出组件的约束）。
 * ========================================================= */

/* 一份最小示例页面，贯穿整个渲染演示 */
const HTML_SRC = `<html>
  <head>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <h1>标题</h1>
    <p>一段文字</p>
  </body>
</html>`

const CSS_SRC = `h1 { color: #e11; font-size: 24px; }
p  { color: #37d67a; }`

const DOM_TREE = [
  {
    label: 'document',
    children: [
      {
        label: 'html',
        children: [
          { label: 'head', children: [{ label: 'link' }] },
          {
            label: 'body',
            children: [
              { label: 'h1', children: [{ label: '"标题"' }] },
              { label: 'p', children: [{ label: '"一段文字"' }] },
            ],
          },
        ],
      },
    ],
  },
]

const CSSOM_TREE = [
  {
    label: 'root',
    children: [
      { label: 'h1', children: [{ label: 'color:#e11  font-size:24px' }] },
      { label: 'p', children: [{ label: 'color:#37d67a' }] },
    ],
  },
]

const RENDER_TREE = [
  {
    label: 'root（只保留可见节点）',
    children: [
      { label: 'h1 · color:#e11 · 24px' },
      { label: 'p · color:#37d67a' },
    ],
  },
]

/* 递归渲染一棵树（纯展示用局部组件，不 export） */
function Tree({ data }) {
  return (
    <ul className="up-tree">
      {data.map((n, i) => (
        <li key={i} className="up-tree-li">
          <span className="up-tree-node">{n.label}</span>
          {n.children && <Tree data={n.children} />}
        </li>
      ))}
    </ul>
  )
}

/* 布局阶段：只有位置和尺寸，没有颜色 */
const LayoutArt = (
  <div className="up-canvas">
    <div className="up-box up-box-layout">
      <span className="up-box-tag">h1</span>
      <span className="up-dim">x:16 y:16 w:280 h:29</span>
    </div>
    <div className="up-box up-box-layout">
      <span className="up-box-tag">p</span>
      <span className="up-dim">x:16 y:61 w:280 h:18</span>
    </div>
  </div>
)

/* 绘制阶段：把盒子填上颜色、文字、阴影等像素 */
const PaintArt = (
  <div className="up-canvas">
    <div className="up-box up-box-paint up-box-h1">标题</div>
    <div className="up-box up-box-paint up-box-p">一段文字</div>
  </div>
)

/* 合成阶段：多个图层分别绘制后，交给 GPU 合成上屏 */
const CompositeArt = (
  <div className="up-composite">
    <div className="up-layers">
      <span className="up-layer up-layer-3">文字层</span>
      <span className="up-layer up-layer-2">背景层</span>
      <span className="up-layer up-layer-1">根图层</span>
    </div>
    <span className="up-composite-arrow">→ 合成 →</span>
    <div className="up-final">
      <div className="up-box up-box-paint up-box-h1">标题</div>
      <div className="up-box up-box-paint up-box-p">一段文字</div>
    </div>
  </div>
)

const STEPS = [
  {
    key: 'dom',
    pill: '① DOM',
    title: '解析 HTML → 构建 DOM 树',
    note: (<>浏览器把字节流的 HTML 按标签解析成一棵 <b>DOM 树</b>，每个标签是一个节点。DOM 是页面在内存里的结构化表示，JS 操作的就是它。</>),
    art: (
      <div className="up-split">
        <pre className="code">{HTML_SRC}</pre>
        <Tree data={DOM_TREE} />
      </div>
    ),
  },
  {
    key: 'cssom',
    pill: '② CSSOM',
    title: '解析 CSS → 构建 CSSOM 树',
    note: (<>同时解析 CSS，构建 <b>CSSOM 树</b>（样式规则树）。注意：<b>CSS 不阻塞 DOM 解析，但阻塞渲染</b>——没有样式就没法画；而且它会阻塞后面的 JS 执行（因为 JS 可能读样式）。</>),
    art: (
      <div className="up-split">
        <pre className="code">{CSS_SRC}</pre>
        <Tree data={CSSOM_TREE} />
      </div>
    ),
  },
  {
    key: 'render',
    pill: '③ 渲染树',
    title: 'DOM + CSSOM → 渲染树（Render Tree）',
    note: (<>把 DOM 和 CSSOM 合并成 <b>渲染树</b>：只包含<b>会显示出来的可见节点</b>。像 <code>head</code>、以及 <code>display:none</code> 的元素都不在渲染树里（但 <code>visibility:hidden</code> 在，只是看不见、仍占位）。</>),
    art: <Tree data={RENDER_TREE} />,
  },
  {
    key: 'layout',
    pill: '④ Layout 布局',
    title: '布局 / 回流（Reflow）',
    note: (<>根据渲染树计算每个节点在屏幕上的<b>精确位置和大小</b>（几何信息），这一步叫 <b>Layout 布局</b>，也叫<b>回流</b>。此时只有"盒子在哪、多大"，还没有颜色。</>),
    art: LayoutArt,
  },
  {
    key: 'paint',
    pill: '⑤ Paint 绘制',
    title: '绘制（Repaint）',
    note: (<>把每个节点转成<b>实际的像素</b>：填充颜色、画文字、图片、边框、阴影……这一步叫 <b>Paint 绘制</b>，改颜色/背景等只影响外观不影响布局的属性，只会触发<b>重绘</b>而不会回流。</>),
    art: PaintArt,
  },
  {
    key: 'composite',
    pill: '⑥ Composite 合成',
    title: '合成（Composite）',
    note: (<>页面常分成多个<b>图层</b>，分别绘制后由 <b>GPU 合成</b>成最终画面显示到屏幕上。用 <code>transform</code>/<code>opacity</code> 做动画能直接走合成，<b>不触发回流和重绘</b>，所以最流畅。</>),
    art: CompositeArt,
  },
]

const STEP_MS = 2000

export default function RenderDemo() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      const next = step + 1
      setStep(next)
      if (next >= STEPS.length - 1) setPlaying(false)
    }, STEP_MS)
    return () => clearTimeout(t)
  }, [playing, step])

  const play = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (step >= STEPS.length - 1) setStep(0)
    setPlaying(true)
  }
  const reset = () => {
    setPlaying(false)
    setStep(0)
  }
  const jump = (i) => {
    setPlaying(false)
    setStep(i)
  }

  const cur = STEPS[step]

  return (
    <div>
      <div className="demo-header">
        <h2>④ 渲染流程 · 关键渲染路径</h2>
        <p className="demo-sub">
          拿到 HTML/CSS 后，浏览器怎么把它变成屏幕上的像素？走的是
          <b> DOM → CSSOM → 渲染树 → 布局 → 绘制 → 合成</b> 这条"关键渲染路径"。点管线上的步骤或"自动播放"看每一步在干嘛。
        </p>
      </div>

      {/* 顶部管线 */}
      <div className="up-rp-pipeline">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            className={'up-rp-pill' + (i === step ? ' up-rp-active' : i < step ? ' up-rp-done' : '')}
            onClick={() => jump(i)}
          >
            {s.pill}
          </button>
        ))}
      </div>

      <div className="demo-box">
        <h3 className="up-rp-title">{cur.title}</h3>
        {/* 用 key 触发切换动画 */}
        <div className="up-rp-stage" key={cur.key}>
          {cur.art}
        </div>
        <p className="up-rp-note">{cur.note}</p>
      </div>

      <div className="up-controls">
        <div className="btn-row">
          <button onClick={play}>{playing ? '⏸ 暂停' : '▶ 自动播放'}</button>
          <button className="ghost" onClick={() => jump(Math.max(step - 1, 0))} disabled={step === 0}>← 上一步</button>
          <button className="ghost" onClick={() => jump(Math.min(step + 1, STEPS.length - 1))} disabled={step === STEPS.length - 1}>下一步 →</button>
          <button className="ghost" onClick={reset}>重置</button>
        </div>
        <span className="up-progress">步骤 {step + 1} / {STEPS.length}</span>
      </div>

      <p className="tip">
        💡 <b>回流（Layout/Reflow）</b>必然引发<b>重绘（Paint）</b>，但重绘不一定回流。回流要重新算布局，代价大：
        改元素尺寸/位置/内容、窗口 resize、读取 <code>offsetTop</code>/<code>clientWidth</code> 等都会触发。
        <br />
        💡 优化：<b>批量改样式</b>（用 class 一次性改）、让动画元素<b>脱离文档流</b>（absolute/fixed）、
        动画优先用 <code>transform / opacity</code>（只走合成）、把 CSS 放 <code>&lt;head&gt;</code>、JS 放底部或加 <code>defer/async</code>。
      </p>
    </div>
  )
}
