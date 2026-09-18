import { useEffect, useMemo, useState } from 'react'
import { TREE_SPEC, buildFiberTree, buildSteps, countFibers } from './shared.js'

/* =========================================================
 * 🔗 结构可视化：把组件树拆成 Fiber 链表，再「走」一遍 work loop
 * ---------------------------------------------------------
 * 核心心智模型：每个组件/DOM 节点对应一个 FiberNode，节点之间只有三根指针——
 *   child（第一个孩子）↓ / sibling（下一个兄弟）→ / return（父节点）↑。
 *   正是这条链表，让 React 能「处理一个单元就停一下、之后从停下的地方接着来」，
 *   而不是一头扎进递归里出不来。这里用真实构建的链表跑 buildSteps，
 *   逐帧高亮 beginWork（往下）/ completeWork（往上），让你亲眼看到遍历顺序。
 * ========================================================= */

// 递归渲染 Fiber 树：child 往下嵌套，sibling 横向排列（强化「链表」心智）
function FiberNodeView({ fiber, status, currentId, currentKind }) {
  // 从当前 fiber 沿 sibling 收集同层所有兄弟，横向排列
  const siblings = []
  let cur = fiber
  while (cur) {
    siblings.push(cur)
    cur = cur.sibling
  }

  return (
    <>
      {siblings.map((node, i) => {
        const nodeSt = status[node.id] || {}
        let ncls = 'fib-node'
        if (node.tag === 'Host') ncls += ' fib-node-host'
        if (nodeSt.complete) ncls += ' fib-node-done'
        else if (nodeSt.begin) ncls += ' fib-node-begun'
        if (node.id === currentId) ncls += currentKind === 'complete' ? ' fib-node-cur-c' : ' fib-node-cur-b'
        return (
          <li className="fib-li" key={node.id}>
            <div className={ncls}>
              <span className="fib-node-name">{node.name}</span>
              <span className="fib-node-tag">{node.tag === 'Host' ? 'HostComponent' : 'FunctionComponent'}</span>
              <span className="fib-node-flag">
                {node.id === currentId
                  ? currentKind === 'complete'
                    ? '✅ completeWork'
                    : '▶ beginWork'
                  : nodeSt.complete
                    ? '已完成'
                    : nodeSt.begin
                      ? '已 begin'
                      : '待处理'}
              </span>
            </div>
            {node.child && (
              <ul className="fib-ul">
                <FiberNodeView
                  fiber={node.child}
                  status={status}
                  currentId={currentId}
                  currentKind={currentKind}
                />
              </ul>
            )}
            {i < siblings.length - 1 && <span className="fib-sib-hint">sibling →</span>}
          </li>
        )
      })}
    </>
  )
}

const WORKLOOP_SOURCE = `// React 渲染的主循环（简化版）
function workLoop(deadline) {
  // 还有工作单元，且（并发模式下）当前帧还有富余时间
  while (nextUnitOfWork && !shouldYield()) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }
  requestIdleCallback(workLoop) // 时间用完就让出，下一帧再接着跑
}

function performUnitOfWork(fiber) {
  beginWork(fiber)                 // 处理当前单元
  if (fiber.child) return fiber.child   // ① 有孩子 → 往下
  completeUnitOfWork(fiber)        // ② 没孩子 → 收尾并找下一个
}

function completeUnitOfWork(fiber) {
  let cur = fiber
  while (cur) {
    completeWork(cur)
    if (cur.sibling) return cur.sibling  // ③ 有兄弟 → 横移
    cur = cur.return                     // ④ 没兄弟 → return 回父节点
  }
  return null // 回到根，整棵树遍历结束
}`

