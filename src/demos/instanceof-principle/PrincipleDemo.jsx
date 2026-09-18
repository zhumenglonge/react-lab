import { useEffect, useMemo, useState } from 'react'
import { CASES, buildChain } from './shared.js'

/* =========================================================
 * 🔍 原理可视化：把 instanceof 的原型链查找「走」给你看
 * ---------------------------------------------------------
 * 核心心智模型：a instanceof B == 从 a.__proto__ 出发沿原型链往上爬，
 *   逐个问「这一环 === B.prototype 吗？」，命中就 true，爬到 null 就 false。
 * 这里用真实对象跑 buildChain，再逐帧高亮每一环，让你亲眼看到查找过程，
 * 而不是背结论。原始值没有原型链，会被第一步直接拦下返回 false。
 * ========================================================= */

export default function PrincipleDemo() {
  const [caseId, setCaseId] = useState(CASES[0].id)
  const current = CASES.find((c) => c.id === caseId) ?? CASES[0]

  // 真跑一遍原型链，得到每一步（含是否命中）
  const chain = useMemo(() => buildChain(current.left, current.Right), [current])

  // 需要播放的总帧数：每个原型一帧；若走到尽头，再加一帧展示 null
  const totalFrames = chain.primitive ? 0 : chain.steps.length + (chain.reachedNull ? 1 : 0)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  // 切用例就回到起点、停止播放
  const pick = (id) => {
    setCaseId(id)
    setStep(0)
    setPlaying(false)
  }

  const finished = step >= totalFrames
  const running = playing && !finished

  // 播放：用 setTimeout 链推进（不在 effect 体内直接 setState，避开 lint 规则）
  useEffect(() => {
    if (!playing || step >= totalFrames) return
    const t = setTimeout(() => setStep((s) => s + 1), 700)
    return () => clearTimeout(t)
  }, [playing, step, totalFrames])

  const togglePlay = () => {
    if (running) {
      setPlaying(false)
      return
    }
    if (finished) setStep(0) // 播完了再点，从头来一遍
    setPlaying(true)
  }

  const revealAll = () => {
    setPlaying(false)
    setStep(totalFrames)
  }

  const nullVisible = chain.reachedNull && step > chain.steps.length

  return (
    <div className="demo-wrap iof-root">
      <div className="demo-header">
        <h2>🔍 原理可视化 · 沿原型链一路找 B.prototype</h2>
        <p className="demo-sub">
          <code>a instanceof B</code> 的本质：<b>从 a 的原型开始往上爬，逐环比较是否等于 B.prototype</b>。
          选一个用例点 <b>▶ 播放</b>，看它怎么一步步找到（或走到 <code>null</code> 也没找到）。
        </p>
      </div>

      {/* 用例选择 */}
      <div className="iof-cases">
        {CASES.map((c) => (
          <button
            key={c.id}
            className={'iof-case' + (c.id === caseId ? ' iof-case-on' : '')}
            onClick={() => pick(c.id)}
          >
            {c.code}
          </button>
        ))}
      </div>

      {/* 当前表达式 */}
      <div className="iof-expr">
        <span>{current.code.replace(' instanceof ', '')}</span>
        <span className="iof-expr-kw">instanceof</span>
        <span>{current.Right.name}</span>
        <span className="iof-arrow">→</span>
        <span className={chain.result ? 'iof-bool-true' : 'iof-bool-false'}>
          {finished ? String(chain.result) : '…'}
        </span>
      </div>

      {/* 播放控制 */}
      <div className="btn-row">
        <button className="iof-primary" onClick={togglePlay} disabled={chain.primitive}>
          {running ? '⏸ 暂停' : finished && step > 0 ? '↻ 重播' : '▶ 播放查找过程'}
        </button>
        <button className="ghost" onClick={() => setStep((s) => Math.min(s + 1, totalFrames))} disabled={chain.primitive || finished}>
          ⏭ 下一步
        </button>
        <button className="ghost" onClick={revealAll} disabled={chain.primitive}>
          👀 直接看结果
        </button>
        <button className="ghost" onClick={() => pick(caseId)}>↺ 重置</button>
      </div>

      {/* 原型链 */}
      <div className="iof-viz">
        <div className="iof-target">
          🎯 查找目标：<b>{chain.targetName}</b>
        </div>

        {chain.primitive ? (
          <div className="iof-result iof-result-false">
            ❌ false
            <span className="iof-result-why">
              <code>{current.code.split(' instanceof ')[0]}</code> 是<b>原始类型</b>，没有原型链，
              instanceof 第一步就直接返回 false（这类判断该用 <code>typeof</code>）。
            </span>
          </div>
        ) : (
          <div className="iof-chain">
            {/* 起点：a 本身 */}
            <div className="iof-step">
              <div className="iof-node iof-node-start">
                <span className="iof-node-name">{chain.startName}</span>
                <span className="iof-node-cmp">起点 a</span>
              </div>
              <span className="iof-arrow">→</span>
            </div>

            {/* 沿途每个原型 */}
            {chain.steps.map((s, i) => {
              const visible = i < step
              const isCur = i === step - 1
              let cls = 'iof-node'
              if (visible) cls += ' iof-node-seen'
              if (s.hit && visible) cls += ' iof-node-hit'
              else if (visible && !s.hit && !isCur) cls += ' iof-node-miss'
              if (isCur && !s.hit) cls += ' iof-node-cur'
              return (
                <div className="iof-step" key={i}>
                  <div className={cls}>
                    <span className="iof-node-name">{s.name}</span>
                    <span className="iof-node-cmp">
                      {!visible
                        ? '（待访问）'
                        : s.hit
                          ? '✅ === 目标，命中！'
                          : '❌ ≠ 目标，继续向上 ↑'}
                    </span>
                  </div>
                  {(i < chain.steps.length - 1 || chain.reachedNull) && <span className="iof-arrow">→</span>}
                </div>
              )
            })}

            {/* 走到尽头：null */}
            {chain.reachedNull && (
              <div className="iof-step">
                <div className={'iof-node iof-node-null' + (nullVisible ? ' iof-node-seen' : '')}>
                  <span className="iof-node-name">null</span>
                  <span className="iof-node-cmp">{nullVisible ? '原型链尽头，停止' : '（待访问）'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 结果条 */}
        {!chain.primitive && finished && (
          <div className={'iof-result ' + (chain.result ? 'iof-result-true' : 'iof-result-false')}>
            {chain.result ? '✅ true' : '❌ false'}
            <span className="iof-result-why">{current.note}</span>
          </div>
        )}
        {!chain.primitive && !finished && (
          <div className="iof-result iof-result-idle">
            点「▶ 播放」或「⏭ 下一步」，看它沿原型链一环环比较…
          </div>
        )}
      </div>

      <p className="tip">
        💡 关键就一句：<b>instanceof 比的是「原型对象」的引用是否相等</b>，不是名字。
        所以 <code>[] instanceof Object</code> 也是 <code>true</code>——数组的原型链是
        <code>[] → Array.prototype → Object.prototype → null</code>，中途经过了 <code>Object.prototype</code>。
        这也解释了为什么它<b>跨 iframe 会失效</b>：两个 window 各有一套 <code>Array.prototype</code>，引用不相等。
      </p>
    </div>
  )
}
