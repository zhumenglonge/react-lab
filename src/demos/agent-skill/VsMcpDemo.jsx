import { useState } from 'react'
import { SKILL_VS_MCP, GATEWAY_COMPARE } from './shared.js'

/* =========================================================
 * ③ Skill vs MCP：一场被误解的"替代战争"
 * ---------------------------------------------------------
 * 上：逐维对比表（形态/解决什么/怎么进上下文/成本/关系）
 * 下：网关对拍 + token 滑杆 —— 直观看到"重 MCP vs Skill 包网关"
 * 的初始上下文差距，以及为什么两者是叠加而非二选一。
 * ========================================================= */

const GATEWAY_BASE = 500 /* Skill 名片层固定成本（示意） */

export default function VsMcpDemo() {
  const [tools, setTools] = useState(20)
  const [perTool, setPerTool] = useState(800)

  const directCost = tools * perTool
  const maxCost = Math.max(directCost, GATEWAY_BASE, 1)

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>③ Skill vs MCP · 到底谁替代谁</h2>
        <p className="desc">
          最常被问反的一点：<b>它们不是竞争关系</b>。MCP 管"连得上"（外部工具/数据的接口），
          Skill 管"会不会做"（过程知识与流程）。一个像水电气管线接口，一本像写给厨房的操作手册。
        </p>
      </div>

      <div className="sk-card">
        <h4>⚖️ 逐维对比</h4>
        <table className="sk-compare">
          <thead>
            <tr><th>维度</th><th>Agent Skill</th><th>MCP</th></tr>
          </thead>
          <tbody>
            {SKILL_VS_MCP.map((r) => (
              <tr key={r.k}>
                <td>{r.k}</td>
                <td><b>{r.skill}</b></td>
                <td>{r.mcp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sk-card">
        <h4>🚪 经典组合：用轻 Skill 包住重 MCP 当"网关"</h4>
        <div className="sk-chips">
          <span className="sk-tag">拖下面两个滑杆，看初始上下文差多少</span>
        </div>
        <div className="sk-slider" style={{ marginBottom: '0.7rem' }}>
          <div className="sk-ctx-head">
            <span>MCP Server 暴露的工具数</span>
            <b>{tools} 个</b>
          </div>
          <input type="range" min="1" max="40" step="1" value={tools} onChange={(e) => setTools(Number(e.target.value))} />
        </div>
        <div className="sk-slider" style={{ marginBottom: '0.9rem' }}>
          <div className="sk-ctx-head">
            <span>平均每个工具 JSON Schema 的 token</span>
            <b>{perTool}</b>
          </div>
          <input type="range" min="200" max="1500" step="50" value={perTool} onChange={(e) => setPerTool(Number(e.target.value))} />
        </div>

        <div className="sk-duel">
          {GATEWAY_COMPARE.map((g) => {
            const cost = g.initial === 16000 ? directCost : GATEWAY_BASE
            const pct = Math.max(4, Math.round((cost / maxCost) * 100))
            return (
              <div key={g.name} className={`sk-duel-col ${g.color}`}>
                <div className="sk-duel-head">{g.name}</div>
                <div className="sk-initial">{cost.toLocaleString()} token<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}> 初始占用</span></div>
                <div className="sk-ctx-track" style={{ marginBottom: '0.7rem' }}>
                  <div className="sk-ctx-fill" style={{ width: `${pct}%` }} />
                </div>
                {g.steps.map((s) => (
                  <div key={s} className="sk-step-line">
                    <span className="sk-step-who">›</span>
                    <span>{s}</span>
                  </div>
                ))}
                <p className={`sk-verdict is-${g.verdict.tone}`} style={{ marginTop: '0.6rem' }}>{g.verdict.text}</p>
              </div>
            )
          })}
        </div>
        <p className="sk-note">
          当前参数下：直连 <b>{directCost.toLocaleString()}</b> token vs Skill 网关 <b>{GATEWAY_BASE.toLocaleString()}</b> token，
          差 <b>{Math.max(0, Math.round((directCost / GATEWAY_BASE) * 10) / 10)}×</b>。
          网关不是变魔法 —— 它只是把"全部 schema 常驻"换成"名片常驻、工具按需再暴露"。
        </p>
      </div>

      <p className="tip">
        💡 面试标准收尾：<b>"MCP 决定够不够得着外部能力，Skill 决定会不会做这件事，两者正交、常叠加。"</b>
        能主动补一句"甚至能用 Skill 包一层 MCP 当省 token 的网关"，基本把这题问到顶了。
      </p>
    </div>
  )
}
