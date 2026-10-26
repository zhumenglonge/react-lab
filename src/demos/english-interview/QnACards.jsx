import { useState } from 'react'
import { questions, MASTERED_KEY } from './shared.js'

/* =========================================================
 * ① 问答闪卡：先自己开口答，再逐段对照参考答案
 * ---------------------------------------------------------
 * 交互设计（刻意模拟面试现场）：
 *   题目永远可见，答案默认全藏 → 点「揭示答案」才出来
 *   答案内部再按「30s → 要点 → 加分句 → 收尾 → 坑」分段展开，
 *   逼自己一层一层回忆，而不是第一眼就把话术全看完
 *   底部「记住了」写 localStorage，可用「只刷未掌握」筛题
 * ========================================================= */

function readMastered() {
  try {
    return new Set(JSON.parse(localStorage.getItem(MASTERED_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function writeMastered(set) {
  try {
    localStorage.setItem(MASTERED_KEY, JSON.stringify([...set]))
  } catch {
    /* 隐私模式下 localStorage 会抛错，忽略即可 */
  }
}

/* 中文提示 + 可开口的英文话术 */
function Script({ zh, text, label }) {
  return (
    <div className="eie-script">
      <div className="eie-script-head">
        <span className="eie-chip">{label}</span>
        <span className="eie-zh">{zh}</span>
      </div>
      <p className="eie-en">{text}</p>
    </div>
  )
}

function AnswerBody({ q }) {
  const [open, setOpen] = useState({ hook: true, points: false, extra: false, closing: false, pitfalls: false })
  const toggle = (k) => setOpen((s) => ({ ...s, [k]: !s[k] }))

  const section = (key, title, count, child) => (
    <div className="eie-sec">
      <button className="eie-sec-head" onClick={() => toggle(key)}>
        <span className="eie-sec-caret">{open[key] ? '▾' : '▸'}</span>
        <span className="eie-sec-title">{title}</span>
        {count != null && <span className="eie-sec-count">{count}</span>}
      </button>
      {open[key] && child}
    </div>
  )

  return (
    <div className="eie-answer">
      <div className="eie-lead">
        <span className="eie-lead-tag">开口思路</span>
        结论先行 → 挑 3~4 点展开 → 一句体现深度 → 收尾拉回自己。<b>别背清单，面试官要的是判断。</b>
      </div>

      {section('hook', '① 30 秒版回答（先说这句）', null, <Script label="30s" zh={q.hook.zh} text={q.hook.text} />)}

      {section(
        'points',
        '② 展开讲（挑 3~4 点即可）',
        q.points.length,
        <table className="eie-table">
          <thead>
            <tr>
              <th>维度</th>
              <th>React</th>
              <th>Vue</th>
            </tr>
          </thead>
          <tbody>
            {q.points.map((p) => (
              <tr key={p.dim}>
                <td>{p.dim}</td>
                <td>{p.react}</td>
                <td>{p.vue}</td>
              </tr>
            ))}
          </tbody>
        </table>,
      )}

      {section(
        'extra',
        '③ 加分句（体现深度）',
        q.extra.length,
        <>
          {q.extra.map((e, i) => (
            <Script key={i} label={`加分句 ${i + 1}`} zh={e.zh} text={e.text} />
          ))}
        </>,
      )}

      {section('closing', '④ 收尾（把话题拉回自己）', null, <Script label="收尾" zh={q.closing.zh} text={q.closing.text} />)}

      {section(
        'pitfalls',
        '⑤ 用词与发音坑',
        q.pitfalls.length,
        <ul className="eie-tips">
          {q.pitfalls.map((p) => (
            <li key={p.tip}>
              <code>{p.tip}</code>
              <span>{p.desc}</span>
            </li>
          ))}
        </ul>,
      )}
    </div>
  )
}

function Card({ q, mastered, onToggleMastered }) {
  const [reveal, setReveal] = useState(false)
  const [showRewrite, setShowRewrite] = useState(false)

  return (
    <article className={`eie-card ${mastered ? 'eie-card-done' : ''}`}>
      <header className="eie-card-head">
        <span className="eie-num">
          Q{q.num} {q.icon}
        </span>
        <div className="eie-head-main">
          <div className="eie-meta">
            <span className="eie-tag">{q.topic}</span>
            <span className="eie-source">{q.source}</span>
            {mastered && <span className="eie-tag eie-tag-ok">✅ 已掌握</span>}
          </div>
          <p className="eie-question">{q.question}</p>
        </div>
      </header>

      {q.verdict && (
        <p className="eie-verdict">
          <b>⚠️ 原题点评</b>
          {q.verdict}
        </p>
      )}

      <div className="eie-btn-row">
        {q.rewrites && (
          <button className={showRewrite ? 'eie-btn eie-btn-on' : 'eie-btn'} onClick={() => setShowRewrite((v) => !v)}>
            🇬🇧 {showRewrite ? '收起英式改写' : '这题怎么问才地道（英式改写）'}
          </button>
        )}
        <button className={reveal ? 'eie-btn eie-btn-on' : 'eie-btn eie-btn-primary'} onClick={() => setReveal((v) => !v)}>
          {reveal ? '🙈 隐藏参考答案' : '💬 我先答了，看参考答案'}
        </button>
        <button className={mastered ? 'eie-btn eie-btn-on' : 'eie-btn'} onClick={onToggleMastered}>
          {mastered ? '↺ 重新加入练习' : '🎯 这道记住了'}
        </button>
      </div>

      {showRewrite && (
        <div className="eie-rewrite">
          <p className="eie-rewrite-lead">面试里更自然的问法（你自己复述问题、或跟面试官确认时也能用）：</p>
          {q.rewrites.map((r) => (
            <div className="eie-rw" key={r.label}>
              <span className="eie-chip eie-chip-uk">{r.label}</span>
              <p className="eie-en">{r.text}</p>
              <p className="eie-rw-note">{r.note}</p>
            </div>
          ))}
        </div>
      )}

      {reveal ? (
        <AnswerBody q={q} />
      ) : (
        <div className="eie-hide-tip">
          参考答案已藏起来。先出声把答案说一遍（哪怕磕巴、哪怕中英夹杂），再点开对照 —— 英文面试练的是<b>开口</b>，不是默读。
        </div>
      )}
    </article>
  )
}

export default function QnACards() {
  const [mastered, setMastered] = useState(readMastered)
  const [onlyTodo, setOnlyTodo] = useState(false)

  const toggleMastered = (id) =>
    setMastered((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      writeMastered(next)
      return next
    })

  const list = onlyTodo ? questions.filter((q) => !mastered.has(q.id)) : questions

  return (
    <div className="eie-root">
      <div className="eie-toolbar">
        <span className="eie-progress">
          共 <b>{questions.length}</b> 题，已掌握 <b>{mastered.size}</b> 题
        </span>
        <label className="eie-filter">
          <input type="checkbox" checked={onlyTodo} onChange={(e) => setOnlyTodo(e.target.checked)} />
          只刷未掌握
        </label>
      </div>

      {list.length === 0 ? (
        <p className="eie-empty">🎉 本主题的题全标记掌握了。新题继续往 english-interview-notes.md 里攒，再同步到这里。</p>
      ) : (
        list.map((q) => (
          <Card key={q.id} q={q} mastered={mastered.has(q.id)} onToggleMastered={() => toggleMastered(q.id)} />
        ))
      )}
    </div>
  )
}
