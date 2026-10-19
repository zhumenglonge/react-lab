import { useState } from 'react'
import { INTEGRATION_WAYS, integrationsWithoutMcp, integrationsWithMcp } from './shared.js'

/* =========================================================
 * ② 接工具两种方式对拍：直连 function calling vs MCP
 * ---------------------------------------------------------
 * 上半：同一件事（给模型接上搜索工具）两条路径逐步对比；
 * 下半：N×M vs N+M 集成矩阵，滑 N（AI 应用数）、M（工具数）
 * 直观感受"为什么需要一条协议"。纯确定性，无副作用。
 * ========================================================= */

function MatrixCell({ kind }) {
  return <div className={`mcp-cell ${kind}`} title={kind === 'wire' ? '一个胶水工程' : undefined} />
}

function IntegrationMatrix({ n, m, useMcp }) {
  const count = useMcp ? integrationsWithMcp(n, m) : integrationsWithoutMcp(n, m)
  const cells = []
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < m; c += 1) {
      const kind = useMcp ? (c === 0 ? 'plug' : 'empty') : 'wire'
      cells.push(<MatrixCell key={`${r}-${c}`} kind={kind} />)
    }
  }
  return (
    <div className={`mcp-matrix-box ${useMcp ? 'is-good' : 'is-bad'}`}>
      <div className="mcp-matrix-title">
        <span>{useMcp ? '✅ 有 MCP：应用接 1 个 Client 位 + 工具方写 1 个 Server' : '❌ 没有 MCP：每个应用 × 每个工具手写胶水'}</span>
        <b className={useMcp ? 'is-good' : 'is-bad'}>{count} 个集成</b>
      </div>
      <div className="mcp-matrix" style={{ gridTemplateColumns: `repeat(${m}, 1fr)` }}>
        {cells}
      </div>
      <p className="mcp-note" style={{ marginTop: '0.6rem' }}>
        {useMcp
          ? '红格消失：工具清单由 Server 声明一次，N 个 Host 通过协议发现复用 —— 改接口只动 Server。'
          : `${n} 个应用 × ${m} 个工具 = ${count} 份硬编码声明 + ${count} 份执行路由；工具一改，${n} 个应用全部跟着发版。`}
      </p>
    </div>
  )
}

export default function ToolCompareDemo() {
  const [pair, setPair] = useState(['fc', 'mcp'])
  const [n, setN] = useState(4)
  const [m, setM] = useState(5)

  const ways = pair.map((k) => INTEGRATION_WAYS.find((w) => w.key === k))
  const toggle = (k) => {
    setPair((prev) => {
      if (prev.includes(k)) {
        if (prev.length === 1) return prev
        return prev.filter((x) => x !== k)
      }
      return [...prev, k].slice(-2)
    })
  }

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>② 接工具的两种方式 · 当场对拍</h2>
        <p className="desc">
          「不都是让模型调工具吗，为什么要多一层协议？」—— 把<b>直连 function calling</b> 和
          <b> MCP Server</b> 摆在一起跑一遍就明白：区别不在"能不能调"，在<b>工具声明从哪来、能复用给谁</b>。
        </p>
      </div>

      <div className="mcp-card">
        <h4>🔀 同一条链路，两种走法 <span className="mcp-tag">任选两栏对比</span></h4>
        <div className="mcp-chips">
          {INTEGRATION_WAYS.map((w) => (
            <button
              key={w.key}
              className={pair.includes(w.key) ? 'mcp-chip on' : 'mcp-chip'}
              onClick={() => toggle(w.key)}
            >
              {w.name}
            </button>
          ))}
        </div>
        <div className="mcp-duel">
          {ways.map((w) => (
            <div key={w.key} className={`mcp-duel-col ${w.color}`}>
              <div className="mcp-duel-head">{w.name}</div>
              {w.steps.map((s) => (
                <div key={s.text} className="mcp-step-line">
                  <span className="mcp-step-who">{s.who}</span>
                  <span>{s.text}</span>
                </div>
              ))}
              <p className={`mcp-verdict is-${w.verdict.tone}`} style={{ marginTop: '0.6rem' }}>
                {w.verdict.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mcp-card">
        <h4>🧮 N×M vs N+M：协议到底省了什么 <span className="mcp-tag">拖滑杆看红格消失</span></h4>
        <div className="mcp-slider">
          <div className="mcp-slider-head">
            <span>N · 要接工具的 AI 应用（Host）数</span>
            <b>{n} 个</b>
          </div>
          <input type="range" min="1" max="6" step="1" value={n} onChange={(e) => setN(Number(e.target.value))} />
          <div className="mcp-slider-scale"><span>1</span><span>6</span></div>
        </div>
        <div className="mcp-slider">
          <div className="mcp-slider-head">
            <span>M · 要暴露给模型的工具数</span>
            <b>{m} 个</b>
          </div>
          <input type="range" min="1" max="8" step="1" value={m} onChange={(e) => setM(Number(e.target.value))} />
          <div className="mcp-slider-scale"><span>1</span><span>8</span></div>
        </div>
        <div className="mcp-matrix-wrap">
          <IntegrationMatrix n={n} m={m} useMcp={false} />
          <IntegrationMatrix n={n} m={m} useMcp />
        </div>
        <p className={`mcp-verdict ${n * m > n + m ? 'is-accent' : 'is-warning'}`}>
          {n * m > n + m
            ? <>现在 <b>N={n}、M={m}</b>：胶水 {n * m} 个 vs 协议 {n + m} 个，省 <b>{n * m - (n + m)} 个集成</b>。
               N、M 越大差距越夸张 —— 这就是「把 M 种数据源的接入标准化」值得立一条协议的原因。</>
            : <>当前 N={n}、M={m} 规模很小，两种写法成本几乎一样 —— <b>这正说明小场景不必上 MCP</b>，
               协议的收益要到多应用、多工具、跨组织才显现。</>}
        </p>
      </div>

      <p className="tip">
        💡 一句话收尾：function calling 解决「模型<b>能不能</b>调工具」，MCP 解决「工具<b>由谁提供、怎么被发现和复用</b>」。
        面试先讲这个分工，再展开 N×M → N+M，基本就是满分框架。
      </p>
    </div>
  )
}
