import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：Event Loop 事件循环 —— 宏任务 / 微任务到底谁先跑
 * ---------------------------------------------------------
 * 面试原题「说说 JS 事件循环 / 这段代码输出顺序」，做成能逐帧验证的闭环：
 *   ① ⚔️ 实跑对拍：三段经典代码逐帧播放，同步→清微任务→取宏任务，
 *      队列存量与"为什么排在这"当场可见
 *   ② 🧠 本质与陷阱：事件循环概念图、微/宏成员对拍表、Node vs 浏览器差异、易错坑
 *   ③ 🎯 面试总结：话术模板 + 高频追问（await 归微任务、链式 then、nextTick、rAF）
 * 每个子 demo 自包含数据与交互，删除本文件夹 + registry 条目即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function EventLoop() {
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
