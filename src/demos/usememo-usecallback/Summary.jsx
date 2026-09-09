/* ==================== 面试总结页 ==================== */
export default function Summary() {
  return (
    <div className="demo-wrap summary">
      <section className="sum-block">
        <h3>🧠 核心区别</h3>
        <table className="compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>useMemo</th>
              <th>useCallback</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>缓存什么</td>
              <td>函数的<b>返回值</b>（一个值 / 对象）</td>
              <td><b>函数本身</b>（一个引用）</td>
            </tr>
            <tr>
              <td>写法</td>
              <td><code>useMemo(() =&gt; compute(), deps)</code></td>
              <td><code>useCallback(fn, deps)</code></td>
            </tr>
            <tr>
              <td>等价关系</td>
              <td>—</td>
              <td><code>useCallback(fn, deps)</code> ≡ <code>useMemo(() =&gt; fn, deps)</code></td>
            </tr>
            <tr>
              <td>何时失效重算</td>
              <td>依赖数组变化时</td>
              <td>依赖数组变化时</td>
            </tr>
            <tr>
              <td>主要目的</td>
              <td>跳过<b>昂贵计算</b></td>
              <td>稳定<b>函数引用</b>（配合 memo / 依赖数组）</td>
            </tr>
            <tr>
              <td>返回类型</td>
              <td>任意值</td>
              <td>一定是函数</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="sum-block">
        <h3>✅ useMemo 什么时候用</h3>
        <ul>
          <li><b>昂贵计算</b>：大列表的过滤 / 排序、复杂格式化、密集运算</li>
          <li>要产出一个<b>引用稳定的对象 / 数组</b>，传给 <code>React.memo</code> 子组件或作为其它 Hook 的依赖</li>
          <li>派生数据成本高，且<b>只在部分 state 变化时</b>才需要重算</li>
        </ul>
      </section>

      <section className="sum-block">
        <h3>✅ useCallback 什么时候用</h3>
        <ul>
          <li>把回调传给 <b><code>React.memo</code> 包裹的子组件</b>，避免父组件无关渲染时子组件跟着渲染</li>
          <li>函数被用作 <b><code>useEffect</code> / 其它 Hook 的依赖</b>，避免依赖每次都变导致副作用反复触发</li>
          <li>需要保证函数引用稳定的场景（订阅、注册回调等）</li>
        </ul>
      </section>

      <section className="sum-block">
        <h3>🚫 什么时候「不该用」（两者通用）</h3>
        <ul>
          <li><b>计算很廉价</b>：缓存的成本（存结果 + 每次比对依赖）&gt; 直接重算</li>
          <li><b>没有消费者</b>：函数没传给 memo 子组件、值也没被谁依赖 —— 纯自我感动</li>
          <li><b>依赖每次都变</b>：缓存永远命中不了，白白增加开销</li>
          <li>别用 <code>useMemo</code> 执行<b>副作用</b>：React 有权丢弃缓存，副作用该交给 <code>useEffect</code></li>
        </ul>
      </section>

      <section className="sum-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote>
          <p>
            "两者都是性能优化 Hook，都遵循<b>『依赖不变就复用上一次的结果』</b>。区别在于缓存的东西：
            <b>useMemo 缓存函数的返回值</b>——一个值；<b>useCallback 缓存函数本身</b>——一个引用。
            其实 <code>useCallback(fn, deps)</code> 完全等价于 <code>useMemo(() =&gt; fn, deps)</code>。
          </p>
          <p>
            useMemo 主要用来<b>跳过昂贵计算</b>，或产出一个引用稳定的对象 / 数组；
            useCallback 主要用来<b>稳定函数引用</b>，它几乎总是和 <code>React.memo</code>、
            或作为其它 Hook 的依赖一起用才有意义 —— 单独缓存一个没人消费的函数就是过度优化。
          </p>
          <p>
            用的前提有三条：<b>①计算确实贵 ②结果确实被依赖 / 被 memo 子组件消费 ③依赖不会每次都变</b>。
            另外 useMemo 不是『保证』，React 有权丢弃缓存，所以别拿它做副作用。
            React 19 的 Compiler 能自动记忆化，未来手写会更少，但原理必须懂。
          </p>
          <p>
            一句话：<b>useMemo 缓存值、useCallback 缓存函数；只在『昂贵计算』或『稳定引用有消费者』时才用</b>。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
