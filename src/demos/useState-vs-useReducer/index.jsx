import { useState } from 'react'
import CounterDemo from './CounterDemo.jsx'
import CartDemo from './CartDemo.jsx'
import FetchDemo from './FetchDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：useState vs useReducer
 * ---------------------------------------------------------
 * 这是主题的"入口文件"，负责：
 *   1. 引入本主题的专属样式（styles.css）
 *   2. 组织内部子 tab 的切换
 *
 * 未来新加一个学习主题，只需要在 demos/ 下新建一个类似的
 * 文件夹，然后到 registry.js 里注册即可。
 * ========================================================= */

const SUB_TABS = [
  { key: 'counter', label: '① 计数器', node: <CounterDemo /> },
  { key: 'cart', label: '② 购物车', node: <CartDemo /> },
  { key: 'fetch', label: '③ 异步请求', node: <FetchDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function UseStateVsUseReducer() {
  const [tab, setTab] = useState('counter')
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
