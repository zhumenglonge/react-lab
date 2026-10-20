/* =========================================================
 * 🎯 面试总结：话术模板 + 手写代码 + 高频追问
 * ---------------------------------------------------------
 * 答题框架：先给首选方案 → 主动覆盖特殊值 → 给 ES5 备选 → 收在复杂度。
 * ========================================================= */

export default function Summary() {
  return (
    <div className="dedup-root dedup-summary">
      <div className="demo-header">
        <h2>🎯 30 秒答完这题，再把追问接住</h2>
        <p className="demo-sub">
          数字数组去重本身只有一行，面试考的是<b>你知不知道每行背后的判等规则和代价</b>。
        </p>
      </div>

      <section className="dedup-block">
        <h3>话术模板（首选方案 + 特殊值 + 备选 + 复杂度）</h3>
        <blockquote className="dedup-quote">
          <p>
            「最简写法是 <code>[...new Set(arr)]</code>，一行搞定，Set 内部用 <b>SameValueZero</b> 判等，
            所以 <b>NaN 也能被去掉</b>，时间复杂度 O(n)、保持稳定顺序。」
          </p>
          <p>
            「如果是 ES5 环境，我用 indexOf 双循环或 filter + indexOf，但要先说清代价：
            一是 <b>O(n²)</b>，大数据量我会换 Map 标记把查找降回 O(1)；
            二是 indexOf 用 === 比较，NaN !== NaN，会让 NaN 失真（双循环把它全保留、filter 又全丢掉），需要先做哨兵替换。」
          </p>
          <p>
            「另外两个细节：+0 和 -0 在 === 和 SameValueZero 下都相等，任何写法都只会留一个；
            sort + 相邻比较虽然 O(n log n) 但会<b>打乱原序</b>，我不推荐。若题目扩展到对象数组，
            Set 按引用判等会失手，要按业务 id 用 Map 去重。」
          </p>
        </blockquote>
      </section>

      <section className="dedup-block">
        <h3>手写区：面试纸上要能默写出来的两段</h3>
        <pre className="dedup-code dedup-code-full">{`// ES6 首选
const unique = (arr) => [...new Set(arr)]

// ES5 经典（能去重 NaN 的安全版：indexOf 判重 + NaN 单独放行）
function uniqueES5(arr) {
  const res = []
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i]
    // NaN 时 res 里 indexOf 永远 -1，用 Number.isNaN 兜底：已有一个 NaN 就跳过
    const seen = Number.isNaN(v)
      ? res.some(x => Number.isNaN(x))
      : res.indexOf(v) !== -1
    if (!seen) res.push(v)
  }
  return res
}`}</pre>
      </section>

      <section className="dedup-block">
        <h3>高频追问</h3>
        <ul className="dedup-list">
          <li><b>「Set 去重的原理？」</b>Set 是键唯一的数据结构，判等用 SameValueZero：NaN 与自己相等、+0 与 -0 相等；展开 <code>[...set]</code> 按插入序返回，所以稳定保序。</li>
          <li><b>「SameValueZero 和 === 差在哪？」</b>就差两点：NaN 与 NaN 视为相等（=== 为 false）；+0 与 -0 视为相等（同 ===）。Object.is 则把 +0/-0 判为不等 —— 三者对比是连环追问点。</li>
          <li><b>「数组 10 万项，你的 filter + indexOf 卡了，怎么办？」</b>indexOf 每项都要线性扫结果数组，O(n²)；换 Set 或 Map 标记降到 O(n)——本页「性能基准」栏实测：Set 5 万项约几毫秒，indexOf 只敢喂 5 千项。</li>
          <li><b>「顺便统计每个数出现次数？」</b>Map 计数：seen.set(v, (seen.get(v) ?? 0) + 1)，去重和计数一次遍历同时完成。</li>
          <li><b>「对象数组按 id 去重？」</b>Map 以 id 为键：arr.filter(x =&gt; !seen.has(x.id) &amp;&amp; seen.set(x.id, 1))，或 reduce 成 Map 再取 values。</li>
          <li><b>「不用 Set/Map 还有招？」</b>sort 后相邻比较（牺牲原序）；或对象键技巧 <code>{'const map = {}; arr.forEach(v => map[v] = v)'}</code>（数字键可行，但 1 和 '1' 会互撞，是隐藏坑）。</li>
        </ul>
      </section>
    </div>
  )
}
