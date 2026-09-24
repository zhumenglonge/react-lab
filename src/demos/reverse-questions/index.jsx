import { useState } from 'react'
import QuestionBank from './QuestionBank.jsx'
import AvoidRole from './AvoidRole.jsx'
import SignalDecode from './SignalDecode.jsx'
import './styles.css'

/* =========================================================
 * 主题：反问环节 —— 面试官问「你有什么想问的」该问什么
 * ---------------------------------------------------------
 * 解决"轮到我提问却不知问啥"：
 *   ① ❓ 反问清单：按场景分类、可勾选带计数的题库（面试前挑 2~3 条）
 *   ② ⚠️ 避雷 & 分角色：不该问什么、面对同事/主管/HR 各问哪类
 *   ③ 🔮 收尾信号：「还有问题吗」不等于通过，教你读真正的信号
 * ========================================================= */

const SUB_TABS = [
  { key: 'bank', label: '❓ 反问清单', node: <QuestionBank /> },
  { key: 'avoid', label: '⚠️ 避雷 & 分角色', node: <AvoidRole /> },
  { key: 'signal', label: '🔮 收尾信号解读', node: <SignalDecode /> },
]

export default function ReverseQuestions() {
  const [tab, setTab] = useState('bank')
  const current = SUB_TABS.find((t) => t.key === tab)

  return (
    <div className="topic-root">
      <nav className="tabs">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            className={t.key === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main className="content">{current.node}</main>
    </div>
  )
}
