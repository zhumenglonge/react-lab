import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：原型链与继承
 * ---------------------------------------------------------
 * 面试原题「原型链是怎么工作的？ES5 继承和 class 什么关系？」，
 * 做成能动手验证的闭环：
 *   ① ⚔️ 实跑对拍：属性查找沿链逐环播放 + ES5 vs class 六项对拍
 *   ② 🧠 本质与陷阱：三角关系图、new 四步、继承对比、特殊关系、高频坑
 *   ③ 🎯 面试总结：一句话本质、高频追问、话术模板
 * 姊妹主题：「instanceof 原理与实现」（同一条链的另一种爬法）。
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function PrototypeChain() {
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
