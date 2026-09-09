import { createContext, useContext, useState } from 'react'
import { CommLog } from './shared.jsx'
import { useCommLog } from './shared.js'

/* =========================================================
 * 场景 2：跨层级通信（Context）
 *   祖先组件用 Provider 提供数据，任意深度的后代用 useContext 直接取，
 *   中间层组件完全不用参与传递 —— 解决 "Props 钻取（Prop Drilling）"。
 * ========================================================= */

// ① 建一条"跨层广播频道"
const ThemeContext = createContext('light')

// 中间层：它根本不关心 theme，只是恰好夹在中间（对比 props 得层层透传）
function MiddleLayer({ children }) {
  return (
    <div className="cc-node cc-node-middle">
      <div className="cc-node-tag">🧱 中间层 Middle（对 theme 一无所知）</div>
      <p className="cc-mini-tip">
        注意：这一层的 props 里<b>没有 theme</b>，它不需要帮忙转发。
      </p>
      {children}
    </div>
  )
}

// 深层后代：直接从 Context 里读，不靠父层一级级传
function DeepChild({ onRead }) {
  const theme = useContext(ThemeContext)
  return (
    <div className={`cc-node cc-node-deep cc-theme-${theme}`}>
      <div className="cc-node-tag">👶 深层孙组件 DeepChild</div>
      <p className="cc-recv">
        useContext 直接取到：<code>theme = <b>{theme}</b></code>
      </p>
      <div className="cc-theme-preview">这段文字/背景随主题变化</div>
      <div className="btn-row">
        <button onClick={onRead}>我读到了 Context</button>
      </div>
    </div>
  )
}

export default function ContextDemo() {
  const [theme, setTheme] = useState('light')
  const { log, push } = useCommLog()

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    push(`祖先 → 后代：Provider 的 value 变成 "${next}"，所有消费者自动更新`, 'down')
  }

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>场景 2：跨层级通信（Context）</h3>
        <p className="desc">
          隔了好几层还想共享数据？用 <b>Context</b>，中间层一行代码都不用写。
        </p>
      </div>

      {/* ② 祖先用 Provider 把数据"广播"出去 */}
      <ThemeContext.Provider value={theme}>
        <div className="cc-tree">
          <div className="cc-node cc-node-parent">
            <div className="cc-node-tag">🏛️ 祖先组件 Provider（数据源头）</div>
            <p className="cc-state-line">
              <code>&lt;ThemeContext.Provider value=<b>"{theme}"</b>&gt;</code>
            </p>
            <div className="btn-row">
              <button onClick={toggle}>切换主题（light / dark）</button>
            </div>

            <div className="cc-flow cc-flow-down">
              ↓ Context 像"广播"，穿过中间层直达后代
            </div>

            <MiddleLayer>
              <DeepChild
                onRead={() => push(`深层孙组件读到了 theme = "${theme}"`, 'up')}
              />
            </MiddleLayer>
          </div>
        </div>
      </ThemeContext.Provider>

      <CommLog log={log} />

      <pre className="code">{`// ① 建频道
const ThemeContext = createContext('light')

// ② 祖先提供（value 变了，所有消费者自动重渲染）
<ThemeContext.Provider value={theme}>
  <MiddleLayer>            {/* 中间层完全不用管 theme */}
    <DeepChild />
  </MiddleLayer>
</ThemeContext.Provider>

// ③ 任意深度的后代直接取
function DeepChild() {
  const theme = useContext(ThemeContext)   // 不用 props！
}`}</pre>

      <p className="tip">
        👉 <b>适用</b>：主题、语言、登录用户等"全局性"数据。
        <b>别滥用</b>：只为了少写两层 props，就把频繁变化的业务数据塞进 Context，
        反而会让所有消费者跟着重渲染。
      </p>
    </div>
  )
}
