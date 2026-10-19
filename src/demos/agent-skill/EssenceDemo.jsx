import { SKILL_BREAKDOWN, LINEAGE, CONFUSION_TABLE, TRAPS } from './shared.js'

/* =========================================================
 * ④ 本质与陷阱：把 Skill 放回"能力扩展谱系"里
 * ---------------------------------------------------------
 * 名称拆解 → 从 Prompt 到 Skills 的谱系 → 四个易混概念辨析 → 陷阱。
 * 纯静态展示。
 * ========================================================= */

export default function EssenceDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>④ 本质与陷阱</h2>
        <p className="desc">
          先拆三个关键词，再把 Skill 放回<b>从 Prompt → Function Calling → MCP → Skills</b> 的演进谱系里，
          最后过四个最易混的概念和 7 个坑。
        </p>
      </div>

      <div className="sk-card">
        <h4>🔤 三个关键词</h4>
        <div className="sk-breakdown">
          {SKILL_BREAKDOWN.map((b) => (
            <div key={b.k} className="sk-breakdown-card">
              <div className="sk-breakdown-k">{b.k}</div>
              <p className="sk-breakdown-v">{b.v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="sk-card">
        <h4>🧬 能力扩展谱系：每一层各解决上一层解决不了的</h4>
        <div className="sk-lineage">
          {LINEAGE.map((l) => (
            <div key={l.era} className="sk-lineage-card">
              <div className="sk-lineage-era"><span>{l.icon}</span><span>{l.era}</span></div>
              <p className="sk-lineage-what">{l.what}</p>
              <p className="sk-lineage-limit">⚠️ {l.limit}</p>
            </div>
          ))}
        </div>
        <p className="sk-note">
          记住这条主线：<b>Prompt 写要求 → Function Calling 让模型能调 → MCP 让工具可被发现复用 → Skills 让"怎么做"可被按需注入。</b>
          四层是<b>叠加</b>关系，不是谁淘汰谁。
        </p>
      </div>

      <div className="sk-card">
        <h4>🧭 四个"听起来很像"的辨析</h4>
        <div className="sk-confusion">
          {CONFUSION_TABLE.map((c) => (
            <div key={c.a} className="sk-confusion-row">
              <div className="sk-confusion-a">{c.a}</div>
              <p className="sk-confusion-b">{c.b}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="sk-card">
        <h4>🕳️ 七个必踩坑 <span className="sk-tag">每条都是追问点</span></h4>
        <div className="sk-trap-grid">
          {TRAPS.map((t, i) => (
            <div key={t.title} className="sk-trap-card">
              <span className="sk-trap-idx">{String(i + 1).padStart(2, '0')}</span>
              <div className="sk-trap-title">{t.title}</div>
              <p className="sk-trap-detail">{t.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