export default function StructureDemo() {
  const root = useMemo(() => buildFiberTree(TREE_SPEC), [])
  const steps = useMemo(() => buildSteps(root), [root])
  const stat = useMemo(() => countFibers(root), [root])

  const total = steps.length
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  const finished = step >= total
  const running = playing && !finished
  const current = step > 0 ? steps[step - 1] : null

  // 已处理步骤的状态表（begin / complete 分别标记）
  const status = useMemo(() => {
    const map = {}
    for (let k = 0; k < step && k < total; k++) {
      const s = steps[k]
      if (!map[s.node.id]) map[s.node.id] = {}
      map[s.node.id][s.kind] = true
    }
    return map
  }, [step, steps, total])

  // 播放：setTimeout 链推进（不在 effect 体内直接 setState，避开 lint 规则）
  useEffect(() => {
    if (!playing || step >= total) return
    const t = setTimeout(() => setStep((s) => s + 1), 620)
    return () => clearTimeout(t)
  }, [playing, step, total])

  const reset = () => {
    setPlaying(false)
    setStep(0)
  }
  const togglePlay = () => {
    if (running) {
      setPlaying(false)
      return
    }
    if (finished) setStep(0)
    setPlaying(true)
  }

  return (
    <div className="demo-wrap fib-root">
      <div className="demo-header">
        <h2>🔗 结构可视化 · 组件树 → Fiber 链表 → work loop 遍历</h2>
        <p className="demo-sub">
          这棵 <code>&lt;App&gt;</code> 树被拆成了 <b>{stat.total} 个 FiberNode 工作单元</b>
          （{stat.fn} 个函数组件 + {stat.host} 个原生标签），节点间靠 <b>child / sibling / return</b> 三根指针相连。
          点 <b>▶ 播放</b>，看 React 怎么用一条 <code>while</code> 循环（而不是递归）把它 depth-first 走一遍——
          <b>能停下来、能接着走</b>，正是可中断渲染的地基。
        </p>
      </div>

      <div className="demo-grid fib-grid">
        {/* 左：Fiber 树可视化 */}
        <div className="demo-box">
          <h4>Fiber 链表（child ↓ / sibling → / return ↑）</h4>

          <div className="btn-row" style={{ justifyContent: 'flex-start' }}>
            <button className="fib-primary" onClick={togglePlay}>
              {running ? '⏸ 暂停' : finished && step > 0 ? '↻ 重播' : '▶ 播放遍历'}
            </button>
            <button className="ghost" onClick={() => setStep((s) => Math.min(s + 1, total))} disabled={finished}>
              ⏭ 下一步
            </button>
            <button className="ghost" onClick={() => { setPlaying(false); setStep(total) }}>
              👀 直接看完
            </button>
            <button className="ghost" onClick={reset}>↺ 重置</button>
          </div>

          {/* 当前指针指示 */}
          <div className="fib-pointer">
            {current ? (
              <>
                <span className={'fib-ptr-kind ' + (current.kind === 'begin' ? 'fib-ptr-begin' : 'fib-ptr-complete')}>
                  {current.kind === 'begin' ? 'beginWork（往下）' : 'completeWork（往上）'}
                </span>
                <span className="fib-ptr-node">{current.node.name}</span>
                <span className="fib-ptr-via">
                  {current.kind === 'begin'
                    ? current.via?.label
                    : `收尾 ${current.node.name}，然后找 sibling / return`}
                </span>
              </>
            ) : (
              <span className="fib-ptr-idle">点「▶ 播放」或「⏭ 下一步」，逐帧观察 work loop 怎么走这棵树</span>
            )}
            <span className="fib-ptr-count">{Math.min(step, total)} / {total} 步</span>
          </div>

          <ul className="fib-ul fib-tree">
            <FiberNodeView
              fiber={root}
              status={status}
              currentId={current?.node.id}
              currentKind={current?.kind}
            />
          </ul>

          <div className="fib-legend">
            <span><i className="fib-dot fib-dot-idle" />待处理</span>
            <span><i className="fib-dot fib-dot-begin" />beginWork（当前/已 begin）</span>
            <span><i className="fib-dot fib-dot-done" />completeWork 完成</span>
          </div>
        </div>

        {/* 右：work loop 源码 + 讲解 */}
        <div className="demo-box">
          <h4>为什么链表能「可中断」</h4>
          <pre className="code">{WORKLOOP_SOURCE}</pre>
          <p className="fib-note">
            关键在 <code>performUnitOfWork</code> 每处理完一个单元都<b>返回「下一个单元」</b>，
            控制权交回 <code>workLoop</code>。循环每转一圈都会问一次 <code>shouldYield()</code>：
            「这一帧的时间（约 5ms）用完了吗？」用完就 <code>return</code> 把主线程还给浏览器，
            下一帧再从 <code>nextUnitOfWork</code> 接着跑。
          </p>
          <p className="fib-note">
            如果是老架构的<b>递归</b>，调用栈一旦压下去就<b>无法中途弹出</b>——
            这就是 Stack Reconciler 不可中断的根因。Fiber 用「链表 + while 循环 + 可保存的 nextUnitOfWork」
            把递归改写成了<b>可暂停、可恢复、可丢弃</b>的循环。
          </p>
          <div className="fib-tri">
            <div className="fib-tri-item"><b>child ↓</b>第一个子节点，beginWork 后优先往下钻</div>
            <div className="fib-tri-item"><b>sibling →</b>下一个兄弟，completeWork 后横向移动</div>
            <div className="fib-tri-item"><b>return ↑</b>父节点，没有 sibling 时上浮继续 complete</div>
          </div>
        </div>
      </div>

      <p className="tip">
        💡 遍历顺序就是 <b>depth-first</b>：<code>beginWork</code> 自顶向下「递」，<code>completeWork</code> 自底向上「归」。
        每个 FiberNode 还挂着 <code>pendingProps / memoizedState / flags（副作用）/ lanes（优先级）/ alternate（双缓存的另一棵树）</code>——
        它既是「工作单元」，也是「保存状态的单位」，所以中断后再回来，进度不会丢。
      </p>
    </div>
  )
}
