import { useState, useEffect } from 'react'
import { createStore } from './store.js'
import { useStore } from './hooks.js'

function counterReducer(state = 0, action) {
  switch (action.type) {
    case 'inc':
      return state + 1
    default:
      return state
  }
}

/* 一个 action 在 Redux 里流动的一圈 */
const FLOW = [
  { key: 'view', label: '① View', desc: 'React 组件', tone: 'view' },
  { key: 'dispatch', label: '② dispatch', desc: '派发 action', tone: 'dispatch' },
  { key: 'action', label: '③ Action', desc: '{ type: "inc" }', tone: 'action' },
  { key: 'reducer', label: '④ Reducer', desc: '(state, action) => new', tone: 'reducer' },
  { key: 'store', label: '⑤ Store', desc: '更新单一状态树', tone: 'store' },
  { key: 'view2', label: '⑥ View', desc: '订阅者重渲染', tone: 'view' },
]

const NODE_NOTE = {
  view: '用户点击按钮，组件里调用 dispatch —— 数据流从 View 出发',
  dispatch: 'store.dispatch(action)：action 正式上路',
  action: 'action 只是个普通对象，用 type 描述"发生了什么"',
  reducer: 'reducer 拿旧 state + action 算出新 state（纯函数，不改旧的）',
  store: 'store 保存新 state，并通知所有 subscribe 的订阅者',
  view2: '订阅了 store 的组件收到通知 → 重渲染 → 界面显示新值，一圈走完',
}

const STEP_MS = 600

export default function FlowDemo() {
  const [store] = useState(() => createStore(counterReducer))
  const count = useStore(store)

  const [step, setStep] = useState(-1) // -1 = 未开始
  const [running, setRunning] = useState(false)

  // 步进引擎：running 时每 STEP_MS 前进一个节点；走到 ⑤Store（index 4）时真正 dispatch，
  // 走到最后一个节点就停止。setState 全放在 setTimeout 回调里（异步），避免 effect 体内同步 setState。
  useEffect(() => {
    if (!running) return
    const t = setTimeout(() => {
      const next = step + 1
      if (next === 4) store.dispatch({ type: 'inc' })
      setStep(next)
      if (next >= FLOW.length - 1) setRunning(false)
    }, STEP_MS)
    return () => clearTimeout(t)
  }, [running, step, store])

  const runFlow = () => {
    if (running) return
    setStep(0)
    setRunning(true)
  }
  const reset = () => {
    setRunning(false)
    setStep(-1)
  }

  return (
    <div>
      <div className="demo-header">
        <h2>② 工作流程 · 单向数据流转一圈</h2>
        <p className="demo-sub">
          点"派发一次 action"，看它如何沿 <b>View → Action → Reducer → Store → View</b> 单向流动。
          走到 ⑤Store 时会真正 dispatch，底部计数器随之 +1——流程和真实 state 是联动的。
        </p>
      </div>

      <div className="demo-box">
        <div className="rx-flow">
          {FLOW.map((node, i) => {
            const cls =
              'rx-flow-step' + (i === step ? ' rx-flow-active' : '') + (i < step ? ' rx-flow-passed' : '')
            return (
              <div className={cls} key={node.key}>
                <div className={'rx-node rx-node-' + node.tone}>
                  <span className="rx-node-label">{node.label}</span>
                  <span className="rx-node-desc">{node.desc}</span>
                </div>
                {i < FLOW.length - 1 && <span className="rx-flow-arrow">→</span>}
              </div>
            )
          })}
        </div>

        <div className="rx-flow-note">
          {step < 0 ? '点下方按钮，看一个 action 如何在 Redux 里流动一圈' : NODE_NOTE[FLOW[step].key]}
        </div>

        <div className="btn-row">
          <button onClick={runFlow} disabled={running}>
            {running ? '流动中…' : '▶ 派发一次 inc action'}
          </button>
          <button className="ghost" onClick={reset} disabled={running}>
            重置
          </button>
        </div>

        <div className="rx-flow-counter">
          <span>当前 store.count = </span>
          <b className="rx-count-num">{count}</b>
          <span className="rx-flow-hint">（流程走到 ⑤Store 时真正 dispatch，这里同步更新）</span>
        </div>
      </div>

      <p className="tip">
        💡 这张图就是 Redux 的<b>单向数据流</b>：永远一个方向，不存在"组件 A 直接改组件 B"。
        面试问"Redux 工作流程"，把这圈画出来 + 说一句"state 只读、只能靠 dispatch action 经 reducer 更新"，就稳了。
      </p>
    </div>
  )
}
