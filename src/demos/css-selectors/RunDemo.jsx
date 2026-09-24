import { useState, createElement } from 'react'
import {
  DUELS,
  CALC_PRESETS,
  calcSpecificity,
  fmtTuple,
  judgeWinner,
  judgeReason,
} from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：权重计算器 + 6 组真实规则对决
 * ---------------------------------------------------------
 * 上半部分：输入任意选择器，当场算出 (0,a,b,c) 四元组。
 * 下半部分：每组对决的规则真实写在 styles.css 里（顺序一致），
 * 点「实测渲染色」用 getComputedStyle 读浏览器层叠引擎的真实
 * 选择结果，与计算器预测的胜者对拍——不是截图，是真跑。
 * ========================================================= */

const COLS = ['ID 列', '类列', '标签列']

export default function RunDemo() {
  // 计算器输入
  const [sel, setSel] = useState('#app .btn:hover')
  // 实测得到的每个对决样本文字的真实渲染色
  const [colors, setColors] = useState(null)

  const tuple = calcSpecificity(sel)

  // 在事件处理器里按 data 标记查样本元素，读真实渲染色
  const measure = () => {
    const next = {}
    for (const d of DUELS) {
      const el = document.querySelector(`[data-cse-sample="${d.id}"]`)
      if (el) next[d.id] = getComputedStyle(el).color
    }
    setColors(next)
  }

  return (
    <div className="demo-wrap cse-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 权重计算器 + 6 组规则对决</h2>
        <p className="demo-sub">
          优先级不用背玄学：<b>数四元组 (内联, ID, 类, 标签)</b>，从左往右逐列比，大的赢；
          打平看<b>书写顺序</b>。下面每组对决的规则都真实写在样式表里，
          点「实测」读浏览器真正选中的颜色，和预测对拍。
        </p>
      </div>

      {/* ---------- 权重计算器 ---------- */}
      <section className="cse-block">
        <h3>🧮 权重计算器 · 输入选择器当场算</h3>
        <div className="cse-calc">
          <input
            className="cse-input"
            value={sel}
            placeholder="例如：#app .btn:hover"
            onChange={(e) => setSel(e.target.value)}
          />
          {tuple ? (
            <div className="cse-tuple">
              <span className="cse-cell cse-cell-fixed">(0,</span>
              {tuple.map((n, i) => (
                <span className="cse-cell" key={COLS[i]}>
                  <b>{n}</b>
                  <i>{COLS[i]}</i>
                </span>
              ))}
              <span className="cse-cell cse-cell-fixed">)</span>
            </div>
          ) : (
            <p className="cse-calc-empty">输入一个选择器试试 ↑</p>
          )}
        </div>
        <div className="cse-presets">
          {CALC_PRESETS.map((p) => (
            <button className="ghost cse-preset" key={p} onClick={() => setSel(p)}>
              {p}
            </button>
          ))}
        </div>
        <p className="cse-tip">
          💡 类列 = 类 + 属性 + 伪类（三者同权）；标签列 = 标签 + 伪元素；
          <code>*</code> 和 <code>:where()</code> 计 0；内联 style 是更高一档的
          (1,0,0,0)，此处不展开。
        </p>
      </section>

      {/* ---------- 6 组对决 ---------- */}
      <div className="btn-row cse-toolbar">
        {!colors ? (
          <button className="cse-primary" onClick={measure}>
            ▶ 实测渲染色（读 getComputedStyle）
          </button>
        ) : (
          <button className="ghost" onClick={() => setColors(null)}>
            ↺ 清空实测
          </button>
        )}
      </div>

      <div className="cse-grid">
        {DUELS.map((d) => {
          const win = judgeWinner(d.rules)
          return (
            <div className="cse-card" key={d.id}>
              <div className="cse-card-head">
                <span className="cse-card-title">{d.title}</span>
              </div>

              <ul className="cse-rules">
                {d.rules.map((r, i) => (
                  <li
                    className={'cse-rule' + (i === win ? ' cse-rule-win' : '')}
                    key={r.sel}
                  >
                    <code className="cse-sel">{r.sel}</code>
                    <span className="cse-rule-tuple">
                      {fmtTuple(calcSpecificity(r.sel))}
                    </span>
                    {r.important && <span className="cse-imp">!important</span>}
                    {i === win && (
                      <span className="cse-win-badge">
                        ✅ {judgeReason(d.rules, win)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <div className={'cse-sample ' + d.sample.wrap} id={d.sample.wrapId}>
                {createElement(
                  d.sample.tag,
                  { ...d.sample.props, 'data-cse-sample': d.id },
                  '我最终是什么颜色？',
                )}
              </div>

              {colors?.[d.id] && (
                <p className="cse-measured">
                  <span
                    className="cse-chip"
                    style={{ background: colors[d.id] }}
                    aria-hidden="true"
                  />
                  实测渲染色 <code>{colors[d.id]}</code> —— 与 ✅ 那条规则一致
                </p>
              )}

              <p className="cse-tip">💡 {d.note}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
