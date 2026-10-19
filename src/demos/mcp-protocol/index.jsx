import { useState } from 'react'
import HandshakeDemo from './HandshakeDemo.jsx'
import ToolCompareDemo from './ToolCompareDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import DecisionDemo from './DecisionDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：什么是 MCP（Model Context Protocol）
 * ---------------------------------------------------------
 * 面试原题「你项目里用到大模型，那你知道什么是 MCP 吗？」，
 * 按项目的三栏式规范拆成五栏（① ② 实跑对拍，③ 本质与陷阱，④ 决策演练，🎯 面试总结）：
 *   ① 握手全程：initialize → tools/list → 喂模型 → tool_calls →
 *      tools/call → 结果回注，九步播放器 + JSON-RPC 消息体
 *   ② 两种方式对拍：直连 function calling vs MCP + N×M/N+M 集成矩阵
 *   ③ 本质与陷阱：名称拆解、Host/Client/Server、协议分层、
 *      原语映射、对比表、7 个必踩坑
 *   ④ 选型决策台：5 个场景判断该不该用 MCP
 *   🎯 面试总结：60 秒话术 + 追问答法 + 项目落地示例 + 避雷清单
 * 与 llm-answer-flow 联动：工具调用那一轮（tool_calls 也是 token）在这里展开成生态标准。
 * ========================================================= */

const SUB_TABS = [
  { key: 'handshake', label: '① 握手与调用全程', node: <HandshakeDemo /> },
  { key: 'compare', label: '② 两种方式对拍', node: <ToolCompareDemo /> },
  { key: 'essence', label: '③ 本质与陷阱', node: <EssenceDemo /> },
  { key: 'decision', label: '④ 选型决策台', node: <DecisionDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function McpProtocol() {
  const [tab, setTab] = useState('handshake')
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
