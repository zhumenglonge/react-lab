import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：闭包实战 —— 累加器 & 缓存函数（memoize）
 * ---------------------------------------------------------
 * 面试原题「用闭包写一个能累加/缓存的函数」，做成能动手验证的闭环：
 *   ① ⚔️ 实跑对拍：闭包累加当场加、memoize 缓存命中/未命中实测、
 *      全局变量 vs 闭包私有变量的污染对比、链式调用变体
 *   ② 🧠 本质与陷阱：闭包三要素、存哪了、高频坑（共享引用/内存泄漏）
 *   ③ 🎯 面试总结：手写话术模板 + 高频追问
 * 每个子 demo 自包含数据与交互，删除本文件夹 + registry 条目即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function ClosureCacheMemo() {
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
