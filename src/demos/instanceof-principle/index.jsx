import { useState } from 'react'
import PrincipleDemo from './PrincipleDemo.jsx'
import ImplDemo from './ImplDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：instanceof 运算符的实现原理及实现
 * ---------------------------------------------------------
 * 面试原题「instanceof 的原理？手写一个」，做成一条能动手验证的闭环：
 *   ① 🔍 原理可视化：真实原型链逐帧播放，看它怎么沿链找 B.prototype
 *   ② 🛠️ 手写实现：myInstanceof 源码 + 用例当场和原生 instanceof 对拍
 *   🎯 面试总结：规范流程、三种类型检测对比、高频追问、话术模板
 * 每个子 demo 自包含数据与交互，删除本文件夹 + registry 条目即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'principle', label: '🔍 原理可视化', node: <PrincipleDemo /> },
  { key: 'impl', label: '🛠️ 手写实现', node: <ImplDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function InstanceofPrinciple() {
  const [tab, setTab] = useState('principle')
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
