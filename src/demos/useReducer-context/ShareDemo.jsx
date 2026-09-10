import { useState } from 'react'
import StoreProvider from './store.jsx'
import { useAppState, useAppDispatch } from './store.js'

/* =========================================================
 * ② 实战：一个 H5 页面的全局 Store
 * ---------------------------------------------------------
 * user / theme / todos 被 TopBar、TodoPanel、TodoBadge 这些分散在
 * 不同层级、彼此没有父子关系的组件共享 —— 全靠 useReducer + Context，
 * 零 props 透传。底部实时打印整份 state，证明"大家读写的就是同一份数据"。
 * ========================================================= */

// 深层组件 A：顶部栏，读 user + theme，dispatch 登录 / 切主题
function TopBar() {
  const { user, theme } = useAppState()
  const dispatch = useAppDispatch()
  return (
    <div className="urc-node urc-topbar">
      <div className="urc-node-tag">🏛️ TopBar（深层组件 A）</div>
      <div className="urc-topbar-row">
        <span className="urc-user">
          👤 {user.name}
          {user.vip && <b className="urc-vip">VIP</b>}
        </span>
        <span className="urc-theme">🎨 theme = {theme}</span>
      </div>
      <div className="btn-row">
        {user.name === '游客' ? (
          <button
            onClick={() =>
              dispatch({ type: 'LOGIN', payload: { name: '张三', vip: true } })
            }
          >
            登录
          </button>
        ) : (
          <button onClick={() => dispatch({ type: 'LOGOUT' })}>退出</button>
        )}
        <button onClick={() => dispatch({ type: 'TOGGLE_THEME' })}>
          切换主题
        </button>
      </div>
    </div>
  )
}

// 中间层：完全不关心全局状态，只是恰好夹在中间（对比 props 得层层透传）
function Layout({ children }) {
  return (
    <div className="urc-node urc-layout">
      <div className="urc-node-tag">
        🧱 Layout（对 user / todos 一无所知，也不用转发任何 props）
      </div>
      <div className="urc-layout-body">{children}</div>
    </div>
  )
}

// 深层组件 B：待办面板，读 todos + dispatch 增删改
function TodoPanel() {
  const { todos } = useAppState()
  const dispatch = useAppDispatch()
  const [text, setText] = useState('')

  const add = () => {
    const t = text.trim()
    if (!t) return
    dispatch({ type: 'ADD_TODO', payload: t })
    setText('')
  }

  return (
    <div className="urc-node urc-todo">
      <div className="urc-node-tag">📝 TodoPanel（深层组件 B）</div>
      <div className="urc-add">
        <input
          value={text}
          placeholder="输入待办，回车添加"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button onClick={add}>添加</button>
      </div>
      <ul className="urc-todo-list">
        {todos.length === 0 && <li className="empty">暂无待办</li>}
        {todos.map((t) => (
          <li key={t.id}>
            <label className={t.done ? 'done' : ''}>
              <input
                type="checkbox"
                checked={t.done}
                onChange={() =>
                  dispatch({ type: 'TOGGLE_TODO', payload: t.id })
                }
              />
              <span>{t.text}</span>
            </label>
            <button onClick={() => dispatch({ type: 'REMOVE_TODO', payload: t.id })}>
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// 深层组件 C：待办计数徽标，只读 todos.length（和 TodoPanel 是兄弟，互不通信）
function TodoBadge() {
  const { todos } = useAppState()
  const done = todos.filter((t) => t.done).length
  return (
    <div className="urc-node urc-badge">
      <div className="urc-node-tag">
        🔢 TodoBadge（深层组件 C，TodoPanel 的兄弟）
      </div>
      <p className="urc-badge-num">
        已完成 <b>{done}</b> / {todos.length}
      </p>
      <p className="urc-mini">
        它和 TodoPanel 没有父子关系，却拿到同一份 todos ——
        这就是全局 Store 的意义：数据不用在组件间"搬运"。
      </p>
    </div>
  )
}

// 全局状态实况：把整份 state 打出来，直观证明"只有一份数据源"
function StoreInspector() {
  const state = useAppState()
  return (
    <div className="urc-inspector">
      <div className="urc-inspector-title">🔍 全局 Store 实况（唯一数据源）</div>
      <pre className="code">{JSON.stringify(state, null, 2)}</pre>
    </div>
  )
}

export default function ShareDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>② 实战：H5 页面的全局 Store</h3>
        <p className="desc">
          user / theme / todos 被分散在不同层级、彼此没有父子关系的组件共享，
          全靠 <b>useReducer + Context</b>，零 props 透传。
        </p>
      </div>

      {/* 只要包在 StoreProvider 里，内部任意组件都能 useAppState / useAppDispatch */}
      <StoreProvider>
        <div className="urc-app">
          <TopBar />
          <Layout>
            <TodoPanel />
            <TodoBadge />
          </Layout>
          <StoreInspector />
        </div>
      </StoreProvider>

      <p className="tip">
        👉 加一条待办，<b>TodoBadge 的计数</b>和<b>底部 Store 实况</b>立刻同步 ——
        它们并没有互相通信，只是共享了同一份全局 state。切换主题 / 登录同理。
      </p>
    </div>
  )
}
