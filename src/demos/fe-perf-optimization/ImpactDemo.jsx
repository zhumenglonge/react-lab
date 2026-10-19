import { useMemo, useState } from 'react'

/* =========================================================
 * ① 首屏优化模拟器：勾手段 → 看指标怎么变（实跑对拍）
 * ---------------------------------------------------------
 * 交互：切网络场景（3G/4G/WiFi）、首次或二次访问，勾选各种优化手段，
 * 请求数 / 传输体积 / FCP / LCP 会按每个手段的“效果系数”连乘，
 * 实时给出优化前后对比条 + Core Web Vitals 评级。
 * 纯确定性计算：所有数值由当前配置算出，渲染期无 Date.now()/随机
 * （规避 react-hooks/purity）。系数是教学用的“经验量级”，非真实基准。
 * ========================================================= */

/* 未优化基线（高速 WiFi、首次访问、无任何优化）—— 教学量级 */
const BASE = { requests: 42, transferKB: 2400, fcp: 3200, lcp: 5100 }

const METRICS = [
  { key: 'requests', label: '请求数', kind: 'count' },
  { key: 'transferKB', label: '传输体积', kind: 'size' },
  { key: 'fcp', label: 'FCP · 首次内容绘制', kind: 'time' },
  { key: 'lcp', label: 'LCP · 最大内容绘制', kind: 'time' },
]

/* 网络场景：放大时间类指标（带宽越差，下载/建连越慢） */
const SCENES = [
  { key: '3g', label: '慢网 3G', factor: { requests: 1.1, transferKB: 1, fcp: 2.0, lcp: 2.5 } },
  { key: '4g', label: '普通 4G', factor: { requests: 1, transferKB: 1, fcp: 1.35, lcp: 1.5 } },
  { key: 'wifi', label: '高速 WiFi', factor: { requests: 1, transferKB: 1, fcp: 1.0, lcp: 1.0 } },
]

/* 优化手段：impact 为各指标的“效果系数”（越小越省），needsRepeat 表示仅二次访问才生效 */
const OPTS = [
  { id: 'gzip', icon: '🗜️', name: 'Gzip / Brotli 压缩', group: '网络传输', impact: { transferKB: 0.28, fcp: 0.85, lcp: 0.88 } },
  { id: 'img', icon: '🖼️', name: 'WebP 图片 + 懒加载', group: '网络传输', impact: { requests: 0.9, transferKB: 0.55, lcp: 0.82 } },
  { id: 'split', icon: '✂️', name: '路由懒加载 / 代码分割', group: '构建产物', impact: { requests: 0.7, transferKB: 0.6, fcp: 0.78, lcp: 0.8 } },
  { id: 'tree', icon: '🌲', name: 'Tree-shaking 去死代码', group: '构建产物', impact: { transferKB: 0.85 } },
  { id: 'cdn', icon: '🌐', name: 'CDN 就近分发', group: '网络传输', impact: { fcp: 0.7, lcp: 0.75 } },
  { id: 'cache', icon: '♻️', name: 'HTTP 缓存命中', group: '网络传输', impact: { requests: 0.12, transferKB: 0.18, fcp: 0.5, lcp: 0.55 }, needsRepeat: true },
  { id: 'ssr', icon: '🏗️', name: 'SSR / 骨架屏直出', group: '渲染', impact: { fcp: 0.55, lcp: 0.72 } },
  { id: 'preload', icon: '⚡', name: 'preload 关键资源', group: '网络传输', impact: { lcp: 0.85 } },
]

const GROUPS = ['网络传输', '构建产物', '渲染']

function fmtVal(metric, v) {
  if (metric.kind === 'size') return v >= 1024 ? `${(v / 1024).toFixed(2)} MB` : `${Math.round(v)} KB`
  if (metric.kind === 'count') return `${Math.round(v)} 个`
  return `${Math.round(v)} ms`
}

/* LCP 评级按 Core Web Vitals 阈值：≤2.5s 良好 / ≤4s 需改进 / >4s 差 */
function lcpVerdict(lcp) {
  if (lcp <= 2500) return { tone: 'success', label: '🟢 良好', hint: 'LCP ≤ 2.5s，达到 Core Web Vitals 良好线' }
  if (lcp <= 4000) return { tone: 'warning', label: '🟠 需改进', hint: '2.5s < LCP ≤ 4s，还能再压' }
  return { tone: 'danger', label: '🔴 较差', hint: 'LCP > 4s，首屏太慢，优先攻这块' }
}

