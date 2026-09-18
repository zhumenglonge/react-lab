import { useState } from 'react'
import StructureDemo from './StructureDemo.jsx'
import InterruptDemo from './InterruptDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：React Fiber 架构
 * ---------------------------------------------------------
 * 面试原题「讲讲 React 的 Fiber 架构 / 为什么需要 Fiber」，做成一条能动手验证的闭环：
 *   ① 🔗 结构可视化：真实构建 child/sibling/return 链表，逐帧播放 work loop 遍历
 *   ② ⏱️ 可中断渲染：Stack vs Fiber 时间切片对比，中途插入用户输入看它何时被响应
 *   ③ 🎯 面试总结：三大阶段、双缓存、Lanes 优先级、高频追问、话术模板
 * 每个子 demo 自包含数据与交互，删除本文件夹 + registry 条目即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'structure', label: '🔗 结构可视化', node: <StructureDemo /> },
  { key: 'interrupt', label: '⏱️ 可中断渲染', node: <InterruptDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function ReactFiber() {
  const [tab, setTab] = useState('structure')
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
