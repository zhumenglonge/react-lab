import { useState } from 'react'

/* =========================================================
 * 🔬 typeof 实验室：亲手验证 + 陷阱竞猜
 * ---------------------------------------------------------
 * 「8 种数据类型」最容易被追问的就是 typeof 的返回值：
 *   typeof 一共只会返回 8 个字符串——
 *   "undefined" "boolean" "number" "bigint" "string" "symbol" "object" "function"
 *   但 "function" 并不是第 9 种数据类型（函数属于 object）。
 * 上半屏是「真实运行」：点任意值，用 JS 引擎当场算出 typeof 与精确类型标签。
 * 下半屏是「陷阱竞猜」：10 道高频坑题，选完立刻讲为什么。
 * ========================================================= */

/* 预置样本：value 用工厂函数生成，真实调用 typeof，不靠硬编码答案 */
const SAMPLES = [
  { code: 'null', get: () => null, trap: true, type: 'null', why: '著名的历史 bug：typeof null === "object"。1995 年的实现用 32 位存值、低位是类型标签，对象的标签是 000，而 null 的内部表示全是 0，于是被误判成对象。后来有提案想修复，因为会破坏大量存量代码被否决了。' },
  { code: 'undefined', get: () => undefined, type: 'undefined', why: 'typeof undefined === "undefined"，这是唯一「类型名和 typeof 结果完全对齐」的空值。' },
  { code: '42', get: () => 42, type: 'number', why: '整数、小数、NaN、Infinity 全是 number，没有 int / float 之分。' },
  { code: 'NaN', get: () => NaN, trap: true, type: 'number', why: 'NaN 的 typeof 仍是 "number"（它表示"不是一个有效数字"）。注意 NaN !== NaN，判断要用 Number.isNaN(x)。' },
  { code: '"hi"', get: () => 'hi', type: 'string', why: '字面量字符串是原始类型，typeof 为 "string"。' },
  { code: 'new String("hi")', get: () => new String('hi'), trap: true, type: 'object', why: '用 new 创建的是「包装对象」，属于引用类型，typeof 为 "object"。所以永远不要写 new String / new Number / new Boolean。' },
  { code: 'true', get: () => true, type: 'boolean', why: '布尔只有 true / false 两个值。注意 new Boolean(true) 会变成对象，if 里永远为真。' },
  { code: 'Symbol("id")', get: () => Symbol('id'), type: 'symbol', why: 'ES6 新增，每次调用都产生唯一值，typeof 为 "symbol"。' },
  { code: '10n', get: () => BigInt(10), type: 'bigint', why: 'ES2020 新增，字面量后缀 n（也可写 BigInt(10)），typeof 为 "bigint"。' },
  { code: '{}', get: () => ({ a: 1 }), type: 'object', why: '普通对象，typeof 为 "object"。' },
  { code: '[]', get: () => [1, 2], trap: true, type: 'object', why: 'typeof 分不清数组和普通对象，都返回 "object"。判数组要用 Array.isArray(x)。' },
  { code: 'function () {}', get: () => function () {}, trap: true, type: 'object', why: 'typeof 对函数特殊返回 "function"，但函数不是第 9 种数据类型——它是「可调用的对象」，属于 object。' },
  { code: 'new Date()', get: () => new Date(), trap: true, type: 'object', why: '内置对象一律 "object"，要精确区分得靠 Object.prototype.toString.call()。' },
  { code: '/ab+c/', get: () => /ab+c/, trap: true, type: 'object', why: '正则也是对象，typeof 为 "object"。' },
  // 未声明变量没法在模块里真实求值，给静态结果 + 说明
  { code: 'notDeclared', raw: 'typeof notDeclared', result: 'undefined', toString: '[object Undefined]', trap: true, type: 'undefined', why: 'typeof 是唯一对「从未声明的变量」不抛 ReferenceError 的操作符，会安静地返回 "undefined"。老代码常用它做特性检测，如 typeof window.BigInt !== "undefined"。' },
]

