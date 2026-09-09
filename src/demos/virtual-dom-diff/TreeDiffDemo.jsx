import { useState } from 'react'
import { StatefulBox } from './shared.jsx'

/* =========================================================
 * 场景 1：Tree Diff（树层级比较）
 * 规则：React 只对"同一层级"的节点做对比
 *      跨层级移动 = 老位置销毁 + 新位置新建（不会真的移动 DOM）
 * ========================================================= */

// ---------- 反面案例：跨层级移动 ----------
function CrossLevelCase() {
  const [deep, setDeep] = useState(false)
  return (
    <div className="demo-box">
      <h4>跨层级移动 ❌ state 会丢</h4>
      <p className="case-desc">
        点按钮把 <b>A</b> 从 Level 1 移到 Level 2 —— React 认为 Level 1 位置的 A 被"删除"，
        Level 2 位置"新建"了一个 A。观察 <code>mountId</code> 变化 + 输入内容丢失。
      </p>
      <button className="primary-btn" onClick={() => setDeep(!deep)}>
        {deep ? '↩️ 把 A 移回 Level 1' : '➡️ 把 A 移到 Level 2'}
      </button>

      <div className="tree">
        <div className="tree-level">
          <span className="level-tag">Level 1</span>
          {!deep && <StatefulBox name="A" color="var(--accent-2)" />}
          <div className="tree-level nested">
            <span className="level-tag">Level 2</span>
            {deep && <StatefulBox name="A" color="var(--accent-2)" />}
          </div>
        </div>
      </div>

      <pre className="code">{`// 位置变了，React 就当作"销毁 + 新建"
{!deep && <A />}         // Level 1
<div>
  {deep && <A />}        // Level 2
</div>`}</pre>
      <p className="tip warn">
        ⚠️ 每次切换，<code>mountId</code> 都会变，输入框内容和 count 全部重置 —— 这就是
        Tree Diff "只比较同层"的代价。
      </p>
    </div>
  )
}

// ---------- 正面案例：同层级位置交换 ----------
function SameLevelCase() {
  const [swapped, setSwapped] = useState(false)
  const order = swapped ? ['B', 'A'] : ['A', 'B']
  const colors = { A: 'var(--accent-2)', B: 'var(--warning)' }

  return (
    <div className="demo-box">
      <h4>同层级交换位置 ✅ state 保留</h4>
      <p className="case-desc">
        通过 <code>key</code> 稳定标识 A 和 B —— 交换顺序时 React 只是"移动 DOM"，
        组件实例不变，<code>mountId</code>/输入/count 全部保留。
      </p>
      <button className="primary-btn" onClick={() => setSwapped(!swapped)}>
        {swapped ? '↩️ 恢复 A、B 顺序' : '🔄 交换 A 和 B'}
      </button>

      <div className="tree">
        <div className="tree-level">
          <span className="level-tag">Level 1</span>
          {order.map((n) => (
            <StatefulBox key={n} name={n} color={colors[n]} />
          ))}
        </div>
      </div>

      <pre className="code">{`// 同层子节点通过 key 识别，React 只做 move
{order.map(n => <Box key={n} />)}
// order: ['A','B'] <-> ['B','A']`}</pre>
      <p className="tip">
        👉 先在两个框里都输入点内容、点几下 count，再交换位置 —— 一切都跟着组件走。
      </p>
    </div>
  )
}

export default function TreeDiffDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>场景 1：Tree Diff（层级比较）</h3>
        <p className="desc">
          规则：<b>只对比同层节点</b>。跨层移动 = 销毁 + 新建，
          所以实践中<b>不要用 React 结构做视觉位置移动</b>，改用 CSS。
        </p>
      </div>
      <div className="demo-grid">
        <CrossLevelCase />
        <SameLevelCase />
      </div>
    </div>
  )
}
