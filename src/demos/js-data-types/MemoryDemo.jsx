import { useState } from 'react'
import { DATA_TYPES, PRIMITIVE_TYPES, typeById } from './shared.js'

/* =========================================================
 * 🧠 记忆法：把「8 种类型」焊进长期记忆
 * ---------------------------------------------------------
 * 记不住的根因是「孤立地背 8 个单词」。这里给三条互补的钩子：
 *   ① 结构钩子：1 个引用类型 + 7 个原始类型（7 = 一周七天）
 *   ② 口诀钩子：数 字 布 未 空 符 大（谐音「书字不为空，付大款」）
 *   ③ 时间钩子：ES1 五样 → ES6 加 Symbol → ES2020 加 BigInt（5→6→7）
 *   ④ 语义钩子：值家族 / 两个「空」/ 一个「唯一」/ 一个「容器」
 * 点口诀里的每个字，可以看到它对应的类型与线索。
 * ========================================================= */

/* 口诀：7 个字对应 7 个原始类型，谐音串成一句能读出口的话 */
const MNEMONIC = [
  { char: '数', homo: '书', id: 'number' },
  { char: '字', homo: '字', id: 'string' },
  { char: '布', homo: '不', id: 'boolean' },
  { char: '未', homo: '为', id: 'undefined' },
  { char: '空', homo: '空', id: 'null' },
  { char: '符', homo: '付', id: 'symbol' },
  { char: '大', homo: '大', id: 'bigint' },
]

/* 时间线：按「新增年代」记，顺带能答出「哪些是 ES6 新增」 */
const TIMELINE = [
  {
    era: 'ES1 · 1995',
    total: '5 原始 + 1 引用 = 6 种',
    ids: ['number', 'string', 'boolean', 'undefined', 'null'],
    note: 'JS 诞生就有这 5 个原始类型，加上 Object 一共 6 种。这也是为什么「老五样」最难忘。',
  },
  {
    era: 'ES6 · 2015',
    total: '6 原始 + 1 引用 = 7 种',
    ids: ['symbol'],
    note: '新增 Symbol：解决「对象键名冲突」，也让语言有了内置的迭代协议（Symbol.iterator）。',
  },
  {
    era: 'ES2020',
    total: '7 原始 + 1 引用 = 8 种',
    ids: ['bigint'],
    note: '新增 BigInt：解决大整数精度丢失（Number 只能安全表示到 2^53 - 1）。',
  },
]

/* 语义分组：按「这类型是干嘛的」记，比死背顺序牢 */
const FAMILIES = [
  {
    icon: '🔢',
    name: '「值」家族 · 4 个',
    ids: ['number', 'bigint', 'string', 'boolean'],
    say: '能直接拿出来运算 / 比较的具体值：数字、大整数、文本、真假。',
  },
  {
    icon: '🕳️',
    name: '两个「空」· 2 个',
    ids: ['undefined', 'null'],
    say: 'undefined = 系统给的（声明了没赋值）；null = 你主动给的（这里本该有对象但没有）。',
  },
  {
    icon: '🎭',
    name: '一个「唯一」· 1 个',
    ids: ['symbol'],
    say: 'Symbol：每次调用都产生全局唯一的值，专门用来做不会撞名的对象键。',
  },
  {
    icon: '📦',
    name: '一个「容器」· 1 个',
    ids: ['object'],
    say: 'Object：唯一的引用类型，数组 / 函数 / 日期 / 正则 / Map / Set 全装在里面。',
  },
]

const COMPARE_ROWS = [
  ['存什么', '值本身（直接在栈里）', '堆里的地址（变量只存指针）'],
  ['可变吗', '不可变，只能整体替换', '可变，属性随时增删改'],
  ['赋值 = ?', '拷贝一份值，互不影响', '拷贝地址，两个变量指向同一对象'],
  ['比较 = ?', '比值：1 === 1 → true', '比地址：{} === {} → false'],
  ['typeof', '各自的类型名（Null 例外，返回 "object"）', '"object"（函数例外，返回 "function"）'],
  ['包含', 'Number / String / Boolean / Undefined / Null / Symbol / BigInt', '普通对象 / 数组 / 函数 / Date / RegExp / Map / Set'],
]

