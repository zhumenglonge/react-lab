import { useState } from 'react'
import EssenceDemo from './EssenceDemo.jsx'
import MatchDemo from './MatchDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：React Router 三个标签（BrowserRouter / Routes / Route）
 * ---------------------------------------------------------
 * Vue 转 React 的人最容易被这三个"不产生 DOM 的标签"卡住。
 * 拆成三栏：
 *   ① 三个标签各干什么：换地址栏 URL，看 Router → Routes →
 *      Route 一步步算出什么；配 JSX → createElement 翻译开关
 *   ② 匹配与部署陷阱：Outlet 三写法对拍 / 具体度排名 /
 *      BrowserRouter vs basename vs HashRouter 刷新实测
 *   🎯 面试总结：速查表 + 5 步职责链 + 9 个高频追问 + 话术
 * 每个子 demo 自包含，删除本文件夹即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'essence', label: '① 三个标签各干什么', node: <EssenceDemo /> },
  { key: 'match', label: '② 匹配与部署陷阱', node: <MatchDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function ReactRouterCore() {
  const [tab, setTab] = useState('essence')
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
