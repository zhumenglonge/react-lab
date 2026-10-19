import { useState } from 'react'
import FlowDemo from './FlowDemo.jsx'
import FieldDemo from './FieldDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：HTTP 缓存（强缓存 vs 协商缓存）
 * ---------------------------------------------------------
 * 前端面试网络高频题「说说强制缓存和协商缓存」，拆成三栏：
 *   ① 缓存流水线：可交互的决策模拟器，配 max-age / 已存时长 /
 *      服务器是否变更，点"发起请求"看它一步步落到 200(from cache) /
 *      304 / 200(全新下载) 哪个结果（实跑对拍）
 *   ② 字段本质与陷阱：Cache-Control 取值台 + Expires vs
 *      Cache-Control + Last-Modified vs ETag 三组可切换对拍
 *   🎯 面试总结：对比表 + no-cache 陷阱 + 项目缓存策略 + 话术模板
 * 每个子 demo 自包含数据与交互，删除本文件夹即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'flow', label: '① 缓存流水线', node: <FlowDemo /> },
  { key: 'field', label: '② 字段本质与陷阱', node: <FieldDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function HttpCache() {
  const [tab, setTab] = useState('flow')
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
