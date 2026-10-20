import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：数组去重（数字数组）
 * ---------------------------------------------------------
 * 面试原题「一个数字类型的数组，怎么去重？」，做成能动手验证的闭环：
 *   ① ⚔️ 实跑对拍：同一数组 6 种写法并排真跑 + 5 万项性能基准真计时
 *   ② 🧠 本质与陷阱：判等规则（=== vs SameValueZero）× 查找代价 × 保序，
 *      NaN / +0 / -0 特殊值全当场真跑，4 个高频陷阱
 *   ③ 🎯 面试总结：30 秒话术模板 + 默写级手写代码 + 6 个高频追问
 * 每个子 demo 自包含数据与交互，删除本文件夹 + registry 条目即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function ArrayDedup() {
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
