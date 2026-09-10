import { useState } from 'react'
import BasicDemo from './BasicDemo.jsx'
import ShareDemo from './ShareDemo.jsx'
import PerfDemo from './PerfDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：useReducer + Context 全局状态（轻量版 Redux）
 * ---------------------------------------------------------
 * 入口文件：引入本主题专属样式 + 组织子 tab 切换。
 * 四个 tab：
 *   ① 最小结构（四步接线，跑通骨架）
 *   ② 实战全局 Store（一个 H5 页面，多组件共享同一份 state）
 *   ③ 性能优化（State / Dispatch 拆分，看谁在重渲染）
 *   🎯 面试总结（vs Redux / 适用场景 / 破除"路由数量"误区 / 话术）
 * ========================================================= */

const SUB_TABS = [
  { key: 'basic', label: '① 最小结构', node: <BasicDemo /> },
  { key: 'share', label: '② 实战 Store', node: <ShareDemo /> },
  { key: 'perf', label: '③ 性能优化', node: <PerfDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function UseReducerContext() {
  const [tab, setTab] = useState('basic')
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
