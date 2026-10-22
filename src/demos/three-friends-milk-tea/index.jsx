import { useState } from 'react'
import './styles.css'

/* =========================================================
 * 🧠 逻辑推理题：三个朋友点奶茶
 * ---------------------------------------------------------
 * 经典"共同知识"推理题。用「逐步揭示」把每个人的回答
 * 暴露了什么信息一层层拆开，最后给出结论与严谨补充。
 * ========================================================= */

const QUESTION =
  '三个好朋友进了一家商店，商店只卖两样东西：奶茶和咖啡。服务员问第一个人：“你们三个人都想喝奶茶吗？”第一个人说“不知道”，第二个人也说“不知道”，第三个人说“我知道了”。请问这三个人到底想不想喝奶茶？'

// 每一步：谁说了什么 → 由此推出什么
const STEPS = [
  {
    who: '第 1 个人',
    said: '“不知道”',
    key: '奶茶 ✓',
    tone: 'ok',
    infer:
      '如果他自己不想喝奶茶，那“三人都想喝”必然为假，他会直接答“不是”。他答“不知道”，说明他否定不了这个前提 → 他本人想喝奶茶，只是猜不透另外两人。',
  },
  {
    who: '第 2 个人',
    said: '“不知道”',
    key: '奶茶 ✓',
    tone: 'ok',
    infer:
      '他已经从第 1 人的“不知道”推出：第 1 人想喝。同理，若他自己不想喝就会答“不是”；他答“不知道” → 他本人也想喝奶茶，只是不确定第 3 人。',
  },
  {
    who: '第 3 个人',
    said: '“我知道了”',
    key: '奶茶 ✓',
    tone: 'ok',
    infer:
      '他听完前两人的“不知道”，已确定第 1、第 2 人都想喝。此时“三人都想喝吗” = 真 ∧ 真 ∧（我自己想不想）。他当然知道自己的偏好，于是能给出确定答案 → “我知道了”（对标经典笑话结尾那句“要！”），说明他也要奶茶。',
  },
]

export default function ThreeFriendsMilkTea() {
  // 当前已揭示到第几步（0 = 只看题目）
  const [revealed, setRevealed] = useState(0)
  const done = revealed >= STEPS.length

  return (
    <div className="mt-page">
      <header className="mt-header">
        <span className="mt-icon">🧠</span>
        <div>
          <h2>逻辑推理题：三个朋友点奶茶</h2>
          <p className="mt-meta">共同知识 / 逆向推理 · 面试原题 · 记录于 2026-10-22</p>
        </div>
      </header>

      <section className="mt-card">
        <h3>📌 题目原文</h3>
        <blockquote className="mt-question">“{QUESTION}”</blockquote>
      </section>

      <section className="mt-card">
        <div className="mt-toolbar">
          <h3>🔎 逐步揭示推理链</h3>
          <div className="mt-btns">
            <button
              className="mt-btn"
              onClick={() => setRevealed((n) => Math.max(0, n - 1))}
              disabled={revealed === 0}
            >
              上一步
            </button>
            <button
              className="mt-btn mt-btn-primary"
              onClick={() => setRevealed((n) => Math.min(STEPS.length, n + 1))}
              disabled={done}
            >
              {done ? '已推到底' : '下一步'}
            </button>
            <button className="mt-btn" onClick={() => setRevealed(0)} disabled={revealed === 0}>
              重置
            </button>
          </div>
        </div>

        <ol className="mt-steps">
          {STEPS.map((s, i) => (
            <li
              key={s.who}
              className={`mt-step ${i < revealed ? 'mt-step-show' : ''}`}
            >
              <div className="mt-step-head">
                <span className="mt-step-who">{s.who}</span>
                <span className="mt-step-said">{s.said}</span>
                <span className={`mt-step-key mt-tone-${s.tone}`}>推出：{s.key}</span>
              </div>
              <p className="mt-step-infer">{s.infer}</p>
            </li>
          ))}
        </ol>

        {!done && (
          <p className="mt-hint">👆 点「下一步」，看每个人的回答到底暴露了什么信息</p>
        )}
      </section>

      {done && (
        <section className="mt-card mt-conclusion">
          <h3>✅ 结论：三个人其实都想喝奶茶</h3>
          <p className="mt-slogan">
            “不知道” = “我想喝，但我不知道别人想不想喝”；只有<b>不想喝</b>的人才会立刻说“不是”。
            前两人都没否定，说明他们都要；第三人拿到全部信息后能肯定，说明他也要。
          </p>
          <div className="mt-note">
            <h4>🧐 面试官若追问（严谨补充）</h4>
            <ul>
              <li>能 100% 确定的只有：<b>第 1、第 2 人一定想喝奶茶</b>。</li>
              <li>
                严格逻辑上，第三人无论想喝奶茶还是咖啡都“能知道答案”（他已确定前两人要，再叠加自身偏好即可判断）。题目用<b>肯定式</b>的“我知道了”收尾，暗示他要的是奶茶。
              </li>
              <li>反过来：若第三人想喝咖啡，他会直接答“不是”，而不是“我知道了”。</li>
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
