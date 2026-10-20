import { useEffect, useMemo, useRef, useState } from 'react'
import { debounce, throttle, throttleTimestamp, RIDER_SUMMARY } from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：防抖 & 节流，同一条事件流并排真跑
 * ---------------------------------------------------------
 * ① 触发源：输入框每敲一个字 / 自动连发 10 个事件（每 100ms 一个）
 * ② 两条时间线当场记录：防抖=一直 pending、安静后才 run；
 *    节流=首次立即 run、区间内 blocked、区间末补 run-tail
 * ③ 时间戳版节流对照：无尾炮，最后一个事件会被丢掉
 * ========================================================= */

// 事件类型 → 展示文案（带文字冗余，不只靠颜色区分）
const TYPE_LABEL = {
  pending: '⏳ 待重置',
  run: '✅ 执行',
  'run-tail': '✅ 补尾炮',
  blocked: '🚫 被拦截',
}

export default function RunDemo() {
  const [wait, setWait] = useState(800)
  const [text, setText] = useState('')
  const [triggerCount, setTriggerCount] = useState(0)
  const [dbtLogs, setDbtLogs] = useState([])
  const [thtLogs, setThtLogs] = useState([])
  const [tsFired, setTsFired] = useState(0)
  const [autoFiring, setAutoFiring] = useState(false)
  const timerRef = useRef(null) // 只在事件回调里用，不在渲染期读 current

  // 记录事件：存绝对时间戳，渲染时再换算成 +Xms（不碰 ref，保持纯函数）
  const record = useMemo(() => (kind, event) => {
    if (kind === 'dbt') setDbtLogs((list) => [...list, event])
    else setThtLogs((list) => [...list, event])
  }, [])

  // 真正要执行的"昂贵活儿"这里只是空函数：重点观察它何时被调用
  const debounced = useMemo(() => debounce(() => {}, wait, (e) => record('dbt', e)), [wait, record])
  const throttled = useMemo(() => throttle(() => {}, wait, (e) => record('tht', e)), [wait, record])

  // 实例换代/组件卸载时取消待定的一次——就是"卸载要 cleanup"的现场演示
  useEffect(() => () => debounced.cancel(), [debounced])
  useEffect(() => () => throttled.cancel(), [throttled])

  // 时间戳版节流：无尾炮，用来和定时器版对比"最后一个事件去哪了"
  const tsThrottled = useMemo(
    () => throttleTimestamp(() => setTsFired((n) => n + 1), wait),
    [wait],
  )

  const fire = (value) => {
    setTriggerCount((n) => n + 1)
    debounced(value)
    throttled(value)
    tsThrottled(value)
  }

  const reset = () => {
    clearTimeout(timerRef.current)
    debounced.cancel() // 取消待定的一次，对齐"卸载要 cleanup"的面试点
    throttled.cancel()
    setAutoFiring(false)
    setTriggerCount(0)
    setDbtLogs([])
    setThtLogs([])
    setTsFired(0)
    setText('')
  }

  const autoFire = () => {
    reset()
    setAutoFiring(true)
    let i = 1
    const tick = () => {
      fire(`事件${i}`)
      if (i >= 10) {
        setAutoFiring(false)
        return
      }
      i += 1
      timerRef.current = setTimeout(tick, 100)
    }
    tick()
  }

  const runCount = (logs) => logs.filter((l) => l.type === 'run' || l.type === 'run-tail').length
  const lastRun = (logs) => [...logs].reverse().find((l) => l.type === 'run' || l.type === 'run-tail')
  // 时间线原点：两条时间线里最早的事件时刻
  const origin = Math.min(dbtLogs[0]?.at ?? Infinity, thtLogs[0]?.at ?? Infinity)
  const rel = (l) => l.at - origin

  return (
    <div className="demo-wrap dbt-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 同一条事件流，两种拦截术</h2>
        <p className="demo-sub">
          <b>防抖</b>：{RIDER_SUMMARY.debounce}；<b>节流</b>：{RIDER_SUMMARY.throttle}。
          下面触发源是同一个，两条时间线<b>真跑</b>记录，看谁在等安静、谁在按班次。
        </p>
      </div>

      {/* ① 控制面板 */}
      <section className="dbt-card">
        <div className="dbt-card-head">
          <span className="dbt-card-title">🎛️ 触发源与参数</span>
          <span className="dbt-card-src">shared.js · debounce / throttle</span>
        </div>
        <div className="dbt-toolbar">
          <span className="dbt-field">
            wait
            <input
              type="number"
              min={200}
              max={3000}
              step={100}
              value={wait}
              onChange={(e) => { setWait(Number(e.target.value) || 800); reset() }}
            />
            ms
          </span>
          <button className="dbt-btn" onClick={autoFire} disabled={autoFiring}>
            {autoFiring ? '连发中…' : '🔫 自动连发 10 个事件（每 100ms）'}
          </button>
          <button className="dbt-btn dbt-btn-danger" onClick={reset}>♻️ 重置</button>
          <span className="dbt-chip">已触发 <b>{triggerCount}</b> 次</span>
        </div>
        <p className="dbt-empty">
          ℹ️ 页面在后台标签时，浏览器会把定时器钉到 ≥1s，连发间隔会被拉长的；
          保持当前标签前台可见再点连发，时间线才是标称的 100ms。
        </p>
        <div className="dbt-field dbt-input-row">
          手动输入（每敲一个字算一次事件）
          <input
            type="text"
            value={text}
            placeholder="随便打字试试…"
            onChange={(e) => { setText(e.target.value); fire(e.target.value) }}
          />
        </div>
      </section>

      {/* ② 防抖 vs 节流 并排时间线 */}
      <section className="dbt-duel">
        <div className="dbt-duel-side dbt-duel-debounce">
          <p className="dbt-duel-title">⏱️ 防抖 debounce · 执行 {runCount(dbtLogs)} 次</p>
          <div className="dbt-logs">
            {dbtLogs.length === 0 && <p className="dbt-empty">还没触发。触发中会一直显示「⏳ 待重置」，安静 {wait}ms 后才出现唯一一次「✅ 执行」。</p>}
            {dbtLogs.map((l, i) => (
              <div className="dbt-event" key={i}>
                <span className={`dbt-tag dbt-tag-${l.type}`}>{TYPE_LABEL[l.type]}</span>
                <span>+{rel(l)}ms</span>
                {l.type === 'run' && <span>距最后一次触发已等 <b>{l.delay}ms</b>（=wait）</span>}
                <span className="dbt-arg">参数：{String(l.args[0])}</span>
              </div>
            ))}
          </div>
          <p className="dbt-tip">最后一发执行于 {lastRun(dbtLogs) ? `+${rel(lastRun(dbtLogs))}ms` : '-'}，参数是<b>最后</b>一次触发值</p>
        </div>
        <div className="dbt-duel-side dbt-duel-throttle">
          <p className="dbt-duel-title">🚌 节流 throttle · 执行 {runCount(thtLogs)} 次</p>
          <div className="dbt-logs">
            {thtLogs.length === 0 && <p className="dbt-empty">还没触发。第一次立即「✅ 执行」，之后 {wait}ms 内的触发全被「🚫 被拦截」，区间末用最后参数「✅ 补尾炮」。</p>}
            {thtLogs.map((l, i) => (
              <div className="dbt-event" key={i}>
                <span className={`dbt-tag dbt-tag-${l.type}`}>{TYPE_LABEL[l.type]}</span>
                <span>+{rel(l)}ms</span>
                <span className="dbt-arg">参数：{String(l.args[0])}</span>
              </div>
            ))}
          </div>
          <p className="dbt-tip">尾炮保证最后一个参数（如「事件10」）<b>不被弄丢</b>——定时器版特有</p>
        </div>
      </section>

      {/* ③ 时间戳版节流对照 */}
      <section className="dbt-card">
        <div className="dbt-card-head">
          <span className="dbt-card-title">🧪 追问实验：时间戳版节流（无尾炮）</span>
          <span className="dbt-card-src">shared.js · throttleTimestamp</span>
        </div>
        <p className="dbt-empty">
          同一条事件流里，定时器版节流会「补尾炮」保证最后一个参数被执行；
          时间戳版只比较 <code>Date.now() - last &gt;= wait</code>，没有 setTimeout——
          所以<b>最后一个事件可能被直接丢掉</b>（要等下一个事件到达才可能补上）。
          连发 10 个事件后：定时器版执行 <b>{runCount(thtLogs)}</b> 次 vs 时间戳版执行 <b>{tsFired}</b> 次，
          差的就是那条尾炮。
        </p>
      </section>

      {/* ④ 手写实现对照 */}
      <section className="dbt-card">
        <div className="dbt-card-head">
          <span className="dbt-card-title">✍️ 手写模板（就是刚才真跑的代码）</span>
          <span className="dbt-card-src">与「闭包实战」主题同骨架：timer 关在闭包里</span>
        </div>
        <pre className="dbt-code">{`// 防抖：清旧定时器，重新倒计时；到点执行"最后一次"的参数
function debounce(fn, wait) {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), wait)
  }
}

// 节流（定时器版）：区间内首次立即执行，末尾补一发尾炮
function throttle(fn, wait) {
  let timer = null, lastArgs = null
  return function (...args) {
    lastArgs = args
    if (timer) return          // 本区间已放行过
    fn.apply(this, args)       // 首次立即执行
    timer = setTimeout(() => {
      timer = null
      if (lastArgs) { fn.apply(this, lastArgs); lastArgs = null }
    }, wait)
  }
}

// 节流（时间戳版）：无定时器、无尾炮，最后一次事件可能被丢
function throttleTs(fn, wait) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= wait) { last = now; fn.apply(this, args) }
  }
}`}</pre>
        <p className="dbt-tip">
          💡 三个实现里 <code>timer</code> / <code>lastArgs</code> / <code>last</code> 都活在<b>闭包</b>里——
          和「闭包实战」主题的累加器是同一个骨架：外层放私有变量 → 内层读写 → 返回内层。
        </p>
      </section>
    </div>
  )
}
