import { createContext, useContext, useReducer } from 'react'
import { useRenderCount } from './shared.js'

/* =========================================================
 * ③ 性能优化：为什么要把 state 和 dispatch 拆成两个 Context
 * ---------------------------------------------------------
 * 左右两栏各跑一个计数器，都点 +1，盯着"只用 dispatch 的按钮"的
 * 渲染次数：合并 Context 会跟着涨，拆分 Context 纹丝不动。
 *
 * 原理：
 *   - Context 的 value 引用一变，所有消费者都会重渲染。
 *   - 合并写法 value={{ state, dispatch }} 每次都是新对象 → 全员重渲染。
 *   - 拆分后 dispatch 引用永远稳定 → 只 dispatch 的组件不受 state 变化影响。
 * ========================================================= */

function perfReducer(state, action) {
  switch (action.type) {
    case 'INC':
      return { count: state.count + 1 }
    default:
      return state
  }
}

/* ---------- 方案 A：state + dispatch 合并到一个 Context ---------- */
const CombinedContext = createContext(null)

function CombinedProvider({ children }) {
  const [state, dispatch] = useReducer(perfReducer, { count: 0 })
  // ⚠️ 每次渲染都新建一个 {state, dispatch}，value 引用永远在变
  return (
    <CombinedContext.Provider value={{ state, dispatch }}>
      {children}
    </CombinedContext.Provider>
  )
}

function CombinedReader() {
  const { state } = useContext(CombinedContext)
  return <p className="urc-count">count = {state.count}</p>
}

// 这个组件只用 dispatch，根本不读 count —— 本不该被 state 变化牵连
function CombinedButton() {
  const renders = useRenderCount()
  const { dispatch } = useContext(CombinedContext)
  return (
    <div className="urc-perf-btn">
      <button onClick={() => dispatch({ type: 'INC' })}>+1（只用 dispatch）</button>
      <span className="urc-render bad">本组件渲染 {renders} 次 ❌</span>
    </div>
  )
}

/* ---------- 方案 B：拆成 StateCtx + DispatchCtx ---------- */
const StateCtx = createContext(null)
const DispatchCtx = createContext(null)

function SplitProvider({ children }) {
  const [state, dispatch] = useReducer(perfReducer, { count: 0 })
  // dispatch 引用稳定；state 单独一个 Provider，各取所需
  return (
    <DispatchCtx.Provider value={dispatch}>
      <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
    </DispatchCtx.Provider>
  )
}

function SplitReader() {
  const state = useContext(StateCtx)
  return <p className="urc-count">count = {state.count}</p>
}

function SplitButton() {
  const renders = useRenderCount()
  const dispatch = useContext(DispatchCtx)
  return (
    <div className="urc-perf-btn">
      <button onClick={() => dispatch({ type: 'INC' })}>+1（只用 dispatch）</button>
      <span className="urc-render good">本组件渲染 {renders} 次 ✅</span>
    </div>
  )
}

export default function PerfDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>③ 性能优化：State / Dispatch 拆分</h3>
        <p className="desc">
          点两边的 <b>+1</b>，盯着"只用 dispatch 的按钮"的<b>渲染次数</b>：
          合并 Context 会跟着涨，拆分 Context 停在初始值不动。
        </p>
      </div>

      <div className="demo-grid">
        {/* 方案 A：合并 */}
        <div className="demo-box">
          <h4>❌ 合并：value = {'{ state, dispatch }'}</h4>
          <CombinedProvider>
            <CombinedReader />
            <CombinedButton />
          </CombinedProvider>
          <p className="urc-mini">
            每次 state 变，Provider 都新建一个 value 对象，引用变了 →
            所有消费者（连只用 dispatch 的按钮也算）全部重渲染。
          </p>
        </div>

        {/* 方案 B：拆分 */}
        <div className="demo-box">
          <h4>✅ 拆分：StateCtx + DispatchCtx</h4>
          <SplitProvider>
            <SplitReader />
            <SplitButton />
          </SplitProvider>
          <p className="urc-mini">
            dispatch 引用永远不变 → 只用 dispatch 的按钮不受 state 变化影响，
            只有读 state 的组件才更新，渲染次数停在初始值。
          </p>
        </div>
      </div>

      <pre className="code">{`// ❌ 合并：value 每次都是新对象，全员重渲染
<Ctx.Provider value={{ state, dispatch }}>

// ✅ 拆分：dispatch 稳定，只有读 state 的组件才重渲染
<DispatchCtx.Provider value={dispatch}>
  <StateCtx.Provider value={state}>
    {children}
  </StateCtx.Provider>
</DispatchCtx.Provider>`}</pre>

      <p className="tip">
        👉 开发环境开启了 <b>StrictMode</b>，组件会双重渲染，所以初始就是「2 次」——
        不影响结论，<b>重点看点击 +1 后谁在涨、谁不动</b>（生产环境不双渲染）。
        如果确实要把多个值组合进一个 Context，记得用 <code>useMemo</code> 把 value 包起来，
        避免每次渲染都产生新引用。
      </p>
    </div>
  )
}
