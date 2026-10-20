import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：移动零（把 0 移到数组末尾 · LeetCode 283）
 * ---------------------------------------------------------
 * 面试原题「数组 [1,2,0,0,4,5,6]，把 0 移到最后，非零保持相对顺序」：
 *   ① ⚔️ 实跑对拍：三种写法并排真跑 + 操作量对比 + 双指针逐帧动画
 *   ② 🧠 本质与陷阱：原地/单趟/保序三条要求 × 分区不变式 + truthy 误伤对拍 + 4 陷阱
 *   ③ 🎯 面试总结：30 秒话术 + 默写级手写代码 + 6 个高频追问
 * 每个子 demo 自包含，删除本文件夹 + registry 条目即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function MoveZeroes() {
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
