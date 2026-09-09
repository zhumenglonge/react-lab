import { useState } from 'react'
import { createStore, applyMiddleware, thunk } from './store.js'
import { useStore } from './hooks.js'

const initialState = { status: 'idle', data: null }

function fetchReducer(state = initialState, action) {
  switch (action.type) {
    case 'fetch/start':
      return { status: 'loading', data: null }
    case 'fetch/success':
      return { status: 'success', data: action.payload }
    default:
      return state
  }
}

const THUNK_SOURCE = `const thunk = ({ dispatch, getState }) => next => action => {
  if (typeof action === 'function') {
    return action(dispatch, getState) // 是函数 → 执行它，把 dispatch 交给它
  }
  return next(action)                 // 是对象 → 放行，继续走向 reducer
}`

const ASYNC_ACTION_SOURCE = `// action 不再是对象，而是一个"函数"（thunk）
const fetchData = () => (dispatch) => {
  dispatch({ type: 'fetch/start' })        // 立刻：进入 loading
  setTimeout(() => {                        // 模拟异步请求
    dispatch({ type: 'fetch/success',       // 拿到数据后再派发
               payload: ['苹果','香蕉','橙子'] })
  }, 1200)
}`

export default function AsyncDemo() {
  const [log, setLog] = useState([])

  // useState 惰性初始化：用 applyMiddleware(thunk, logger) 增强 dispatch
  const [store] = useState(() => {
    // logger 中间件：在 action 到达 reducer 之前把它记录下来
    const logger = () => (next) => (action) => {
      if (typeof action !== 'function') {
        setLog((prev) => [action.type, ...prev].slice(0, 8))
      }
      return next(action)
    }
    return createStore(fetchReducer, applyMiddleware(thunk, logger))
  })
  const state = useStore(store)

  // 一个 thunk：action 是函数，内部自己决定"何时"派发真正的对象 action
  const fetchData = () => (dispatch) => {
    dispatch({ type: 'fetch/start' })
    setTimeout(() => {
      dispatch({ type: 'fetch/success', payload: ['苹果', '香蕉', '橙子'] })
    }, 1200)
  }

  const reset = () => store.dispatch({ type: '@@reset' })

  return (
    <div>
      <div className="demo-header">
        <h2>③ 异步与中间件 · thunk 是怎么工作的</h2>
        <p className="demo-sub">
          Redux 的 dispatch 默认只认"对象 action"，异步怎么办？答案是<b>中间件</b>。
          点"异步获取数据"，dispatch 的是一个<b>函数</b>——thunk 拦下它执行，请求回来后再派发对象 action。
        </p>
      </div>

      <div className="demo-grid">
        {/* 左：异步状态机 + 交互 */}
        <div className="demo-box">
          <h3>发起一个异步请求</h3>

          <div className={'rx-status rx-status-' + state.status}>
            {state.status === 'idle' && '空闲：点按钮发起异步请求'}
            {state.status === 'loading' && '加载中…（已派发 fetch/start）'}
            {state.status === 'success' && '成功：' + state.data.join('、')}
          </div>

          <div className="btn-row">
            <button onClick={() => store.dispatch(fetchData())} disabled={state.status === 'loading'}>
              {state.status === 'loading' ? '请求中…' : '▶ 异步获取数据'}
            </button>
            <button className="ghost" onClick={reset} disabled={state.status === 'idle'}>
              重置
            </button>
          </div>

          <div className="rx-mw-log">
            <div className="rx-log-head">logger 中间件记录的 action（按时间倒序）</div>
            {log.length === 0 ? (
              <div className="rx-log-empty">暂无</div>
            ) : (
              log.map((l, i) => (
                <div className="rx-log-item" key={i}>
                  <span className="rx-log-arrow">→</span>
                  {l}
                </div>
              ))
            )}
          </div>
          <p className="rx-note">
            看日志顺序：先 <code>fetch/start</code>，1.2 秒后才 <code>fetch/success</code>。
            函数 action 被 thunk 拦下、<b>不会</b>进日志（它不是对象），这正是中间件的价值。
          </p>
        </div>

        {/* 右：源码 */}
        <div className="demo-box">
          <h3>thunk 源码（就这么短）</h3>
          <pre className="code">{THUNK_SOURCE}</pre>
          <h3 style={{ marginTop: '16px' }}>异步 action 长这样</h3>
          <pre className="code">{ASYNC_ACTION_SOURCE}</pre>
          <p className="rx-note">
            <code>applyMiddleware</code> 用 <code>compose</code> 把中间件像洋葱一样层层包住原始 dispatch：
            <code>thunk → logger → reducer</code>。每个中间件都能在 action 到达 reducer 前拦截、改写或放行。
          </p>
        </div>
      </div>

      <p className="tip">
        💡 面试问"Redux 怎么处理异步"：<b>用中间件</b>。最经典的是 <code>redux-thunk</code>（让 action 可以是函数），
        复杂场景用 <code>redux-saga</code>。而现代的 <b>Redux Toolkit 默认已内置 thunk</b>，还推荐用 <code>createAsyncThunk</code> 处理请求三态。
      </p>
    </div>
  )
}