export default function ImpactDemo() {
  const [sceneKey, setSceneKey] = useState('4g')
  const [visit, setVisit] = useState('first')
  const [checked, setChecked] = useState({ gzip: true, split: true })

  const scene = SCENES.find((s) => s.key === sceneKey)

  /* 基线（当前场景下、未加任何优化） */
  const baseline = useMemo(() => {
    const b = {}
    for (const m of METRICS) b[m.key] = BASE[m.key] * scene.factor[m.key]
    return b
  }, [scene])

  /* 生效的优化（二次访问才让缓存生效） */
  const active = OPTS.filter((o) => checked[o.id] && !(o.needsRepeat && visit === 'first'))

  /* 优化后 = 基线 × 各手段系数连乘 */
  const optimized = useMemo(() => {
    const o = { ...baseline }
    for (const m of METRICS) for (const opt of active) if (opt.impact[m.key] != null) o[m.key] *= opt.impact[m.key]
    return o
  }, [baseline, active])

  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }))
  const allOn = () => setChecked(Object.fromEntries(OPTS.map((o) => [o.id, visit === 'repeat' || !o.needsRepeat])))
  const allOff = () => setChecked({})

  const verdict = lcpVerdict(optimized.lcp)
  const lcpSaved = Math.round((1 - optimized.lcp / baseline.lcp) * 100)
  const sizeSaved = Math.round((1 - optimized.transferKB / baseline.transferKB) * 100)

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>① 首屏优化模拟器 · 勾手段，看指标怎么变</h2>
        <p className="desc">
          性能优化不是背清单，而是<b>对症下药</b>。这里把常见手段做成开关：切<b>网络场景</b>、选<b>首次/二次访问</b>，
          勾选优化手段，看 <code>请求数 / 传输体积 / FCP / LCP</code> 怎么被"连乘"压低——直观感受每个手段值多少分。
          （系数是教学经验量级，非真实基准，用来建立"谁管哪段"的直觉。）
        </p>
      </div>

      {/* 场景 & 访问模式 */}
      <div className="fp-panel">
        <div className="fp-ctrl-group">
          <span className="fp-ctrl-label">网络场景</span>
          <div className="fp-chips">
            {SCENES.map((s) => (
              <button key={s.key} className={'fp-chip' + (s.key === sceneKey ? ' on' : '')} onClick={() => setSceneKey(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="fp-ctrl-group">
          <span className="fp-ctrl-label">访问模式</span>
          <div className="fp-chips">
            <button className={'fp-chip' + (visit === 'first' ? ' on' : '')} onClick={() => setVisit('first')}>首次访问</button>
            <button className={'fp-chip' + (visit === 'repeat' ? ' on' : '')} onClick={() => setVisit('repeat')}>二次访问（可命中缓存）</button>
          </div>
        </div>
      </div>

      {/* 优化手段开关 */}
      <div className="fp-panel">
        <div className="fp-panel-head">
          <span className="fp-ctrl-label">优化手段</span>
          <div className="btn-row">
            <button className="ghost" onClick={allOn}>全开</button>
            <button className="ghost" onClick={allOff}>清零</button>
          </div>
        </div>

        {GROUPS.map((g) => (
          <div key={g} className="fp-opt-group">
            <span className="fp-opt-grouptitle">{g}</span>
            <div className="fp-opt-list">
              {OPTS.filter((o) => o.group === g).map((o) => {
                const disabled = o.needsRepeat && visit === 'first'
                const on = checked[o.id] && !disabled
                return (
                  <label key={o.id} className={'fp-opt' + (on ? ' on' : '') + (disabled ? ' disabled' : '')}>
                    <input
                      type="checkbox"
                      checked={!!checked[o.id]}
                      disabled={disabled}
                      onChange={() => toggle(o.id)}
                    />
                    <span className="fp-opt-icon">{o.icon}</span>
                    <span className="fp-opt-name">{o.name}</span>
                    <span className="fp-opt-eff">
                      {disabled ? '需二次访问' : Object.entries(o.impact).map(([k, v]) => `${METRICS.find((m) => m.key === k).label.split(' ')[0]} −${Math.round((1 - v) * 100)}%`).join(' · ')}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 前后对比条 */}
      <div className="fp-results">
        {METRICS.map((m) => {
          const before = baseline[m.key]
          const after = optimized[m.key]
          const pct = Math.max(4, (after / before) * 100)
          const saved = Math.round((1 - after / before) * 100)
          const good = m.key === 'lcp' ? after <= 2500 : m.key === 'fcp' ? after <= 1800 : null
          return (
            <div key={m.key} className="fp-metric">
              <div className="fp-metric-head">
                <span className="fp-metric-label">{m.label}</span>
                <span className="fp-metric-nums">
                  <s>{fmtVal(m, before)}</s>
                  <b>{fmtVal(m, after)}</b>
                  {saved > 0 && <em className="fp-saved">↓ {saved}%</em>}
                  {good != null && <span className={'fp-flag ' + (good ? 'ok' : 'bad')}>{good ? '✅ 达标' : '❌ 偏慢'}</span>}
                </span>
              </div>
              <div className="fp-bar fp-bar-before"><div className="fp-bar-fill" style={{ width: '100%' }} /></div>
              <div className="fp-bar fp-bar-after"><div className="fp-bar-fill" style={{ width: pct + '%' }} /></div>
            </div>
          )
        })}
      </div>

      {/* 评级卡 */}
      <div className={'fp-verdict fp-verdict-' + verdict.tone}>
        <div className="fp-verdict-badge">🏁 {verdict.label}</div>
        <p className="fp-verdict-hint">{verdict.hint}</p>
        <p className="fp-verdict-sum">
          本次共 <b>{active.length}</b> 项优化生效 → 传输体积 <b>−{sizeSaved}%</b>，LCP <b>−{lcpSaved}%</b>
          {active.length === 0 ? '（一个都没开，试试勾选手段看条子怎么缩）' : ''}
        </p>
      </div>

      <p className="tip">
        💡 面试答题的正确姿势不是罗列 30 条手段，而是<b>先定位瓶颈再开方</b>：请求多/体积大 → 攻<b>网络与构建</b>（压缩、分包、CDN、缓存）；
        白屏久 → 攻<b>渲染</b>（SSR、骨架屏、关键 CSS）；交互卡顿 → 攻<b>JS 执行</b>（防抖节流、虚拟列表、Web Worker）。
        用 <code>LCP / CLS / INP</code> 量化验证效果。
      </p>
    </div>
  )
}
