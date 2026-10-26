import { useState } from 'react'
import { phrases, grammar } from './shared.js'

/* =========================================================
 * ② 口语 & 用词速查
 * ---------------------------------------------------------
 * 两块：
 *   表达抽屉：按场景分组的短句（说法 / 含义 / 备注），可搜索
 *   语法坑：高频易错点（如 ever 不能在肯定句表「曾经」）
 * ========================================================= */

export default function SpokenRef() {
  const [kw, setKw] = useState('')
  const q = kw.trim().toLowerCase()

  const match = (s) => !q || s.toLowerCase().includes(q)
  const groups = phrases
    .map((g) => ({ ...g, items: g.items.filter((it) => match(it.text) || match(it.zh) || match(it.note || '')) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="eie-root">
      <div className="eie-toolbar">
        <input
          className="eie-search"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          placeholder="🔍 搜说法或中文，例如 never mind / 曾经 / ever"
        />
        {kw && (
          <button className="eie-btn" onClick={() => setKw('')}>
            清空
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="eie-empty">没搜到「{kw}」。口语表达都在 shared.js 里攒着，加一条就有。</p>
      ) : (
        groups.map((g) => (
          <section className="eie-block" key={g.group}>
            <h3>{g.group}</h3>
            <table className="eie-table eie-table-phrase">
              <thead>
                <tr>
                  <th>说法</th>
                  <th>含义</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((it) => (
                  <tr key={it.text}>
                    <td>
                      <code>{it.text}</code>
                    </td>
                    <td>{it.zh}</td>
                    <td className="eie-td-note">{it.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      )}

      <section className="eie-block">
        <h3>语法坑 · 一讲就忘的那几个</h3>
        {grammar.map((g) => (
          <div className="eie-gram" key={g.group}>
            <p className="eie-gram-title">{g.group}</p>
            <table className="eie-table">
              <thead>
                <tr>
                  <th>用法</th>
                  <th>例句</th>
                  <th>含义</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((it) => (
                  <tr key={it.usage}>
                    <td>{it.usage}</td>
                    <td>
                      <code>{it.eg}</code>
                    </td>
                    <td>{it.zh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="eie-warn">{g.warn}</p>
          </div>
        ))}
      </section>

      <section className="eie-block">
        <h3>英式 vs 美式 · 用词小提示</h3>
        <ul className="eie-bullets">
          <li>偏好 <code>Could you…</code> / <code>Would you mind…</code> 而不是 <code>Can you…</code>（更委婉）</li>
          <li><code>quite a bit / rather</code> 代替 <code>very / a lot</code>；注意英式 <code>quite good</code> 常带「还不错但没到极好」的 understatement 意味</li>
          <li>爱用 <code>chat through</code> / <code>talk us through</code> / <code>shall we…</code> / <code>at the moment</code> / <code>CV</code>（美式 résumé）/ <code>programme</code>（美式 program）</li>
          <li>惯用完成时 + <code>before</code>：<code>you've worked with React before</code> ✅</li>
        </ul>
      </section>
    </div>
  )
}
