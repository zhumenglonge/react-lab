import { useState } from 'react'
import PerfCompareDemo from './PerfCompareDemo.jsx'
import HowItWorksDemo from './HowItWorksDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：虚拟滚动 / 长列表性能优化
 * ---------------------------------------------------------
 * 入口文件：引入本主题专属样式 + 组织子 tab 切换。
 * 三个 tab：性能对比（眼见为实）→ 原理剖析（怎么算的）→ 面试总结
 * ========================================================= */

const SUB_TABS = [
  { key: 'perf', label: '① 性能对比', node: <PerfCompareDemo /> },
  { key: 'how', label: '② 原理剖析', node: <HowItWorksDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function VirtualScroll() {
  const [tab, setTab] = useState('perf')
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
