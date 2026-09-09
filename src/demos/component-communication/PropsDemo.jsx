import { useState } from 'react'
import { CommLog } from './shared.jsx'
import { useCommLog } from './shared.js'

/* =========================================================
 * 场景 1：父子通信（最基础）
 *   ↓ 父传子：props —— 数据、函数都能往下传
 *   ↑ 子传父：子组件调用父组件传下来的回调函数
 * 这就是 React「单向数据流」：数据往下流，事件往上报。
 * ========================================================= */

// 子组件：只"用"数据、只"喊话"，自己不持有共享状态
function Child({ count, onAdd, onReset }) {
  return (
    <div className="cc-node cc-node-child">
      <div className="cc-node-tag">🧒 子组件 Child</div>
      <p className="cc-recv">
        通过 props 收到父组件的 <code>count = <b>{count}</b></code>
      </p>
      <div className="btn-row">
        <button onClick={onAdd}>通知父组件 +1</button>
        <button onClick={onReset}>通知父组件重置</button>
      </div>
      <p className="cc-mini-tip">
        子组件不存 count，只负责调用回调"喊话"，数据由父组件统一持有。
      </p>
    </div>
  )
}

export default function PropsDemo() {
  const [count, setCount] = useState(0)
  const { log, push } = useCommLog()

  const handleAdd = () => {
    setCount((c) => c + 1)
    push('子 → 父：调用 onAdd()，父组件把 count + 1', 'up')
  }
  const handleReset = () => {
    setCount(0)
    push('子 → 父：调用 onReset()，父组件把 count 归零', 'up')
  }

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>场景 1：父子通信（Props ↓ + 回调 ↑）</h3>
        <p className="desc">
          父 → 子用 <b>props</b> 传数据；子 → 父用父组件传下来的<b>回调函数</b>上报。
        </p>
      </div>

      <div className="cc-tree">
        <div className="cc-node cc-node-parent">
          <div className="cc-node-tag">👨‍👩‍👧 父组件 Parent（数据源头）</div>
          <p className="cc-state-line">
            内部 state：<code>count = <b>{count}</b></code>
          </p>

          <div className="cc-flow cc-flow-down">
            ↓ props 把 count 和两个回调函数传下去
          </div>

          <Child count={count} onAdd={handleAdd} onReset={handleReset} />

          <div className="cc-flow cc-flow-up">
            ↑ 子组件调用回调，把"我想改数据"的意图传回来
          </div>
        </div>
      </div>

      <CommLog log={log} />

      <pre className="code">{`// 父组件：持有状态 + 定义"怎么改"的回调
function Parent() {
  const [count, setCount] = useState(0)
  return <Child count={count} onAdd={() => setCount(c => c + 1)} />
}

// 子组件：用 props 拿数据，调 props 里的函数上报
function Child({ count, onAdd }) {
  return <button onClick={onAdd}>收到 {count}，点我通知父亲 +1</button>
}`}</pre>

      <p className="tip">
        👉 记住：<b>数据往下流（props），事件往上报（callback）</b>。
        子组件永远不直接改父组件的状态，只能"请求"父组件去改。
      </p>
    </div>
  )
}
