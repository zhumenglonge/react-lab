import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：TS 和 JS 的区别
 * ---------------------------------------------------------
 * 面试原题「TS 和 JS 有什么区别？」，做成能动手验证的闭环：
 *   ① ⚔️ 实跑对拍：同一 bug 的 TS 编译期报错 vs 真跑擦除类型后的 JS
 *   ② 🧠 本质与陷阱：逐维度对比、TS 新增能力、高频坑
 *   ③ 🎯 面试总结：一句话本质、高频追问、话术模板
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function TsVsJs() {
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
