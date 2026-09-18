import { useEffect, useRef, useState } from 'react'
import {
  DATA_TYPES,
  GROUP_LABEL,
  PRIMITIVE_TYPES,
  STORAGE_KEYS,
  buildHint,
  diagnoseWrong,
  findType,
  isMatch,
  loadProgress,
  normalize,
  saveProgress,
  shuffle,
  typeById,
} from './shared.js'

/* =========================================================
 * ✍️ 默写挑战：亲手把 8 种数据类型填出来
 * ---------------------------------------------------------
 * 记忆的关键不是「看」，而是「提取」——所以这里做成默写：
 *   🟢 看线索：每格一句中文线索，写出类型名
 *   🟡 看例子：每格一段示例代码，写出它的类型
 *   🔴 纯默写：只分「原始 7 + 引用 1」，顺序也打乱，最接近面试
 * 填不出来就点 💡，提示分三级递进（首字母 → 关键线索 → 答案），
 * 用了三级答案的格子会被标记，不计入「完美默写」。
 * 答错时不给标准答案了事，而是走 diagnoseWrong 做「错因诊断」，
 * 把 typeof null、function、数组这些最常见的混淆点当场纠正。
 * ========================================================= */

const LEVELS = [
  { key: 'clue', label: '🟢 看线索', desc: '每格一句中文线索，写出类型名' },
  { key: 'example', label: '🟡 看例子', desc: '每格一段示例代码，写出它的类型' },
  { key: 'blind', label: '🔴 纯默写', desc: '只分「原始 7 + 引用 1」，全靠回忆' },
]

const TOTAL = DATA_TYPES.length // 8

// 出题：线索/例子模式打乱顺序，避免靠「位置」背答案；盲填模式只给分组
function buildSlots(level) {
  if (level === 'blind') {
    return [
      ...PRIMITIVE_TYPES.map((t) => ({ key: 'p-' + t.id, group: 'primitive', targetId: null })),
      { key: 'o-object', group: 'object', targetId: 'object' },
    ]
  }
  return shuffle(DATA_TYPES).map((t) => ({ key: t.id, group: t.group, targetId: t.id }))
}

// 批改：位置模式对号入座，盲填模式做集合匹配（原始 7 格不分先后，但不能重复）
function grade(slots, answers) {
  const used = new Set()
  return slots.map((slot, i) => {
    const raw = answers[i]
    const target = slot.targetId ? typeById(slot.targetId) : null

    if (!normalize(raw)) return { status: 'empty', target, matched: null, hint: '还没填，先想 30 秒再点提示' }

    if (target) {
      if (isMatch(raw, target.id)) return { status: 'correct', target, matched: target, hint: '' }
      return { status: 'wrong', target, matched: findType(raw), hint: diagnoseWrong(raw, target.id) }
    }

    const matched = findType(raw)
    if (!matched) return { status: 'wrong', target: null, matched: null, hint: diagnoseWrong(raw, null) }
    if (matched.group === 'object') {
      return {
        status: 'wrong',
        target: null,
        matched,
        hint: `${matched.name} 是唯一的「引用类型」，应该填在最后那一格；前面 7 格要的是原始类型。`,
      }
    }
    if (used.has(matched.id)) {
      return {
        status: 'wrong',
        target: null,
        matched,
        hint: `${matched.name} 已经在别的格子填过了，8 种类型互不重复。`,
      }
    }
    used.add(matched.id)
    return { status: 'correct', target: null, matched, hint: '' }
  })
}

