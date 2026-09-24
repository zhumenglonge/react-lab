import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：Array.prototype.some 与 every 的区别
 * ---------------------------------------------------------
 * 面试原题「some 和 every 有什么区别？」，做成能动手验证的闭环：
 *   ① ⚔️ 实跑对拍：some/every 各跑一遍 + 短路计数
 *   ② 🧠 本质与陷阱：some/every/find/filter 家族对比、空数组规则、高频坑
 *   ③ 🎯 面试总结：一句话本质、高频追问、话术模板
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function SomeVsEvery() {
  const [tab, setTab] = useState('run')
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
