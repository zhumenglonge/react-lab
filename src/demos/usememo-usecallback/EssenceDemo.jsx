import { useState, useReducer, useMemo, useCallback } from 'react'
import { useIsNewRef } from './shared.js'

/* =========================================================
 * ① 本质区别：useMemo 缓存「值」，useCallback 缓存「函数」
 * ---------------------------------------------------------
 * 两者的心智完全一样 —— 「依赖不变就复用上一次的结果」，
 * 区别只在于缓存的东西不同：
 *   - useMemo(() => 计算, deps)  → 缓存【计算的结果】（一个值 / 对象）
 *   - useCallback(fn, deps)      → 缓存【函数本身】（一个引用）
 * 而且：useCallback(fn, deps) ≡ useMemo(() => fn, deps)
 * ========================================================= */

function RefBadge({ isNew }) {
  return isNew ? (
    <span className="ref-badge new">🆕 新引用</span>
  ) : (
    <span className="ref-badge same">🔗 未变</span>
  )
}

// 盯着一个引用的「身份」：相比上一次渲染变没变
function RefRow({ label, code, value }) {
  const isNew = useIsNewRef(value)
  return (
    <div className="ref-row">
      <div className="ref-label">
        <b>{label}</b>
        <code>{code}</code>
      </div>
      <RefBadge isNew={isNew} />
    </div>
  )
}

export default function EssenceDemo() {
  const [count, setCount] = useState(0)
  const [, forceRender] = useReducer((x) => x + 1, 0)

  // ❌ 不缓存：每次渲染都新建对象 / 新建函数
  const plainObject = { n: count }
  const plainFunction = () => count

  // ✅ 缓存：依赖 [count] 不变时，复用上一次的对象 / 函数
  const memoObject = useMemo(() => ({ n: count }), [count])
  const memoFunction = useCallback(() => count, [count])

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>① 本质区别：一个缓存「值」，一个缓存「函数」</h3>
        <p className="desc">
          下面每一行都在盯着一个引用的<b>身份</b>。点按钮触发渲染，
          看谁 <b>🆕 变了</b>、谁 <b>🔗 没变</b>。
        </p>
      </div>

      <div className="controls">
        <span className="count-tag">count = {count}</span>
        <button className="primary-btn" onClick={() => setCount((c) => c + 1)}>
          改依赖：count + 1
        </button>
        <button className="primary-btn ghost" onClick={forceRender}>
          触发一次无关渲染（count 不变）
        </button>
      </div>

      <div className="demo-grid">
        <div className="demo-box">
          <h4>值 / 对象 —— useMemo 的地盘</h4>
          <RefRow label="普通对象" code="const o = { n: count }" value={plainObject} />
          <RefRow
            label="useMemo 缓存"
            code="useMemo(() => ({ n: count }), [count])"
            value={memoObject}
          />
          <p className="tip">
            useMemo 返回的是<b>函数的返回值</b>（这里是那个对象）。
          </p>
        </div>
        <div className="demo-box">
          <h4>函数 —— useCallback 的地盘</h4>
          <RefRow label="普通函数" code="const fn = () => count" value={plainFunction} />
          <RefRow
            label="useCallback 缓存"
            code="useCallback(() => count, [count])"
            value={memoFunction}
          />
          <p className="tip">
            useCallback 返回的是<b>函数本身</b>（那个引用）。
          </p>
        </div>
      </div>

      <pre className="code">{`// 一句话记住：
useMemo(() => value, deps)   // 缓存 value —— 函数的「返回值」
useCallback(fn, deps)        // 缓存 fn    —— 函数「本身」

// 而且 useCallback 就是 useMemo 的语法糖，二者完全等价：
useCallback(fn, deps)
===  useMemo(() => fn, deps)`}</pre>

      <p className="tip">
        👉 只点<b>「无关渲染」</b>：两个「普通」行立刻 🆕（每次渲染都新建），
        两个「缓存」行保持 🔗（依赖没变，复用旧引用）。
        再点 <b>「count + 1」</b>：缓存行也 🆕 了 —— 因为<b>依赖变了，缓存必须失效</b>。
      </p>
    </div>
  )
}
