/* =========================================================
 * 🎯 面试总结：for...in vs for...of
 * 作用域挂在 .fio-summary 下，样式随本主题懒加载，不依赖其它主题。
 * ========================================================= */

// 高频追问点（模块级常量，未导出，符合 react-refresh 约定）
const NOTES = [
  {
    q: 'for...in 的顺序到底靠不靠谱？',
    a: '规范层面 for...in 不保证顺序。V8 的实际表现是：整数索引按数值升序排前面，字符串键按插入顺序，二者混在一起时顺序可能不符合直觉。真要确定顺序，用 Object.keys(obj).sort() 或改用 for...of 遍历可迭代结构。',
  },
  {
    q: '为什么 for...in 里要写 hasOwnProperty？',
    a: '因为 for...in 会连同原型链上可枚举属性一起枚举。如果有人在 Array.prototype / Object.prototype 上加了可枚举属性，就会被带出来。用 Object.prototype.hasOwnProperty.call(obj, k) 过滤，只保留自有属性。',
  },
  {
    q: 'for...of 靠什么工作？能迭代自定义对象吗？',
    a: '靠 Symbol.iterator：先取 obj[Symbol.iterator]() 拿到迭代器，再反复调用它的 next() 直到 done。给普通对象挂一个 [Symbol.iterator] 生成器，就能被 for...of 遍历——这也是 Vue3/JS 里「可迭代协议」的核心。',
  },
  {
    q: 'Object.keys / values / entries 和它俩什么关系？',
    a: '它们只返回自有可枚举属性、不看原型链，再配合 forEach 或 for...of 使用，是当下遍历对象的推荐写法，比裸 for...in 更安全（省掉 hasOwnProperty）。',
  },
  {
    q: '遍历数组该选哪个？',
    a: '要值用 for...of 或 forEach，要索引和普通 for 语义用经典 for。不要用 for...in 遍历数组——它给的是字符串下标，还会混入非索引自定义属性，顺序也不保证。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap fio-root fio-summary">
      <section className="fio-block">
        <h3>🧠 一句话本质</h3>
        <p className="fio-lead">
          <b>for...in 遍历「键名」（含原型链），for...of 遍历「值」（走 Symbol.iterator）。</b>
          一个为<b>对象</b>服务，一个为<b>可迭代对象</b>（数组 / 字符串 / Map / Set…）服务。
          口诀：<b>in 看 index，of 看 value</b>。
        </p>
      </section>

      <section className="fio-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="fio-list">
          {NOTES.map((n) => (
            <li key={n.q}>
              <b>{n.q}</b>
              {n.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="fio-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="fio-quote">
          <p>
            "<b>for...in</b> 遍历的是对象<b>可枚举属性的键名</b>，而且是<b>连原型链一起</b>枚举，
            所以内部通常要配 <code>hasOwnProperty</code> 过滤；它主要为<b>普通对象</b>设计，
            拿来遍历数组会拿到字符串下标、还会混进自定义属性，是个坑。"
          </p>
          <p>
            "<b>for...of</b> 遍历的是<b>值</b>，基于 <code>Symbol.iterator</code> 迭代器协议，
            支持数组、字符串、Map、Set、TypedArray 这些可迭代对象，顺序有保证，还能
            <code>break / continue / return</code>。直接怼普通对象会抛 “is not iterable”，
            因为对象默认没有 Symbol.iterator，得先 <code>Object.keys/entries</code> 转一下。"
          </p>
          <p>
            "所以选型很简单：<b>遍历对象用 for...in（或 Object.keys），遍历数组/集合用 for...of</b>；
            要确定顺序、要避免原型链污染，现代写法更推荐 <code>Object.keys/values/entries</code> 配合循环。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
