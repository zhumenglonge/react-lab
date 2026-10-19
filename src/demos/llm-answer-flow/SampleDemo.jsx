import { useState, useMemo } from 'react'
import { CANDIDATES, softmax, applyTopP, drawHistogram, makeRng, sampleIndex, argmaxIndex } from './shared.js'

/* =========================================================
 * ③ 采样台：从 logits 到"它到底会吐出哪个词"
 * ---------------------------------------------------------
 * 真跑 softmax(temperature) + top-p nucleus 截断 + 可复现 LCG 抽样。
 * 想讲清三件事：
 *   1) 模型不是查答案，是在词表上算一个概率分布然后抽骰子
 *   2) temperature / top_p 是怎么把"香蕉"从几乎不可能抽成有可能的
 *   3) 为什么同一个问题两次答案不一样（换 seed），贪心又为什么会稳定地错
 * ========================================================= */

const DRAWS = 20

export default function SampleDemo() {
  const [temperature, setTemperature] = useState(0.7)
  const [topP, setTopP] = useState(0.9)
  const [greedy, setGreedy] = useState(false)
  const [seed, setSeed] = useState(1)

  const { items } = CANDIDATES

  /* 概率分布 + 截断 + 频次：全部确定性算出（固定 seed，无 Math.random） */
  const model = useMemo(() => {
    const logits = items.map((c) => c.logits)
    const raw = softmax(logits, temperature)
    const kept = greedy ? new Set([argmaxIndex(logits)]) : applyTopP(raw, topP)

    /* 被 top-p 砍掉的不参与归一化，也不可能被抽到 */
    const keptTotal = raw.reduce((sum, p, i) => sum + (kept.has(i) ? p : 0), 0)
    const finalProbs = raw.map((p, i) => (kept.has(i) ? p / keptTotal : 0))
    const counts = greedy
      ? items.map((_, i) => (i === argmaxIndex(logits) ? DRAWS : 0))
      : drawHistogram(finalProbs, DRAWS, 20261019 + seed)

    /* 连续三次独立抽取（模拟"同一问题问三遍"） */
    const rng = makeRng(7000 + seed * 31)
    const draws = [0, 1, 2].map(() => items[sampleIndex(finalProbs, rng)].tok)

    return { raw, finalProbs, kept, counts, draws }
  }, [items, temperature, topP, greedy, seed])

  const nonsenseIdx = items.findIndex((c) => c.tok === '香蕉')
  const nonsenseP = model.finalProbs[nonsenseIdx]
  const nonsenseCount = model.counts[nonsenseIdx]

  const expect = (nonsenseP * DRAWS).toFixed(1)
  const verdict =
    nonsenseP <= 0.005
      ? { tone: 'success', text: `🟢 长尾被压住了：P(香蕉)=${(nonsenseP * 100).toFixed(2)}%，${DRAWS} 抽期望 ${expect} 次 —— 这是你想要的采样状态` }
      : nonsenseP <= 0.03
        ? { tone: 'warning', text: `🟠 分布开始变平：P(香蕉)=${(nonsenseP * 100).toFixed(1)}%，${DRAWS} 抽期望 ${expect} 次（本次实际抽中 ${nonsenseCount} 次）—— 次抽中一次，整句就废了` }
        : { tone: 'danger', text: `🔴 已经放飞：P(香蕉)=${(nonsenseP * 100).toFixed(1)}%，${DRAWS} 抽期望 ${expect} 次（本次实际 ${nonsenseCount} 次）。把 temperature 拉高 / 把 top_p 放到 1，就是在给幻觉开门` }

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>③ 采样台 · 「它是怎么决定下一个字的」</h2>
        <p className="desc">
          第 5 步放大看：前向传播的输出是<b>一整条 logits</b>（词表里每个词一个分数），
          不是答案。分数经过 <b>softmax → temperature 缩放 → top-p 截断 → 按概率抽样</b> 才变成 token。
          下面是同一道题（{CANDIDATES.question}）的候选分布，拖动参数看"香蕉"什么时候有机会冒出来。
        </p>
      </div>

      {/* 参数面板 */}
      <section className="lm-card">
        <div className="lm-chips">
          <button className={greedy ? 'lm-chip' : 'lm-chip on'} onClick={() => setGreedy(false)}>
            🎲 采样（temperature / top_p 生效）
          </button>
          <button className={greedy ? 'lm-chip on' : 'lm-chip'} onClick={() => setGreedy(true)}>
            🎯 贪心 decoding（每步取最高分）
          </button>
          <button className="lm-chip" onClick={() => setSeed((s) => s + 1)}>
            🔁 重掷一次骰子（seed={seed}）
          </button>
        </div>

        {!greedy && (
          <>
            <div className="lm-slider">
              <div className="lm-slider-head">
                <span>temperature（把分布调"尖"或调"平"）</span>
                <b>{temperature.toFixed(1)}</b>
              </div>
              <input type="range" min="0.1" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
              <div className="lm-slider-scale"><span>0.1 保守</span><span>2.0 放飞</span></div>
            </div>

            <div className="lm-slider">
              <div className="lm-slider-head">
                <span>top-p（nucleus：只保留累计概率到 p 的头部候选）</span>
                <b>{topP.toFixed(2)}</b>
              </div>
              <input type="range" min="0.1" max="1" step="0.05" value={topP} onChange={(e) => setTopP(Number(e.target.value))} />
              <div className="lm-slider-scale"><span>0.1 只留最稳的</span><span>1.0 不截断</span></div>
            </div>
          </>
        )}

        <div className={'lm-verdict is-' + verdict.tone}>{verdict.text}</div>
      </section>

      {/* 分布对拍表 */}
      <section className="lm-card">
        <h4>📊 logits → 概率 → 实际抽样 {DRAWS} 次<span className="lm-tag">确定性 LCG，同 seed 同结果</span></h4>
        <table className="lm-compare">
          <thead>
            <tr>
              <th>候选 token</th><th>logits 分数</th><th>softmax 概率</th>
              <th>top-p 后</th><th>抽样频次</th><th>说明</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c, i) => {
              const cut = !model.kept.has(i)
              const p = model.finalProbs[i]
              const maxP = Math.max(...model.finalProbs)
              return (
                <tr key={c.tok}>
                  <td>{c.tok}</td>
                  <td>{c.logits.toFixed(1)}</td>
                  <td>{(model.raw[i] * 100).toFixed(1)}%</td>
                  <td>
                    {cut ? (
                      <span className="lm-cut">❌ 被截掉</span>
                    ) : (
                      <div className="lm-prob-cell">
                        <div className="lm-prob-track">
                          <div className="lm-prob-fill" style={{ width: (p / maxP) * 100 + '%' }} />
                        </div>
                        <b>{(p * 100).toFixed(p < 0.01 ? 3 : 1)}%</b>
                      </div>
                    )}
                  </td>
                  <td>{model.counts[i]} / {DRAWS}</td>
                  <td className="lm-note-cell">{c.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="lm-draws">
          <span className="lm-k">同一问题连问三次的结果</span>
          <div className="lm-draw-list">
            {model.draws.map((d, i) => (
              <span key={i} className={'lm-draw' + (d === '香蕉' ? ' bad' : '')}>第 {i + 1} 次：{d}</span>
            ))}
          </div>
          {greedy && <span className="lm-hint">贪心：三次必然相同（每步 argmax）</span>}
        </div>
      </section>

      {/* 自回归串词 */}
      <section className="lm-card">
        <h4>🔁 把抽到的词接回去，再抽下一个<span className="lm-tag">一次前向只产出一个 token</span></h4>
        <pre className="code">{`# 每一行 = 一次完整前向传播（重新算一整条分布，不是接着上次算）
输入 [请用一句话解释什么是闭]     → 分布抽样 → 包
输入 [请用一句话解释什么是闭包]   → 分布抽样 → ，
输入 [请用一句话解释什么是闭包，] → 分布抽样 → 它
输入 […] 它                       → 分布抽样 → 指
… 直到抽到 <EOS>（结束符）或撞上限 max_tokens

# 关键：一旦某一步抽偏，后面是在"偏掉的前文"上继续算 → 越走越远（错误会自我强化）`}</pre>
        <p className="lm-note">
          这就是"一个字一个字往外蹦"的原因，也解释了<b>为什么模型不会回头改前面的话</b>：
          自回归是单向的，写错了只能接着往下圆（除非外层再跑一遍重采样 / reasoning 阶段）。
          {nonsenseP > 0.005 && (
            <> 现在这套参数下"香蕉"有 <b>{(nonsenseP * 100).toFixed(1)}%</b> 的概率被抽中 ——
              而它只要出现一次，整段回答就废了；这就是<b>逐 token 风险会被长度放大</b>的算术。</>
          )}
        </p>
      </section>

      <p className="tip">
        💡 一句话本质：<b>大模型不是在检索答案，是在按概率生成下一个 token</b>。
        temperature 控分布锐度、top_p 砍长尾、贪心等价于 temperature→0；
        想"稳定 + 少胡说"就调低 temperature + 收紧 top_p + 把事实交给工具/RAG，
        但<b>调到 0 也救不了"它压根不知道"</b>—— argmax 选到的可能就是错的。
      </p>
    </div>
  )
}
