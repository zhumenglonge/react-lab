import { useState } from 'react'
import { MOVE_METHODS, DEFAULT_ARR, runMethod, traceSwap, fmtArr, fmtVal } from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：把 0 移到末尾，三种写法并排真跑 + 双指针逐快照
 * ---------------------------------------------------------
 * 输入可改（默认题目数组），点运行看三种写法的真实结果与"操作次数"；
 * 下方双指针动画把 slow/fast 每步怎么走、什么时候交换当场放出来，
 * 这就是面试里"原地、最少操作、保持相对顺序"三条要求的实证。
 * ========================================================= */

function parseInput(text) {
  return text
    .split(/[,，\s]+/)
    .filter(Boolean)
    .map((t) => Number(t))
    .filter((n) => !Number.isNaN(n))
}

export default function RunDemo() {
  const [input, setInput] = useState(fmtArr(DEFAULT_ARR).slice(1, -1))
  const [results, setResults] = useState(null)
  const [steps, setSteps] = useState(null)
  const [cursor, setCursor] = useState(0)

  const run = () => {
    const arr = parseInput(input)
    if (!arr.length) {
      setResults(null)
      setSteps(null)
      return
    }
    setResults({ arr, rows: MOVE_METHODS.map((m) => ({ ...m, out: runMethod(m.key, arr) })) })
    setSteps(traceSwap(arr))
    setCursor(0)
  }

  const cur = steps ? steps[Math.min(cursor, steps.length - 1)] : null

  return (
    <div className="mz-root">
      <div className="demo-header">
        <h2>⚔️ 把 0 移到末尾：三种写法 + 双指针怎么走</h2>
        <p className="demo-sub">
          面试原题<b>「数组 [1,2,0,0,4,5,6]，把 0 都移到最后，非零保持相对顺序，尽量原地、少操作」</b>。
          改输入点运行，看三种写法的<b>真实结果和操作次数</b>，再逐帧看双指针。
        </p>
      </div>

      <div className="mz-card">
        <div className="mz-toolbar">
          <label className="mz-field">
            数组
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="1,2,0,0,4,5,6" />
          </label>
          <button className="mz-primary" onClick={run}>▶ 跑一遍</button>
        </div>

        {results ? (
          <>
            <p className="mz-input-line">
              原始数组 <code>{fmtArr(results.arr)}</code>（{results.arr.length} 项，
              {results.arr.filter((v) => v === 0).length} 个 0）
            </p>
            <div className="mz-results">
              {results.rows.map((r) => (
                <div key={r.key} className="mz-row">
                  <div className="mz-row-head">
                    <span className="mz-row-name">{r.name}</span>
                    <code className="mz-row-src">{r.src}</code>
                    <span className="mz-chip">操作量：<b>{r.out.ops}</b> {r.out.opsKind}</span>
                  </div>
                  <code className="mz-row-out">{fmtArr(r.out.result)}</code>
                  <p className="mz-row-note">{r.note}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mz-empty">还没跑 —— 点上面按钮，三种写法结果并排展开。</p>
        )}
      </div>

      {steps && (
        <div className="mz-card">
          <div className="mz-card-head">
            <span className="mz-card-title">🎬 双指针（交换版）逐帧：slow 管放置、fast 管探路</span>
            <code className="mz-card-src">原地 · 单趟 · 保持相对顺序</code>
          </div>
          <div className="mz-player">
            <button onClick={() => setCursor((c) => Math.max(0, c - 1))}>← 上一步</button>
            <span className="mz-step-label">
              第 {Math.min(cursor, steps.length - 1)} / {steps.length - 1} 步
            </span>
            <button onClick={() => setCursor((c) => Math.min(steps.length - 1, c + 1))}>下一步 →</button>
          </div>

          <div className="mz-cells">
            {cur.arr.map((v, i) => (
              <div
                key={i}
                className={[
                  'mz-cell',
                  v === 0 ? 'mz-cell-zero' : 'mz-cell-nonzero',
                  i === cur.slow ? 'mz-cell-slow' : '',
                  i === cur.fast ? 'mz-cell-fast' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="mz-cell-idx">{i}</span>
                <span className="mz-cell-val">{fmtVal(v)}</span>
                <span className="mz-cell-marks">
                  {i === cur.slow && <em className="mz-mark mz-mark-slow">slow</em>}
                  {i === cur.fast && <em className="mz-mark mz-mark-fast">fast</em>}
                </span>
              </div>
            ))}
          </div>
          <p className={['mz-action', cur.moved ? 'mz-action-move' : ''].filter(Boolean).join(' ')}>
            {cur.action}
          </p>
        </div>
      )}
    </div>
  )
}
