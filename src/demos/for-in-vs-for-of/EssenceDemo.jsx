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
    </div>
  )
}
