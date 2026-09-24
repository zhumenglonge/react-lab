import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：CSS 选择器与优先级
 * ---------------------------------------------------------
 * 面试原题「CSS 有哪些选择器？优先级怎么算？」，做成能动手验证的闭环：
 *   ① ⚔️ 实跑对拍：权重计算器 + 6 组真实规则对决（getComputedStyle 实测）
 *   ② 🧠 本质与陷阱：五大家族、权重档位表、高频坑
 *   ③ 🎯 面试总结：一句话本质、高频追问、话术模板
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function CssSelectors() {
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
