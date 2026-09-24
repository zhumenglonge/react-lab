import { useState } from 'react'
import { CASES, safeRun } from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：同一个 bug，TS 编译期拦 vs JS 运行时见
 * ---------------------------------------------------------
 * 每张卡片左右并排：带类型的 TS 源码（tsc --strict 当场标红）
 * 和类型擦除后的 JS。点「运行」真执行 JS 版本——你会看到
 * 它要么运行时才炸、要么安静地算出离谱结果，而这正是
 * TS 在你敲下那行代码时就拦下的东西。
 * ========================================================= */

export default function RunDemo() {
  const [results, setResults] = useState(null)

  const runAll = () => {
    const next = {}
    for (const c of CASES) next[c.id] = safeRun(c.runJs)
    setResults(next)
  }

  return (
    <div className="demo-wrap tsj-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 同一个 bug，TS 拦在编译期，JS 漏到运行时</h2>
        <p className="demo-sub">
          TS 没法在浏览器里跑——它编译后就是普通 JS（<b>类型被擦除</b>）。
          所以这里的玩法是：左边看 <code>tsc --strict</code> 的<b>编译期报错</b>，
          右边<b>真跑</b>擦除类型后的 JS，对比「提前拦住」和「当场炸 / 静默算错」。
        </p>
      </div>

      <div className="btn-row tsj-toolbar">
        {!results ? (
          <button className="tsj-primary" onClick={runAll}>
            ▶ 运行全部 JS 版本
          </button>
        ) : (
          <button className="ghost" onClick={() => setResults(null)}>
            ↺ 清空结果
          </button>
        )}
      </div>

      {!results ? (
        <p className="tsj-note">
          点「运行」，下方 4 个用例会真执行<b>类型擦除后的 JS</b>，
          和左边 TS 的编译期报错对照着看。
        </p>
      ) : (
        <div className="tsj-list">
          {CASES.map((c) => {
            const r = results[c.id]
            return (
              <div className="tsj-card" key={c.id}>
                <div className="tsj-card-head">
                  <span className="tsj-card-title">{c.title}</span>
                </div>

                <div className="tsj-duel">
                  <div className="tsj-side">
                    <div className="tsj-side-tag tsj-side-ts">TypeScript 源码</div>
                    <pre className="code tsj-code">{c.ts}</pre>
                    {c.tsError ? (
                      <div className="tsj-terror">
                        <b>❌ tsc --strict 编译期报错：</b>
                        <code>{c.tsError}</code>
                        <span className="tsj-terror-sub">代码根本到不了运行时</span>
                      </div>
                    ) : (
                      <div className="tsj-tok">
                        <b>✅ 编译通过</b>
                        <span className="tsj-terror-sub">但类型标注全部被擦除 ↓</span>
                      </div>
                    )}
                  </div>

                  <div className="tsj-side">
                    <div className="tsj-side-tag tsj-side-js">擦除类型后的 JS（真跑这个）</div>
                    <pre className="code tsj-code">{c.js}</pre>
                    <div className={'tsj-run-result ' + (r.threw ? 'tsj-run-threw' : 'tsj-run-ok')}>
                      {r.threw ? (
                        <>
                          <b>💥 运行时才炸：</b>
                          <code>{r.text}</code>
                        </>
                      ) : (
                        <>
                          <b>{'▶ 运行结果：'}</b>
                          <code>{r.text}</code>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <p className="tsj-tip">💡 {c.note}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
