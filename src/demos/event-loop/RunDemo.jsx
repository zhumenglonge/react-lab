import { useEffect, useMemo, useState } from 'react'
import { SNIPPETS, KIND_LABEL } from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：Event Loop 逐帧播放
 * ---------------------------------------------------------
 * 三段经典代码，逐帧还原浏览器事件循环的真实顺序：
 *   同步阶段（调用栈）→ 清空全部微任务 → 取一个宏任务 →（回到清空微任务）
 * 每一帧都显示：当前打印、微任务/宏任务两条队列的实时存量、以及"为什么排在这"。
 * ========================================================= */

export default function RunDemo() {
  const [snippetId, setSnippetId] = useState(SNIPPETS[0].id)
  const [frame, setFrame] = useState(0) // 已播放到第几帧（0=还没开始）
  const [playing, setPlaying] = useState(false)

  const snippet = useMemo(
    () => SNIPPETS.find((s) => s.id === snippetId),
    [snippetId],
  )
  const steps = snippet.steps
  const total = steps.length

  // 自动逐帧播放：每 1100ms 前进一帧；两个 setState 都在异步回调里，播到最后一帧自动停
  useEffect(() => {
    if (!playing || frame >= total) return undefined
    const t = setTimeout(() => {
      const nf = Math.min(total, frame + 1)
      setFrame(nf)
      if (nf >= total) setPlaying(false)
    }, 1100)
    return () => clearTimeout(t)
  }, [playing, frame, total])

  const pick = (id) => { setSnippetId(id); setFrame(0); setPlaying(false) }
  const reset = () => { setFrame(0); setPlaying(false) }
  const next = () => { setPlaying(false); setFrame((f) => Math.min(total, f + 1)) }
  const prev = () => { setPlaying(false); setFrame((f) => Math.max(0, f - 1)) }

  const done = frame >= total
  const current = frame > 0 ? steps[frame - 1] : null
  const printed = steps.slice(0, frame)

  return (
    <div className="demo-wrap el-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 事件循环逐帧播放</h2>
        <p className="demo-sub">
          别背顺序，<b>一帧一帧看它怎么流转</b>：同步代码先进调用栈，跑完后
          <b>一次性清空所有微任务</b>，这才轮到<b>一个宏任务</b>——如此循环。
          选一段代码，点「▶ 播放」或「下一步」，看输出、微任务队列、宏任务队列同时变化。
        </p>
      </div>

      {/* ① 代码选择 */}
      <section className="el-card">
        <div className="el-card-head">
          <span className="el-card-title">🎬 选一段经典题</span>
          <span className="el-card-src">shared.js · SNIPPETS</span>
        </div>
        <div className="el-picks">
          {SNIPPETS.map((s) => (
            <button
              key={s.id}
              className={s.id === snippetId ? 'el-pick active' : 'el-pick'}
              onClick={() => pick(s.id)}
            >
              {s.tab}
            </button>
          ))}
        </div>
        <pre className="el-code">{snippet.code}</pre>
        <p className="el-hint">💡 {snippet.hint}</p>
      </section>

      {/* ② 播放器 */}
      <section className="el-card">
        <div className="el-card-head">
          <span className="el-card-title">▶️ 逐帧执行 · 第 {frame} / {total} 帧</span>
          <div className="el-controls">
            <button className="el-btn" onClick={reset}>⏮ 重置</button>
            <button className="el-btn" onClick={prev} disabled={frame === 0}>◀ 上一步</button>
            <button className="el-btn el-btn-play" onClick={() => setPlaying((p) => (done ? false : !p))} disabled={done}>
              {playing ? '⏸ 暂停' : '▶ 播放'}
            </button>
            <button className="el-btn" onClick={next} disabled={done}>下一步 ▶</button>
          </div>
        </div>

        {/* 阶段进度条 */}
        <div className="el-phases">
          {['① 同步（调用栈）', '② 清空微任务', '③ 取宏任务'].map((label, i) => {
            const phaseKey = ['sync', 'micro', 'macro'][i]
            const cur = current?.kind
            const order = { sync: 0, micro: 1, macro: 2 }
            const active = cur && order[cur] === i
            const passed = cur ? order[cur] > i : false
            return (
              <span
                key={label}
                className={
                  'el-phase' +
                  (active ? ' el-phase-active' : '') +
                  (passed ? ' el-phase-passed' : '')
                }
                data-kind={phaseKey}
              >
                {label}
              </span>
            )
          })}
        </div>

        {frame === 0 && (
          <p className="el-empty">
            还没开始。点 <b>▶ 播放</b> 让它自己一帧帧走，或点 <b>下一步 ▶</b> 手动推进。
            每一帧下方会同步显示<b>微任务 / 宏任务</b>两条队列的实时存量。
          </p>
        )}

        {current && (
          <div className="el-stage">
            {/* 左：console 输出 */}
            <div className="el-col">
              <p className="el-col-title">🖥️ console 输出（按顺序）</p>
              <div className="el-console">
                {printed.map((s, i) => (
                  <div
                    key={i}
                    className={'el-line' + (i === printed.length - 1 ? ' el-line-now' : '')}
                  >
                    <span className={`el-badge el-badge-${s.kind}`}>{KIND_LABEL[s.kind]}</span>
                    <span className="el-line-text">{s.out}</span>
                  </div>
                ))}
              </div>
              <div className="el-why">
                <span className={`el-badge el-badge-${current.kind}`}>{KIND_LABEL[current.kind]}</span>
                <span>{current.why}</span>
              </div>
            </div>

            {/* 右：两条队列 */}
            <div className="el-col">
              <p className="el-col-title">🟦 微任务队列 · 还剩 {current.micro.length}</p>
              <div className="el-queue el-queue-micro">
                {current.micro.length === 0
                  ? <span className="el-q-empty">（空）</span>
                  : current.micro.map((m) => <span key={m} className="el-q-chip">{m}</span>)}
              </div>

              <p className="el-col-title">🟨 宏任务队列 · 还剩 {current.macro.length}</p>
              <div className="el-queue el-queue-macro">
                {current.macro.length === 0
                  ? <span className="el-q-empty">（空）</span>
                  : current.macro.map((m) => <span key={m} className="el-q-chip">{m}</span>)}
              </div>
            </div>
          </div>
        )}

        {done && (
          <p className="el-final">
            ✅ 播完。最终输出顺序：
            <code>{steps.map((s) => s.out).join(' → ')}</code>
          </p>
        )}
      </section>

      {/* ③ 规则速记 */}
      <section className="el-card">
        <div className="el-card-head">
          <span className="el-card-title">📌 事件循环三条铁律</span>
        </div>
        <ul className="el-list">
          <li>先执行<b>全部同步代码</b>（调用栈），异步回调只是"入队"，不在这一轮跑。</li>
          <li>同步栈一清空，就<b>一口气清空整条微任务队列</b>（哪怕过程中又冒出新微任务，也一并处理完）。</li>
          <li>微任务空了，才从宏任务队列<b>取一个</b>执行；取完<b>再回去清微任务</b>——如此循环。<b>一个宏任务 : 一整轮微任务</b>。</li>
        </ul>
      </section>
    </div>
  )
}
