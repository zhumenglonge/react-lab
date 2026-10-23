import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：忙循环里的优先级调度 —— 循环不闲着，新任务优先
 * ---------------------------------------------------------
 * 面试手写原题「写一个函数，里面循环不让它闲着；外头来了
 * 新任务要能优先执行」，做成能动手验证的闭环：
 *   ① ⚔️ 实跑对拍：裸同步 / 微任务假异步 / 切片+让步 三种跑法
 *      真跑在主线程，rAF 心跳 + 排队毫秒数当场量出差距
 *   ② 🧠 本质与陷阱：三条铁律、五种让步方式对拍、抢占真相、六个坑
 *   ③ 🎯 面试总结：60 秒话术 + 白板模板 + 高频追问（Fiber/Worker/Node）
 * 每个子 demo 自包含数据与交互，删除本文件夹 + registry 条目即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function SchedulerPreempt() {
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
