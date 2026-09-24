import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：TS 基础原子类型
 * ---------------------------------------------------------
 * 面试原题「TS 有哪些基础原子类型？」，做成能动手验证的闭环：
 *   ① ⚔️ 实跑对拍：原子类型 typeof 探测台 + 特殊类型运行时足迹
 *   ② 🧠 本质与陷阱：7 种原子类型、特殊类型、组合类型、拓宽、高频坑
 *   ③ 🎯 面试总结：一句话本质、高频追问、话术模板
 * 姊妹主题：「TS 和 JS 的区别」（同样讲类型擦除与编译期检查）。
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function TsBasicTypes() {
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
