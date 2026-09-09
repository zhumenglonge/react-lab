/* ==================== 面试总结页 ==================== */
export default function Summary() {
  return (
    <div className="demo-wrap summary">
      <section className="sum-block">
        <h3>🧠 一句话概括</h3>
        <blockquote>
          <p>
            React 的 diff 算法（Reconciliation）通过三个"预设约束"，
            把传统树 diff 的 <b>O(n³)</b> 复杂度降到 <b>O(n)</b>：
          </p>
          <p>
            <b>① Tree Diff</b>：只对比同一层级的节点，跨层移动视为"删除 + 新建"。<br />
            <b>② Component Diff</b>：类型相同则递归 diff，类型不同则替换整棵子树。<br />
            <b>③ Element Diff</b>：同层子节点通过 <code>key</code> 唯一标识，
            据此判断是 INSERT / MOVE / DELETE。
          </p>
        </blockquote>
      </section>

      <section className="sum-block">
        <h3>📊 三大策略对比表</h3>
        <table className="compare">
          <thead>
            <tr>
              <th>策略</th>
              <th>核心规则</th>
              <th>实践启示</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tree Diff</td>
              <td>
                只对比<b>同一层级</b>的节点，跨层不追踪。
                时间复杂度从 O(n³) 降到 O(n)。
              </td>
              <td>
                ❌ 不要用 React 树结构做"视觉移动"<br />
                ✅ 保持 DOM 结构稳定，用 CSS（<code>order</code> / <code>transform</code>）做位置变化
              </td>
            </tr>
            <tr>
              <td>Component Diff</td>
              <td>
                同类型组件 → 递归 diff props 和 children<br />
                不同类型组件 → <b>整棵子树替换</b>
              </td>
              <td>
                ❌ 不要用变量决定标签类型（<code>useDiv ? 'div' : 'section'</code>）<br />
                ✅ 用 <code>className</code> 或 <code>style</code> 切换外观<br />
                ✅ 用 <code>React.memo</code> 让 React 跳过对纯展示子树的 diff
              </td>
            </tr>
            <tr>
              <td>Element Diff</td>
              <td>
                同层子节点用 <code>key</code> 唯一标识。<br />
                React 根据 key 集合的差异判断哪些是新增、哪些是移动、哪些是删除。
              </td>
              <td>
                ❌ 不要用数组 <code>index</code> 作 key（列表可能变动时）<br />
                ❌ 不要用 <code>Math.random()</code> 作 key（每次都是新节点）<br />
                ✅ 用<b>稳定、唯一、可预测</b>的 id 作 key<br />
                ✅ 反过来：想强制"重置组件"时，主动改 key
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="sum-block">
        <h3>🔑 key 的三个"必须"</h3>
        <ul>
          <li><b>必须稳定</b> —— 同一个数据项在多次渲染中 key 不变</li>
          <li><b>必须唯一</b> —— 在同一父节点下不重复（不用全局唯一）</li>
          <li><b>必须可预测</b> —— 不能是 <code>Math.random()</code> 或 <code>Date.now()</code></li>
        </ul>
        <h4 className="sub-h">什么时候可以用 index 作 key？</h4>
        <ul>
          <li>列表<b>纯静态展示</b>，永远不会增删、排序、过滤</li>
          <li>列表项<b>没有内部 state</b>，也没有非受控 DOM（如 <code>&lt;input defaultValue&gt;</code>）</li>
          <li>以上两条<b>都满足</b>时，用 index 是可以的（也是唯一可以的时候）</li>
        </ul>
      </section>

      <section className="sum-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote>
          <p>
            "React 的 diff 算法又叫 <b>Reconciliation</b>，核心目标是在可接受的时间内
            找出两棵虚拟 DOM 树的差异。理论上树 diff 是 O(n³)，React 通过三个预设把它降到了 O(n)：
          </p>
          <p>
            <b>第一是 Tree Diff</b> —— 只对比同一层级的节点。如果一个节点跨层级移动了，
            React 不会追踪它，而是把老位置删掉、新位置重建。所以实践中我们要
            <b>保持 DOM 结构稳定</b>，视觉位置的变化交给 CSS。
          </p>
          <p>
            <b>第二是 Component Diff</b> —— 同类型组件递归 diff props 和 children，
            不同类型直接替换整棵子树。所以<b>不要用变量控制标签类型</b>（比如
            <code>useDiv ? 'div' : 'section'</code>），这会导致子组件全部重挂载、state 丢失。
            同时 React.memo 就是在这层做短路优化 —— props 浅比较相等就跳过整棵子树的 diff。
          </p>
          <p>
            <b>第三是 Element Diff</b> —— 同层子节点用 <code>key</code> 唯一标识，
            React 通过 key 集合的差异判断哪些是 INSERT、MOVE、DELETE。
            这就是为什么<b>列表渲染要给稳定的 key</b>：用 index 作 key 时，
            头部插入会让所有节点的 key 都错位，React 复用了错误的 DOM，
            如果列表项里有非受控的 input 或者内部 state，就会出现"内容跟着位置走而不是跟着数据走"的 Bug。
          </p>
          <p>
            补充一点 —— React 16 之后的 <b>Fiber 架构</b>把 diff 过程做成了可中断的链表遍历，
            配合时间切片能在每一帧让出主线程，但 diff 的<b>三条规则本身没变</b>。"
          </p>
        </blockquote>
      </section>

      <section className="sum-block">
        <h3>⚠️ 常见误区</h3>
        <ul>
          <li>
            <b>误区 1</b>：以为"给列表加 key 只是为了消除 warning" ——
            其实 key 直接决定了 React 是复用还是销毁节点，是<b>正确性问题</b>不只是性能问题
          </li>
          <li>
            <b>误区 2</b>：以为 key 必须"全局唯一" ——
            其实只要在同一父节点的兄弟之间唯一即可，两个不同列表可以有相同的 key
          </li>
          <li>
            <b>误区 3</b>：以为 "React 会智能识别跨层级移动" ——
            不会，跨层就是销毁 + 新建，即使节点内容一模一样
          </li>
          <li>
            <b>误区 4</b>：以为 "diff 就是 React 的全部性能优化" ——
            diff 只是"减少真实 DOM 操作"，真正的性能优化还要配合
            <code>memo</code> / <code>useMemo</code> / <code>useCallback</code> / 虚拟列表等
          </li>
        </ul>
      </section>

      <section className="sum-block">
        <h3>🚀 进阶：Fiber 架构对 diff 的影响</h3>
        <ul>
          <li>React 15 之前：diff 是<b>递归</b>的，一旦开始就不能中断，大树会导致主线程长时间卡住</li>
          <li>React 16+ 引入 <b>Fiber</b>：把虚拟 DOM 树变成链表结构，diff 可以<b>中断、恢复、分片</b></li>
          <li>配合 <b>时间切片</b>（time slicing），每一帧空闲时才处理一部分节点，避免卡顿</li>
          <li>但 <b>diff 的三条规则本身没变</b> —— Tree/Component/Element 依然是心智模型的基础</li>
          <li>React 18+ 的 <b>并发渲染</b>（Concurrent Rendering）在 Fiber 之上做了更多调度优化，
            比如 <code>useTransition</code> 可以让某些更新"降级"为可中断的</li>
        </ul>
      </section>
    </div>
  )
}
