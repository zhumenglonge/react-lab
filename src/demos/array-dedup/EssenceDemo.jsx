import { DEDUP_METHODS, fmtArr, specialRun } from './shared.js'

/* =========================================================
 * 🧠 本质与陷阱
 * ---------------------------------------------------------
 * 去重的本质一句话：判重规则 + 从左到右扫描、只留首次出现。
 * 六种写法差的全是"判重规则"那一步（=== 还是 SameValueZero、
 * 查找 O(n) 还是 O(1)、动不动原始顺序），下面的特殊值对拍全当场真跑。
 * ========================================================= */

export default function EssenceDemo() {
  const sp = specialRun()

  return (
    <div className="dedup-root dedup-essence">
      <div className="demo-header">
        <h2>🧠 六种写法差在哪：判等规则 × 查找代价 × 保序</h2>
        <p className="demo-sub">
          写法可以背，但面试官追问<b>「NaN 怎么办？+0 和 -0 算不算重复？大数据量选哪个？？」</b>
          考的是判等规则 —— 这张表和三组真跑结果把差异全部摊开。
        </p>
      </div>

      <section className="dedup-block">
        <h3>① 方法对比总表</h3>
        <table className="dedup-table">
          <thead>
            <tr><th>方法</th><th>判等规则</th><th>时间量级</th><th>保持原顺序</th><th>NaN 能去掉吗</th></tr>
          </thead>
          <tbody>
            <tr><td>① Set 展开</td><td>SameValueZero</td><td>O(n)</td><td>✅</td><td>✅ 正确：只留一个</td></tr>
            <tr><td>② indexOf 双循环</td><td>===</td><td>O(n²)</td><td>✅</td><td>❌ 去不掉：每个 NaN 都保留</td></tr>
            <tr><td>③ filter + indexOf</td><td>===</td><td>O(n²)</td><td>✅</td><td>❌ 反而全丢：indexOf(NaN) 恒 -1</td></tr>
            <tr><td>④ Map 标记</td><td>SameValueZero</td><td>O(n)</td><td>✅</td><td>✅ 正确：只留一个</td></tr>
            <tr><td>⑤ sort + 相邻比较</td><td>!==（比较器遇 NaN 失效）</td><td>O(n log n)</td><td>❌ 被打乱</td><td>⚠️ 不可靠：常留两个 NaN</td></tr>
            <tr><td>⑥ reduce 版</td><td>includes → SameValueZero</td><td>O(n²)（还每步展开新数组）</td><td>✅</td><td>✅ 正确：只留一个</td></tr>
          </tbody>
        </table>
        <p className="dedup-tip">
          记忆钩子：<b>去掉 NaN 靠 SameValueZero（Set / Map / includes），去不掉 NaN 的是 ===（indexOf）</b>；
          ⑥ 虽用 includes 能去 NaN，但每步 <code>[...acc, v]</code> 都新建数组，是六种里最慢的。
        </p>
      </section>

      <section className="dedup-block">
        <h3>② 特殊值对拍（输入 {fmtArr(sp.input)}，浏览器真跑）</h3>
        <div className="dedup-results">
          {DEDUP_METHODS.map((m) => {
            const out = sp[m.key]
            // 真跑结果分三类：正确留一个 NaN / indexOf 全保留 / filter 全丢弃 / sort 不可靠
            const VERDICT = {
              set: ['ok', '✅ NaN 正好留一个'],
              map: ['ok', '✅ NaN 正好留一个'],
              reduce: ['ok', '✅ NaN 正好留一个'],
              indexOf: ['warn', '⚠️ NaN 全被保留'],
              filter: ['warn', '⚠️ NaN 全被丢失'],
              sort: ['warn', '⚠️ 顺序乱 + NaN 没塌干净'],
            }
            const [kind, label] = VERDICT[m.key]
            return (
              <div key={m.key} className="dedup-row">
                <div className="dedup-row-head">
                  <span className="dedup-row-name">{m.name}</span>
                  {kind === 'ok'
                    ? <span className="dedup-tag dedup-tag-ok">{label}</span>
                    : <span className="dedup-tag dedup-tag-warn">{label}</span>}
                </div>
                <code className="dedup-row-out">{fmtArr(out)}</code>
              </div>
            )
          })}
        </div>
        <p className="dedup-tip">
          注意 <b>0 与 -0</b>：所有方法输出里都只剩一个 <code>0</code> —— 因为 <code>+0 === -0</code> 为
          <b>true</b>，SameValueZero 也视它们相等，<b>没有任何去重写法能区分 +0/-0</b>（要区分只能 Object.is 自己做键）。
          再看 <b>NaN</b>：只有走 SameValueZero 的 ①④⑥ 能“正好留一个”；② 把两个 NaN 都留下、
          ③ 一个都不留、⑤ 因比较器返回 NaN 失效，连 <code>5</code> 都被挤到末尾——这三类失真就是面试里“为什么首选 Set”的硬理由。
        </p>
      </section>

      <section className="dedup-block">
        <h3>③ 判等规则本身，也真跑给你看</h3>
        <table className="dedup-table">
          <thead><tr><th>表达式</th><th>结果</th><th>说明</th></tr></thead>
          <tbody>
            <tr><td><code>new Set([NaN]).has(NaN)</code></td><td><b>{String(sp.setHasNaN)}</b></td><td>Set 用 SameValueZero，NaN 能命中</td></tr>
            <tr><td><code>new Map([[NaN, 1]]).has(NaN)</code></td><td><b>{String(sp.mapHasNaN)}</b></td><td>Map 同理，所以 ④ 能去 NaN</td></tr>
            <tr><td><code>[NaN].indexOf(NaN)</code></td><td><b>{String(sp.indexOfFindsNaN)}</b></td><td>-1：indexOf 用 ===，NaN !== NaN</td></tr>
            <tr><td><code>[NaN].includes(NaN)</code></td><td><b>{String(sp.includesFindsNaN)}</b></td><td>includes 反常地用 SameValueZero</td></tr>
            <tr><td><code>+0 === -0</code></td><td><b>{String(sp.zeroSame)}</b></td><td>所以任何方法都把 -0 当 0 的重复</td></tr>
          </tbody>
        </table>
      </section>

      <section className="dedup-block">
        <h3>④ 高频陷阱</h3>
        <div className="dedup-pit">
          <p className="dedup-pit-name">陷阱 1：NaN 遇上 indexOf 就失真（② 全保留 / ③ 全丢失）</p>
          <p className="dedup-pit-detail">②③ 都拿 indexOf 判重，而 indexOf 用 === 比较，NaN !== NaN，于是 NaN 永远“找不到”——但两者失真方向相反：② indexOf 双循环用 <code>indexOf(v) === -1</code>，NaN 永远满足条件→每个都保留（重复）；③ filter 用 <code>indexOf(v) === i</code>，而 indexOf(NaN) 恒为 -1 永远不等于下标→一个都不留。解法：换 Set（或 ES5 先 <code>arr.map(v =&gt; Number.isNaN(v) ? 'NaN哨兵' : v)</code>）。</p>
        </div>
        <div className="dedup-pit">
          <p className="dedup-pit-name">陷阱 2：sort 版默认比较是字典序</p>
          <p className="dedup-pit-detail"><code>[1, 10, 2].sort()</code> 得 [1, 10, 2]（比的是字符串）。数字数组必须传 <code>(a, b) =&gt; a - b</code>，而且 sort 会原地改原数组 —— 演示里先 [...arr] 拷贝就是这个原因。更坑的是：比较器遇到 NaN 返回 NaN 会破坏排序契约，⑤ 的真跑里两个 NaN 都没塌掉、连 5 也被挤到末尾。</p>
        </div>
        <div className="dedup-pit">
          <p className="dedup-pit-name">陷阱 3：去重同时还想保留每项的次数？</p>
          <p className="dedup-pit-detail">Set 会丢信息，Map 计数（frequency map）才能答这问。追问「统计每个数字出现次数再返回」时，④ 的 seen 从 true 换成计数即可 —— 这就是 Map 比 Set 强的地方。</p>
        </div>
        <div className="dedup-pit">
          <p className="dedup-pit-name">陷阱 4：题目不是纯数字时 Set 也会失手</p>
          <p className="dedup-pit-detail">本题限定数字数组所以 Set 通吃；若混入对象/数组，判等比的是引用，<code>{'[{a:1}, {a:1}]'}</code> 去重不了，要按 key 去重（Map 以 <code>JSON.stringify</code> 或业务 id 为键）。答题时先反问一句"数组里只有数字吗"是加分项。</p>
        </div>
      </section>
    </div>
  )
}
