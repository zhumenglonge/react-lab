import { useState } from 'react'
import { SCENARIOS, OPTION_LABELS } from './shared.js'

/* =========================================================
 * ④ 选型决策台：这题该不该用 MCP？
 * ---------------------------------------------------------
 * 给 5 个真实场景，选出最合适的接入方式。
 * 考点不是"MCP 好不好"，而是"什么时候轮到你用 MCP" ——
 * 能在面试里主动说出"什么时候不用"，比无脑吹更加分。
 * ========================================================= */

const OPTION_KEYS = ['fc', 'mcp', 'rag', 'none']

export default function DecisionDemo() {
  const [idx, setIdx] = useState(0)
  const [picks, setPicks] = useState({})

  const q = SCENARIOS[idx]
  const picked = picks[q.id]
  const solved = Object.entries(picks).filter(([id, p]) => SCENARIOS.find((s) => s.id === id)?.pick === p).length

  const choose = (key) => {
    if (picked) return
    setPicks((prev) => ({ ...prev, [q.id]: key }))
  }

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>④ 选型决策台 · 该不该上 MCP</h2>
        <p className="desc">
          每题一个场景，四选一。选完给出理由 ——
          把 5 道题全对的判断标准记下来，面试被追问"你们为什么用/不用 MCP"就不会露怯。
        </p>
      </div>

      <div className="mcp-card">
        <div className="mcp-chips">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              className={i === idx ? 'mcp-chip on' : 'mcp-chip'}
              onClick={() => setIdx(i)}
            >
              场景 {i + 1}
              {picks[s.id] ? (picks[s.id] === s.pick ? ' ✓' : ' ✗') : ''}
            </button>
          ))}
        </div>

        <div className="mcp-qa">🎬 {q.q}</div>

        <div className="mcp-opt-grid">
          {OPTION_KEYS.map((k) => {
            let cls = 'mcp-opt'
            if (picked) {
              if (k === q.pick) cls += ' right'
              else if (k === picked) cls += ' wrong'
            }
            return (
              <button key={k} className={cls} onClick={() => choose(k)}>
                {OPTION_LABELS[k]}
              </button>
            )
          })}
        </div>

        {picked ? (
          <div className="mcp-why">
            {picked === q.pick
              ? <>✅ 选对了。<b>{OPTION_LABELS[q.pick]}</b> —— {q.why}</>
              : <>❌ 标准答案是 <b>{OPTION_LABELS[q.pick]}</b>。{q.why}</>}
          </div>
        ) : (
          <p className="mcp-hint" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            👆 先选，再看解析
          </p>
        )}

        <p className="mcp-score">
          得分：{solved} / {SCENARIOS.length}
          {solved === SCENARIOS.length && ' —— 全对！这套判断直接搬进面试'}
        </p>
      </div>

      <p className="tip">
        💡 决策口诀：<b>工具给一个应用用 → 直连就行；工具要给多个应用/别人用 → MCP；
        检索链路写死、模型不做决定 → RAG；不改数据源、只改表达 → prompt / 微调。</b>
      </p>
    </div>
  )
}
