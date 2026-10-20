import { MOVE_METHODS, DEFAULT_ARR, runMethod, truthyTrap, fmtArr } from './shared.js'

/* =========================================================
 * 🧠 本质与陷阱
 * ---------------------------------------------------------
 * 移动零的本质 = 双指针分区：slow 左边全是非零、(slow,fast) 之间全是零，
 * fast 探到非零就归位。三条面试硬要求——原地 / 单趟 / 保序——全指着这个不变式。
 * 最大陷阱：把"移动 0"写成"过滤 falsy"，误伤 false / '' / null。
 * ========================================================= */

export default function EssenceDemo() {
  const trap = truthyTrap()

  return (
    <div className="mz-root mz-essence">
      <div className="demo-header">
        <h2>🧠 本质是"分区不变式"，最大坑是"把 0 当 falsy"</h2>
        <p className="demo-sub">
          写法不难，面试官追问<b>「能原地吗？操作几次？非零顺序会变吗？数组里混 false/null 怎么办？」</b>
          考的就是下面的不变式和真值判断。
        </p>
      </div>

      <section className="mz-block">
        <h3>① 三条硬要求 × 三种写法（对题目 {fmtArr(DEFAULT_ARR)} 真跑）</h3>
        <table className="mz-table">
          <thead>
            <tr><th>写法</th><th>原地？</th><th>时间</th><th>额外空间</th><th>操作量</th><th>保持非零顺序</th></tr>
          </thead>
          <tbody>
            {MOVE_METHODS.map((m) => {
              const r = runMethod(m.key, DEFAULT_ARR)
              const inPlace = m.key !== 'filter'
              return (
                <tr key={m.key}>
                  <td>{m.name}</td>
                  <td>{inPlace ? '✅ 是' : '❌ 否（新建）'}</td>
                  <td>O(n)</td>
                  <td>{inPlace ? 'O(1)' : 'O(n)'}</td>
                  <td><b>{r.ops}</b> {r.opsKind}</td>
                  <td>✅</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="mz-tip">
          三种都能保序（都按"非零先出现、0 后补"的规则），差别在<b>原地与操作量</b>：
          交换版实测只 <b>{runMethod('swap', DEFAULT_ARR).ops} 次交换</b>，覆盖写版 <b>{runMethod('write', DEFAULT_ARR).ops} 次赋值</b>
          （= 数组长度，每个元素被写一次），filter 版虽一行但要<b>新建数组 + 双趟遍历</b>。
          题目若明确"必须原地、操作最少"，就选交换/覆盖写，别交 filter。
        </p>
      </section>

      <section className="mz-block">
        <h3>② 双指针的"分区不变式"（背这一句就够）</h3>
        <p className="mz-lead">
          任何时刻：<code>arr[0 .. slow-1]</code> 全是<b>已就位的非零</b>，
          <code>arr[slow .. fast-1]</code> 全是<b>0</b>，<code>arr[fast]</code> 正在检查。
          fast 一路右移：遇到 0 什么都不做（0 自动留在中间区），遇到非零就把它<b>换到 slow 位</b>并 slow++。
          一趟走完，非零全聚在左边且相对顺序不变，0 全被挤到右边 —— 这正是"移动零"的定义。
        </p>
      </section>

      <section className="mz-block">
        <h3>③ truthy 陷阱：把 {fmtArr(trap.input)} 真跑给你看</h3>
        <div className="mz-duel">
          <div className="mz-duel-side mz-duel-bad">
            <p className="mz-duel-title">❌ 写成"过滤 falsy"（filter(Boolean) / if(v)）</p>
            <code className="mz-duel-readout">{fmtArr(trap.wrongTruthy)}</code>
            <p className="mz-duel-note">false、null 也被当成 0 移走了 —— 数据丢了。</p>
          </div>
          <div className="mz-duel-side mz-duel-good">
            <p className="mz-duel-title">✅ 只认数字 0（v !== 0）</p>
            <code className="mz-duel-readout">{fmtArr(trap.correct)}</code>
            <p className="mz-duel-note">false、null 属于"非零"，留在原位。</p>
          </div>
        </div>
        <table className="mz-table">
          <thead><tr><th>值</th><th>!v（是否 falsy）</th><th>v === 0</th><th>结论</th></tr></thead>
          <tbody>
            {trap.isFalsyButNotZero.map((x) => (
              <tr key={x.val}>
                <td><code>{x.val}</code></td>
                <td>{x.falsy ? 'true' : 'false'}</td>
                <td>{x.eqZero ? 'true' : 'false'}</td>
                <td>{x.eqZero ? '是零，该移' : 'falsy 但不是 0，不该移'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mz-tip">
          判据永远写 <code>v !== 0</code>，别图省事写 <code>if (v)</code>。另外 <code>-0 === 0</code> 为
          <b>{String(trap.negZeroEqZero)}</b>，所以"移动 0"会连 <code>-0</code> 一起移（一般正是想要的）。
        </p>
      </section>

      <section className="mz-block">
        <h3>④ 高频陷阱</h3>
        <div className="mz-pit">
          <p className="mz-pit-name">陷阱 1：用 splice + push 边删边加，下标错乱</p>
          <p className="mz-pit-detail">for 循环里 <code>arr.splice(i,1)</code> 会让后面元素左移、i 却继续 ++，直接漏检。要删零要么倒序遍历，要么用双指针别动长度。</p>
        </div>
        <div className="mz-pit">
          <p className="mz-pit-name">陷阱 2：覆盖写版忘了"补零"</p>
          <p className="mz-pit-detail">只把非零拷到前面，尾部旧值还在（默认题变成 [1,2,4,5,6,<b>5</b>,<b>6</b>]）。必须从 slow 起把剩余位置显式置 0。</p>
        </div>
        <div className="mz-pit">
          <p className="mz-pit-name">陷阱 3：交换版非零顺序会变吗？—— 不会</p>
          <p className="mz-pit-detail">slow 只在遇到非零时 ++，非零总是按出现的先后被换到更靠前的空位，相对顺序天然保持。真正会变顺序的是"从两端向中间"那种写法，别用。</p>
        </div>
        <div className="mz-pit">
          <p className="mz-pit-name">陷阱 4：题目是"删除 0"还是"移动 0"？</p>
          <p className="mz-pit-detail">移动 0 后长度不变、0 在末尾；删除 0 后长度变短。LeetCode 283 是移动、27 是删除。答题前先确认——两者双指针框架一样，收尾不同。</p>
        </div>
      </section>
    </div>
  )
}
