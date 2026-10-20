import { useState, useRef } from 'react'

/* =========================================================
 * ⚔️ 实跑对拍：CSS 布局切换台 + 浮动塌陷 BFC 实测
 * ---------------------------------------------------------
 * 一屏切换 6 种常用布局（文档流 / inline-block / 浮动 / flex /
 * grid / 绝对定位），当场看同样的 5 个盒子怎么排；下方实时生成
 * 对应的容器 CSS。浮动模式额外用 DOM 实测「不清除浮动 → 高度塌陷
 * → 加 overflow:hidden 触发 BFC 撑开」的真伪对比。
 * ========================================================= */

const MODES = [
  { key: 'flow', label: '📄 文档流' },
  { key: 'inline-block', label: '🧱 inline-block' },
  { key: 'float', label: '🌊 float 浮动' },
  { key: 'flex', label: '📐 Flex 弹性' },
  { key: 'grid', label: '🔳 Grid 网格' },
  { key: 'absolute', label: '🎯 absolute 定位' },
]

// 5 个宽高不同的盒子，才能看出各布局的排布差异
const ITEMS = [
  { label: '1', w: 80, h: 60 },
  { label: '2', w: 130, h: 92 },
  { label: '3', w: 60, h: 120 },
  { label: '4', w: 110, h: 70 },
  { label: '5', w: 90, h: 84 },
]

const FLEX_DIR = [
  ['row', 'row'],
  ['row-reverse', 'row-reverse'],
  ['column', 'column'],
]
const JUSTIFY = [
  ['flex-start', 'start'],
  ['center', 'center'],
  ['flex-end', 'end'],
  ['space-between', 'between'],
  ['space-around', 'around'],
  ['space-evenly', 'evenly'],
]
const ALIGN = [
  ['stretch', 'stretch'],
  ['flex-start', 'start'],
  ['center', 'center'],
  ['flex-end', 'end'],
]

const FC = 100 // 浮动演示：子块高
const FW = 160 // 浮动演示：子块宽

