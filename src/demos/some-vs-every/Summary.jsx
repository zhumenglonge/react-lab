/* =========================================================
 * 🎯 面试总结：some vs every
 * 作用域挂在 .soe-summary 下，样式随本主题懒加载。
 * ========================================================= */

const NOTES = [
  {
    q: 'some 和 every 的返回值是什么？会不会修改原数组？',
    a: '都返回布尔值，且都是非破坏性的——不改变原数组，只读取。回调参数为 (value, index, array)，可选第二个入参当作回调里的 this。',
  },
  {
    q: '它们和 find / filter 怎么区分？',
    a: 'some/every 回答「有没有 / 是不是都」→ 布尔；find 回答「第一个满足的是哪个」→ 元素或 undefined；filter 回答「满足的都有哪些」→ 新数组。要布尔用前者，要数据用后者。',
  },
  {
    q: '空数组 [] 上 some / every 分别是什么？',
    a: '[].some(any) 为 false，[].every(any) 为 true，且都不执行回调。every 的这个「空真」是逻辑学上的 vacuous truth，面试最爱考。',
  },
  {
    q: '两者有什么短路特性？性能上要注意什么？',
    a: 'some 命中第一个 true 即停，every 遇到第一个 false 即停，都不保证遍历完整个数组。所以别指望它们的回调被调用固定次数，更不能在回调里做累加/收集。',
  },
  {
    q: '能用其他方式实现吗？',
    a: '能。arr.some(p) ≈ arr.filter(p).length > 0（但 filter 不短路、更慢）；也可用 for...of 手写提前 return。原生 some/every 既简洁又能短路，是首选。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap soe-root soe-summary">
      <section className="soe-block">
        <h3>🧠 一句话本质</h3>
        <p className="soe-lead">
          <b>some 判「存在」（找到一个真的就返回 true），every 判「全部」（找到一个假的就返回 false）</b>
          ，都返回布尔、都不改原数组、都会短路。口诀：
          <b>some = 有没有，every = 是不是都</b>。
        </p>
      </section>

      <section className="soe-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="soe-list">
          {NOTES.map((n) => (
            <li key={n.q}>
              <b>{n.q}</b>
              {n.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="soe-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="soe-quote">
          <p>
            "<b>some</b> 和 <b>every</b> 都是数组方法，接收一个返回布尔的谓词，最终<b>返回布尔值</b>，
            且都不会修改原数组。区别是：<code>some</code> 只要<b>存在一个</b>元素满足就返回 true（存在即真），
            <code>every</code> 要<b>所有</b>元素都满足才返回 true（全真才真）。"
          </p>
          <p>
            "它们都<b>短路</b>：some 找到第一个满足的就停，every 找到第一个不满足的就停，
            所以回调不保证对每个元素都执行——也因此不能用它俩来做累加或收集，那种需求要用
            <code>forEach</code> / <code>filter</code> / <code>reduce</code>。"
          </p>
          <p>
            "最容易踩的是<b>空数组</b>：<code>[].every()</code> 恒为 true、<code>[].some()</code> 恒为 false
            且都不进回调。用 every 做「全部合法」校验时，空列表会被判成通过，需要先单独判
            <code>length &gt; 0</code>。另外要布尔结果用 some/every，要拿元素用 <code>find</code>，要拿子集用 <code>filter</code>。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
