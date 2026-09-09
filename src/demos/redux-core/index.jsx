import { useState } from 'react'
import CoreDemo from './CoreDemo.jsx'
import FlowDemo from './FlowDemo.jsx'
import AsyncDemo from './AsyncDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：Redux 核心原理（手写 mini-redux）
 * ---------------------------------------------------------
 * 入口文件：引入本主题专属样式 + 组织子 tab 切换。
 * 四个 tab：
 *   ① 核心原理（createStore 源码 + 实时 dispatch/subscribe）
 *   ② 工作流程（单向数据流可视化，走一圈）
 *   ③ 异步中间件（手写 thunk，看异步 action 怎么跑）
 *   🎯 面试总结（概念/原则/真实 RTK 对照/话术）
 * ========================================================= */

const SUB_TABS = [
  { key: 'core', label: '① 核心原理', node: <CoreDemo /> },
  { key: 'flow', label: '② 工作流程', node: <FlowDemo /> },
  { key: 'async', label: '③ 异步中间件', node: <AsyncDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function ReduxCore() {
  const [tab, setTab] = useState('core')
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
