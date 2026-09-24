/* =========================================================
 * 共享纯函数与数据：CSS 选择器与优先级
 * ---------------------------------------------------------
 * 含一个「简化版特异性计算器」和 6 组「实跑对拍」数据。
 * 只放普通 JS（无组件），满足 react-refresh 约定。
 * ========================================================= */

/* ---------- 权重计算器 ----------
 * 返回 [ID列, 类列, 标签列]，展示为四元组 (0, a, b, c)。
 * 覆盖常见语法：#id、.class、[attr]、:伪类、::伪元素、标签、
 * :is()/:not()（按规范取参数里最高者）、:where()（整体计 0）、*（计 0）。
 * 限制：函数式伪类参数不支持再嵌套括号，教学场景够用。 */

// 不含 :is/:not/:where 的普通选择器计数
function countSimple(selector) {
  let s = selector
  const take = (re) => {
    const m = s.match(re) || []
    s = s.replace(re, ' ')
    return m.length
  }

  const pseudoElem = take(/::[A-Za-z-]+/g)                 // 伪元素 → 标签列
  const ids = take(/#[A-Za-z_-][\w-]*/g)                   // ID 列
  const classes = take(/\.[A-Za-z_-][\w-]*/g)              // 类列：.class
  const attrs = take(/\[[^\]]+\]/g)                        // 类列：[属性]
  const pseudoClasses = take(/:[A-Za-z-]+(\([^()]*\))?/g)  // 类列：:伪类
  // 剩下的字母词只剩标签名（* 和组合符 > + ~ 不匹配字母开头）
  const types = take(/\b[A-Za-z][A-Za-z0-9-]*\b/g)

  return [ids, classes + attrs + pseudoClasses, types + pseudoElem]
}

export function calcSpecificity(selector) {
  let s = selector.trim()
  if (!s) return null
  // :where(...) 整体贡献 0，先整段删掉
  s = s.replace(/:where\([^()]*\)/g, ' ')
  // :is(...) / :not(...)：递归算每个参数的权重，取最高者累加（规范行为）
  let extra = [0, 0, 0]
  s = s.replace(/:(?:is|not)\(([^()]*)\)/g, (_, args) => {
    let best = [0, 0, 0]
    for (const arg of args.split(',')) {
      const t = calcSpecificity(arg)
      if (t && compareTuples(t, best) > 0) best = t
    }
    extra = extra.map((n, i) => n + best[i])
    return ' '
  })
  return countSimple(s).map((n, i) => n + extra[i])
}

// 元组逐列比较：大的赢，全等返回 0
export function compareTuples(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1
  }
  return 0
}

export function fmtTuple(t) {
  return `(0, ${t[0]}, ${t[1]}, ${t[2]})`
}

/* ---------- 实跑对拍：6 组真实竞争的规则 ----------
 * rules 数组顺序 = styles.css 中实际书写顺序（同源顺序对拍靠它）。
 * sample 描述被样式作用的真实 DOM，渲染出的颜色就是浏览器
 * 层叠引擎算出来的最终结果，与计算器预测对拍。 */
export const DUELS = [
  {
    id: 'd1',
    title: '对决 ① 标签 vs 类',
    rules: [{ sel: '.cse-live-1 p' }, { sel: '.cse-live-1 .t' }],
    sample: { wrap: 'cse-live-1', tag: 'p', props: { className: 't' } },
    note: '类在「类列」，比标签的「标签列」高一个数量级——.t 赢，和谁在前谁在后无关。',
  },
  {
    id: 'd2',
    title: '对决 ② 类 vs ID',
    rules: [{ sel: '.cse-live-2 .t' }, { sel: '#cse-id2' }],
    sample: { wrap: 'cse-live-2', tag: 'p', props: { className: 't', id: 'cse-id2' } },
    note: '一个 #id 顶一百个 class——ID 列先比，两个类的复合也压不过一个 ID。',
  },
  {
    id: 'd3',
    title: '对决 ③ 权重打平 → 后来者居上',
    rules: [{ sel: '.cse-live-3 .first' }, { sel: '.cse-live-3 .second' }],
    sample: { wrap: 'cse-live-3', tag: 'p', props: { className: 't first second' } },
    note: '元组完全相同，比书写顺序：styles.css 里 .second 写在后面，它赢。改颜色靠调整顺序不如降低前者权重。',
  },
  {
    id: 'd4',
    title: '对决 ④ :is() vs :where()',
    rules: [
      { sel: '.cse-live-4 .t' },
      { sel: ':is(#cse-box4, .cse-live-4) .t' },
      { sel: ':where(#cse-box4) .t' },
    ],
    sample: { wrap: 'cse-live-4', tag: 'p', props: { className: 't' }, wrapId: 'cse-box4' },
    note: '同一个 #id：装进 :is() 权重照算（取参数最高者，赢），装进 :where() 一律清零（反而垫底）。',
  },
  {
    id: 'd5',
    title: '对决 ⑤ !important 掀桌',
    rules: [{ sel: '#cse-id5' }, { sel: '.cse-live-5 .t', important: true }],
    sample: { wrap: 'cse-live-5', tag: 'p', props: { className: 't', id: 'cse-id5' } },
    note: 'ID 权重远高于类，但类那条带 !important——正常权重全部让路。它是逃生舱不是日常工具。',
  },
  {
    id: 'd6',
    title: '对决 ⑥ 属性 vs 类：同列打平',
    rules: [{ sel: "[data-cse-role='hero']" }, { sel: '.cse-attr6' }],
    sample: { wrap: 'cse-live-6', tag: 'p', props: { className: 't cse-attr6', 'data-cse-role': 'hero' } },
    note: '[属性]、.类、:伪类三者同属「类列」权重相等，只能靠书写顺序定输赢——后写的 .cse-attr6 赢。',
  },
]

// 判定胜者：先分流 !important 组，组内比元组，打平取书写靠后的
export function judgeWinner(rules) {
  const scored = rules.map((r, i) => ({ i, t: calcSpecificity(r.sel), imp: !!r.important }))
  const imp = scored.filter((s) => s.imp)
  const pool = imp.length ? imp : scored
  let win = pool[0]
  for (const s of pool.slice(1)) {
    const c = compareTuples(s.t, win.t)
    if (c > 0 || (c === 0 && s.i > win.i)) win = s
  }
  return win.i
}

// 判定原因描述
export function judgeReason(rules, winIdx) {
  const win = rules[winIdx]
  if (win.important) return '!important 直接掀桌，无视正常权重'
  const others = rules.filter((_, i) => i !== winIdx)
  const winT = calcSpecificity(win.sel)
  if (others.some((r) => compareTuples(winT, calcSpecificity(r.sel)) === 0)) {
    return '权重打平，书写顺序靠后者居上'
  }
  return '权重更高，直接获胜'
}

/* ---------- 权重计算器预选用例 ---------- */
export const CALC_PRESETS = [
  'div.nav a',
  '#app .btn:hover',
  'ul li:first-child',
  ':is(h2, #x) span',
  'a[href^="https"]::after',
  '* + .card',
]
