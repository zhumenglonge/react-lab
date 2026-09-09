import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/* =========================================================
 * 场景 2：读取 / 修改布局，避免"闪烁" —— useLayoutEffect 的正当用途
 *   气泡要"先渲染 → 测量按钮位置 → 再定位"。
 *   · useEffect      ：先按初始位置(舞台左上角)绘制一帧，effect 里再跳到正确位置
 *                      → 肉眼可见气泡"跳一下"（闪烁）
 *   · useLayoutEffect：在绘制前就把位置算好，浏览器只绘制最终位置
 *                      → 用户直接看到气泡贴着按钮，无闪烁
 * ========================================================= */

// 纯计算：根据 anchor 与 stage 的位置，算出气泡相对 stage 的坐标。
// 抽成模块级函数（引用稳定），避免放进依赖数组。
function computePos(anchorEl, stageEl) {
  if (!anchorEl || !stageEl) return null
  const a = anchorEl.getBoundingClientRect()
  const s = stageEl.getBoundingClientRect()
  return {
    top: a.bottom - s.top + 10,
    left: a.left - s.left + a.width / 2,
  }
}

function BubbleCard({ mode }) {
  const isLayout = mode === 'layout'
  const anchorRef = useRef(null)
  const stageRef = useRef(null)
  const [show, setShow] = useState(false)
  // 初始故意放在左上角 (0,0)，用来暴露 useEffect 版的"跳动"
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // 两个 hook 都无条件调用（符合 Hook 规则），只有匹配 mode 的那个真正定位
  useLayoutEffect(() => {
    if (isLayout && show) {
      const p = computePos(anchorRef.current, stageRef.current)
      if (p) setPos(p)
    }
  }, [isLayout, show])

  useEffect(() => {
    if (!isLayout && show) {
      const p = computePos(anchorRef.current, stageRef.current)
      if (p) setPos(p)
    }
  }, [isLayout, show])

  return (
    <div className={`demo-box uel-bubble-card ${isLayout ? 'uel-box-good' : 'uel-box-warn'}`}>
      <h4>{isLayout ? 'useLayoutEffect（绘制前定位 · 无闪烁）' : 'useEffect（绘制后定位 · 会跳一下）'}</h4>
      <div className="uel-stage" ref={stageRef}>
        <span className="uel-stage-origin">初始位置 (0,0)</span>
        <button
          ref={anchorRef}
          className="uel-anchor"
          onClick={() => setShow((s) => !s)}
        >
          {show ? '隐藏气泡' : '显示气泡'}
        </button>
        {show && (
          <div className="uel-bubble" style={{ top: pos.top, left: pos.left }}>
            💬 我贴着按钮出现
          </div>
        )}
      </div>
      <p className="uel-note">
        {isLayout
          ? '气泡直接出现在按钮下方，看不到任何中间态。'
          : '留意舞台【左上角】：气泡会先在那儿闪一下，再跳到按钮下方。'}
      </p>
    </div>
  )
}

export default function FlickerDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>场景 2：测量布局、避免闪烁 —— useLayoutEffect 的正当用途</h3>
        <p className="desc">
          需要"先渲染、再测量 DOM、再同步修正位置"时，放 <b>useLayoutEffect</b> 能在绘制前算好，
          放 <b>useEffect</b> 里则会先绘制到默认位置再跳过去，肉眼可见闪一下。
        </p>
      </div>

      <div className="demo-grid">
        <BubbleCard mode="passive" />
        <BubbleCard mode="layout" />
      </div>

      <pre className="code">{`function Tooltip() {
  const ref = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {            // ← 换成 useEffect 就会看到跳动
    const r = ref.current.getBoundingClientRect()
    setPos({ top: r.bottom, left: r.left })   // 绘制前同步定位
  }, [])

  return <div ref={ref} style={{ top: pos.top, left: pos.left }} />
}`}</pre>

      <p className="tip">
        👉 这就是 <b>useLayoutEffect</b> 存在的意义：<b>需要在浏览器绘制前同步读取/修改 DOM 布局</b>
        （测量尺寸、定位浮层、恢复滚动位置、防止中间态被看到）。但它是同步阻塞的——能用 useEffect 解决就别用它。
      </p>
    </div>
  )
}
