import { useState } from 'react'
import DisclosureDemo from './DisclosureDemo.jsx'
import AnatomyDemo from './AnatomyDemo.jsx'
import VsMcpDemo from './VsMcpDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：什么是 Skill（Agent Skills）
 * ---------------------------------------------------------
 * 面试追问「MCP 能连工具了，那 Skill 又是什么？和 MCP 什么关系」，
 * 按三栏式规范拆成五栏（① ② ③ 实跑对拍，④ 本质与陷阱，🎯 面试总结）：
 *   ① 渐进式披露三层：一个 PDF 表单 skill 的目录树 + 上下文窗口随步骤
 *      "用到才加载"地长大（本主题招牌交互）
 *   ② Skill 长什么样：真实 SKILL.md（可切换只看 L1 名片）+ 字段速查 + 能带代码
 *   ③ Skill vs MCP 对拍：逐维对比 + "轻 Skill 包重 MCP 当网关"的 token 计算
 *   ④ 本质与陷阱：三关键词 + Prompt→FC→MCP→Skills 谱系 + 四概念辨析 + 7 坑
 *   🎯 面试总结：60 秒话术 + 一句话分工 + 高频追问 + 项目落地 + 避雷
 * 与 mcp-protocol / llm-answer-flow 联动：连接层与知识层各归其位。
 * ========================================================= */

const SUB_TABS = [
  { key: 'disclose', label: '① 渐进式披露三层', node: <DisclosureDemo /> },
  { key: 'anatomy', label: '② Skill 长什么样', node: <AnatomyDemo /> },
  { key: 'vsmcp', label: '③ Skill vs MCP', node: <VsMcpDemo /> },
  { key: 'essence', label: '④ 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function AgentSkill() {
  const [tab, setTab] = useState('disclose')
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
