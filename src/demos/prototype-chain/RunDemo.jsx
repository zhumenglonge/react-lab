import { useEffect, useMemo, useState } from 'react'
import { LOOKUP_CASES, runLookup, runInheritCompare } from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：属性查找播放器 + ES5 继承 vs class
 * ---------------------------------------------------------
 * 上半部分：选一个属性（p.name / p.sayHi / p.toString / arr.push…），
 * 点播放，看引擎沿原型链一环环 hasOwnProperty 找上去——命中停，
 * 爬到 null 返回 undefined。真对象真爬链，不是画图。
 * 下半部分：ES5 寄生组合继承与 class extends 各跑一遍，
 * 六项检查逐条对拍，验证「class 是语法糖」。
 * ========================================================= */

export default function RunDemo() {
  /* ---------- 属性查找播放器 ---------- */
  const [caseId, setCaseId] = useState(LOOKUP_CASES[0].id)
  const current = useMemo(() => runLookup(caseId), [caseId])
  const chain = current.chain

  const totalFrames = chain.steps.length + (chain.reachedNull ? 1 : 0)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  const pick = (id) => {
    setCaseId(id)
    setStep(0)
    setPlaying(false)
  }

  const finished = step >= totalFrames
  const running = playing && !finished

  // 播放：setTimeout 链推进（不在 effect 体内直接 setState，避开 lint 规则）
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
    if (finished) setStep(0)
    setPlaying(true)
  }

  const nullVisible = chain.reachedNull && step > chain.steps.length

  /* ---------- 继承对拍 ---------- */
  const [compare, setCompare] = useState(null)

  return (
    <div className="demo-wrap ptc-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 属性查找沿原型链爬给你看</h2>
        <p className="demo-sub">
          访问 <code>p.xxx</code> 时引擎的动作：<b>自身有吗？没有就沿 __proto__ 上一环再问</b>，
          命中就用，爬到 <code>null</code> 还没有就返回 <code>undefined</code>。
          选一个用例点 <b>▶ 播放</b>，看这次查找停在哪一环。
        </p>
      </div>

      {/* 用例选择 */}
      <div className="ptc-cases">
        {LOOKUP_CASES.map((c) => (
          <button
            key={c.id}
            className={'ptc-case' + (c.id === caseId ? ' ptc-case-on' : '')}
            onClick={() => pick(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 播放控制 */}
      <div className="btn-row">
        <button className="ptc-primary" onClick={togglePlay}>
          {running ? '⏸ 暂停' : finished && step > 0 ? '↻ 重播' : '▶ 播放查找过程'}
        </button>
        <button className="ghost" onClick={() => setStep((s) => Math.min(s + 1, totalFrames))} disabled={finished}>
          ⏭ 下一步
        </button>
        <button className="ghost" onClick={() => { setPlaying(false); setStep(totalFrames) }}>
          👀 直接看结果
        </button>
        <button className="ghost" onClick={() => pick(caseId)}>↺ 重置</button>
      </div>

      {/* 原型链可视化 */}
      <div className="ptc-viz">
        <div className="ptc-target">
          🎯 查找属性：<b>{current.prop}</b>（表达式 <code>{current.label}</code>）
        </div>

        <div className="ptc-chain">
          {chain.steps.map((s, i) => {
            const visible = i < step
            const isCur = i === step - 1
            let cls = 'ptc-node'
            if (visible) cls += ' ptc-node-seen'
            if (s.hit && visible) cls += ' ptc-node-hit'
            else if (visible && !s.hit && !isCur) cls += ' ptc-node-miss'
            if (isCur && !s.hit) cls += ' ptc-node-cur'
            return (
              <div className="ptc-step" key={s.label}>
                <div className={cls}>
                  <span className="ptc-node-name">{s.label}</span>
                  <span className="ptc-node-cmp">
                    {!visible
                      ? '（待访问）'
                      : s.hit
                        ? `✅ 有 ${current.prop}，命中！`
                        : `❌ 没有 ${current.prop}，继续向上 ↑`}
                  </span>
                </div>
                {(i < chain.steps.length - 1 || chain.reachedNull) && (
                  <span className="ptc-arrow">→</span>
                )}
              </div>
            )
          })}

          {chain.reachedNull && (
            <div className="ptc-step">
              <div className={'ptc-node ptc-node-null' + (nullVisible ? ' ptc-node-seen' : '')}>
                <span className="ptc-node-name">null</span>
                <span className="ptc-node-cmp">
                  {nullVisible ? '原型链尽头，停止查找' : '（待访问）'}
                </span>
              </div>
            </div>
          )}
        </div>

        {finished && (
          <div className={'ptc-result ' + (chain.found ? 'ptc-result-true' : 'ptc-result-false')}>
            {chain.found ? `✅ 找到了（${chain.resultType}）` : `❌ 整条链都没有 → ${current.label} === undefined`}
            <span className="ptc-result-why">{current.note}</span>
          </div>
        )}
        {!finished && (
          <div className="ptc-result ptc-result-idle">
            点「▶ 播放」或「⏭ 下一步」，看引擎沿链一环环 hasOwnProperty…
          </div>
        )}
      </div>

      {/* ---------- ES5 vs class 继承对拍 ---------- */}
      <section className="ptc-block">
        <h3>🥊 继承对拍 · ES5 寄生组合 vs class extends</h3>
        <p className="ptc-lead">
          左边是手写 ES5 继承（<code>Parent.call</code> 偷构造 +{' '}
          <code>Object.create</code> 接原型线 + 修 constructor），右边是{' '}
          <code>class extends</code>。点运行，六项检查逐条对拍。
        </p>
        <div className="btn-row">
          {!compare ? (
            <button className="ptc-primary" onClick={() => setCompare(runInheritCompare())}>
              ▶ 运行两套继承并对比
            </button>
          ) : (
            <button className="ghost" onClick={() => setCompare(null)}>
              ↺ 清空结果
            </button>
          )}
        </div>

        {compare && (
          <>
            <table className="ptc-compare">
              <thead>
                <tr>
                  <th>检查项</th>
                  <th>ES5 寄生组合</th>
                  <th>class extends</th>
                </tr>
              </thead>
              <tbody>
                {compare.map((r) => (
                  <tr key={r.code}>
                    <td>
                      <b>{r.label}</b>
                      <code className="ptc-code-sub">{r.code}</code>
                    </td>
                    <td className={r.es5 ? 'ptc-bool-true' : 'ptc-bool-false'}>
                      {String(r.es5)} {r.es5 ? '✅' : '❌'}
                    </td>
                    <td className={r.cls ? 'ptc-bool-true' : 'ptc-bool-false'}>
                      {String(r.cls)} {r.cls ? '✅' : '❌'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="ptc-tip">
              💡 六项全一致——<b>class extends 就是寄生组合继承的语法糖</b>：
              同样是「call/super 继承实例属性 + 原型接线继承方法」。
              差别只在写法与细节约束（class 必须 new 调用、子类构造器必须先 super）。
            </p>
          </>
        )}
      </section>
    </div>
  )
}