const VALUE_VS_REF_CODE = `// 原始类型：拷贝的是「值」
let a = 1
let b = a
b = 2
console.log(a)        // 1  ← a 不受影响

// 引用类型：拷贝的是「地址」
let o1 = { n: 1 }
let o2 = o1
o2.n = 2
console.log(o1.n)     // 2  ← o1 被改了

// 比较：原始比值，引用比地址
1 === 1               // true
'x' === 'x'           // true
{} === {}             // false（两个不同对象）
[] === []             // false
NaN === NaN           // false（NaN 连自己都不等）`

export default function MemoryDemo() {
  const [picked, setPicked] = useState('number')
  const [era, setEra] = useState(2)
  const pickedType = typeById(picked)

  return (
    <div className="demo-wrap jst-root">
      <div className="demo-header">
        <h2>🧠 记忆法 · 四条钩子，任选顺手的</h2>
        <p className="demo-sub">
          别孤立地背 8 个英文单词。先记<b>结构（1 + 7）</b>，再用<b>口诀</b>把 7 个原始类型串起来，
          最后用<b>时间线</b>确认自己没漏 ES6 / ES2020 新增的那两个。
        </p>
      </div>

      {/* 标准答案 */}
      <section className="jst-block">
        <h3>🎯 面试标准答案（先背这一句）</h3>
        <div className="jst-answer">
          JS 共有 <b>8</b> 种数据类型 =
          <span className="jst-answer-part jst-answer-prim">
            <b>7</b> 种原始类型：Number、String、Boolean、Undefined、Null、Symbol、BigInt
          </span>
          <span className="jst-answer-part jst-answer-obj">
            <b>1</b> 种引用类型：Object（数组、函数、日期、正则、Map/Set 都属于它）
          </span>
        </div>
        <p className="jst-note">
          加分说法：「按<b>存储方式</b>分成原始类型和引用类型；原始类型存值本身、不可变，引用类型存堆地址、可变。
          其中 Symbol 是 ES6 新增、BigInt 是 ES2020 新增。」
        </p>
      </section>

      {/* 分类树 */}
      <section className="jst-block">
        <h3>🌳 结构钩子：1 + 7（7 个原始类型 = 一周七天）</h3>
        <div className="jst-tree">
          <div className="jst-tree-root">JavaScript 数据类型（8 种）</div>
          <div className="jst-tree-branches">
            <div className="jst-tree-col">
              <div className="jst-tree-label jst-tree-label-prim">原始类型 Primitive · 7</div>
              <div className="jst-tree-leaves">
                {PRIMITIVE_TYPES.map((t) => (
                  <button
                    key={t.id}
                    className={'jst-leaf' + (t.id === picked ? ' jst-leaf-on' : '')}
                    onClick={() => setPicked(t.id)}
                  >
                    {t.icon} {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="jst-tree-col">
              <div className="jst-tree-label jst-tree-label-obj">引用类型 Reference · 1</div>
              <div className="jst-tree-leaves">
                <button
                  className={'jst-leaf' + (picked === 'object' ? ' jst-leaf-on' : '')}
                  onClick={() => setPicked('object')}
                >
                  📦 Object
                </button>
                <span className="jst-tree-sub">├ 数组 Array<br />├ 函数 Function<br />├ Date / RegExp<br />└ Map / Set / 普通对象</span>
              </div>
            </div>
          </div>
        </div>
        {pickedType && (
          <div className="jst-leaf-detail">
            <div className="jst-leaf-title">
              <b>{pickedType.icon} {pickedType.name}（{pickedType.cn}）</b>
              <span className="jst-leaf-es">{pickedType.es} 引入</span>
            </div>
            <div>{pickedType.clue}</div>
            <div className="jst-leaf-key">⚠️ 考点：{pickedType.key}</div>
          </div>
        )}
      </section>

      {/* 口诀 */}
      <section className="jst-block">
        <h3>🗣️ 口诀钩子：数 字 布 未 空 符 大</h3>
        <p className="jst-note">
          谐音读成一句话更好记：<b className="jst-homo">「书字不为空，付大款」</b>
          ——每个字对应一个原始类型，点一下看是谁。
        </p>
        <div className="jst-mnemo">
          {MNEMONIC.map((m) => {
            const t = typeById(m.id)
            return (
              <button
                key={m.id}
                className={'jst-char' + (m.id === picked ? ' jst-char-on' : '')}
                onClick={() => setPicked(m.id)}
              >
                <span className="jst-char-main">{m.char}</span>
                <span className="jst-char-homo">谐音「{m.homo}」</span>
                <span className="jst-char-type">{t.icon} {t.name}</span>
              </button>
            )
          })}
          <div className="jst-char jst-char-plus">
            <span className="jst-char-main">＋</span>
            <span className="jst-char-homo">第 8 个</span>
            <span className="jst-char-type">📦 Object</span>
          </div>
        </div>
        <p className="jst-note">
          英文首字母版（7 个原始类型）：<b>S</b>tring <b>N</b>umber <b>B</b>oolean <b>U</b>ndefined
          <b> N</b>ull <b>S</b>ymbol <b>B</b>igInt → 记成一句话
          <b className="jst-homo"> “Super Ninjas Break Under No Stress, Breathe”</b>。
        </p>
      </section>

      {/* 时间线 */}
      <section className="jst-block">
        <h3>📅 时间钩子：5 → 6 → 7（按年代记，顺便答出「ES6 新增了什么」）</h3>
        <div className="jst-timeline">
          {TIMELINE.map((t, i) => (
            <button
              key={t.era}
              className={'jst-tl' + (i === era ? ' jst-tl-on' : '')}
              onClick={() => setEra(i)}
            >
              <span className="jst-tl-era">{t.era}</span>
              <span className="jst-tl-total">{t.total}</span>
              <span className="jst-tl-new">
                {i === 0 ? '原始五样：Number / String / Boolean / Undefined / Null' : `新增：${t.ids.map((id) => typeById(id).name).join('、')}`}
              </span>
            </button>
          ))}
        </div>
        <p className="jst-note">👉 {TIMELINE[era].note}</p>
      </section>

      {/* 语义分组 */}
      <section className="jst-block">
        <h3>🧩 语义钩子：按「它是干嘛的」分成 4 组</h3>
        <div className="jst-families">
          {FAMILIES.map((f) => (
            <div key={f.name} className="jst-family">
              <div className="jst-family-name">{f.icon} {f.name}</div>
              <div className="jst-family-types">
                {f.ids.map((id) => {
                  const t = typeById(id)
                  return <span key={id} className="jst-pill">{t.icon} {t.name}</span>
                })}
              </div>
              <div className="jst-family-say">{f.say}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 原始 vs 引用 */}
      <section className="jst-block">
        <h3>⚖️ 原始 vs 引用（面试官一定会追问）</h3>
        <table className="jst-table">
          <thead>
            <tr><th>维度</th><th>原始类型（7 种）</th><th>引用类型（Object）</th></tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((r) => (
              <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>
            ))}
          </tbody>
        </table>
        <pre className="code">{VALUE_VS_REF_CODE}</pre>
        <p className="jst-note">
          易错点：JS <b>只有值传递</b>。把对象传进函数，传的是「地址的副本」——函数内改属性能影响外面，
          但给参数<b>重新赋值</b>不会影响外面的变量。
        </p>
      </section>

      {/* 练习路线 */}
      <section className="jst-block">
        <h3>🔁 怎么练才不会再忘（间隔提取）</h3>
        <ol className="jst-steps">
          <li><b>现在</b>：读完本页，去 <b>✍️ 默写挑战</b> 用 🔴 纯默写测一次真实水平。</li>
          <li><b>10 分钟后</b>：再默写一次，只看错题的「错因」，不要直接看答案。</li>
          <li><b>睡前</b>：用 <b>🃏 闪卡速记</b> 过一遍，把不熟的卡标出来（会自动存起来）。</li>
          <li><b>第 2 天 / 第 4 天 / 第 7 天</b>：各默写一次。<b>提取 3 次以上，基本就长住了。</b></li>
        </ol>
        <p className="jst-note">
          全站 8 种类型总览（便于扫一眼复习）：
          {DATA_TYPES.map((t) => `${t.icon}${t.name}`).join(' · ')}
        </p>
      </section>
    </div>
  )
}
