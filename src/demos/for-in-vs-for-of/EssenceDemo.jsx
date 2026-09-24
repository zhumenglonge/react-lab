/* =========================================================
 * 🧠 本质 · 选型 · 陷阱：for...in vs for...of
 * ---------------------------------------------------------
 * 纯静态讲解页，样式作用域挂在 .fio-root 下，随本主题懒加载。
 * ========================================================= */

// for...in 遍历「键名」，for...of 遍历「值」——按维度拉平对比
const COMPARE = [
  ['遍历的东西', '可枚举属性的<b>键名</b>（字符串）', '可迭代对象的<b>值</b>'],
  ['底层机制', '属性枚举（含原型链）', 'Symbol.iterator 迭代器协议'],
  ['为谁而生', '普通对象 object', '数组 / 字符串 / Map / Set / TypedArray 等'],
  ['遍历数组', "得到 '0'/'1'/'2' 下标字符串", '得到每个元素值'],
  ['遍历对象', '✅ 拿到各个 key', '❌ 抛 TypeError（不可迭代）'],
  ['遍历 Map/Set', '❌ 枚举不到（无可枚举属性）', '✅ 拿到值 / [键,值]'],
  ['原型链属性', '⚠️ 会被一起枚举，需 hasOwnProperty', '不涉及（走迭代器）'],
  ['顺序', '不保证（现代引擎多为插入序，但规范不保证）', '保证（迭代器定义）'],
  ['能拿到索引', '把 key 转成数字即可', '配 entries()：for (const [i,v] of a.entries())'],
]

// 该用哪个：一句话决策
const WHEN = [
  { s: '遍历数组 / 字符串 / Map / Set 的「值」', use: 'for...of', why: '拿到的是值本身，顺序可控，还能 break / continue / return' },
  { s: '遍历普通对象的「键」', use: 'for...in + hasOwnProperty', why: '或直接用 Object.keys / Object.entries，更省心也不会漏过滤' },
  { s: '需要索引来配合计算', use: '普通 for 或 for...of + entries()', why: 'for...in 的下标是字符串，做算术要小心' },
]

// 高频陷阱
const PITFALLS = [
  {
    t: 'for...in 会滚到原型链上',
    d: '它枚举所有「可枚举属性」，包括从原型继承来的。所以老代码里 for...in 内部几乎必写一句 if (!obj.hasOwnProperty(k)) continue 来挡掉继承属性。',
  },
  {
    t: 'for...in 遍历数组是坑',
    d: "拿到的是下标字符串 '0'、'1'，还会把 arr.extra 这种非索引自定义属性也带进来，顺序也不保证。遍历数组请老老实实用 for...of 或 forEach。",
  },
  {
    t: 'for...of 直接怼普通对象会报错',
    d: '对象没有 Symbol.iterator，for (const x of {}) 抛 "is not iterable"。想迭代对象得先 Object.keys/entries 转一下，或给它自定义 Symbol.iterator。',
  },
  {
    t: '想中途 break？别用 forEach',
    d: 'for...in 和 for...of 都是原生语句，天然支持 break / continue / return；而 forEach 靠回调，无法中途跳出（只能靠抛异常等骚操作）。这也是「为什么有 for...of 还要 forEach」的常见追问点。',
  },
]

/* ---------- 附录：Map / Set 快速了解 ---------- */

// 三者按维度拉平：存什么、迭代产出什么、和 in/of 的关系
const MAP_COMPARE = [
  ['存的是什么', '键值对（键只能是 string/symbol）', '键值对（键可以是<b>任意类型</b>）', '<b>不重复的值</b>（只有值没有键）'],
  ['数据存在哪', '属性上（for...in 可枚举）', '内部存储，<b>不是属性</b>', '内部存储，<b>不是属性</b>'],
  ['for...in', '✅ 拿到各 key', '❌ 空手而归', '❌ 空手而归'],
  ['for...of 产出', '❌ 抛错（无 Symbol.iterator）', '[键, 值] 数组（默认 entries()）', '每个值本身'],
  ['顺序 / 计数', '数字键会被抢先排序 / 数 Object.keys', '严格插入顺序 / size 直接读', '插入顺序 / size'],
  ['典型用途', '固定形状的数据、JSON 交互', '对象当键、动态映射、计数器', '<b>去重</b>：[...new Set(arr)]'],
]

