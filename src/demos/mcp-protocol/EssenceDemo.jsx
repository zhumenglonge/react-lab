import {
  MCP_BREAKDOWN, ROLES, LAYERS, PRIMITIVE_MAP, COMPARE_ROWS, TRAPS,
} from './shared.js'

/* =========================================================
 * ③ 本质与陷阱：把 MCP 拆到原子，再给 7 个必踩坑
 * ---------------------------------------------------------
 * 名称拆解 → 三层角色 → 协议分层 → 原语映射 → 对比表 → 陷阱。
 * 纯静态展示，无交互状态。
 * ========================================================= */

export default function EssenceDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>③ 本质与陷阱</h2>
        <p className="desc">
          先把 <b>Model · Context · Protocol</b> 三个词逐个拆开（这决定你答题的颗粒度），
          再过角色、分层、对比表和 7 个面试官爱挖的坑。
        </p>
      </div>

      <div className="mcp-card">
        <h4>🔤 名字拆解：三个词各自在说什么</h4>
        <div className="mcp-breakdown">
          {MCP_BREAKDOWN.map((b) => (
            <div key={b.k} className="mcp-breakdown-card">
              <div className="mcp-breakdown-k">{b.k}</div>
              <p className="mcp-breakdown-v">{b.v}</p>
            </div>
          ))}
        </div>
        <p className="mcp-note">
          连起来：<b>给大模型标准化地喂上下文/工具能力的公开协议</b>。
          很多回答只背了全称，把这三个词各自的用意讲出来，立刻和背题的区分开。
        </p>
      </div>

      <div className="mcp-card">
        <h4>🏗️ 三层角色：Host / Client / Server</h4>
        <div className="mcp-roles-grid">
          {ROLES.map((r) => (
            <div key={r.name} className="mcp-role-card">
              <div className="mcp-role-name">
                <span>{r.icon}</span>
                <span>{r.name}</span>
                <span className="mcp-role-en">{r.en}</span>
              </div>
              <p className="mcp-role-desc">{r.desc}</p>
              <p className="mcp-role-ex">例：{r.examples}</p>
            </div>
          ))}
        </div>
        <p className="mcp-note">
          ⚠️ 最常考的关系题：<b>Client 与 Server 严格 1:1</b>；一个 Host 可以同时挂多个 Server（每个一个 Client）。
          别说成"一个 Client 连一堆 Server"，会被追问。
        </p>
      </div>

      <div className="mcp-card">
        <h4>🧱 协议分层：数据 / 控制 / 传输</h4>
        <div className="mcp-layers">
          {LAYERS.map((l) => (
            <div key={l.name} className="mcp-layer">
              <div className="mcp-layer-name">{l.name}</div>
              <p className="mcp-layer-items">{l.items}</p>
              <p className="mcp-layer-note">💡 {l.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mcp-card">
        <h4>🔁 三类原语 ↔ 你已有的概念 <span className="mcp-tag">映射到 OpenAI 风格 API</span></h4>
        <div className="mcp-map-grid">
          {PRIMITIVE_MAP.map((p) => (
            <div key={p.mcp} className="mcp-map-card">
              <div className="mcp-map-eq">
                <span>{p.mcp}</span><span className="to">≈</span><span>{p.ai}</span>
              </div>
              <p className="mcp-map-note">{p.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mcp-card">
        <h4>⚖️ MCP vs 直连 function calling：逐维对比</h4>
        <table className="mcp-compare">
          <thead>
            <tr><th>维度</th><th>直连 function calling</th><th>MCP</th></tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((r) => (
              <tr key={r.k}>
                <td>{r.k}</td>
                <td>{r.fc}</td>
                <td><b>{r.mcp}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mcp-card">
        <h4>🕳️ 七个必踩坑 <span className="mcp-tag">每条都是追问点</span></h4>
        <div className="mcp-trap-grid">
          {TRAPS.map((t, i) => (
            <div key={t.title} className="mcp-trap-card">
              <span className="mcp-trap-idx">{String(i + 1).padStart(2, '0')}</span>
              <div className="mcp-trap-title">{t.title}</div>
              <p className="mcp-trap-detail">{t.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