function fmtSec(total) {
  const s = Math.max(0, total)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function QuizDemo() {
  const [level, setLevel] = useState('clue')
  const [slots, setSlots] = useState(() => buildSlots('clue'))
  const [answers, setAnswers] = useState(() => Array(TOTAL).fill(''))
  const [hintLevels, setHintLevels] = useState(() => Array(TOTAL).fill(0))
  const [results, setResults] = useState(null)
  const [record, setRecord] = useState(() =>
    loadProgress(STORAGE_KEYS.quiz, { attempts: 0, best: 0, perfect: 0, last: null }),
  )

  // 用「秒数累加」计时而不是 Date.now()：够用，也满足 react-hooks/purity
  // （Date.now() 是不纯调用，写在组件体内的函数里会被 React Compiler 规则拦下）
  const [seconds, setSeconds] = useState(0)
  const inputsRef = useRef([])

  // 计时器：只在「还没交卷」时跑，交卷后自动停
  useEffect(() => {
    if (results) return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [results])

  const filled = answers.filter((a) => normalize(a)).length
  const elapsed = results ? results.seconds : seconds

  // 切难度 = 重新出题
  const pickLevel = (key) => {
    setLevel(key)
    reset(key)
  }

  function reset(nextLevel = level) {
    setSlots(buildSlots(nextLevel))
    setAnswers(Array(TOTAL).fill(''))
    setHintLevels(Array(TOTAL).fill(0))
    setResults(null)
    setSeconds(0)
  }

  // 交卷后输入框只读，想改就点「重新开始」，避免出现「一半批改一半可编辑」的怪状态
  const setAnswer = (i, v) => {
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? v : a)))
  }

  const bumpHint = (i) => {
    setHintLevels((prev) => prev.map((l, idx) => (idx === i ? Math.min(l + 1, 3) : l)))
  }

  const revealAll = () => {
    setHintLevels(Array(TOTAL).fill(3))
  }

  const focusNext = (i) => {
    for (let j = i + 1; j < TOTAL; j++) {
      if (!normalize(answers[j])) {
        inputsRef.current[j]?.focus()
        return
      }
    }
    inputsRef.current[0]?.focus()
  }

  const submit = () => {
    const rows = grade(slots, answers)
    const correct = rows.filter((r) => r.status === 'correct').length
    const hintsUsed = hintLevels.filter((l) => l > 0).length
    const revealed = hintLevels.filter((l) => l >= 3).length
    const missing = DATA_TYPES.filter((t) => !rows.some((r) => r.status === 'correct' && r.matched?.id === t.id))

    setResults({ rows, correct, hintsUsed, revealed, missing, seconds: elapsed })

    const next = {
      attempts: record.attempts + 1,
      best: Math.max(record.best, correct),
      perfect: record.perfect + (correct === TOTAL && hintsUsed === 0 ? 1 : 0),
      last: { score: correct, hintsUsed, level, seconds: elapsed },
    }
    setRecord(next)
    saveProgress(STORAGE_KEYS.quiz, next)
  }

  const verdict = () => {
    if (!results) return null
    const { correct, hintsUsed, revealed } = results
    if (correct === TOTAL && hintsUsed === 0) return '🏆 完美默写：8/8，全程没用提示，面试稳了'
    if (correct === TOTAL) {
      return `✅ 全对 8/8，但用了 ${hintsUsed} 次提示${revealed ? `（${revealed} 格直接看了答案）` : ''}，再练到不用提示为止`
    }
    if (correct >= 6) return `👍 ${correct}/8，就差一点，把下面错题的「错因」读一遍`
    return `💪 ${correct}/8，先去「🧠 记忆法」tab 背口诀，再回来默写`
  }

  return (
    <div className="demo-wrap jst-root">
      <div className="demo-header">
        <h2>✍️ 默写挑战 · 把 8 种类型亲手填出来</h2>
        <p className="demo-sub">
          背不住的原因是<b>只看不写</b>。这里逼你<b>主动提取</b>：8 个格子对应 8 种类型，
          填不出来点 💡 拿<b>三级递进提示</b>，填错了会告诉你<b>错在哪</b>（而不是只打个红叉）。
        </p>
      </div>

      {/* 难度 */}
      <div className="jst-levels">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            className={'jst-level' + (l.key === level ? ' jst-level-on' : '')}
            onClick={() => pickLevel(l.key)}
            title={l.desc}
          >
            <b>{l.label}</b>
            <span>{l.desc}</span>
          </button>
        ))}
      </div>

      {/* 状态条 */}
      <div className="jst-statusbar">
        <span>已填 <b>{filled}</b> / {TOTAL}</span>
        <span>⏱️ {fmtSec(elapsed)}</span>
        <span className="jst-record">
          📒 历史：练过 <b>{record.attempts}</b> 次，最好 <b>{record.best}</b>/8，完美 <b>{record.perfect}</b> 次
        </span>
      </div>

      {/* 8 个格子 */}
      <div className="jst-slots">
        {slots.map((slot, i) => {
          const row = results?.rows[i]
          const hintFor = slot.targetId ? typeById(slot.targetId) : null
          const state = row ? ` jst-slot-${row.status}` : ''
          return (
            <div key={slot.key} className={'jst-slot' + state}>
              <div className="jst-slot-top">
                <span className="jst-slot-idx">{i + 1}</span>
                <span className={'jst-badge jst-badge-' + slot.group}>{GROUP_LABEL[slot.group]}</span>
                {slot.targetId && level !== 'blind' && (
                  <span className="jst-slot-es">{typeById(slot.targetId).es}</span>
                )}
                <button className="jst-hint-btn" onClick={() => bumpHint(i)} disabled={hintLevels[i] >= 3}>
                  💡 {hintLevels[i] >= 3 ? '已看答案' : hintLevels[i] > 0 ? `提示 Lv.${hintLevels[i]}` : '提示'}
                </button>
              </div>

              {/* 线索 / 例子 */}
              <div className="jst-clue">
                {level === 'clue' &&
                  (hintFor ? hintFor.clue : '原始类型之一（7 选 1，不能重复）')}
                {level === 'example' &&
                  (hintFor ? (
                    <>
                      这段代码的值是什么类型？<code className="jst-code">{`const v = ${hintFor.examples[0]}`}</code>
                    </>
                  ) : (
                    <>
                      原始类型之一，想想有哪些？<code className="jst-code">typeof v === ?</code>
                    </>
                  ))}
                {level === 'blind' &&
                  (slot.group === 'primitive'
                    ? '原始类型之一：直接写出来，7 个不分先后但不能重复'
                    : '唯一的引用类型：数组、函数、日期都属于它')}
              </div>

              <input
                ref={(el) => {
                  inputsRef.current[i] = el
                }}
                className="jst-input"
                value={answers[i]}
                placeholder={slot.group === 'primitive' ? '如：number' : '如：object'}
                autoComplete="off"
                spellCheck="false"
                disabled={!!results}
                onChange={(e) => setAnswer(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (i === TOTAL - 1) submit()
                    else focusNext(i)
                  }
                }}
              />

              {/* 三级提示：位置模式对着目标类型给，盲填模式给方向性提示 */}
              {hintLevels[i] > 0 && (
                <div className="jst-hint">
                  {hintFor
                    ? buildHint(hintFor, hintLevels[i])
                    : hintLevels[i] === 1
                      ? '第 1 级：7 个原始类型的首字母是 n / s / b / u / n / s / b'
                      : hintLevels[i] === 2
                        ? `第 2 级：口诀「数 字 布 未 空 符 大」——数字、字符串、布尔、未定义、空值、符号、大整数`
                        : `第 3 级（答案）：${PRIMITIVE_TYPES.map((t) => t.name).join(' / ')}（7 个原始类型，顺序不限）`}
                </div>
              )}

              {/* 批改结果 */}
              {row && row.status === 'correct' && (
                <div className="jst-row-ok">✅ 正确：{row.matched.name}（{row.matched.cn}）</div>
              )}
              {row && row.status === 'wrong' && (
                <div className="jst-row-bad">
                  <div>❌ 不对{row.target ? `，答案是 ${row.target.name}` : ''}</div>
                  <div className="jst-row-why">{row.hint}</div>
                </div>
              )}
              {row && row.status === 'empty' && <div className="jst-row-empty">⬜ {row.hint}</div>}
            </div>
          )
        })}
      </div>

      <div className="btn-row">
        <button className="jst-primary" onClick={submit} disabled={filled === 0}>
          📝 提交批改（{filled}/{TOTAL}）
        </button>
        <button className="ghost" onClick={revealAll}>👀 全部看答案</button>
        <button className="ghost" onClick={() => reset()}>↻ 重新开始</button>
      </div>

      {/* 成绩面板 */}
      {results && (
        <div className={'jst-score' + (results.correct === TOTAL ? ' jst-score-full' : '')}>
          <div className="jst-score-main">
            <b>{results.correct}</b> / {TOTAL}
            <span className="jst-score-time">用时 {fmtSec(results.seconds)}</span>
          </div>
          <div className="jst-score-verdict">{verdict()}</div>
          {results.missing.length > 0 && (
            <div className="jst-score-miss">
              漏掉的类型：{results.missing.map((t) => `${t.icon} ${t.name}`).join('、')}
              <div className="jst-score-miss-clue">
                {results.missing.map((t) => (
                  <div key={t.id}><b>{t.name}</b> —— {t.clue}</div>
                ))}
              </div>
            </div>
          )}
          <div className="btn-row">
            <button onClick={() => reset()}>↻ 再默写一遍（换一批顺序）</button>
          </div>
        </div>
      )}

      <p className="tip">
        💡 本站统一按<b>全小写</b>记：<code>number</code>、<code>string</code>、<code>boolean</code>、<code>undefined</code>、
        <code>null</code>、<code>symbol</code>、<code>bigint</code>、<code>object</code>——正好和 <code>typeof</code> 的返回值一模一样，
        背一套就够。判分时<b>大小写都算对</b>（<code>Number</code> / <code>数字</code> / <code>num</code> 也认），不用纠结。
      </p>

      <p className="tip">
        ⚠️ 只有两种情况必须大写，因为那是代码里真实的标识符：① 全局构造器
        <code>Object.keys()</code>、<code>Symbol('id')</code>、<code>BigInt(10)</code>、<code>Array.isArray()</code>；
        ② <code>Object.prototype.toString.call(null)</code> 返回的 <code>'[object Null]'</code>。
        注意 <code>null</code> / <code>undefined</code> <b>没有大写形式</b>，写 <code>Null</code> 会 ReferenceError。
      </p>

      <p className="tip">
        💡 用法建议：先用 🔴 纯默写测真实水平 → 错的格子读「错因」而不是答案 →
        隔 10 分钟再默写一遍 → 第二天再默写一遍。<b>提取三次以上，基本就不会再忘了</b>。
      </p>
    </div>
  )
}
