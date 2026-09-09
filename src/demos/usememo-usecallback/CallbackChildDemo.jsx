import { useState, useCallback, memo } from 'react'
import { useRenderCount } from './shared.js'

/* =========================================================
 * ③ useCallback 实战：稳定函数引用 + React.memo 才能真正省渲染
 * ---------------------------------------------------------
 * useCallback 单独用几乎没意义。它的价值在于：
 * 把「引用稳定的函数」传给一个 React.memo 子组件，
 * 让父组件因为无关 state 重渲染时，子组件能跳过重渲染。
 * ========================================================= */

// 被 React.memo 包裹的子组件：props 浅比较相等就不重渲染
const MemoChild = memo(function MemoChild({ onClick, label }) {
  const renders = useRenderCount()
  return (
    <div className="render-box memo">
      <div className="rc-head">🧒 React.memo 子组件</div>
      <div className="rc-prop">
        收到的 label：<code>{label}</code>
      </div>
      <button className="primary-btn" onClick={onClick}>
        子组件按钮（点了让父组件 label +1）
      </button>
      <div className="render-count">子组件渲染次数：{renders}</div>
    </div>
  )
})

// ❌ 父组件：每次渲染都新建 onClick（内联箭头函数）
function ParentWithout() {
  const [count, setCount] = useState(0) // 与子组件无关的 state
  const [label, setLabel] = useState(0) // 会传给子组件
  const renders = useRenderCount()

  return (
    <div className="demo-box">
      <h4>❌ 不用 useCallback（内联新函数）</h4>
      <div className="btn-row">
        <button className="primary-btn ghost" onClick={() => setCount((c) => c + 1)}>
          父组件无关渲染 (count={count})
        </button>
      </div>
      <div className="render-count">父组件渲染次数：{renders}</div>
      <MemoChild label={`label=${label}`} onClick={() => setLabel((v) => v + 1)} />
      <pre className="code">{`// 每次父组件渲染，onClick 都是全新函数
<MemoChild
  label={\`label=\${label}\`}
  onClick={() => setLabel(v => v + 1)}
/>`}</pre>
    </div>
  )
}

// ✅ 父组件：useCallback 把 onClick 引用固定住
function ParentWith() {
  const [count, setCount] = useState(0)
  const [label, setLabel] = useState(0)
  const renders = useRenderCount()
  // 用 setState 的「函数式更新」，回调不依赖任何外部值 → 依赖数组可为空
  const onClick = useCallback(() => setLabel((v) => v + 1), [])

  return (
    <div className="demo-box">
      <h4>✅ 用 useCallback（引用稳定）</h4>
      <div className="btn-row">
        <button className="primary-btn ghost" onClick={() => setCount((c) => c + 1)}>
          父组件无关渲染 (count={count})
        </button>
      </div>
      <div className="render-count">父组件渲染次数：{renders}</div>
      <MemoChild label={`label=${label}`} onClick={onClick} />
      <pre className="code">{`// onClick 引用永远不变
const onClick = useCallback(
  () => setLabel(v => v + 1),
  []
)
<MemoChild label={\`label=\${label}\`} onClick={onClick} />`}</pre>
    </div>
  )
}

export default function CallbackChildDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>③ useCallback 实战：配合 React.memo 跳过子组件渲染</h3>
        <p className="desc">
          两边都反复点<b>「父组件无关渲染」</b>。左边子组件被迫跟着渲染，右边子组件稳如泰山。
        </p>
      </div>

      <div className="demo-grid">
        <ParentWithout />
        <ParentWith />
      </div>

      <p className="tip">
        👉 <b>为什么右边能跳过？</b> React.memo 对 props 做浅比较：<code>label</code> 字符串没变、
        <code>onClick</code> 引用也没变（被 useCallback 固定住了）→ 判定「props 相同」→ 跳过重渲染。
        点<b>子组件自己的按钮</b>时 label 变了，两边都会正常重渲染（合理更新不该被拦）。
      </p>
      <p className="tip warn">
        ⚠️ 关键认知：<b>useCallback 必须和 React.memo（或作为其它 Hook 的依赖）搭配才有意义</b>。
        子组件若没被 memo 包裹，你把函数缓存得再稳，父组件一渲染它照样跟着渲染 —— 那就是纯粹的过度优化。
      </p>
    </div>
  )
}
