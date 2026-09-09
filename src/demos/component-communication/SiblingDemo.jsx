import { useState } from 'react'
import { CommLog } from './shared.jsx'
import { useCommLog } from './shared.js'

/* =========================================================
 * 场景 3：兄弟通信（状态提升 Lifting State Up）
 *   兄弟之间不能直接说话，把共享状态"提升"到最近的共同父组件：
 *   兄弟 A 通过回调改父组件的 state → 父组件再通过 props 把新 state 传给兄弟 B。
 * ========================================================= */

// 兄弟 A：发送方，只负责"上报"，不持有共享数据
function Sender({ onSend }) {
  const [text, setText] = useState('')
  const send = () => {
    const value = text.trim()
    if (!value) return
    onSend(value)
    setText('')
  }
  return (
    <div className="cc-node cc-node-siblingA">
      <div className="cc-node-tag">🅰️ 兄弟 A · 发送方</div>
      <input
        className="cc-input"
        value={text}
        placeholder="输入消息，发给兄弟 B…"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') send()
        }}
      />
      <div className="btn-row">
        <button onClick={send}>↑ 交给父组件</button>
      </div>
      <p className="cc-mini-tip">
        A 不认识 B，它只是把数据交给共同的父组件。
      </p>
    </div>
  )
}

// 兄弟 B：接收方，通过 props 拿父组件下发的共享数据
function Receiver({ messages }) {
  return (
    <div className="cc-node cc-node-siblingB">
      <div className="cc-node-tag">🅱️ 兄弟 B · 接收方</div>
      {messages.length === 0 ? (
        <p className="cc-recv cc-empty">还没收到消息…</p>
      ) : (
        <ul className="cc-msg-list">
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
      <p className="cc-mini-tip">
        B 也不认识 A，它只是渲染父组件传下来的 props。
      </p>
    </div>
  )
}

export default function SiblingDemo() {
  // 共享状态"提升"到最近的共同父组件
  const [messages, setMessages] = useState([])
  const { log, push } = useCommLog()

  const handleSend = (text) => {
    setMessages((prev) => [text, ...prev].slice(0, 6))
    push(`A → 父：上报 "${text}"；父 → B：通过 props 把新列表下发`, 'both')
  }

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>场景 3：兄弟通信（状态提升）</h3>
        <p className="desc">
          把共享数据放到<b>最近的共同父组件</b>，A 改、B 用，靠父组件做中转。
        </p>
      </div>

      <div className="cc-tree">
        <div className="cc-node cc-node-parent">
          <div className="cc-node-tag">👨‍👩‍👧 共同父组件 Parent（持有共享 state）</div>
          <p className="cc-state-line">
            <code>messages: [ {messages.length} 条 ]</code>
          </p>

          <div className="cc-sibling-row">
            <Sender onSend={handleSend} />
            <Receiver messages={messages} />
          </div>

          <div className="cc-flow cc-flow-both">
            A ↑ 上报给父 &nbsp;·&nbsp; 父 ↓ 下发给 B（兄弟从不直接对话）
          </div>
        </div>
      </div>

      <CommLog log={log} />

      <pre className="code">{`function Parent() {
  const [messages, setMessages] = useState([])   // ← 共享状态提升到这里
  return (
    <>
      {/* A：通过回调改父组件的 state */}
      <Sender onSend={text => setMessages(m => [text, ...m])} />
      {/* B：通过 props 读取同一个 state */}
      <Receiver messages={messages} />
    </>
  )
}`}</pre>

      <p className="tip">
        👉 口诀：<b>谁改往上提，谁用往下接</b>。共享状态放在最近共同父级，
        A 负责改（回调上报），B 负责用（props 下发），兄弟之间始终不直接耦合。
      </p>
    </div>
  )
}
