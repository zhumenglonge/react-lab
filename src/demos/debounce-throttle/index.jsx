import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：防抖 vs 节流 —— 高频事件两种拦截术
 * ---------------------------------------------------------
 * 面试原题「防抖和节流有什么区别，手写一下」，做成能动手验证的闭环：
 *   ① ⚔️ 实跑对拍：同一个输入框/自动连发，防抖与节流真执行时间线并排对拍
 *      （待重置/被拦截/补尾炮 全部当场可见）+ 定时器 vs 时间戳实现
 *   ② 🧠 本质与陷阱：一句话口诀、对比表、场景选型、共享引用/丢失尾事件等坑
 *   ③ 🎯 面试总结：手写话术模板 + 高频追问（leading/trailing、rAF、React 闭包陷阱）
 * 每个子 demo 自包含数据与交互，删除本文件夹 + registry 条目即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function DebounceThrottle() {
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
