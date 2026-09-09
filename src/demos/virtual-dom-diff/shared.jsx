import { useState, useRef } from 'react'

/* =========================================================
 * 共享演示组件：一个"带内部 state 的盒子"
 * ---------------------------------------------------------
 * mountId 是每次挂载随机生成的短字符串，重挂载就会变，
 * 用它来"眼见为实"地判断组件是否被 React 销毁重建了。
 * ========================================================= */

export function StatefulBox({ name, color = 'var(--accent-2)', compact = false }) {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const mountId = useRef(Math.random().toString(36).slice(2, 6)).current

  return (
    <div
      className={compact ? 'sbox compact' : 'sbox'}
      style={{ borderColor: color }}
    >
      <div className="sbox-head">
        <b style={{ color }}>{name}</b>
        <span className="mount-id" title="组件挂载 ID，重挂载会变">
          🔖 {mountId}
        </span>
      </div>
      <input
        className="sbox-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="输入点内容..."
      />
      <button className="sbox-btn" onClick={() => setCount((c) => c + 1)}>
        count = {count}
      </button>
    </div>
  )
}
