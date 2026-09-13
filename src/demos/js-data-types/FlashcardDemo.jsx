import { useCallback, useEffect, useState } from 'react'
import { DATA_TYPES, STORAGE_KEYS, loadProgress, saveProgress, typeById } from './shared.js'

/* =========================================================
 * 🃏 闪卡速记：正面线索 → 心里想答案 → 翻面对答案
 * ---------------------------------------------------------
 * 这是对抗「隔很久就忘」最省时的办法：主动提取 + 简易间隔重复。
 *   标「😕 不熟悉」的卡会回到牌堆末尾，本轮内反复出现；
 *   同时累计一个「不熟悉次数」写进 localStorage（不会因为后来答对就清零），
 *   下次打开时这些卡自动排在最前面——就是简易版的间隔重复。
 *   标「😀 认识」的卡移出牌堆。历史记录可用「清空记录」手动重置。
 * 键盘：空格 / 回车 翻面，1 = 不熟悉，2 = 认识。
 * ========================================================= */

const FRONT_MODES = [
  { key: 'clue', label: '📖 看线索' },
  { key: 'example', label: '💻 看代码' },
]

// 组牌堆：历史上「不熟悉」次数多的排前面（sort 稳定，次数相同保持原顺序）
function buildDeck(ids, counts) {
  return ids.map((id) => ({ id, again: counts?.[id] ?? 0 })).sort((a, b) => b.again - a.again)
}

