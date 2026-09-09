import { useState } from 'react'
import PropsDemo from './PropsDemo.jsx'
import ContextDemo from './ContextDemo.jsx'
import SiblingDemo from './SiblingDemo.jsx'
import RefDemo from './RefDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：React 组件间的通信方式
 * ---------------------------------------------------------
 * 入口文件：引入本主题专属样式 + 组织子 tab 切换。
 * 五个 tab 按"层级关系"递进：
 *   ① 父子（Props）→ ② 跨层级（Context）→ ③ 兄弟（状态提升）
 *   → ④ Ref（命令式）→ 🎯 面试总结
 * ========================================================= */

const SUB_TABS = [
  { key: 'props', label: '① 父子 · Props', node: <PropsDemo /> },
  { key: 'context', label: '② 跨层级 · Context', node: <ContextDemo /> },
  { key: 'sibling', label: '③ 兄弟 · 状态提升', node: <SiblingDemo /> },
  { key: 'ref', label: '④ Ref · 命令式', node: <RefDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function ComponentCommunication() {
  const [tab, setTab] = useState('props')
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