export default function RunDemo() {
  const [mode, setMode] = useState('flex')
  // flex / grid 共用参数
  const [flexDir, setFlexDir] = useState('row')
  const [justify, setJustify] = useState('space-between')
  const [align, setAlign] = useState('center')
  const [wrap, setWrap] = useState(true)
  const [gap, setGap] = useState(12)
  const [cols, setCols] = useState(3)
  const [clearfix, setClearfix] = useState(false)

  // 浮动塌陷实测
  const noClearRef = useRef(null)
  const withClearRef = useRef(null)
  const [bfc, setBfc] = useState(null)

  const measureBfc = () => {
    setBfc({
      noClear: noClearRef.current.offsetHeight,
      withClear: withClearRef.current.offsetHeight,
    })
  }

  const containerStyle = () => {
    switch (mode) {
      case 'inline-block':
        return { fontSize: 0 }
      case 'float':
        return { overflow: clearfix ? 'hidden' : 'visible' }
      case 'flex':
        return {
          display: 'flex',
          flexDirection: flexDir,
          justifyContent: justify,
          alignItems: align,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          gap: `${gap}px`,
        }
      case 'grid':
        return {
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: `${gap}px`,
        }
      case 'absolute':
        return { position: 'relative', height: 260 }
      default: // flow：默认 display:block
        return {}
    }
  }

  const itemStyle = (item, idx) => {
    switch (mode) {
      case 'inline-block':
        return {
          display: 'inline-block',
          width: item.w,
          height: item.h,
          margin: '0 8px 8px 0',
          verticalAlign: 'top',
        }
      case 'float':
        return { float: 'left', width: item.w, height: item.h, margin: '0 8px 8px 0' }
      case 'flex':
        return { width: item.w, height: align === 'stretch' ? undefined : item.h, flexShrink: 0 }
      case 'grid':
        return { minHeight: 72 }
      case 'absolute':
        return {
          position: 'absolute',
          left: 16 + idx * 72,
          top: 24 + (idx % 2) * 66,
          width: item.w,
          height: item.h,
        }
      default: // flow：块级独占一行
        return { height: 44, marginBottom: 6 }
    }
  }

  const code = buildCode(mode, { flexDir, justify, align, wrap, gap, cols, clearfix })

  return (
    <div className="demo-wrap cl-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 同样的 5 个盒子，6 种布局怎么排</h2>
        <p className="demo-sub">
          点下面的按钮切换布局手段，舞台里的盒子会<b>当场重排</b>；参数可调，下方实时生成对应的
          <b>容器 CSS</b>。选到 <b>float 浮动</b>时，底部还能实测「不清除浮动 → 父盒高度塌陷」。
        </p>
      </div>

      {/* ---------- 布局模式切换 ---------- */}
      <div className="cl-modebar">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={m.key === mode ? 'cl-pill active' : 'cl-pill'}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ---------- 参数控制 ---------- */}
      {(mode === 'flex' || mode === 'grid') && (
        <section className="cl-block cl-controls">
          {mode === 'flex' ? (
            <>
              <Seg label="flex-direction" opts={FLEX_DIR} value={flexDir} onChange={setFlexDir} />
              <Seg label="justify-content" opts={JUSTIFY} value={justify} onChange={setJustify} />
              <Seg label="align-items" opts={ALIGN} value={align} onChange={setAlign} />
              <label className="cl-check">
                <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />
                flex-wrap
              </label>
            </>
          ) : (
            <div className="cl-seg">
              <span className="cl-seg-label">grid-template-columns</span>
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  className={n === cols ? 'cl-mini active' : 'cl-mini'}
                  onClick={() => setCols(n)}
                >
                  repeat({n}, 1fr)
                </button>
              ))}
            </div>
          )}
          <label className="cl-slider">
            <span>
              gap：<b>{gap}px</b>
            </span>
            <input type="range" min="0" max="28" value={gap} onChange={(e) => setGap(Number(e.target.value))} />
          </label>
        </section>
      )}

      {mode === 'float' && (
        <section className="cl-block cl-controls">
          <label className="cl-check">
            <input type="checkbox" checked={clearfix} onChange={(e) => setClearfix(e.target.checked)} />
            给容器加 <code>overflow: hidden</code>（触发 BFC 清除浮动）
          </label>
        </section>
      )}

      {/* ---------- 舞台 ---------- */}
      <section className="cl-block">
        <div className="cl-stage">
          <div className="cl-container" style={containerStyle()}>
            {ITEMS.map((it, i) => (
              <div
                key={it.label}
                className={`cl-item cl-item-${i + 1}`}
                style={itemStyle(it, i)}
              >
                {it.label}
              </div>
            ))}
          </div>
        </div>
        <pre className="cl-code">{code}</pre>
      </section>

      {/* ---------- 浮动塌陷 BFC 实测 ---------- */}
      {mode === 'float' && (
        <section className="cl-block">
          <h3>🕳️ 浮动塌陷 · 经典面试坑（父盒高度算不算子浮动）</h3>
          <p className="cl-lead">
            子元素 <code>float: left</code> 会<b>脱离文档流</b>，父容器算不到它的高度 →
            <b>高度塌陷</b>（背景/边框撑不开）。加 <code>overflow: hidden</code> 让父容器触发{' '}
            <b>BFC</b>，就能把浮动子元素包进去。点「实测」用 <code>offsetHeight</code> 对比：
          </p>
          <div className="cl-bfc-duel">
            <div className="cl-bfc-card">
              <div className="cl-bfc-head">❌ 未清除浮动</div>
              <div ref={noClearRef} className="cl-bfc-box">
                <div className="cl-bfc-float" style={{ width: FW, height: FC }}>
                  float 子块 {FC}px
                </div>
              </div>
              <p className="cl-bfc-num">
                父容器 offsetHeight = <b>{bfc ? `${bfc.noClear}px` : '—'}</b>
                {bfc && bfc.noClear < FC && <span className=" cl-ok"> ← 塌陷了 ✅</span>}
              </p>
            </div>
            <div className="cl-bfc-card">
              <div className="cl-bfc-head">✅ overflow: hidden（BFC）</div>
              <div ref={withClearRef} className="cl-bfc-box" style={{ overflow: 'hidden' }}>
                <div className="cl-bfc-float" style={{ width: FW, height: FC }}>
                  float 子块 {FC}px
                </div>
              </div>
              <p className="cl-bfc-num">
                父容器 offsetHeight = <b>{bfc ? `${bfc.withClear}px` : '—'}</b>
                {bfc && bfc.withClear >= FC && <span className=" cl-ok"> ← 撑开了 ✅</span>}
              </p>
            </div>
          </div>
          <div className="btn-row cl-toolbar">
            {!bfc ? (
              <button className="cl-primary" onClick={measureBfc}>
                ▶ 实测父容器高度（offsetHeight）
              </button>
            ) : (
              <button className="ghost" onClick={() => setBfc(null)}>
                ↺ 清空实测
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

/* ---------- 内部小组件（不导出，满足 react-refresh） ---------- */
function Seg({ label, opts, value, onChange }) {
  return (
    <div className="cl-seg">
      <span className="cl-seg-label">{label}</span>
      {opts.map(([val, txt]) => (
        <button
          key={val}
          className={val === value ? 'cl-mini active' : 'cl-mini'}
          onClick={() => onChange(val)}
        >
          {txt}
        </button>
      ))}
    </div>
  )
}

/* ---------- 实时生成容器 CSS 文案 ---------- */
function buildCode(mode, s) {
  switch (mode) {
    case 'flow':
      return [
        '/* 默认就是文档流，无需声明 */',
        '.container { display: block; }',
        '.item    { display: block; }  /* 块级：每个独占一行 */',
      ].join('\n')
    case 'inline-block':
      return [
        '.container { font-size: 0; }           /* 消除行内空白缝隙 */',
        '.item { display: inline-block; }        /* 行内块：横排 + 能设宽高 */',
      ].join('\n')
    case 'float':
      return [
        '.item { float: left; }                  /* 子元素浮动、脱离文档流 */',
        s.clearfix
          ? '.container { overflow: hidden; }     /* ✅ 触发 BFC 撑开高度 */'
          : '.container { /* ⚠️ 没清除浮动 → 高度塌陷 */ }',
      ].join('\n')
    case 'flex':
      return [
        '.container {',
        `  display: flex;`,
        `  flex-direction: ${s.flexDir};`,
        `  justify-content: ${s.justify};`,
        `  align-items: ${s.align};`,
        `  flex-wrap: ${s.wrap ? 'wrap' : 'nowrap'};`,
        `  gap: ${s.gap}px;`,
        '}',
      ].join('\n')
    case 'grid':
      return [
        '.container {',
        '  display: grid;',
        `  grid-template-columns: repeat(${s.cols}, 1fr);`,
        `  gap: ${s.gap}px;`,
        '}',
      ].join('\n')
    case 'absolute':
      return [
        '.container { position: relative; }       /* 作为定位参照 */',
        '.item { position: absolute; }             /* 脱离文档流，靠 top/left */',
      ].join('\n')
    default:
      return ''
  }
}
