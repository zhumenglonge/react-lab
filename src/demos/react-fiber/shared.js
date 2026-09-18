/* =========================================================
 * 主题共享数据与工具（非组件，单独放 .js，符合 react-refresh 约定）
 * ---------------------------------------------------------
 * 面试原题：「讲讲 React 的 Fiber 架构 / 为什么需要 Fiber」
 *
 * 一句话原理：Fiber 把「组件树」拆成一个个可暂停的工作单元（FiberNode），
 *   节点之间用 child / sibling / return 三根指针连成一条链表，
 *   于是原本「同步递归、一跑到底、无法中断」的渲染，
 *   变成「处理一个单元 → 判断要不要让出主线程 → 再回来接着处理」的可中断循环。
 *
 * 本文件提供：
 *   1. TREE_SPEC     —— 一棵示例组件树（JSX 结构的纯数据描述）
 *   2. buildFiberTree —— 把树描述真构建成 child/sibling/return 链表（React 的形状）
 *   3. buildSteps    —— 用 React work loop 的算法真跑一遍遍历，产出每一步供动画逐帧展示
 *   4. countFibers   —— 统计节点数（含各 tag），用于说明
 *   5. 时间切片模拟常量 —— 供「可中断渲染」子 demo 使用
 * 所有遍历都在真实构建的链表上跑，不造假数据。
 * ========================================================= */

/* ---------- 示例组件树（对应一段常见的 JSX） ----------
 *
 *   <App>
 *     <Header><h1 /></Header>
 *     <Nav><a /><a /></Nav>
 *     <Main><List><ul><li /><li /></ul></List></Main>
 *   </App>
 *
 * tag：'Function' = 函数组件；'Host' = 原生 DOM 标签
 */
export const TREE_SPEC = {
  name: 'App',
  tag: 'Function',
  type: 'App',
  children: [
    {
      name: 'Header',
      tag: 'Function',
      type: 'Header',
      children: [{ name: 'h1', tag: 'Host', type: 'h1' }],
    },
    {
      name: 'Nav',
      tag: 'Function',
      type: 'Nav',
      children: [
        { name: 'a', tag: 'Host', type: 'a' },
        { name: 'a', tag: 'Host', type: 'a' },
      ],
    },
    {
      name: 'Main',
      tag: 'Function',
      type: 'Main',
      children: [
        {
          name: 'List',
          tag: 'Function',
          type: 'List',
          children: [
            {
              name: 'ul',
              tag: 'Host',
              type: 'ul',
              children: [
                { name: 'li', tag: 'Host', type: 'li' },
                { name: 'li', tag: 'Host', type: 'li' },
              ],
            },
          ],
        },
      ],
    },
  ],
}

/**
 * 把树描述构建成 Fiber 链表（React FiberNode 的核心形状）。
 * 每个节点带三根指针：child（第一个子节点）/ sibling（下一个兄弟）/ return（父节点）。
 * id 用闭包内计数器生成，保证同一棵树每次构建 id 稳定、可作 React key。
 * @param {object} spec 树描述
 * @returns {object} rootFiber
 */
export function buildFiberTree(spec) {
  let uid = 0
  const build = (s, returnFiber) => {
    const fiber = {
      id: `f${uid++}`,
      name: s.name,
      tag: s.tag,
      type: s.type,
      return: returnFiber,
      child: null,
      sibling: null,
      depth: returnFiber ? returnFiber.depth + 1 : 0,
    }
    let prev = null
    for (const childSpec of s.children ?? []) {
      const childFiber = build(childSpec, fiber)
      if (!fiber.child) fiber.child = childFiber // 第一个孩子挂 child
      if (prev) prev.sibling = childFiber // 其余孩子用 sibling 串起来
      prev = childFiber
    }
    return fiber
  }
  return build(spec, null)
}

/**
 * 用 React「work loop」的算法真跑一遍深度优先遍历，产出可逐帧播放的步骤。
 * 核心就是 performUnitOfWork / completeUnitOfWork：
 *   - 有 child → 往下（beginWork 孩子）
 *   - 没 child → completeWork 自己，然后找 sibling；没 sibling 就 return 回父节点继续 complete
 * @param {object} root
 * @returns {Array<{kind:'begin'|'complete', node:object, via?:{label:string, pointer?:string}}>}
 */
export function buildSteps(root) {
  const steps = []
  let unit = root
  let via = { label: 'root（从根 Fiber 开始，进入 work loop）', pointer: 'root' }

  while (unit) {
    // performUnitOfWork → beginWork
    steps.push({ kind: 'begin', node: unit, via })

    if (unit.child) {
      via = { label: `child ↓ 进入 ${unit.child.name}`, pointer: 'child' }
      unit = unit.child
      continue
    }

    // completeUnitOfWork：一路 complete，遇到 sibling 就横移，否则 return 上浮
    let cur = unit
    let nextUnit = null
    while (cur) {
      steps.push({ kind: 'complete', node: cur })
      if (cur.sibling) {
        nextUnit = cur.sibling
        via = { label: `sibling → 横移到 ${cur.sibling.name}`, pointer: 'sibling' }
        break
      }
      via = { label: 'return ↑ 没有 sibling，回到父节点继续 complete', pointer: 'return' }
      cur = cur.return
    }
    unit = nextUnit
  }
  return steps
}

/**
 * 统计一棵 Fiber 树的节点信息，用于文案里说明「一棵树被拆成了 N 个工作单元」。
 * @param {object} root
 */
export function countFibers(root) {
  let total = 0
  let fn = 0
  let host = 0
  let maxDepth = 0
  const walk = (f) => {
    if (!f) return
    total += 1
    if (f.tag === 'Function') fn += 1
    else host += 1
    maxDepth = Math.max(maxDepth, f.depth)
    walk(f.child)
    walk(f.sibling)
  }
  walk(root)
  return { total, fn, host, maxDepth }
}

/* ---------- 「可中断渲染」时间切片模拟常量 ----------
 * 用一个大渲染任务（TOTAL_UNITS 个工作单元）对比两种调度：
 *   - Stack Reconciler：同步递归、绝不让出，用户输入只能等它全部跑完（阻塞、掉帧）
 *   - Fiber：每处理 SLICE_SIZE 个单元就在切片边界 shouldYield() 让出主线程，
 *            高优先级的用户输入可以「插队」先被响应，然后再回来继续渲染
 */
export const TOTAL_UNITS = 30
export const SLICE_SIZE = 5
export const TICK_MS = 320 // 每个切片/每一步之间的可视化间隔
