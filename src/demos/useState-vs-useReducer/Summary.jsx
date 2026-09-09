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
              <th>useState</th>
              <th>useReducer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>心智模型</td>
              <td>"直接改这个值"</td>
              <td>"派发一个动作，由 reducer 决定新状态"</td>
            </tr>
            <tr>
              <td>状态形态</td>
              <td>通常是独立的基本值</td>
              <td>通常是一个对象，多个字段互相关联</td>
            </tr>
            <tr>
              <td>更新逻辑位置</td>
              <td>散落在各个事件处理函数里</td>
              <td>集中在一个 reducer 函数里</td>
            </tr>
            <tr>
              <td>API</td>
              <td><code>setXxx(newValue)</code></td>
              <td><code>dispatch({'{ type, payload }'})</code></td>
            </tr>
            <tr>
              <td>可测试性</td>
              <td>要挂载组件才能测</td>
              <td>reducer 是纯函数，单独就能测</td>
            </tr>
            <tr>
              <td>调试</td>
              <td>看不出"为啥变了"</td>
              <td>打印 action 就能看到状态迁移轨迹</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="sum-block">
        <h3>✅ useState 适用场景</h3>
        <ul>
          <li>状态是<b>独立的、简单的</b>基本值（数字、字符串、布尔、单个对象）</li>
          <li>更新逻辑<b>一句话就能写完</b>，比如开关、计数、输入框绑定</li>
          <li>状态之间<b>没有依赖关系</b>，改一个不影响另一个</li>
          <li>组件规模小，不需要跨层传递更新逻辑</li>
        </ul>
      </section>

      <section className="sum-block">
        <h3>✅ useReducer 适用场景</h3>
        <ul>
          <li><b>多个状态互相关联</b>（如购物车的 items + coupon + total）</li>
          <li><b>更新逻辑复杂</b>，一个动作要改多个字段</li>
          <li><b>状态机场景</b>：loading / success / error 这种互斥状态迁移</li>
          <li>需要把"如何更新状态"传给深层子组件 —— <code>dispatch</code> 引用稳定，
            配合 Context 可以避免不必要的重渲染</li>
          <li>需要<b>可测试</b>、<b>可回放</b>、<b>可日志追踪</b>的业务逻辑</li>
          <li>下一步要接 Redux 时的天然过渡（reducer 概念一致）</li>
        </ul>
      </section>

      <section className="sum-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote>
          <p>
            "两者都能管理组件状态。<b>useState</b> 是最基础的心智模型 ——
            拿到 setter，直接告诉 React 新值是什么，适合状态独立、更新简单的场景，
            比如一个开关、一个输入框。
          </p>
          <p>
            <b>useReducer</b> 是把'如何更新'抽离成一个纯函数 reducer，
            组件里只负责 dispatch 一个描述'发生了什么'的 action。
            它适合三类场景：<b>①多个关联状态</b>（购物车）、
            <b>②复杂更新逻辑</b>（一个动作改多个字段）、
            <b>③状态机</b>（异步请求的 loading/success/error）。
          </p>
          <p>
            额外好处是 —— reducer 是纯函数，容易单测；dispatch 引用稳定，
            配合 Context 往下传能避免闭包陷阱和不必要的重渲染；
            而且它就是 Redux 的心智模型，团队扩展时零成本迁移。
          </p>
          <p>
            一句话：<b>简单场景用 useState，复杂或关联状态用 useReducer</b>。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
