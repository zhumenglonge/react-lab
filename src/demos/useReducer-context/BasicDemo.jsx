import { createContext, useContext, useReducer } from 'react'

/* =========================================================
 * ① 最小结构：useReducer + Context 的四步接线
 * ---------------------------------------------------------
 * 用一个计数器把骨架跑通：
 *   建频道(createContext) → 写 reducer → Provider 下发 → useContext 消费
 * 这里为了先讲清楚"接线"，把 state 和 dispatch 放在同一个 Context；
 * 生产环境为什么要拆成两个，见「③ 性能优化」。
 * ========================================================= */

// ① 建一条跨层频道
const CountContext = createContext(null)

// ② 写 reducer：所有更新集中在这里
function countReducer(state, action) {
  switch (action.type) {
    case 'INC':
      return { count: state.count + 1 }
    case 'DEC':
      return { count: state.count - 1 }
    case 'RESET':
      return { count: 0 }
    default:
      return state
  }
}

// ③ Provider：用 useReducer 持有状态，并广播 {state, dispatch}
function CountProvider({ children }) {
  const [state, dispatch] = useReducer(countReducer, { count: 0 })
  return (
    <CountContext.Provider value={{ state, dispatch }}>
      {children}
    </CountContext.Provider>
  )
}

// ④ 深层消费者：没有接收任何 props，直接 useContext 拿
function DeepCounter() {
  const { state, dispatch } = useContext(CountContext)
  return (
    <div className="demo-box urc-deep">
      <h4>👶 深层组件（props 里什么都没有）</h4>
      <p className="urc-count">count = {state.count}</p>
      <div className="btn-row">
        <button onClick={() => dispatch({ type: 'DEC' })}>-1</button>
        <button onClick={() => dispatch({ type: 'RESET' })}>归零</button>
        <button onClick={() => dispatch({ type: 'INC' })}>+1</button>
      </div>
    </div>
  )
}

export default function BasicDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>① 最小结构：四步接线</h3>
        <p className="desc">
          把 <b>useReducer</b> 的状态用 <b>Context</b> 广播出去，
          任意深度的组件都能直接读写，不用一层层传 props。
        </p>
      </div>

      <CountProvider>
        <div className="urc-layers">
          <div className="urc-layer">
            <div className="urc-node-tag">🏛️ CountProvider（状态源头）</div>
            <div className="urc-layer">
              <div className="urc-node-tag">
                🧱 中间层（对 count 一无所知，也不用帮忙转发）
              </div>
              <DeepCounter />
            </div>
          </div>
        </div>
      </CountProvider>

      <pre className="code">{`// ① 建频道
const CountContext = createContext(null)

// ② 写 reducer
function countReducer(state, action) { /* ...INC / DEC / RESET... */ }

// ③ Provider：useReducer 持有状态并广播
function CountProvider({ children }) {
  const [state, dispatch] = useReducer(countReducer, { count: 0 })
  return <CountContext.Provider value={{ state, dispatch }}>{children}</CountContext.Provider>
}

// ④ 任意深度消费者直接取，不用 props
function DeepCounter() {
  const { state, dispatch } = useContext(CountContext)
}`}</pre>

      <p className="tip">
        👉 四步：<b>建 Context → 写 reducer → Provider 下发 → useContext 消费</b>。
        这就是"轻量版 Redux"的骨架 —— 它已经能跨组件共享状态了。
      </p>
    </div>
  )
}
