import { useState } from 'react'
import { PROBE, SPECIAL_RUN, runTypeof, safeRun } from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：TS 类型关键字 vs JS 运行时 typeof
 * ---------------------------------------------------------
 * 类型运行时被擦除，所以这里跑两样能真跑的东西：
 *   ① 原子类型探测台：对每种基础类型的真实值跑 typeof，
 *      看 TS 的类型关键字落到运行时是什么，暴露 null / NaN 两个经典坑。
 *   ② 特殊类型足迹：void / never / any / unknown 各真跑一段代码，
 *      看它们在运行时长什么样（返回 undefined / 抛错 / 无痕迹 / 需收窄）。
 * ========================================================= */

export default function RunDemo() {
  const [probeRan, setProbeRan] = useState(false)
  const [special, setSpecial] = useState({})

  const runProbe = () => setProbeRan(true)
  const runOne = (s) => setSpecial((prev) => ({ ...prev, [s.id]: safeRun(s.run) }))

  return (
    <div className="demo-wrap tsb-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · TS 类型关键字，落到运行时是什么</h2>
        <p className="demo-sub">
          TS 的类型只活在<b>编译期</b>，编译后被<b>整个擦除</b>——浏览器里根本没有 <code>string</code>、
          <code>number</code> 这些类型。所以这里不跑类型，而是跑两样能真跑的：
          对每种原子类型的<b>真实值跑 typeof</b>（看 JS 运行时怎么认它），
          再<b>真跑</b> void / never / any / unknown 的代码，看它们的运行时足迹。
        </p>
      </div>

      {/* ---------- ① 原子类型探测台 ---------- */}
      <section className="tsb-section">
        <div className="tsb-sec-head">
          <h3>🔬 原子类型探测台（真跑 typeof）</h3>
          <div className="btn-row">
            {!probeRan ? (
              <button className="tsb-primary" onClick={runProbe}>▶ 运行全部 typeof</button>
            ) : (
              <button className="ghost" onClick={() => setProbeRan(false)}>↺ 收起结果</button>
            )}
          </div>
        </div>

        <div className="tsb-probe">
          <div className="tsb-probe-row tsb-probe-head">
            <span>TS 类型</span>
            <span>示例值</span>
            <span>运行时 typeof</span>
          </div>
          {PROBE.map((p) => {
            const r = probeRan ? runTypeof(p.run) : null
            return (
              <div className={'tsb-probe-row' + (p.trap ? ' tsb-trap' : '')} key={p.id}>
                <span className="tsb-probe-ts">
                  {p.ts}
                  {p.trap && <em className="tsb-trap-tag">⚠️ 陷阱</em>}
                </span>
                <span className="tsb-probe-val"><code>{p.value}</code></span>
                <span className="tsb-probe-type">
                  {r ? (
                    <code className={p.trap ? 'tsb-type-bad' : 'tsb-type-ok'}>
                      {p.trap ? '⚠️ ' : '✅ '}typeof → "{r.text}"
                    </code>
                  ) : (
                    <span className="tsb-type-pending">点上方运行…</span>
                  )}
                </span>
                {r && <p className="tsb-probe-note">💡 {p.note}</p>}
              </div>
            )
          })}
        </div>
        {!probeRan && (
          <p className="tsb-hint">
            点「运行」，对上面每个真实值执行 <code>typeof</code>。重点看两行<b>陷阱</b>：
            <code>typeof null</code> 竟然是 <code>"object"</code>，<code>typeof NaN</code> 是 <code>"number"</code>。
          </p>
        )}
      </section>

      {/* ---------- ② 特殊类型的运行时足迹 ---------- */}
      <section className="tsb-section">
        <div className="tsb-sec-head">
          <h3>👣 特殊类型的运行时足迹（真跑代码）</h3>
        </div>
        <p className="tsb-hint tsb-hint-left">
          <code>void</code> / <code>never</code> / <code>any</code> / <code>unknown</code> 没有对应的 typeof 结果，
          它们是编译期的概念。逐个点「运行」，看它们落到运行时到底是什么样子。
        </p>
        <div className="tsb-special">
          {SPECIAL_RUN.map((s) => {
            const r = special[s.id]
            return (
              <div className="tsb-sp-card" key={s.id}>
                <div className="tsb-sp-head">
                  <span className="tsb-sp-badge">{s.ts}</span>
                  <span className="tsb-sp-title">{s.title}</span>
                </div>
                <pre className="code tsb-code">{s.decl}</pre>
                <div className="btn-row tsb-sp-btn">
                  <button className="ghost" onClick={() => runOne(s)}>▶ 运行这段</button>
                  <span className="tsb-sp-expect">预期：{s.expect}</span>
                </div>
                {r && (
                  <div className={'tsb-sp-result ' + (r.threw ? 'tsb-sp-threw' : 'tsb-sp-ok')}>
                    {r.threw ? (
                      <><b>💥 抛错：</b><code>{r.text}</code></>
                    ) : (
                      <><b>▶ 结果：</b><code>{r.text}</code><span className="tsb-sp-kind">typeof → "{r.kind}"</span></>
                    )}
                  </div>
                )}
                <p className="tsb-tip">💡 {s.note}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