const QUESTIONS = [
  {
    code: 'typeof null',
    options: ['"null"', '"object"', '"undefined"', '"number"'],
    answer: '"object"',
    why: '历史 bug：null 的内部表示全是 0，类型标签恰好和对象一样。判断 null 只能用 x === null 或 Object.prototype.toString.call(x) === "[object Null]"。',
  },
  {
    code: 'typeof NaN',
    options: ['"NaN"', '"number"', '"undefined"', '"object"'],
    answer: '"number"',
    why: 'NaN 是 number 类型的一个特殊值，意为「不是有效数字」。顺带记：NaN 是唯一不等于自己的值，用 Number.isNaN() 判断。',
  },
  {
    code: 'typeof []',
    options: ['"array"', '"object"', '"list"', '"undefined"'],
    answer: '"object"',
    why: 'typeof 对数组、日期、正则、null 一律返回 "object"，粒度太粗。判数组用 Array.isArray()。',
  },
  {
    code: 'typeof function () {}',
    options: ['"function"', '"object"', '"undefined"', '"callable"'],
    answer: '"function"',
    why: '这是 typeof 的「特殊照顾」，但函数仍然属于 object（引用类型），所以数据类型总数还是 8 种，不是 9 种。',
  },
  {
    code: 'typeof Symbol("id")',
    options: ['"symbol"', '"object"', '"string"', '"unique"'],
    answer: '"symbol"',
    why: 'ES6 新增的原始类型，typeof 能正确识别为 "symbol"。',
  },
  {
    code: 'typeof 10n',
    options: ['"bigint"', '"number"', '"object"', '"integer"'],
    answer: '"bigint"',
    why: 'ES2020 新增，typeof 返回 "bigint"。它和 number 不能直接混合运算：10n + 1 会抛 TypeError。',
  },
  {
    code: 'typeof notDeclared  // 变量从未声明',
    options: ['"undefined"', '抛 ReferenceError', '"null"', '"object"'],
    answer: '"undefined"',
    why: 'typeof 有「安全保护」：对未声明变量不报错，直接返回 "undefined"。直接写 notDeclared 才会 ReferenceError。',
  },
  {
    code: 'typeof (typeof 42)',
    options: ['"string"', '"number"', '"object"', '"undefined"'],
    answer: '"string"',
    why: 'typeof 的返回值永远是字符串，所以里面先得到 "number" 这个字符串，外面再 typeof 就是 "string"。',
  },
  {
    code: 'typeof new String("hi")',
    options: ['"string"', '"object"', '"function"', '"undefined"'],
    answer: '"object"',
    why: 'new 出来的是包装对象（引用类型）。原始字符串才是 "string"，这也是不要用 new String/Number/Boolean 的原因。',
  },
  {
    code: '0.1 + 0.2 === 0.3',
    options: ['true', 'false', 'NaN', 'TypeError'],
    answer: 'false',
    why: 'number 是 IEEE 754 双精度浮点，0.1 + 0.2 实际是 0.30000000000000004。浮点比较用 Math.abs(a - b) < Number.EPSILON，超大整数用 bigint。',
  },
]

// 真实计算：优先用静态结果（未声明变量那种），否则现场求值
function compute(s) {
  if (s.result) return { typeStr: s.result, tag: s.toString }
  const v = s.get()
  return { typeStr: typeof v, tag: Object.prototype.toString.call(v) }
}

