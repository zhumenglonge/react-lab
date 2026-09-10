import { useState } from 'react'
import JourneyDemo from './JourneyDemo.jsx'
import DnsDemo from './DnsDemo.jsx'
import TcpDemo from './TcpDemo.jsx'
import RenderDemo from './RenderDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：从输入 URL 到页面展示（浏览器工作原理）
 * ---------------------------------------------------------
 * 经典面试题"在浏览器地址栏输入 URL 后发生了什么"，拆成五块：
 *   ① 全流程：8 个阶段一条龙动画，先建立整体印象
 *   ② DNS 解析：域名 → IP 的递归 / 迭代查询链
 *   ③ TCP 握手：三次握手 + 四次挥手时序图
 *   ④ 渲染流程：DOM/CSSOM → 渲染树 → 布局 → 绘制 → 合成
 *   🎯 面试总结：缓存 / 回流重绘 / 话术模板
 * 每个子 demo 自包含数据与交互，删除本文件夹即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'journey', label: '① 全流程', node: <JourneyDemo /> },
  { key: 'dns', label: '② DNS 解析', node: <DnsDemo /> },
  { key: 'tcp', label: '③ TCP 握手', node: <TcpDemo /> },
  { key: 'render', label: '④ 渲染流程', node: <RenderDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function UrlToPage() {
  const [tab, setTab] = useState('journey')
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
