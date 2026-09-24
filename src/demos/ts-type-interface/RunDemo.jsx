import { useState } from 'react'
import { MERGE, MATRIX, RUNTIME, safeRun } from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：type/interface 合并、any/unknown/never 放行矩阵
 * ---------------------------------------------------------
 * ① 声明合并模拟器：同名 interface 合并 vs type 冲突（点编译揭示 tsc 结果）
 * ② 操作放行矩阵：对 any/unknown/never 逐操作揭示 tsc --strict 的 ✅/❌
 * ③ any vs unknown 真跑：浏览器真执行 JS，看运行时后果（炸 / 安全）
 * ========================================================= */

const TYPES = ['any', 'unknown', 'never']
const ICON = { yes: '✅', no: '❌', na: '➖' }

export default function RunDemo() {
  const [merged, setMerged] = useState({})
  const [matrixOn, setMatrixOn] = useState(false)
  const [runtime, setRuntime] = useState({})

  const compileMerge = (k) => setMerged((p) => ({ ...p, [k]: true }))
  const runOne = (r) => setRuntime((p) => ({ ...p, [r.id]: safeRun(r.run) }))

  return (
    <div className="demo-wrap tti-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 合并 / 放行矩阵 / 运行时后果</h2>
        <p className="demo-sub">
          TS 类型只活在<b>编译期</b>，浏览器跑不了 <code>tsc</code>。所以前两区揭示的是
          <b>tsc --strict 的真实编译结果</b>（预置），第三区是浏览器里<b>真跑的 JS</b>——
          看 <code>any</code> 放行后运行时怎么炸、<code>unknown</code> 收窄后怎么变安全。
        </p>
      </div>

      {/* ---------- ① 声明合并模拟器 ---------- */}
      <section className="tti-section">
        <h3>🔀 同名声明：interface 合并 vs type 冲突</h3>
        <div className="tti-duel">
          {[['iface', 'interface User', MERGE.iface], ['type', 'type User', MERGE.type]].map(([k, label, d]) => (
            <div className="tti-card" key={k}>
              <div className="tti-card-head">
                <span className={'tti-tag ' + (d.ok ? 'tti-tag-ok' : 'tti-tag-bad')}>{label}</span>
              </div>
              <pre className="code tti-code">{d.code}</pre>
              <div className="btn-row tti-card-btn">
                {!merged[k] ? (
                  <button className="ghost" onClick={() => compileMerge(k)}>▶ 编译看看</button>
                ) : (
                  <span className={'tti-verdict ' + (d.ok ? 'tti-v-ok' : 'tti-v-bad')}>{d.verdict}</span>
                )}
              </div>
              {merged[k] && <p className="tti-detail">{d.detail}</p>}
            </div>
          ))}
        </div>
        <p className="tti-tip">💡 {MERGE.note}</p>
      </section>

      {/* ---------- ② 操作放行矩阵 ---------- */}
      <section className="tti-section">
        <div className="tti-sec-head">
          <h3>🚦 any / unknown / never 操作放行矩阵</h3>
          <div className="btn-row">
            {!matrixOn ? (
              <button className="tti-primary" onClick={() => setMatrixOn(true)}>▶ 运行 tsc --strict 检查</button>
            ) : (
              <button className="ghost" onClick={() => setMatrixOn(false)}>↺ 收起</button>
            )}
          </div>
        </div>
        <div className="tti-matrix">
          <div className="tti-mrow tti-mhead">
            <span>操作</span>
            {TYPES.map((t) => <span key={t} className="tti-mtype">{t}</span>)}
          </div>
          {MATRIX.map((row) => (
            <div className="tti-mrow" key={row.op}>
              <span className="tti-mop">{row.op}</span>
              {TYPES.map((t) => {
                const c = row.cells[t]
                return (
                  <span className="tti-mcell" key={t}>
                    {matrixOn ? (
                      <>
                        <b className={'tti-micon tti-' + c.ok}>{ICON[c.ok]}</b>
                        <em className="tti-mmsg">{c.msg}</em>
                      </>
                    ) : (
                      <em className="tti-mpending">点上方运行…</em>
                    )}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
        <p className="tti-tip">
          💡 一句话记：<b>any</b> 全放行（放弃检查）、<b>unknown</b> 收进来但用前必须收窄（top type）、
          <b>never</b> 装不下任何值却能赋给任何类型（bottom type，用于穷尽性检查）。
        </p>
      </section>

      {/* ---------- ③ any vs unknown 真跑 ---------- */}
      <section className="tti-section">
        <h3>👣 any 放行 vs unknown 拦截（真跑运行时代码）</h3>
        <div className="tti-duel">
          {RUNTIME.map((r) => {
            const res = runtime[r.id]
            return (
              <div className="tti-card" key={r.id}>
                <div className="tti-card-head">
                  <span className={'tti-tag ' + (r.id === 'any' ? 'tti-tag-bad' : 'tti-tag-ok')}>{r.tag}</span>
                  <span className="tti-card-title">{r.title}</span>
                </div>
                <div className="tti-side-tag tti-side-ts">TypeScript</div>
                <pre className="code tti-code">{r.ts}</pre>
                <div className="tti-side-tag tti-side-js">擦除类型后的 JS（真跑这个）</div>
                <pre className="code tti-code">{r.js}</pre>
                <div className="btn-row tti-card-btn">
                  <button className="ghost" onClick={() => runOne(r)}>▶ 运行这段 JS</button>
                </div>
                {res && (
                  <div className={'tti-run ' + (res.threw ? 'tti-run-threw' : 'tti-run-ok')}>
                    {res.threw ? (
                      <><b>💥 运行时炸：</b><code>{res.text}</code></>
                    ) : (
                      <><b>▶ 安全返回：</b><code>{res.text}</code></>
                    )}
                  </div>
                )}
                <p className="tti-tip">💡 {r.note}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
