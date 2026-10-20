import { useState } from 'react'
import RunDemo from './RunDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：浏览器存储（Cookie / localStorage / sessionStorage）
 * ---------------------------------------------------------
 * 前端面试高频题「说说浏览器缓存、cookie、localstorage 这些」，
 * 先辨析"HTTP 缓存 ≠ 端侧存储"，再拆成三栏：
 *   ① ⚔️ 实跑对拍：真调 document.cookie / localStorage /
 *      sessionStorage —— 读写台、4KB vs 5MB 容量实测、请求头
 *      模拟（只有 Cookie 自动上行）、跨标签页 storage 事件广播
 *   ② 🧠 本质与陷阱：存储 vs 缓存边界 + Cookie↔Session 流水线
 *      （储物柜与钥匙）+ Cookie 安全三件套 + 高频陷阱列表
 *   ③ 🎯 面试总结：三者对比表 + 选型决策 + 话术模板 + 高频追问
 * 每个子 demo 自包含数据与交互，删除本文件夹 + registry 条目即可整体移除。
 * 网络层的强缓存/协商缓存见 http-cache 主题，本主题只管端侧存储。
 * ========================================================= */

const SUB_TABS = [
  { key: 'run', label: '⚔️ 实跑对拍', node: <RunDemo /> },
  { key: 'essence', label: '🧠 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function WebStorage() {
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
