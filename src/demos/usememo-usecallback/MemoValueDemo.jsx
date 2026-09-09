import { useState, useReducer, useMemo, useRef } from 'react'
import { heavyCompute, useRenderCount } from './shared.js'

/* =========================================================
 * ② useMemo 实战：缓存「昂贵计算」的结果
 * ---------------------------------------------------------
 * 场景：一个重活只在依赖变化时才需要重算，
 *      但组件会因为别的 state 变化而频繁重渲染 ——
 *      不用 useMemo，这个重活就被白白重复执行了。
 * ========================================================= */

function Stat({ label, value, tone }) {
  return (
    <div className={tone ? `stat ${tone}` : 'stat'}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}

// ❌ 每次渲染都硬算，哪怕 count 根本没变
function WithoutMemo({ count }) {
  const renders = useRenderCount()
  const stats = useRef({ times: 0, ms: 0 })
  const result = heavyCompute(count, stats)

  return (
    <div className="demo-box">
      <h4>❌ 不用 useMemo</h4>
      <div className="stat-grid">
        <Stat label="组件渲染" value={`${renders} 次`} />
        <Stat label="重活执行" value={`${stats.current.times} 次`} tone="bad" />
        <Stat label="累计耗时" value={`${stats.current.ms.toFixed(1)} ms`} tone="bad" />
      </div>
      <p className="result-line">
        计算结果：<b>{result.value}</b>
      </p>
      <pre className="code">{`function Box({ count }) {
  // 每次渲染都调用，count 没变也照算
  const result = heavyCompute(count)
}`}</pre>
    </div>
  )
}

// ✅ 依赖 [count] 不变 → 直接复用上次缓存的结果
function WithMemo({ count }) {
  const renders = useRenderCount()
  const stats = useRef({ times: 0, ms: 0 })
  const result = useMemo(() => heavyCompute(count, stats), [count])

  return (
    <div className="demo-box">
      <h4>✅ 用 useMemo</h4>
      <div className="stat-grid">
        <Stat label="组件渲染" value={`${renders} 次`} />
        <Stat label="重活执行" value={`${stats.current.times} 次`} tone="good" />
        <Stat label="累计耗时" value={`${stats.current.ms.toFixed(1)} ms`} tone="good" />
      </div>
      <p className="result-line">
        计算结果：<b>{result.value}</b>
      </p>
      <pre className="code">{`function Box({ count }) {
  // 依赖 [count] 不变 → 复用上次结果，不再重算
  const result = useMemo(
    () => heavyCompute(count),
    [count]
  )
}`}</pre>
    </div>
  )
}

export default function MemoValueDemo() {
  const [count, setCount] = useState(1)
  const [, forceRender] = useReducer((x) => x + 1, 0)

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>② useMemo 实战：缓存昂贵计算</h3>
        <p className="desc">
          两个盒子做同一件重活（跑 150 万次循环）。点「无关渲染」制造与 count 无关的重渲染，
          看谁的「重活执行 / 累计耗时」在疯涨。
        </p>
      </div>

      <div className="controls">
        <span className="count-tag">count = {count}</span>
        <button className="primary-btn" onClick={() => setCount((c) => c + 1)}>
          改依赖：count + 1
        </button>
        <button className="primary-btn ghost" onClick={forceRender}>
          触发无关渲染（count 不变）
        </button>
      </div>

      <div className="demo-grid">
        <WithoutMemo count={count} />
        <WithMemo count={count} />
      </div>

      <p className="tip">
        👉 连点几次<b>「无关渲染」</b>：左边「重活执行 / 累计耗时」一路飙升，右边<b>纹丝不动</b>
        —— 因为 <code>count</code> 没变，useMemo 直接返回上次缓存的结果。
        再点 <b>「count + 1」</b>：两边都会重算（依赖变了，缓存理应失效）。
      </p>
      <p className="tip warn">
        ⚠️ StrictMode 下开发环境的计数会成对增长（渲染函数被调用两次），看<b>相对趋势</b>即可，不影响结论。
      </p>
    </div>
  )
}
