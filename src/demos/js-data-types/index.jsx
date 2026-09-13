import { useState } from 'react'
import QuizDemo from './QuizDemo.jsx'
import MemoryDemo from './MemoryDemo.jsx'
import FlashcardDemo from './FlashcardDemo.jsx'
import TypeofDemo from './TypeofDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：JS 数据类型有哪些（8 种）
 * ---------------------------------------------------------
 * 针对「隔很久就忘」这个痛点，把主题做成一条记忆闭环，而不是又一页笔记：
 *   ① ✍️ 默写挑战：8 个格子亲手填，三级递进提示 + 答错给「错因诊断」（默认页）
 *   ② 🧠 记忆法：口诀「数字布未空符大」/ 时间线 5→6→7 / 语义分组 / 原始 vs 引用
 *   ③ 🃏 闪卡速记：主动提取 + 不熟的卡回炉，进度存 localStorage
 *   ④ 🔬 typeof 实验室：真实运行 typeof，10 道陷阱竞猜（typeof null 等）
 *   🎯 面试总结：速查表、undefined vs null、判断类型的方法、话术模板
 * 每个子 demo 自包含数据与交互，删除本文件夹 + registry 条目即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'quiz', label: '✍️ 默写挑战', node: <QuizDemo /> },
  { key: 'memory', label: '🧠 记忆法', node: <MemoryDemo /> },
  { key: 'cards', label: '🃏 闪卡速记', node: <FlashcardDemo /> },
  { key: 'typeof', label: '🔬 typeof 实验室', node: <TypeofDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function JsDataTypes() {
  const [tab, setTab] = useState('quiz')
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
