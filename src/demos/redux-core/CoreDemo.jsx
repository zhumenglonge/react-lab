import { useState } from 'react'
import { createStore, combineReducers } from './store.js'
import { useStore } from './hooks.js'

/* ---- 两个 reducer，各管状态树的一片（纯函数：不修改入参，返回新值）---- */
function counterReducer(state = 0, action) {
  switch (action.type) {
    case 'counter/increment':
      return state + 1
    case 'counter/decrement':
      return state - 1
    default:
      return state
  }
}

function todosReducer(state = [], action) {
  switch (action.type) {
    case 'todos/add':
      return [...state, { id: action.id, text: action.payload, done: false }]
    case 'todos/toggle':
      return state.map((t) => (t.id === action.payload ? { ...t, done: !t.done } : t))
    case 'todos/clear':
      return []
    default:
      return state
  }
}

const rootReducer = combineReducers({ counter: counterReducer, todos: todosReducer })

/* createStore 精简源码（展示用，真实实现见 ./store.js） */
const CORE_SOURCE = `function createStore(reducer, preloadedState) {
  let state = preloadedState      // 闭包守住唯一的 state
  let listeners = []

  const getState = () => state

  const dispatch = (action) => {
    state = reducer(state, action)   // 纯函数算出新 state
    listeners.forEach((fn) => fn())  // 通知所有订阅者
    return action
  }

  const subscribe = (fn) => {
    listeners.push(fn)
    return () => { listeners = listeners.filter(l => l !== fn) }
  }

  dispatch({ type: '@@INIT' })       // 初始化 state
  return { getState, dispatch, subscribe }
}`

const TODO_SAMPLES = ['学 Redux 原理', '手写 createStore', '看懂单向数据流']

export default function CoreDemo() {
  // 用 useState 惰性初始化，保证整个组件生命周期只创建一次 store
  const [store] = useState(() => createStore(rootReducer))
  // 订阅 store：任何 dispatch 让 state 变化后，本组件自动重渲染
  const state = useStore(store)

  const [log, setLog] = useState([])
  const [todoIdx, setTodoIdx] = useState(0)

  // 统一入口：派发 action + 记录一条日志
  const dispatch = (action) => {
    store.dispatch(action)
    const label = action.type + (action.payload !== undefined ? ` · ${JSON.stringify(action.payload)}` : '')
    setLog((prev) => [label, ...prev].slice(0, 6))
  }

  const addTodo = () => {
    dispatch({ type: 'todos/add', payload: TODO_SAMPLES[todoIdx % TODO_SAMPLES.length], id: Date.now() })
    setTodoIdx((i) => i + 1)
  }

  return (
    <div>
      <div className="demo-header">
        <h2>① 核心原理 · createStore 就这几行</h2>
        <p className="demo-sub">
          左边是 Redux 的心脏 <code>createStore</code>，右边是它跑起来的样子。点按钮派发 action，
          盯着"单一状态树"和日志——你会看清 <b>dispatch → reducer → 新 state → 通知订阅者</b> 的闭环。
        </p>
      </div>

      <div className="demo-grid">
        {/* 左：核心源码 */}
        <div className="demo-box">
          <h3>createStore 源码</h3>
          <pre className="code">{CORE_SOURCE}</pre>
          <p className="rx-note">
            整个 Redux 靠一个<b>闭包</b>守住唯一的 <code>state</code>，对外只暴露
            <code>getState</code> / <code>dispatch</code> / <code>subscribe</code> 三个方法。就这么简单。
          </p>
        </div>

        {/* 右：实时交互 */}
        <div className="demo-box">
          <h3>操作这个 store</h3>

          <div className="rx-state-tree">
            <div className="rx-tree-title">单一状态树 · getState()</div>
            <pre className="code">{JSON.stringify(state, null, 2)}</pre>
          </div>

          <div className="btn-row">
            <button onClick={() => dispatch({ type: 'counter/increment' })}>counter +1</button>
            <button onClick={() => dispatch({ type: 'counter/decrement' })}>counter -1</button>
            <button onClick={addTodo}>加一条 todo</button>
            <button className="ghost" onClick={() => dispatch({ type: 'todos/clear' })}>清空 todos</button>
          </div>

          <div className="rx-todos">
            <span className="rx-todos-label">todos（点击切换完成 → 派发 toggle）：</span>
            {state.todos.length === 0 ? (
              <span className="rx-empty">暂无</span>
            ) : (
              state.todos.map((t) => (
                <button
                  key={t.id}
                  className={'rx-chip' + (t.done ? ' rx-chip-done' : '')}
                  onClick={() => dispatch({ type: 'todos/toggle', payload: t.id })}
                >
                  {t.done ? '✓ ' : ''}
                  {t.text}
                </button>
              ))
            )}
          </div>

          <div className="rx-log">
            <div className="rx-log-head">dispatch 记录</div>
            {log.length === 0 ? (
              <div className="rx-log-empty">点上面的按钮派发 action</div>
            ) : (
              log.map((l, i) => (
                <div className="rx-log-item" key={i}>
                  <span className="rx-log-arrow">→</span>
                  {l}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="tip">
        💡 状态树里 <code>counter</code> 和 <code>todos</code> 是两片独立状态，由 <code>combineReducers</code> 合并。
        reducer 永远是纯函数：拿到旧 state 和 action，<b>返回一个新对象</b>，绝不直接改旧的——这是 Redux 可预测的根基。
      </p>
    </div>
  )
}