// 什么时候用 Map / WeakMap，Set 与 Map 的关系一句话
const MAP_NOTES = [
  {
    t: '为什么 in / of 在 Map 上表现反差这么大？',
    d: 'Map 把键值对存在引擎内部存储里，对象身上一个可枚举属性都没有，所以「枚举属性」的 for...in 一无所获；而它实现了 Symbol.iterator（默认指向 entries()，每次吐出 [键, 值] 数组），所以「消费迭代器」的 for...of 能同时拿到键和值——这不是语法魔法，是 Map 迭代器协议的约定。Set 同理，只是它的迭代器产出的是值本身。',
  },
  {
    t: '什么时候用 Map 而不是普通对象？',
    d: '① 键想用对象/数字/NaN 当（对象键会被强转字符串撞车）；② 需要可靠的插入顺序和 O(1) 的 size；③ 频繁增删的映射（计数器、缓存）；④ 键来自用户输入，怕 __proto__ 原型污染。反过来：固定形状的数据、要和 JSON/API 打交道，还是用对象——JSON.stringify(map) 会得到 "{}"，需先 Object.fromEntries 转一下。',
  },
  {
    t: 'Set 和 Map 什么关系？',
    d: '可以理解为「只有值的 Map」：都是 ES6 哈希结构、都不可被 for...in 枚举、都可 for...of。Set 保证成员不重复（按 SameValueZero 判重），所以前端最常用的姿势就是 [...new Set(arr)] 一行去重，以及 has() 做 O(1) 存在性查询。',
  },
  {
    t: '追问延伸：有了 Map 为什么还有 WeakMap？',
    d: 'Map 会强引用住它的键——键对象在外面没用了也回收不掉，长生命周期的 Map 攒着短命对象就是内存泄漏。WeakMap 对键只持弱引用：键对象被 GC 时条目自动消失，代价是键只能是对象、没有 size、不可遍历。典型用途是给对象挂「附加私有数据」（DOM 节点元数据、库的内部状态）。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap fio-root fio-essence">
      <section className="fio-block">
        <h3>🧠 一句话本质</h3>
        <p className="fio-lead">
          <b>for...in 遍历「键」，为对象而生</b>——它枚举对象及其<b>原型链</b>上所有可枚举属性的
          字符串键名；<b>for...of 遍历「值」，为可迭代对象而生</b>——它依赖
          <code>Symbol.iterator</code> 迭代器协议，按顺序吐出数组 / 字符串 / Map / Set 等的值。
          记法：<b>in → index（键名）</b>，<b>of → value（值）</b>。
        </p>
      </section>

      <section className="fio-block">
        <h3>⚔️ 逐维度对比</h3>
        <table className="fio-compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>for...in</th>
              <th>for...of</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
                <td dangerouslySetInnerHTML={{ __html: r[2] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="fio-block">
        <h3>🧭 到底用哪个</h3>
        <ul className="fio-when">
          {WHEN.map((w) => (
            <li key={w.s}>
              <span className="fio-when-scene">{w.s}</span>
              <span className="fio-when-use">→ {w.use}</span>
              <span className="fio-when-why">{w.why}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="fio-block">
        <h3>⚠️ 高频陷阱</h3>
        <ul className="fio-list">
          {PITFALLS.map((p) => (
            <li key={p.t}>
              <b>{p.t}</b>
              {p.d}
            </li>
          ))}
        </ul>
      </section>

      <section className="fio-block">
        <h3>🗺️ 附录 · Map / Set 快速了解</h3>
        <p className="fio-lead">
          上面的对拍里 Map / Set 是最特别的两行：一个 <code>for...in</code> 空手而归、一个{' '}
          <code>for...of</code> 能同时产出键和值。这个附录把「Map 是什么、什么时候用、和 Set 怎么选」一次讲清。
        </p>
        <table className="fio-compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>普通对象</th>
              <th>Map</th>
              <th>Set</th>
            </tr>
          </thead>
          <tbody>
            {MAP_COMPARE.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                {r.slice(1).map((cell, i) => (
                  <td key={i} dangerouslySetInnerHTML={{ __html: cell }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="fio-block">
        <h3>🧩 Map / Set 追问延伸</h3>
        <ul className="fio-list">
          {MAP_NOTES.map((p) => (
            <li key={p.t}>
              <b>{p.t}</b>
              {p.d}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
