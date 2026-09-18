import { useEffect, useRef, useState } from 'react'
import { TOTAL_UNITS, SLICE_SIZE, TICK_MS } from './shared.js'

/* =========================================================
 * ⏱️ 可中断渲染：Stack Reconciler vs Fiber 时间切片，当场对比
 * ---------------------------------------------------------
 * 面试核心追问「Fiber 到底解决了什么问题」——答案是「渲染不可中断导致的卡顿」。
 * 这里跑一个大渲染任务（TOTAL_UNITS 个工作单元），你可以在渲染途中点「模拟用户输入」：
 *   - Stack 模式：同步递归、独占主线程，输入只能干等到渲染全部结束（阻塞、掉帧）
 *   - Fiber 模式：每 SLICE_SIZE 个单元就在切片边界 shouldYield() 让出，高优先级输入立刻插队被响应
 * 两者用的是同一套调度循环，唯一差别就是「要不要在切片边界让出」——这正是 Fiber 的本质。
 * ========================================================= */

export default function InterruptDemo() {
  const [mode, setMode] = useState('stack')
  const [status, setStatus] = useState('idle') // idle | running | done
  const [rendered, setRendered] = useState(0)
  const [pendingInput, setPendingInput] = useState(0)
  const [events, setEvents] = useState([])

  // 循环里读写的可变量都放 ref，避免闭包读到旧值；显示值才用 state
  const timerRef = useRef(null)
  const renderedRef = useRef(0)
  const urgentRef = useRef(0)
  const seqRef = useRef(0)
  const modeRef = useRef('stack')
  const statusRef = useRef('idle')

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const pushEvent = (text, tone) => {
    seqRef.current += 1
    const id = seqRef.current
    setEvents((e) => [...e, { id, text, tone }])
  }

  const finish = () => {
    statusRef.current = 'done'
    setStatus('done')
    pushEvent(
      modeRef.current === 'stack'
        ? '🏁 渲染结束：Stack 一口气跑到底，中途完全不理会用户输入'
        : '🏁 渲染结束：Fiber 分片跑完，全程保持了可响应',
      'done',
    )
  }

  const step = () => {
    // Fiber：切片边界优先响应高优先级输入（插队）
    if (modeRef.current === 'fiber' && urgentRef.current > 0) {
      urgentRef.current -= 1
      setPendingInput(urgentRef.current)
      pushEvent('⚡ 到达切片边界 shouldYield() → 让出主线程，立刻响应用户输入（高优先级插队）', 'urgent')
      timerRef.current = setTimeout(step, TICK_MS)
      return
    }

    const remain = TOTAL_UNITS - renderedRef.current
    if (remain <= 0) {
      if (urgentRef.current > 0) {
        const n = urgentRef.current
        urgentRef.current = 0
        setPendingInput(0)
        pushEvent(
          modeRef.current === 'stack'
            ? `⌛ 渲染全部结束，才终于轮到处理被阻塞的 ${n} 次输入 —— 用户已经感觉「卡了一下」`
            : `✅ 渲染完成，处理剩余的 ${n} 次输入`,
          modeRef.current === 'stack' ? 'late' : 'slice',
        )
      }
      finish()
      return
    }

    const n = Math.min(SLICE_SIZE, remain)
    renderedRef.current += n
    setRendered(renderedRef.current)
    pushEvent(
      modeRef.current === 'stack'
        ? `🧱 同步递归渲染 ${renderedRef.current}/${TOTAL_UNITS}：主线程被独占，用户输入只能排队干等（无法插队）`
        : `🧩 时间切片渲染 ${renderedRef.current}/${TOTAL_UNITS}：跑完这一片就让出主线程，浏览器可绘制 / 响应输入`,
      modeRef.current === 'stack' ? 'block' : 'slice',
    )
    timerRef.current = setTimeout(step, TICK_MS)
  }

  const clearAll = () => {
    clearTimeout(timerRef.current)
    renderedRef.current = 0
    urgentRef.current = 0
    seqRef.current = 0
    statusRef.current = 'idle'
    setRendered(0)
    setPendingInput(0)
    setEvents([])
    setStatus('idle')
  }

  const start = () => {
    clearAll()
    statusRef.current = 'running'
    setStatus('running')
    pushEvent(
      modeRef.current === 'stack'
        ? `▶ 开始：Stack Reconciler 同步渲染一个大列表（${TOTAL_UNITS} 个单元，不可中断）`
        : `▶ 开始：Fiber 并发渲染一个大列表（${TOTAL_UNITS} 个单元，每 ${SLICE_SIZE} 个一片）`,
      'start',
    )
    timerRef.current = setTimeout(step, TICK_MS)
  }

  const injectInput = () => {
    urgentRef.current += 1
    setPendingInput((u) => u + 1)
    pushEvent('🔴 用户点击 / 输入（高优先级，期望立刻得到响应）', 'user')
  }

  const changeMode = (m) => {
    if (statusRef.current === 'running' || m === modeRef.current) return
    modeRef.current = m
    setMode(m)
    clearAll()
  }

  const running = status === 'running'
  const pct = Math.round((rendered / TOTAL_UNITS) * 100)
  const blocked = mode === 'stack' && running && pendingInput > 0

  return (
    <div className="demo-wrap fib-root">
      <div className="demo-header">
        <h2>⏱️ 可中断渲染 · 为什么 Fiber 不卡</h2>
        <p className="demo-sub">
          选一种架构点 <b>▶ 开始渲染</b>，然后在渲染途中多点几次 <b>🔴 模拟用户输入</b>，
          观察它<b>什么时候才被响应</b>。同样的调度循环，唯一差别就是「切片边界要不要让出主线程」。
        </p>
      </div>

      {/* 架构选择 */}
      <div className="fib-modes">
        <button
          className={'fib-mode' + (mode === 'stack' ? ' fib-mode-on fib-mode-stack' : '')}
          onClick={() => changeMode('stack')}
          disabled={running}
        >
          <b>🧱 Stack Reconciler（旧 · React 15-）</b>
          <span>同步递归，一旦开始就停不下来，主线程被独占 → 大任务期间掉帧、点不动</span>
        </button>
        <button
          className={'fib-mode' + (mode === 'fiber' ? ' fib-mode-on fib-mode-fiber' : '')}
          onClick={() => changeMode('fiber')}
          disabled={running}
        >
          <b>🧩 Fiber（新 · React 16+ 并发）</b>
          <span>把渲染拆成时间切片，每片之间 shouldYield() 让出 → 高优先级输入可插队</span>
        </button>
      </div>

      <div className="demo-grid fib-grid">
        {/* 左：控制台 + 主线程进度 */}
        <div className="demo-box">
          <h4>主线程时间线</h4>
          <div className="btn-row" style={{ justifyContent: 'flex-start' }}>
            <button className="fib-primary" onClick={start} disabled={running}>
              ▶ 开始渲染
            </button>
            <button className="fib-danger" onClick={injectInput} disabled={!running}>
              🔴 模拟用户输入
            </button>
            <button className="ghost" onClick={clearAll} disabled={running}>↺ 重置</button>
          </div>

          {/* 单元方块进度 */}
          <div className="fib-units">
            {Array.from({ length: TOTAL_UNITS }).map((_, i) => {
              let cls = 'fib-unit'
              if (i < rendered) cls += mode === 'stack' ? ' fib-unit-block' : ' fib-unit-slice'
              // 切片边界（每 SLICE_SIZE 个）在 fiber 模式下标记「可让出」
              if (mode === 'fiber' && i > 0 && i % SLICE_SIZE === 0) cls += ' fib-unit-yield'
              return <span key={i} className={cls} />
            })}
          </div>

          <div className="fib-meter">
            <div className="fib-meter-bar">
              <div
                className={'fib-meter-fill ' + (mode === 'stack' ? 'fib-meter-stack' : 'fib-meter-fiber')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="fib-meter-txt">渲染进度 {rendered}/{TOTAL_UNITS}（{pct}%）</span>
          </div>

          <div className={'fib-status' + (blocked ? ' fib-status-blocked' : '')}>
            {blocked
              ? `⚠️ 主线程被渲染独占，${pendingInput} 次用户输入被挂起，界面卡顿、点不动…`
              : pendingInput > 0 && running
                ? `⏳ 有 ${pendingInput} 次输入等待，将在下一个切片边界被响应`
                : running
                  ? mode === 'stack'
                    ? '🧱 同步渲染中，无法中断'
                    : '🧩 分片渲染中，随时可让出'
                  : status === 'done'
                    ? '✅ 本轮结束，看看右侧时间线里输入是被「立刻响应」还是「最后才补上」'
                    : '👆 选择架构后点「开始渲染」'}
          </div>
        </div>

        {/* 右：事件时间线 */}
        <div className="demo-box">
          <h4>执行时间线（按发生顺序）</h4>
          <div className="fib-log">
            {events.length === 0 ? (
              <p className="fib-note">这里会实时打印每一步：渲染切片、用户输入、以及输入「何时」被响应。</p>
            ) : (
              events.map((e) => (
                <div key={e.id} className={'fib-log-item fib-log-' + e.tone}>
                  <span className="fib-log-seq">#{e.id}</span>
                  <span>{e.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="tip">
        💡 对比结论：<b>Stack</b> 里用户输入永远排在渲染后面（红色事件在时间线最末才出现「⌛ 被阻塞」）；
        <b>Fiber</b> 里输入能在下一个切片边界<b>插队</b>先被处理（「⚡ 立刻响应」）。
        这就是 <code>requestIdleCallback</code> / 时间切片 + <b>Lanes 优先级调度</b>要解决的问题——
        把「同步、不可打断」的渲染，变成「异步可中断、按优先级插队」的渲染，页面才不卡。
      </p>
    </div>
  )
}
