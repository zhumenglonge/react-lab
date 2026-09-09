import { useState } from 'react'
import TreeDiffDemo from './TreeDiffDemo.jsx'
import ComponentDiffDemo from './ComponentDiffDemo.jsx'
import KeyDiffDemo from './KeyDiffDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：虚拟 DOM Diff 算法
 * ---------------------------------------------------------
 * 三大策略：Tree Diff / Component Diff / Element Diff
 * 每一条都有可交互 demo，让你亲眼看到规则的效果
 * ========================================================= */

const SUB_TABS = [
  { key: 'tree', label: '① Tree Diff', node: <TreeDiffDemo /> },
  { key: 'component', label: '② Component Diff', node: <ComponentDiffDemo /> },
  { key: 'element', label: '③ Element Diff (key)', node: <KeyDiffDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function VirtualDomDiff() {
  const [tab, setTab] = useState('tree')
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
