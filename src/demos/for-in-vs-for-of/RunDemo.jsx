import { useState } from 'react'
import {
  TARGETS,
  collectForIn,
  collectForInOwn,
  collectForOf,
  fmt,
} from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：同一批数据，当场用 for...in / for...of 各跑一遍
 * ---------------------------------------------------------
 * 不是截图，是点击「运行」后真执行的结果并排展示。
 * 顶部开关可切换 for...in 是否用 hasOwnProperty 过滤原型链，
 * 直观看到「带原型链的对象」那一行差异。
 * ========================================================= */

export default function RunDemo() {
  const [ran, setRan] = useState(false)
  const [ownOnly, setOwnOnly] = useState(false)

  const results = ran
    ? TARGETS.map((t) => {
        const obj = t.make()
        return {
          ...t,
          inKeys: ownOnly ? collectForInOwn(obj) : collectForIn(obj),
          of: collectForOf(obj),
        }
      })
    : null

  return (
    <div className="demo-wrap fio-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 同一份数据，两种循环各跑一遍</h2>
        <p className="demo-sub">
          for...in 枚举的是<b>属性键名</b>，for...of 迭代的是<b>值</b>。
          光背结论容易忘，下面 8 种数据<b>当场执行</b>给你看差异——尤其对象、稀疏数组、
          Map/Set 这三类最能拉开区别。
        </p>
      </div>

      <div className="btn-row fio-toolbar">
        {!ran ? (
          <button className="fio-primary" onClick={() => setRan(true)}>
            ▶ 运行全部用例
          </button>
        ) : (
          <button className="ghost" onClick={() => setRan(false)}>
            ↺ 清空结果
          </button>
        )}
        <label className="fio-switch">
          <input
            type="checkbox"
            checked={ownOnly}
            disabled={!ran}
            onChange={(e) => setOwnOnly(e.target.checked)}
          />
          for...in 用 hasOwnProperty 过滤原型链
        </label>
      </div>

      {!ran ? (
        <p className="fio-note">
          点「运行」，下方表格会真跑 <code>for (const k in t)</code> 与{' '}
          <code>for (const v of t)</code>，把各自拿到的东西并排列出来。
        </p>
      ) : (
        <div className="fio-grid">
          {results.map((r) => (
            <div className="fio-card" key={r.id}>
              <div className="fio-card-head">
                <span className="fio-card-title">{r.label}</span>
                <code className="fio-card-src">{r.snippet}</code>
              </div>

              <div className="fio-row">
                <span className="fio-badge fio-badge-in">for...in</span>
                <span className="fio-vals">
                  {r.inKeys.length
                    ? r.inKeys.map((k, i) => (
                        <code className="fio-chip" key={i}>{k}</code>
                      ))
                    : <em className="fio-empty">（一个都没枚举到）</em>}
                </span>
              </div>

              <div className="fio-row">
                <span className="fio-badge fio-badge-of">for...of</span>
                {r.of.ok ? (
                  <span className="fio-vals">
                    {r.of.values.map((v, i) => (
                      <code className="fio-chip" key={i}>{fmt(v)}</code>
                    ))}
                  </span>
                ) : (
                  <span className="fio-err">✖ {r.of.error}</span>
                )}
              </div>

              <p className="fio-tip">💡 {r.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