export default function TypeofDemo() {
  const [sel, setSel] = useState(0)
  const [res, setRes] = useState(() => compute(SAMPLES[0]))
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(null)
  const [right, setRight] = useState(0)
  const [wrongList, setWrongList] = useState([])

  const sample = SAMPLES[sel]
  const q = QUESTIONS[qi]
  const finished = qi >= QUESTIONS.length

  const pickSample = (i) => {
    setSel(i)
    setRes(compute(SAMPLES[i]))
  }

  const pickOption = (opt) => {
    if (picked) return // 一题只判一次
    setPicked(opt)
    const ok = opt === q.answer
    if (ok) setRight((r) => r + 1)
    else setWrongList((w) => [...w, { code: q.code, answer: q.answer, why: q.why }])
  }

  const next = () => {
    setQi((i) => i + 1)
    setPicked(null)
  }

  const redo = () => {
    setQi(0)
    setPicked(null)
    setRight(0)
    setWrongList([])
  }

  return (
    <div className="demo-wrap jst-root">
      <div className="demo-header">
        <h2>🔬 typeof 实验室 · 8 种类型的「验证器」</h2>
        <p className="demo-sub">
          背类型名容易忘，<b>把每种类型和 typeof 结果绑在一起</b>就难忘多了。
          下面的结果是<b>真的在你浏览器里跑出来的</b>，不是写死的字符串。
        </p>
      </div>

      {/* 亲手验证 */}
      <section className="jst-block">
        <h3>① 亲手验证：点一个值，看 typeof 到底返回什么</h3>
        <div className="jst-chips">
          {SAMPLES.map((s, i) => (
            <button
              key={s.code}
              className={'jst-chip' + (i === sel ? ' jst-chip-on' : '') + (s.trap ? ' jst-chip-trap' : '')}
              onClick={() => pickSample(i)}
            >
              <code>{s.raw ?? `typeof ${s.code}`}</code>
            </button>
          ))}
        </div>

        <div className="jst-lab">
          <div className="jst-lab-expr">
            <code>{sample.raw ?? `typeof ${sample.code}`}</code>
            <span className="jst-lab-arrow">→</span>
            <b className={'jst-lab-result' + (sample.trap ? ' jst-lab-trap' : '')}>"{res.typeStr}"</b>
            {sample.trap && <span className="jst-trap-tag">⚠️ 陷阱</span>}
          </div>
          <div className="jst-lab-precise">
            精确类型：<code>Object.prototype.toString.call(v)</code> → <b>{res.tag}</b>
            <span className="jst-lab-belong">它属于 8 种类型里的 <b>{sample.type}</b></span>
          </div>
          <p className="jst-note">{sample.why}</p>
        </div>
      </section>

      {/* 竞猜 */}
      <section className="jst-block">
        <h3>② 陷阱竞猜：{QUESTIONS.length} 道高频坑题</h3>

        {!finished ? (
          <div className="jst-quiz">
            <div className="jst-quiz-head">
              <span>第 {qi + 1} / {QUESTIONS.length} 题</span>
              <span>已答对 <b>{right}</b></span>
            </div>
            <code className="jst-quiz-code">{q.code}</code>
            <div className="jst-opts">
              {q.options.map((opt) => {
                let cls = 'jst-opt'
                if (picked) {
                  if (opt === q.answer) cls += ' jst-opt-right'
                  else if (opt === picked) cls += ' jst-opt-wrong'
                  else cls += ' jst-opt-dim'
                }
                return (
                  <button key={opt} className={cls} disabled={!!picked} onClick={() => pickOption(opt)}>
                    {picked && opt === q.answer ? '✅ ' : picked && opt === picked ? '❌ ' : ''}
                    {opt}
                  </button>
                )
              })}
            </div>
            {picked && (
              <div className={'jst-quiz-why ' + (picked === q.answer ? 'is-ok' : 'is-bad')}>
                {picked === q.answer ? '✅ 答对了！' : `❌ 正确答案是 ${q.answer}`}
                <div>{q.why}</div>
              </div>
            )}
            <div className="btn-row">
              {picked && (
                <button className="jst-primary" onClick={next}>
                  {qi === QUESTIONS.length - 1 ? '看结果 →' : '下一题 →'}
                </button>
              )}
              <button className="ghost" onClick={redo}>↻ 重做</button>
            </div>
          </div>
        ) : (
          <div className="jst-score">
            <div className="jst-score-main">
              <b>{right}</b> / {QUESTIONS.length}
            </div>
            <div className="jst-score-verdict">
              {right === QUESTIONS.length
                ? '🏆 全对！typeof 的所有坑你都躲过了'
                : right >= 7
                  ? '👍 不错，把下面错题的解析读一遍再重做一次'
                  : '💪 陷阱题错得多很正常，重点记 typeof null 和 typeof 函数这两个'}
            </div>
            {wrongList.length > 0 && (
              <div className="jst-wrong-review">
                <div className="jst-wrong-title">📌 错题回顾</div>
                {wrongList.map((w) => (
                  <div key={w.code} className="jst-wrong-item">
                    <code>{w.code}</code> → <b>{w.answer}</b>
                    <div className="jst-row-why">{w.why}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="btn-row">
              <button onClick={redo}>↻ 再做一遍</button>
            </div>
          </div>
        )}
      </section>

      {/* typeof 全景 */}
      <section className="jst-block">
        <h3>③ 一张图记住 typeof 的「8 个返回值 vs 8 种类型」（现在两边一模一样）</h3>
        <pre className="code">{`typeof 可能返回的 8 个字符串          对应的数据类型（8 种）
─────────────────────────────────    ─────────────────────────
"undefined"                          undefined
"boolean"                            boolean
"number"                             number（含 NaN / Infinity）
"bigint"                             bigint
"string"                             string
"symbol"                             symbol
"function"  ⚠️ 不是独立类型  ────────┐
"object"    ⚠️ null 也返回它  ───────┴─→  object（函数/数组/日期/正则/Map/Set）`}</pre>
        <p className="jst-note">
          所以「typeof 返回 8 种」和「数据类型 8 种」是<b>巧合</b>，不是对应关系：
          typeof 多了一个 <code>function</code>，又把 <code>null</code> 错算成了 <code>object</code>。
          面试时点出这一层，基本就是加分项。
          这也是本站<b>统一用小写记类型名</b>的原因——刚好和 typeof 的返回值完全重合，背一套就够。
        </p>
      </section>

      <p className="tip">
        💡 需要<b>精确</b>判断类型时用 <code>Object.prototype.toString.call(x)</code>：
        它对 8 种类型分别返回 <code>[object Number]</code>、<code>[object Null]</code>、<code>[object Array]</code>、
        <code>[object Function]</code> … 不会像 typeof 那样把 null / 数组 / 日期混成一坨。
      </p>
    </div>
  )
}
