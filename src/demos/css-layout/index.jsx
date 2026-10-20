import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：CSS 常用布局
 * ---------------------------------------------------------
 * 面试原题「CSS 里面有哪些常用的布局？」，做成能动手切换验证的闭环：
 *   ① ⚔️ 实跑对拍：布局切换台（文档流/inline-block/浮动/flex/grid/定位），
 *      实时渲染 + 生成 CSS + 浮动塌陷 BFC 实测
 *   ② 🧠 本质与陷阱：六大布局手段一览、Flex vs Grid、BFC、经典三栏
 *   ③ 🎯 面试总结：一句话本质、高频追问、话术模板
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function CssLayout() {
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
