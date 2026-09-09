import { Fragment, useEffect, useLayoutEffect, useState } from 'react'
import { blockSync } from './shared.js'

/* =========================================================
 * 场景 1：执行时机 —— 谁在浏览器"绘制之前"跑？
 *   useLayoutEffect：DOM 更新后、浏览器 paint 之前，【同步】执行（会阻塞绘制）
 *   useEffect      ：浏览器 paint 之后，【异步】调度执行（不阻塞绘制）
 * 用一段"同步忙等"把差异放大：阻塞绘制的那一个，肉眼就能看出来。
 * ========================================================= */

const BLOCK_MS = 300

// 顶部流程图解：一次渲染提交的完整时间线
const PHASES = [
  { key: 'render', label: '① render', desc: '计算新的虚拟 DOM', tone: 'neutral' },
  { key: 'commit', label: '② commit', desc: '把变更写入真实 DOM', tone: 'neutral' },
  { key: 'layout', label: '③ useLayoutEffect', desc: '同步执行 · 阻塞绘制', tone: 'layout' },
  { key: 'paint', label: '④ 浏览器 paint', desc: '把画面绘制到屏幕', tone: 'paint' },
  { key: 'effect', label: '⑤ useEffect', desc: '异步执行 · 不阻塞绘制', tone: 'effect' },
]

function PhaseFlow() {
  return (
    <div className="uel-phases">
      {PHASES.map((p, i) => (
        <Fragment key={p.key}>
          <div className={`uel-phase uel-phase-${p.tone}`}>
            <div className="uel-phase-label">{p.label}</div>
            <div className="uel-phase-desc">{p.desc}</div>
          </div>
          {i < PHASES.length - 1 && <div className="uel-phase-arrow">→</div>}
        </Fragment>
      ))}
    </div>
  )
}

const PHASE_META = {
  idle: { icon: '🟢', text: '待命', cls: 'idle' },
  busy: { icon: '⏳', text: '处理中…', cls: 'busy' },
  done: { icon: '✅', text: '完成', cls: 'done' },
}

// 两个盒子共用的外壳（纯展示）
function BoxUI({ title, tone, phase, count, onStart, onReset, note }) {
  const meta = PHASE_META[phase]
  return (
    <div className={`demo-box uel-box uel-box-${tone}`}>
      <h4>{title}</h4>
      <div className={`uel-lamp uel-lamp-${meta.cls}`}>
        <span className="uel-lamp-icon">{meta.icon}</span>
        <span className="uel-lamp-text">{meta.text}</span>
      </div>
      <p className="uel-count">已触发 <b>{count}</b> 次</p>
      <div className="btn-row">
        <button onClick={onStart} disabled={phase === 'busy'}>
          ▶ 触发一次同步重活
        </button>
        <button className="uel-ghost" onClick={onReset}>重置</button>
      </div>
      <p className="uel-note">{note}</p>
    </div>
  )
}

// A：useEffect —— 绘制后异步执行，不阻塞
function PassiveBox() {
  const [phase, setPhase] = useState('idle')
  const [count, setCount] = useState(0)

  const start = () => {
    setPhase('busy')
    setCount((c) => c + 1)
  }

  useEffect(() => {
    if (phase !== 'busy') return
    // 走到这里时浏览器【已经 paint 过了】，用户已经看到"⏳ 处理中"
    blockSync(BLOCK_MS)
    // 演示专用：故意在 effect 内同步 setState，用"级联渲染"暴露执行时机差异
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase('done')
  }, [phase])

  return (
    <BoxUI
      title="useEffect（绘制后 · 异步）"
      tone="good"
      phase={phase}
      count={count}
      onStart={start}
      onReset={() => setPhase('idle')}
      note="点击后：立刻看到「⏳ 处理中」→ 约 300ms 后变「✅ 完成」。绘制没被阻塞，界面先响应。"
    />
  )
}

// B：useLayoutEffect —— 绘制前同步执行，会阻塞
function LayoutBox() {
  const [phase, setPhase] = useState('idle')
  const [count, setCount] = useState(0)

  const start = () => {
    setPhase('busy')
    setCount((c) => c + 1)
  }

  useLayoutEffect(() => {
    if (phase !== 'busy') return
    // DOM 已更新为 busy，但浏览器【还没 paint】
    blockSync(BLOCK_MS)   // 同步忙等，把绘制一起挡住了
    // 演示专用：故意在 paint 前同步 setState，触发"绘制前的同步重渲染"
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase('done')      // 在 paint 之前又触发一次同步渲染
  }, [phase])

  return (
    <BoxUI
      title="useLayoutEffect（绘制前 · 同步）"
      tone="warn"
      phase={phase}
      count={count}
      onStart={start}
      onReset={() => setPhase('idle')}
      note="点击后：界面卡住约 300ms，然后【直接】显示「✅ 完成」——几乎看不到「处理中」，因为绘制被推迟到了忙等之后。"
    />
  )
}

export default function TimingDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>场景 1：执行时机 —— 谁挡在浏览器绘制之前？</h3>
        <p className="desc">
          <b>useLayoutEffect</b> 在 DOM 更新后、绘制前<b>同步</b>执行（会阻塞绘制）；
          <b>useEffect</b> 在绘制后<b>异步</b>执行（不阻塞绘制）。
        </p>
      </div>

      <PhaseFlow />

      <div className="demo-grid">
        <PassiveBox />
        <LayoutBox />
      </div>

      <pre className="code">{`useEffect(() => { ... }, [deps])         // paint 之后，异步、不阻塞
useLayoutEffect(() => { ... }, [deps])   // paint 之前，同步、会阻塞

// 依赖数组、清理函数(return) 的行为两者完全一致`}</pre>

      <p className="tip">
        👉 分别点两个盒子的按钮：<b>useEffect 版</b>能看到「⏳ 处理中」闪现约 300ms 再变「✅ 完成」；
        <b>useLayoutEffect 版</b>是卡一下直接「✅ 完成」——它的同步重活挡在了绘制前面。这就是"阻塞绘制"的直观代价。
      </p>
    </div>
  )
}