export default function FlashcardDemo() {
  const [counts, setCounts] = useState(() => loadProgress(STORAGE_KEYS.cards, {}))
  const [deck, setDeck] = useState(() =>
    buildDeck(DATA_TYPES.map((t) => t.id), loadProgress(STORAGE_KEYS.cards, {})),
  )
  const [flipped, setFlipped] = useState(false)
  const [frontMode, setFrontMode] = useState('clue')
  const [mastered, setMastered] = useState([])
  const [roundHard, setRoundHard] = useState([]) // 本轮标过「不熟悉」的类型
  const [hardTimes, setHardTimes] = useState(0)
  const [round, setRound] = useState(1)

  const flip = useCallback(() => setFlipped((f) => !f), [])

  const judge = useCallback(
    (know) => {
      const card = deck[0]
      if (!card) return
      setFlipped(false)
      if (know) {
        setMastered((m) => [...m, card.id])
        setDeck((d) => d.slice(1))
        return
      }
      // 不熟悉：累计次数落盘（不清零），本轮内回到队尾反复出现
      const nextCounts = { ...counts, [card.id]: (counts[card.id] ?? 0) + 1 }
      setCounts(nextCounts)
      saveProgress(STORAGE_KEYS.cards, nextCounts)
      setRoundHard((ids) => (ids.includes(card.id) ? ids : [...ids, card.id]))
      setHardTimes((h) => h + 1)
      setDeck((d) => [...d.slice(1), { ...card, again: nextCounts[card.id] }])
    },
    [counts, deck],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        flip()
      } else if (e.key === '1') {
        judge(false)
      } else if (e.key === '2') {
        judge(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flip, judge])

  const restart = (onlyHard = false) => {
    const ids = onlyHard ? roundHard : DATA_TYPES.map((t) => t.id)
    if (ids.length === 0) return
    setDeck(buildDeck(ids, counts))
    setMastered([])
    setRoundHard([])
    setHardTimes(0)
    setFlipped(false)
    setRound((r) => r + 1)
  }

  const clearHistory = () => {
    setCounts({})
    saveProgress(STORAGE_KEYS.cards, {})
  }

  const card = deck[0]
  const type = card ? typeById(card.id) : null
  // 历史待巩固：累计不熟悉次数 > 0 的，按次数倒序
  const historyHardIds = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)

  return (
    <div className="demo-wrap jst-root">
      <div className="demo-header">
        <h2>🃏 闪卡速记 · 3 分钟过完 8 张</h2>
        <p className="demo-sub">
          看正面线索，<b>先在心里说出答案</b>，再点卡片翻面对照。答不上来就标「不熟悉」，
          这张卡会<b>回到队尾反复出现</b>，并且被记住——下次打开时它排在最前面。
        </p>
      </div>

      <div className="jst-fc-bar">
        <div className="jst-fc-modes">
          {FRONT_MODES.map((m) => (
            <button
              key={m.key}
              className={'jst-level' + (m.key === frontMode ? ' jst-level-on' : '')}
              onClick={() => {
                setFrontMode(m.key)
                setFlipped(false)
              }}
            >
              <b>{m.label}</b>
            </button>
          ))}
        </div>
        <div className="jst-statusbar">
          <span>第 <b>{round}</b> 轮</span>
          <span>牌堆剩 <b>{deck.length}</b> 张</span>
          <span>✅ 已掌握 <b>{mastered.length}</b> / 8</span>
          <span>😕 本轮回炉 <b>{hardTimes}</b> 次</span>
        </div>
      </div>

      {type ? (
        <>
          <div
            className={'jst-card' + (flipped ? ' jst-card-flipped' : '')}
            onClick={flip}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') flip()
            }}
          >
            <div className="jst-face jst-face-front">
              <div className="jst-face-tag">
                {card.again > 0 ? `😕 历史上标过 ${card.again} 次不熟悉` : '✨ 第一次出现'}
              </div>
              {frontMode === 'clue' ? (
                <div className="jst-face-main">{type.clue}</div>
              ) : (
                <code className="jst-face-code">{`const v = ${type.examples[0]}`}</code>
              )}
              <div className="jst-face-tip">
                <span className={'jst-badge jst-badge-' + type.group}>
                  {type.group === 'primitive' ? '原始类型' : '引用类型'}
                </span>
                <span>点卡片翻面看答案（空格）</span>
              </div>
            </div>

            <div className="jst-face jst-face-back">
              <div className="jst-face-answer">
                <span className="jst-face-icon">{type.icon}</span>
                <span className="jst-face-name">{type.name}</span>
                <span className="jst-face-cn">{type.cn} · {type.es}</span>
              </div>
              <div className="jst-face-meta">
                <span><code className="jst-code">typeof v</code> → <b>{type.typeofResult}</b></span>
                <span>示例：<code className="jst-code">{type.examples.join('、')}</code></span>
              </div>
              <div className="jst-face-key">⚠️ {type.key}</div>
            </div>
          </div>

          <div className="btn-row">
            <button className="jst-bad-btn" onClick={() => judge(false)}>😕 不熟悉（1）</button>
            <button className="jst-ok-btn" onClick={() => judge(true)}>😀 认识（2）</button>
            <button className="ghost" onClick={clearHistory} disabled={historyHardIds.length === 0}>
              🧹 清空记录
            </button>
          </div>
        </>
      ) : (
        <div className="jst-fc-done">
          <div className="jst-fc-done-title">🎉 本轮 {mastered.length} 张全部掌握</div>
          <p className="jst-note">
            这一轮你标了 <b>{hardTimes}</b> 次「不熟悉」。
            {hardTimes === 0
              ? '一张都没回炉，说明这 8 种类型已经稳了，去 ✍️ 默写挑战 用 🔴 纯默写验证一下。'
              : '隔 10 分钟再来一轮，只练不熟的卡，效果最好。'}
          </p>
          {roundHard.length > 0 && (
            <div className="jst-fc-hard">
              本轮不熟：{roundHard.map((id) => `${typeById(id).icon} ${typeById(id).name}`).join('、')}
            </div>
          )}
          {historyHardIds.length > 0 && (
            <div className="jst-fc-hard">
              📒 历史待巩固：{historyHardIds.map((id) => `${typeById(id).icon} ${typeById(id).name}（${counts[id]} 次）`).join('、')}
            </div>
          )}
          <div className="btn-row">
            {roundHard.length > 0 && (
              <button className="jst-primary" onClick={() => restart(true)}>🔁 只练本轮不熟的 {roundHard.length} 张</button>
            )}
            <button className="ghost" onClick={() => restart(false)}>↻ 8 张全练一遍</button>
          </div>
        </div>
      )}

      {/* 掌握进度条 */}
      <div className="jst-fc-track">
        {DATA_TYPES.map((t) => (
          <span
            key={t.id}
            className={
              'jst-fc-dot' +
              (mastered.includes(t.id) ? ' jst-fc-dot-ok' : counts[t.id] > 0 ? ' jst-fc-dot-hard' : '')
            }
            title={`${t.name}：${mastered.includes(t.id) ? '本轮已掌握' : counts[t.id] > 0 ? `不熟悉 ${counts[t.id]} 次` : '待复习'}`}
          >
            {t.icon}
          </span>
        ))}
      </div>

      <p className="tip">
        💡 闪卡的正确用法：<b>一定要先在心里说出答案再翻面</b>。翻了才想，就变成「看卡片」而不是「提取记忆」，
        效果差一半。「认识」的标准是<b>不用想就能说出来</b>，犹豫了就标不熟悉。
      </p>
    </div>
  )
}
