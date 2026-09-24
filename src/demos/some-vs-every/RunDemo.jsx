import { useState } from 'react'
import { CASES, runSome, runEvery } from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：some / every 各跑一遍，并显示「短路检查了几个」
 * ---------------------------------------------------------
 * 不是截图，是点「运行」后真执行的结果。checked/total 直观展示
 * 两者一旦能判定结果就立刻停止遍历（短路求值）。
 * ========================================================= */

export default function RunDemo() {
  const [ran, setRan] = useState(false)

  const results = ran
    ? CASES.map((c) => ({
        ...c,
        some: runSome(c.array, c.pred),
        every: runEvery(c.array, c.pred),
      }))
    : null

  return (
    <div className="demo-wrap soe-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 同一份数组，some / every 各跑一遍</h2>
        <p className="demo-sub">
          两者都返回<b>布尔值</b>，区别在<b>判定条件</b>与<b>短路时机</b>：
          <code>some</code> 找到<b>第一个满足</b>的就停（存在即真），
          <code>every</code> 找到<b>第一个不满足</b>的就停（全真才真）。
          下面每格标注了<b>实际检查了几个元素</b>，看它们在哪里停下来。
        </p>
      </div>

      <div className="btn-row soe-toolbar">
        {!ran ? (
          <button className="soe-primary" onClick={() => setRan(true)}>
            ▶ 运行全部用例
          </button>
        ) : (
          <button className="ghost" onClick={() => setRan(false)}>
            ↺ 清空结果
          </button>
        )}
      </div>

      {!ran ? (
        <p className="soe-note">
          点「运行」，下方会真跑 <code>array.some(pred)</code> 与{' '}
          <code>array.every(pred)</code>，并排展示返回值和短路计数。
        </p>
      ) : (
        <div className="soe-grid">
          {results.map((r) => (
            <div className="soe-card" key={r.id}>
              <div className="soe-card-head">
                <span className="soe-card-title">{r.label}</span>
                <code className="soe-card-src">
                  [{r.array.map((v) => (Number.isNaN(v) ? 'NaN' : JSON.stringify(v))).join(', ')}]
                  {'  '}
                  {r.predLabel}
                </code>
              </div>

              <ResultRow kind="some" data={r.some} />
              <ResultRow kind="every" data={r.every} />

              <p className="soe-tip">💡 {r.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ResultRow({ kind, data }) {
  const stopped = data.checked < data.total
  return (
    <div className="soe-row">
      <span className={'soe-badge soe-badge-' + kind}>{kind}()</span>
      <span
        className={
          'soe-bool ' + (data.result ? 'soe-bool-true' : 'soe-bool-false')
        }
      >
        {String(data.result)}
      </span>
      <span className="soe-checked">
        检查 {data.checked}/{data.total}
        {stopped ? ' → 提前短路 ⛔' : data.total === 0 ? ' → 未进入回调' : ' → 遍历完'}
      </span>
    </div>
  )
}
