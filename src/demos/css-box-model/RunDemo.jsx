import { useState, useRef } from 'react'

/* =========================================================
 * ⚔️ 实跑对拍：标准盒模型 vs IE 盒模型 + margin 塌陷实测
 * ---------------------------------------------------------
 * 拖动 padding / border 滑块，两个盒子（content-box / border-box）
 * 当场重排；点「实测 DOM」读 offsetWidth / clientWidth /
 * getBoundingClientRect 真实数值，与公式预测对拍。
 * margin 塌陷也用 getBoundingClientRect 实测两块的真实间距。
 * ========================================================= */

const BOX_W = 200 // 两个盒子的 width 都是 200px
const MB = 30 // 塌陷演示：上块的 margin-bottom
const MT = 20 // 塌陷演示：下块的 margin-top

// 预测总宽（offsetWidth）：
// content-box → content + 2p + 2b；border-box → content 被压缩，总宽仍 = width
function predictOffset(sizing, w, p, b) {
  const content = sizing === 'border-box' ? Math.max(0, w - 2 * p - 2 * b) : w
  return content + 2 * p + 2 * b
}

export default function RunDemo() {
  const [padding, setPadding] = useState(20)
  const [border, setBorder] = useState(10)
  const [measured, setMeasured] = useState(null)

  const stdRef = useRef(null)
  const ieRef = useRef(null)
  const colTopRef = useRef(null)
  const colBottomRef = useRef(null)

  // 改参数时作废旧实测，避免残留数值对不上新预测
  const updatePadding = (e) => {
    setPadding(Number(e.target.value))
    setMeasured(null)
  }
  const updateBorder = (e) => {
    setBorder(Number(e.target.value))
    setMeasured(null)
  }

  const measure = () => {
    const read = (el) => ({
      offset: el.offsetWidth,
      client: el.clientWidth,
      rect: Math.round(el.getBoundingClientRect().width * 10) / 10,
    })
    const a = colTopRef.current.getBoundingClientRect()
    const b = colBottomRef.current.getBoundingClientRect()
    setMeasured({
      std: read(stdRef.current),
      ie: read(ieRef.current),
      gap: Math.round(b.top - a.bottom),
    })
  }

  const boxStyle = (sizing) => ({
    width: BOX_W,
    padding,
    border: `${border}px solid`,
    boxSizing: sizing,
  })

  const stdPredict = predictOffset('content-box', BOX_W, padding, border)
  const iePredict = predictOffset('border-box', BOX_W, padding, border)

  return (
    <div className="demo-wrap cbm-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 同样的 width: 200px，两种盒模型</h2>
        <p className="demo-sub">
          左边<b>标准盒模型（content-box）</b>：width 只算内容，padding/border 往外撑，总宽变大；
          右边<b>IE 盒模型（border-box）</b>：width 算到边框为止，padding/border 往里挤内容。
          拖滑块看两边当场重排，再点「实测」用 DOM API 验证公式。
        </p>
      </div>

      {/* ---------- 滑块控制 ---------- */}
      <section className="cbm-block cbm-controls">
        <label className="cbm-slider">
          <span>
            padding：<b>{padding}px</b>
          </span>
          <input
            type="range"
            min="0"
            max="40"
            value={padding}
            onChange={updatePadding}
          />
        </label>
        <label className="cbm-slider">
          <span>
            border：<b>{border}px</b>
          </span>
          <input
            type="range"
            min="0"
            max="20"
            value={border}
            onChange={updateBorder}
          />
        </label>
      </section>

      {/* ---------- 双盒对拍 ---------- */}
      <div className="cbm-duel">
        <div className="cbm-card">
          <div className="cbm-card-head">
            <span className="cbm-card-title">📏 标准盒模型</span>
            <code>box-sizing: content-box</code>
          </div>
          <div className="cbm-stage">
            <div ref={stdRef} className="cbm-box cbm-box-std" style={boxStyle('content-box')}>
              content {BOX_W}px
            </div>
          </div>
          <p className="cbm-formula">
            总宽 = {BOX_W} + 2×{padding} + 2×{border} = <b>{stdPredict}px</b>
            {measured && (
              <span className={measured.std.offset === stdPredict ? ' cbm-ok' : ' cbm-bad'}>
                {' '}
                实测 offsetWidth = {measured.std.offset}px{' '}
                {measured.std.offset === stdPredict ? '✅' : '❌'}
              </span>
            )}
          </p>
          {measured && (
            <p className="cbm-detail">
              clientWidth = {measured.std.client}px（内容+padding，不含 border）· rect ={' '}
              {measured.std.rect}px
            </p>
          )}
        </div>

        <div className="cbm-card">
          <div className="cbm-card-head">
            <span className="cbm-card-title">📦 IE 盒模型</span>
            <code>box-sizing: border-box</code>
          </div>
          <div className="cbm-stage">
            <div ref={ieRef} className="cbm-box cbm-box-ie" style={boxStyle('border-box')}>
              content {Math.max(0, BOX_W - 2 * padding - 2 * border)}px
            </div>
          </div>
          <p className="cbm-formula">
            总宽 = width 本身 = <b>{iePredict}px</b>（内容被压缩）
            {measured && (
              <span className={measured.ie.offset === iePredict ? ' cbm-ok' : ' cbm-bad'}>
                {' '}
                实测 offsetWidth = {measured.ie.offset}px{' '}
                {measured.ie.offset === iePredict ? '✅' : '❌'}
              </span>
            )}
          </p>
          {measured && (
            <p className="cbm-detail">
              clientWidth = {measured.ie.client}px · rect = {measured.ie.rect}px
            </p>
          )}
        </div>
      </div>

      <div className="btn-row cbm-toolbar">
        {!measured ? (
          <button className="cbm-primary" onClick={measure}>
            ▶ 实测 DOM（offsetWidth / clientWidth / rect）
          </button>
        ) : (
          <button className="ghost" onClick={() => setMeasured(null)}>
            ↺ 清空实测
          </button>
        )}
      </div>

      {/* ---------- margin 塌陷实测 ---------- */}
      <section className="cbm-block">
        <h3>🕳️ margin 塌陷 · 30px + 20px ≠ 50px</h3>
        <p className="cbm-lead">
          上块 <code>margin-bottom: {MB}px</code>，下块 <code>margin-top: {MT}px</code>。
          直觉间距是 {MB + MT}px，但垂直相邻外边距会<b>塌陷合并</b>，实际取{' '}
          <b>max({MB}, {MT}) = {Math.max(MB, MT)}px</b>。点上面的「实测」按钮验证：
          {measured && (
            <span className={measured.gap === Math.max(MB, MT) ? ' cbm-ok' : ' cbm-bad'}>
              {' '}
              实测间距 = {measured.gap}px {measured.gap === Math.max(MB, MT) ? '✅' : '❌'}
            </span>
          )}
        </p>
        <div className="cbm-stage cbm-collapse-stage">
          <div ref={colTopRef} className="cbm-collapse cbm-collapse-top" style={{ marginBottom: MB }}>
            上块 · margin-bottom: {MB}px
          </div>
          <div ref={colBottomRef} className="cbm-collapse cbm-collapse-bottom" style={{ marginTop: MT }}>
            下块 · margin-top: {MT}px
          </div>
        </div>
      </section>
    </div>
  )
}
