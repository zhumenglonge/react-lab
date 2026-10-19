import { useState } from 'react'
import { tokenizeMini, estimateCost, PRICE } from './shared.js'

/* =========================================================
 * ② Token 与窗口：真跑一个迷你 tokenizer
 * ---------------------------------------------------------
 * 两块对拍：
 *   A) 切分台：输入一句话 → 当场切成 token，看 hit/oov、与 text.length 的偏差、按 token 计费
 *   B) 窗口预算台：窗口大小 + 历史轮数 → 谁被挤出局，三种截断策略各留下什么
 * 纯确定性计算，渲染期无副作用。
 * ========================================================= */

const DEFAULT_TEXT = '请用一句话解释什么是闭包，并给个 React 组件例子'

/* 迷你词表规模提示（真模型 10 万+） */
const VOCAB_SIZE_HINT = 40

const WINDOWS = [
  { size: 4096, label: '4k（早期模型）' },
  { size: 8192, label: '8k' },
  { size: 32768, label: '32k' },
  { size: 128000, label: '128k（当前主流）' },
]

const PER_ROUND = 340
/* 滑动窗口默认保留的最近轮数 */
const KEEP_ROUNDS = 6

/* 上下文的五个组成块（key 用于砍价） */
function buildParts(text, rounds) {
  const userTokens = 120 + tokenizeMini(text).tokenCount
  return [
    { key: 'system', name: 'system prompt + 工具声明', tokens: 900, tone: 'keep' },
    { key: 'older', name: '更早的历史（已超出保留窗口）', tokens: Math.max(0, rounds - KEEP_ROUNDS) * PER_ROUND, tone: 'cut' },
    { key: 'recent', name: `最近 ${Math.min(rounds, KEEP_ROUNDS)} 轮原文`, tokens: Math.min(rounds, KEEP_ROUNDS) * PER_ROUND, tone: 'keep' },
    { key: 'rag', name: 'RAG 检索片段', tokens: 4200, tone: 'cut' },
    { key: 'user', name: '本轮 user 输入', tokens: userTokens, tone: 'keep' },
  ]
}

/* 三种截断策略：砍价顺序（先砍谁）不同，留下的后果也不同 */
const STRATEGIES = [
  {
    key: 'head',
    name: '保开头（从头截断，丢最新内容）',
    cuts: ['recent', 'rag', 'older'],
    result: '系统设定与最早的历史稳住了，但你刚说的几句话模型看不见 —— 表现为"答非所问、让它重新说一遍"。',
    tone: 'warning',
  },
  {
    key: 'tail',
    name: '保结尾（从尾截断，丢最早内容直至 system）',
    cuts: ['older', 'rag', 'system'],
    result: '最近的话都在，但角色设定/工具声明被挤掉 —— 表现为"语气变了、不调工具了、越狱成功"。风险最高。',
    tone: 'danger',
  },
  {
    key: 'slide',
    name: '滑动窗口 + 摘要 + 精简检索（推荐）',
    cuts: null,
    result: 'system 常驻 + 最近若干轮原文 + 更早内容压成摘要 + RAG 只留 top-k。工程上最麻烦，但质量最稳。',
    tone: 'success',
  },
]

