/* =========================================================
 * 🧠 本质 · 家族对比 · 陷阱：some vs every
 * ---------------------------------------------------------
 * 纯静态讲解页，样式作用域挂在 .soe-root 下，随本主题懒加载。
 * ========================================================= */

// some / every 与「近亲 API」的横向对比
const COMPARE = [
  ['返回什么', '布尔值', '布尔值', '第一个满足的<b>元素</b>', '满足元素的<b>数组</b>'],
  ['判定逻辑', '<b>存在</b>一个满足即 true', '<b>全部</b>满足才 true', '找到第一个满足即返回', '挑出所有满足的'],
  ['能否短路', '✅ 命中即停', '✅ 遇假即停', '✅ 命中即停', '❌ 必须扫完'],
  ['空数组 []', 'false', 'true（空真）', 'undefined', '[]'],
  ['典型语义', '有没有 / 是否存在', '是不是都 / 是否全部', '取出那一个', '过滤子集'],
]

// 高频陷阱
const PITFALLS = [
  {
    t: '空数组：some 假、every 真',
    d: '[].some() === false，[].every() === true。every 的空真最反直觉——用它做「全部合法」校验前，先判 length > 0，否则空列表会被误判为通过。',
  },
  {
    t: '返回的是布尔值，不是元素',
    d: '想拿到「满足条件那一项」要用 find()（或索引用 findIndex()）；some/every 只回答「有没有 / 是不是都」。',
  },
  {
    t: '谓词返回的是 truthy/falsy，不是严格 true/false',
    d: '回调返回值会被转成布尔。写 v => v.name 这种返回对象的看似能跑，但语义模糊，最好显式返回布尔。',
  },
  {
    t: '有短路，别在回调里写「副作用累积」',
    d: '因为一旦判定就停止遍历，用 some/every 累加计数、收集结果会得到不完整的数据——那种需求该用 forEach / reduce / filter。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap soe-root soe-essence">
      <section className="soe-block">
        <h3>🧠 一句话本质</h3>
        <p className="soe-lead">
          <b>some = 「存在性」判断（存在即真），every = 「一致性」判断（全真才真）。</b>
          两者都是数组方法，接收一个<b>谓词函数</b>，返回<b>布尔值</b>，且都<b>短路</b>：
          some 遇到第一个让谓词为真的元素就返回 true，every 遇到第一个为假的就返回 false。
          互为对偶：<code>!arr.some(x =&gt; !p(x)) === arr.every(p)</code>。
        </p>
      </section>

      <section className="soe-block">
        <h3>⚔️ some / every / find / filter</h3>
        <table className="soe-compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>some()</th>
              <th>every()</th>
              <th>find()</th>
              <th>filter()</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                {r.slice(1).map((c, i) => (
                  <td key={i} dangerouslySetInnerHTML={{ __html: c }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="soe-block">
        <h3>⚠️ 高频陷阱</h3>
        <ul className="soe-list">
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
