import { useState, memo } from 'react'
import { StatefulBox } from './shared.jsx'

/* =========================================================
 * 场景 2：Component Diff（组件级比较）
 * 规则：
 *   - 类型相同 → 递归 diff 属性和子节点，组件实例保留
 *   - 类型不同 → 直接替换整棵子树（销毁旧的、挂载新的）
 * ========================================================= */

// ---------- 反面案例：改变元素类型 ----------
function TypeChangeCase() {
  const [useDiv, setUseDiv] = useState(true)
  // 用变量决定标签类型 —— React 会认为是"不同的元素"
  const Wrapper = useDiv ? 'div' : 'section'

  return (
    <div className="demo-box">
      <h4>改变元素类型 ❌ 整棵子树被替换</h4>
      <p className="case-desc">
        切换 <code>&lt;div&gt;</code> ↔ <code>&lt;section&gt;</code> —— 虽然只是标签名变了，
        React 会认为它们是"不同类型"，直接<b>销毁整棵子树并重建</b>。
      </p>
      <button
        className="primary-btn"
        onClick={() => setUseDiv(!useDiv)}
      >
        当前：&lt;{useDiv ? 'div' : 'section'}&gt;（点击切换）
      </button>

      <Wrapper className="wrapper-box">
        <div className="wrapper-tag">&lt;{useDiv ? 'div' : 'section'}&gt;</div>
        <StatefulBox name="子组件" color="var(--danger)" />
      </Wrapper>

      <pre className="code">{`const Wrapper = useDiv ? 'div' : 'section'
<Wrapper>
  <StatefulBox />   // 类型变了，我会被销毁重建
</Wrapper>`}</pre>
      <p className="tip warn">
        ⚠️ 每次切换标签，子组件的 <code>mountId</code> 都会变 —— 即使子组件代码完全一样。
        这也是为什么"用变量控制标签类型"是一个性能陷阱。
      </p>
    </div>
  )
}

// ---------- 正面案例：只改变 props ----------
function PropsChangeCase() {
  const [variant, setVariant] = useState('a')

  return (
    <div className="demo-box">
      <h4>只改变 props ✅ 子组件实例保留</h4>
      <p className="case-desc">
        类型始终是 <code>&lt;div&gt;</code>，只是 <code>className</code> 在变 ——
        React 复用同一个 DOM 节点，只更新属性，子组件完全不动。
      </p>
      <button
        className="primary-btn"
        onClick={() => setVariant(variant === 'a' ? 'b' : 'a')}
      >
        切换 className（当前 variant-{variant}）
      </button>

      <div className={`wrapper-box variant-${variant}`}>
        <div className="wrapper-tag">&lt;div class="variant-{variant}"&gt;</div>
        <StatefulBox name="子组件" color="var(--success)" />
      </div>

      <pre className="code">{`<div className={\`variant-\${variant}\`}>
  <StatefulBox />   // 类型没变，我一直是同一个实例
</div>`}</pre>
      <p className="tip">
        👉 无论怎么切换，<code>mountId</code> 都不变，输入内容和 count 全部保留 —— 这就是
        "类型相同则递归 diff"。
      </p>
    </div>
  )
}

// ---------- 补充：React.memo 跳过子树 diff ----------
function MemoSkipCase() {
  const [parentCount, setParentCount] = useState(0)
  const [childProp, setChildProp] = useState(0)

  return (
    <div className="demo-box full-width">
      <h4>🚀 进阶：跳过子树 diff —— React.memo / PureComponent</h4>
      <p className="case-desc">
        类型相同时 React 默认还是会<b>递归 diff 整棵子树</b>。
        对于纯展示的子组件，用 <code>React.memo</code> 包裹可以让 React 直接跳过它 ——
        这就是 Component Diff 层面的"手动优化"。
      </p>
      <div className="memo-controls">
        <button className="primary-btn" onClick={() => setParentCount((c) => c + 1)}>
          触发父组件重渲染（parentCount = {parentCount}）
        </button>
        <button className="primary-btn" onClick={() => setChildProp((c) => c + 1)}>
          改变传给 memo 子组件的 prop（childProp = {childProp}）
        </button>
      </div>
      <div className="memo-grid">
        <div className="memo-side">
          <div className="memo-header">普通子组件</div>
          <NormalChild childProp={childProp} />
          <pre className="code">{`function NormalChild({ childProp }) {
  // 父组件重渲染 → 我就重渲染
  return <div>...</div>
}`}</pre>
        </div>
        <div className="memo-side">
          <div className="memo-header">React.memo 包裹</div>
          <MemoChild childProp={childProp} />
          <pre className="code">{`const MemoChild = memo(function MemoChild({ childProp }) {
  // props 没变 → React 跳过对我的 diff
  return <div>...</div>
})`}</pre>
        </div>
      </div>
      <p className="tip">
        👉 只点"触发父组件重渲染" —— 左边渲染次数一直涨，右边一动不动。
        再点"改变 prop" —— 两边同时涨。这就是 <b>memo 的浅比较短路机制</b>。
      </p>
    </div>
  )
}

let normalRenderCount = 0
function NormalChild({ childProp }) {
  normalRenderCount++
  return (
    <div className="render-box normal">
      <div>childProp = {childProp}</div>
      <div className="render-count">渲染次数：{normalRenderCount}</div>
    </div>
  )
}

let memoRenderCount = 0
const MemoChild = memo(function MemoChild({ childProp }) {
  memoRenderCount++
  return (
    <div className="render-box memo">
      <div>childProp = {childProp}</div>
      <div className="render-count">渲染次数：{memoRenderCount}</div>
    </div>
  )
})

export default function ComponentDiffDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>场景 2：Component Diff（组件级比较）</h3>
        <p className="desc">
          规则：<b>类型相同则递归 diff，类型不同则整棵子树替换</b>。
          这就是"不要用变量控制标签类型"的原因。
        </p>
      </div>
      <div className="demo-grid">
        <TypeChangeCase />
        <PropsChangeCase />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <MemoSkipCase />
      </div>
    </div>
  )
}
