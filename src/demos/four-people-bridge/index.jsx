import { useState } from 'react'
import './styles.css'

/* =========================================================
 * 🧠 逻辑推理题：四人过桥（Bridge and Torch）
 * ---------------------------------------------------------
 * 考"贪心陷阱 + 全局最优"：让最慢的两人一起过、用两个快的当摆渡。
 * 做成「常规 vs 最优」两策略逐步对拍。
 * ========================================================= */

const QUESTION =
  '4 个人夜里要过一座桥，只有一支手电，桥一次最多承受 2 人，过桥必须拿着手电；两人同行时按较慢那个人的速度算。四人单独过桥分别要 1、2、5、10 分钟。问：全部过去最短需要多少分钟？'

// 四个人与其耗时
const PEOPLE = { 甲: 1, 乙: 2, 丙: 5, 丁: 10 }

// 两套策略：每步 { who, dir, cost }；dir: 'go'=过桥, 'back'=送回
const STRATEGIES = {
  optimal: {
    label: '最优策略',
    total: 17,
    tone: 'ok',
    note: '关键：把最慢的丙(5)、丁(10)绑在一起过，让他们的 10 分钟只算一次；用最快的甲(1)、乙(2)来回送手电。',
    moves: [
      { who: '甲 + 乙', dir: 'go', cost: 2 },
      { who: '甲', dir: 'back', cost: 1 },
      { who: '丙 + 丁', dir: 'go', cost: 10 },
      { who: '乙', dir: 'back', cost: 2 },
      { who: '甲 + 乙', dir: 'go', cost: 2 },
    ],
  },
  naive: {
    label: '常规策略（每次都让最快的甲送回）',
    total: 19,
    tone: 'bad',
    note: '直觉做法：让 1 分钟的甲当"专职摆渡"，逐个送——但丙丁各占一次来回，最慢的 10 和 5 被分开算了两轮。',
    moves: [
      { who: '甲 + 丁', dir: 'go', cost: 10 },
      { who: '甲', dir: 'back', cost: 1 },
      { who: '甲 + 丙', dir: 'go', cost: 5 },
      { who: '甲', dir: 'back', cost: 1 },
      { who: '甲 + 乙', dir: 'go', cost: 2 },
    ],
  },
}

export default function FourPeopleBridge() {
  const [key, setKey] = useState('optimal')
  const [step, setStep] = useState(1)
  const strat = STRATEGIES[key]
  const maxStep = strat.moves.length

  const switchTo = (k) => { setKey(k); setStep(1) }

  // 累计到当前已揭示步的时间（前缀求和，不跨 map 改变量）
  const rows = strat.moves.map((m, i) => ({
    ...m,
    idx: i,
    shown: i < step,
    cum: strat.moves.slice(0, i + 1).reduce((a, x) => a + x.cost, 0),
  }))

  return (
    <div className="bd-page">
      <header className="bd-header">
        <span className="bd-icon">🌉</span>
        <div>
          <h2>逻辑题：四人过桥</h2>
          <p className="bd-meta">贪心陷阱 / 全局最优 · 经典智力题 · 记录于 2026-10-22</p>
        </div>
      </header>

      <section className="bd-card">
        <h3>📌 题目原文</h3>
        <blockquote className="bd-question">“{QUESTION}”</blockquote>
        <div className="bd-people">
          {Object.entries(PEOPLE).map(([n, t]) => (
            <span key={n} className="bd-person">
              {n} <b>{t}′</b>
            </span>
          ))}
        </div>
      </section>

      <section className="bd-card">
        <div className="bd-toolbar">
          <h3>🔎 逐步演示</h3>
          <div className="bd-switch">
            <button
              className={`bd-seg ${key === 'naive' ? 'bd-seg-on' : ''}`}
              onClick={() => switchTo('naive')}
            >
              常规 {STRATEGIES.naive.total}′
            </button>
            <button
              className={`bd-seg ${key === 'optimal' ? 'bd-seg-on' : ''}`}
              onClick={() => switchTo('optimal')}
            >
              最优 {STRATEGIES.optimal.total}′
            </button>
          </div>
        </div>

        <table className="bd-table">
          <thead>
            <tr>
              <th>步</th>
              <th>动作</th>
              <th>本步</th>
              <th>累计</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.idx} className={r.shown ? '' : 'bd-row-hidden'}>
                <td>{r.idx + 1}</td>
                <td>
                  {r.who} {r.dir === 'go' ? '→ 过桥 🌉' : '← 送回 🔦'}
                </td>
                <td className="bd-cost">{r.cost}′</td>
                <td className="bd-cum">{r.shown ? r.cum : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bd-controls">
          <button className="bd-btn" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step <= 1}>
            上一步
          </button>
          <button
            className="bd-btn bd-btn-primary"
            onClick={() => setStep((s) => Math.min(maxStep, s + 1))}
            disabled={step >= maxStep}
          >
            下一步
          </button>
        </div>
        <p className={`bd-note bd-tone-${strat.tone}`}>{strat.note}</p>
      </section>

      <section className="bd-card bd-conclusion">
        <h3>✅ 答案：最短 17 分钟</h3>
        <p className="bd-slogan">
          直觉的"最快的人专职摆渡"是<b>贪心陷阱</b>（19 分钟）；正解是<b>让最慢的两人一起过</b>（10′ 只算一次），
          用两个快的一前一后送回手电，压到 <b>17 分钟</b>。
        </p>
        <div className="bd-note">
          <h4>🧐 面试官若追问</h4>
          <ul>
            <li><b>为什么是 17 不是 19？</b>常规法把 5′、10′ 分开各送一趟、各配一次回头；最优法让 5′+10′ 同行，一次吃掉 10′，省掉一轮慢速往返。</li>
            <li><b>关键结构：</b>两个最快的人(1、2)当"摆渡员"来回送手电；两个最慢的(5、10)必须结伴过，避免他们的时间被数两次。</li>
            <li><b>通用化：</b>设最快的两个为 a ≤ b、最慢的两个为 y ≤ z，把 y、z 送过去只有两种方案，取较小者后对剩下 n−2 人递归：① 两快摆渡 a+2b+z；② 最快专职 2a+y+z。本例 a=1,b=2,y=5,z=10 → ①=15、②=17，取①，最后甲乙再过(+2) = 17 分。</li>
            <li><b>考什么：</b>这题不是考算数，是考"敢不敢打破直觉的贪心、看到全局最优"。</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
