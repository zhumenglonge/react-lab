import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：JS 中 for...in 与 for...of 的区别
 * ---------------------------------------------------------
 * 面试原题「for in 和 for of 有什么区别？」，做成能动手验证的闭环：
 *   ① ⚔️ 实跑对拍：8 种数据当场各跑一遍，看它们分别拿到什么
 *   ② 🧠 本质与陷阱：逐维度对比、何时用哪个、高频坑
 *   ③ 🎯 面试总结：一句话本质、高频追问、话术模板
 * 每个子 demo 自包含数据与交互，删除本文件夹 + registry 条目即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function ForInVsForOf() {
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