export default function TokenDemo() {
  const [text, setText] = useState(DEFAULT_TEXT)
  const [windowSize, setWindowSize] = useState(8192)
  const [rounds, setRounds] = useState(12)

  /* ---------- A) 切分台 ---------- */
  const result = tokenizeMini(text)
  const cost = estimateCost(result.tokenCount, Math.round(result.tokenCount * 2))
  const lengthGap = result.tokenCount - text.length

  /* ---------- B) 窗口预算台 ---------- */
  const parts = buildParts(text, rounds)
  const totalNeed = parts.reduce((sum, p) => sum + p.tokens, 0)
  const overflow = totalNeed - windowSize
  /* 宽度基准取"需求与窗口的较大值"，超窗口时也能看清各块真实占比 */
  const barBase = Math.max(totalNeed, windowSize)

  const labelOf = (key) => parts.find((p) => p.key === key)?.name ?? key

  const strategyViews = STRATEGIES.map((s) => {
    if (s.key === 'slide') {
      const summaryTokens = 400
      const fixed = parts.find((p) => p.key === 'system').tokens + parts.find((p) => p.key === 'user').tokens
      const keepRounds = Math.max(0, Math.min(rounds, Math.floor((windowSize - fixed - summaryTokens) / PER_ROUND)))
      const ragBudget = Math.max(0, windowSize - fixed - summaryTokens - keepRounds * PER_ROUND)
      const ragKept = Math.min(ragBudget, parts.find((p) => p.key === 'rag').tokens)
      const used = fixed + summaryTokens + keepRounds * PER_ROUND + ragKept
      return {
        ...s,
        used,
        detail: `保留：system + ${keepRounds} 轮原文 + 更早内容摘要 ${summaryTokens} token + 检索 ${ragKept.toLocaleString()} token`,
      }
    }
    let remain = totalNeed
    const keep = new Map(parts.map((p) => [p.key, p.tokens]))
    const dropped = []
    for (const key of s.cuts) {
      if (remain <= windowSize) break
      const t = keep.get(key) ?? 0
      if (t <= 0) continue
      const cut = Math.min(t, remain - windowSize)
      keep.set(key, t - cut)
      dropped.push(`${labelOf(key)} -${cut.toLocaleString()}`)
      remain -= cut
    }
    const used = Array.from(keep.values()).reduce((a, b) => a + b, 0)
    return {
      ...s,
      used,
      detail: dropped.length
        ? `按顺序砍：${dropped.join('  →  ')}`
        : '无需裁剪，全量装得下',
    }
  })

  const oovRatio = result.tokenCount > 0 ? result.oovCount / result.tokenCount : 0

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>② Token：模型眼里的世界只有数字</h2>
        <p className="desc">
          <b>token 是大模型的计价单位</b>：切分决定成本、窗口决定"能记住多少"、
          而 <code>text.length</code> 跟 token 数根本不是一回事。下面左边真跑一个 40 词的迷你词表，
          右边把窗口塞爆，看三种截断策略各留下什么。
        </p>
      </div>

      {/* ---------- A) 切分台 ---------- */}
      <section className="lm-card">
        <h4>🔤 A · 迷你 tokenizer 实跑<span className="lm-tag">词表仅 {VOCAB_SIZE_HINT} 词</span></h4>
        <textarea
          className="lm-input"
          rows="2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="随便输入一句中英文混合的话，试试生僻字和长英文单词"
        />
        <div className="lm-tokens">
          {result.pieces.map((p, i) => (
            <span key={`${p.piece}-${i}`} className={p.kind === 'hit' ? 'lm-tok hit' : 'lm-tok oov'}>
              {p.piece}
              <i>{p.id}</i>
            </span>
          ))}
          {result.pieces.length === 0 && <span className="lm-empty">输入内容后自动切分</span>}
        </div>
        <div className="lm-kpi-grid">
          <div><span className="lm-k">token 数</span><b>{result.tokenCount}</b></div>
          <div><span className="lm-k">字符数（text.length）</span><b>{text.length}</b></div>
          <div><span className="lm-k">UTF-8 字节数</span><b>{result.byteCount}</b></div>
          <div><span className="lm-k">命中整词</span><b>{result.tokenCount - result.oovCount} ✅</b></div>
          <div><span className="lm-k">被拆碎（oov）</span><b>{result.oovCount}{result.oovCount > 0 ? ' ⚠️' : ''}</b></div>
          <div><span className="lm-k">这段的示例价</span><b>¥ {cost.total.toFixed(6)}</b></div>
        </div>
        <p className="lm-note">
          {result.tokenCount === 0
            ? '输入内容后这里会出现切分结果。'
            : oovRatio > 0.5
              ? <>⚠️ <b>{Math.round(oovRatio * 100)}% 的 token 是拆碎片</b>：这个词表太小，没命中的英文被逐字母拆开了（真模型用 BPE 会合成子词，比如 <code>explain → ex + pl + ain</code>）。真实场景里<b>代码、JSON、专有名词、生僻字</b>就是这种"拆碎更贵"的情况。</>
              : lengthGap > 0
                ? `⚠️ token 比字符多 ${lengthGap} 个：有内容不在词表里被拆碎了（多字节标点、代码符号最常见）。`
                : `token 比字符少 ${-lengthGap} 个：原因是①常见词被合成一整个 token（BPE 的压缩效果），②空白被吞掉不单独计数。` }
          <br />
          <b>结论</b>：限流、计费、截断都必须用官方 tokenizer 数 token；
          用 <code>text.length</code> 估算，中英文混排下误差能到几十个百分点。
          单价示例：输入 ¥{PRICE.input}/百万 token，输出 ¥{PRICE.output}/百万 token（output 通常贵 3~5 倍）。
        </p>
      </section>

      {/* ---------- B) 窗口预算台 ---------- */}
      <section className="lm-card">
        <h4>📏 B · 上下文窗口塞爆对拍<span className="lm-tag">模型无状态：每轮重传全部</span></h4>

        <div className="lm-chips">
          {WINDOWS.map((w) => (
            <button
              key={w.size}
              className={w.size === windowSize ? 'lm-chip on' : 'lm-chip'}
              onClick={() => setWindowSize(w.size)}
            >
              {w.label}
            </button>
          ))}
        </div>

        <div className="lm-slider">
          <div className="lm-slider-head">
            <span>对话已进行多少轮</span>
            <b>{rounds} 轮 ≈ {(rounds * PER_ROUND).toLocaleString()} token</b>
          </div>
          <input type="range" min="0" max="40" step="1" value={rounds} onChange={(e) => setRounds(Number(e.target.value))} />
          <div className="lm-slider-scale"><span>0</span><span>40 轮</span></div>
        </div>

        {/* 占用条：虚线右侧就是"窗口装不下的部分" */}
        <div className="lm-bar">
          {parts.map((p) => (
            <div
              key={p.key}
              className={'lm-bar-seg tone-' + p.tone}
              style={{ width: (p.tokens / barBase) * 100 + '%' }}
              title={`${p.name}：${p.tokens.toLocaleString()} token`}
            >
              {(p.tokens / barBase) * 100 > 8 ? p.name.slice(0, 6) : ''}
            </div>
          ))}
          {overflow > 0 && (
            <div className="lm-bar-overflow">
              超出 {overflow.toLocaleString()}
            </div>
          )}
        </div>
        <div className="lm-bar-legend">
          <span>窗口容量 {windowSize.toLocaleString()} token（整条 = max(需求, 窗口)）</span>
          <span><i className="lm-dot tone-keep" />必留 &nbsp;<i className="lm-dot tone-cut" />优先被砍</span>
        </div>
        <div className={'lm-verdict is-' + (overflow > 0 ? 'danger' : 'success')}>
          {overflow > 0
            ? `🔴 需要 ${totalNeed.toLocaleString()} token > 窗口 ${windowSize.toLocaleString()}，超出 ${overflow.toLocaleString()} → 必须裁剪，砍谁就是策略问题`
            : `🟢 需要 ${totalNeed.toLocaleString()} token ≤ 窗口 ${windowSize.toLocaleString()}，还剩 ${(windowSize - totalNeed).toLocaleString()} 余量（还要给回答留 completion 空间）`}
        </div>

        <div className="lm-strategy-grid">
          {strategyViews.map((s) => (
            <div key={s.key} className={'lm-strategy tone-' + s.tone}>
              <div className="lm-strategy-name">
                {s.key === 'slide' ? '✅ ' : s.key === 'tail' ? '❌ ' : '⚠️ '}
                {s.name}
              </div>
              <p className="lm-strategy-detail">{s.detail}</p>
              <p className="lm-strategy-result">{s.result}</p>
              <p className="lm-strategy-used">实际占用 {s.used.toLocaleString()} / {windowSize.toLocaleString()} token</p>
            </div>
          ))}
        </div>
      </section>

      <p className="tip">
        💡 面试加分说法：<b>上下文窗口不是记忆，是每重新传一遍的工作区</b>。
        传得越多，Prefill 越慢、越贵，而且中部内容命中率会掉（lost in the middle）。
        所以工程上要做的三件事：<b>固定内容放开头吃前缀缓存、历史滑动窗口 + 摘要压缩、长文档改走 RAG 检索</b>。
      </p>
    </div>
  )
}
