import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：type vs interface · any/unknown/never
 * ---------------------------------------------------------
 * 面试原题「type 与 interface 有什么区别、定义对象用哪个、同名 interface
 * 会不会合并、any/unknown/never 三者区别」，做成能动手验证的闭环：
 *   ① ⚔️ 实跑对拍：声明合并模拟器 + 放行矩阵 + any/unknown 真跑后果
 *   ② 🧠 本质与陷阱：能力对比、对象选型、顶/底类型、高频坑
 *   ③ 🎯 面试总结：一句话本质、高频追问、话术模板
 * 姊妹主题：「TS 基础原子类型」「TS 和 JS 的区别」。
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function TsTypeInterface() {
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
