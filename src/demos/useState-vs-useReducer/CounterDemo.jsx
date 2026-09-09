import { useState, useReducer } from 'react'

/* =========================================================
 * 场景 1：简单计数器
 * 结论：状态少、更新逻辑简单 —— useState 更合适
 * ========================================================= */

// ---------- 方式 A：useState ----------
function CounterWithState() {
  const [count, setCount] = useState(0)

  return (
    <div className="demo-box">
      <h4>useState 版本 ✅ 推荐</h4>
      <p className="count">count = {count}</p>
      <div className="btn-row">
        <button onClick={() => setCount(count + 1)}>+1</button>
        <button onClick={() => setCount(count - 1)}>-1</button>
        <button onClick={() => setCount(0)}>reset</button>
      </div>
      <pre className="code">{`const [count, setCount] = useState(0)
<button onClick={() => setCount(count + 1)}>+1</button>`}</pre>
      <p className="tip">👉 一行声明 + 一行更新，代码最短。</p>
    </div>
  )
}

// ---------- 方式 B：useReducer ----------
function counterReducer(state, action) {
  switch (action.type) {
    case 'inc':
      return { count: state.count + 1 }
    case 'dec':
      return { count: state.count - 1 }
    case 'reset':
      return { count: 0 }
    default:
      return state
  }
}

function CounterWithReducer() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 })

  return (
    <div className="demo-box">
      <h4>useReducer 版本 ⚠️ 有点重</h4>
      <p className="count">count = {state.count}</p>
      <div className="btn-row">
        <button onClick={() => dispatch({ type: 'inc' })}>+1</button>
        <button onClick={() => dispatch({ type: 'dec' })}>-1</button>
        <button onClick={() => dispatch({ type: 'reset' })}>reset</button>
      </div>
      <pre className="code">{`function reducer(state, action) {
  switch (action.type) {
    case 'inc': return { count: state.count + 1 }
    ...
  }
}
const [state, dispatch] = useReducer(reducer, { count: 0 })`}</pre>
      <p className="tip">👉 为了一个数字，写了一整个 reducer，性价比低。</p>
    </div>
  )
}

export default function CounterDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>场景 1：简单计数器</h3>
        <p className="desc">
          状态独立、更新逻辑一目了然 —— <b>useState</b> 完胜。
        </p>
      </div>
      <div className="demo-grid">
        <CounterWithState />
        <CounterWithReducer />
      </div>
    </div>
  )
}
