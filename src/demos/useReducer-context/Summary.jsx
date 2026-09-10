/* ==================== 面试总结页 ==================== */
export default function Summary() {
  return (
    <div className="demo-wrap summary">
      <section className="sum-block">
        <h3>🧠 一句话本质</h3>
        <blockquote>
          <p>
            <b>useReducer + Context = 手写的轻量版 Redux</b>：
            useReducer 提供"集中更新的 reducer + dispatch"，Context 负责"跨组件广播"。
            两者拼起来，就有了 Redux 最核心的两件事 —— <b>单一数据源</b>和<b>单向数据流</b>，
            只是没有中间件和 DevTools。
          </p>
        </blockquote>
      </section>

      <section className="sum-block">
        <h3>🔧 核心结构（四步 + 一个优化）</h3>
        <ul>
          <li>① <code>createContext</code> 建频道（生产环境建两条：State / Dispatch）</li>
          <li>② 写 <code>reducer</code>，把所有更新集中成纯函数</li>
          <li>③ <code>Provider</code> 里用 <code>useReducer</code> 持有状态并下发</li>
          <li>④ 消费组件用 <code>useContext</code>（封装成 <code>useAppState / useAppDispatch</code>）直接读写</li>
          <li>⚡ 优化：<b>state 与 dispatch 拆成两个 Context</b>，让只用 dispatch 的组件不被 state 变化牵连重渲染</li>
        </ul>
      </section>

      <section className="sum-block">
        <h3>⚖️ useReducer + Context vs Redux</h3>
        <table className="compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>useReducer + Context</th>
              <th>Redux（RTK）</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>本质</td>
              <td>React 内置能力拼装，零依赖</td>
              <td>独立状态管理库</td>
            </tr>
            <tr>
              <td>异步处理</td>
              <td>需自己在 effect / 回调里 dispatch，无统一机制</td>
              <td>中间件（thunk / saga / listener）统一编排</td>
            </tr>
            <tr>
              <td>DevTools</td>
              <td>❌ 无，靠自己 console / 打印 state</td>
              <td>✅ 时间旅行、action 回放、state diff</td>
            </tr>
            <tr>
              <td>性能控制</td>
              <td>Context 粗粒度，需手动拆分 / memo 优化</td>
              <td>selector 精准订阅，只有所需切片变化才重渲染</td>
            </tr>
            <tr>
              <td>样板代码</td>
              <td>少，但大状态时 Provider 会层层嵌套</td>
              <td>RTK 已大幅消除，中等</td>
            </tr>
            <tr>
              <td>适用规模</td>
              <td>中小型应用 / 单一业务域共享</td>
              <td>大型应用 / 多业务域 / 复杂异步 / 团队协作</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="sum-block">
        <h3>✅ 什么时候 useReducer + Context 就够</h3>
        <ul>
          <li>共享的是<b>"读多写少"的全局数据</b>：登录用户、主题、语言、权限、全局 loading</li>
          <li>业务域<b>相对单一</b>，全局状态不算庞大（如一个 H5 活动页、后台的一个模块）</li>
          <li>异步逻辑简单，用 effect + dispatch 就能覆盖，不需要中间件编排</li>
          <li>不想为一个中小项目引入 Redux 的依赖和心智负担</li>
        </ul>
      </section>

      <section className="sum-block">
        <h3>⚠️ 什么时候该上 Redux（RTK）</h3>
        <ul>
          <li><b>复杂异步 / 副作用编排</b>：请求竞态、缓存、乐观更新、轮询、WebSocket</li>
          <li><b>大量组件高频共享大块状态</b>，Context 的重渲染已经拖累性能</li>
          <li>需要 <b>DevTools 时间旅行</b>来排查复杂状态流转</li>
          <li><b>多业务域、多团队</b>协作，需要统一的规范、可预测的数据流和可测试性</li>
          <li>需要状态<b>持久化、撤销重做、跨页面长存</b>等中间件生态能力</li>
        </ul>
      </section>

      <section className="sum-block urc-myth">
        <h3>🚫 破除误区：用"路由数量"来选，是错的</h3>
        <blockquote>
          <p>
            ❌ <b>"单路由 H5 用 useReducer+Context，多路由应用用 Redux" —— 这个判断标准不成立。</b>
          </p>
          <p>
            路由数量和状态管理选型<b>没有必然关系</b>。真正该看的是两个维度：
            <b>①全局状态的复杂度</b>（共享范围有多大、更新有多频繁）、
            <b>②异步 / 副作用的复杂度</b>（要不要中间件、要不要 DevTools）。
          </p>
          <p>
            反例一：一个<b>只有单页</b>的复杂数据看板，实时 WebSocket + 大量交叉筛选，
            单路由也<b>该上 Redux</b>。反例二：一个<b>几十个路由</b>的内容站，
            全局状态只有"登录用户 + 主题"，多路由也<b>用 Context 足够</b>，
            甚至路由间状态大多各自独立、根本不需要全局共享。
          </p>
          <p>
            ✅ 正确心智：<b>先按"状态共享复杂度 + 异步复杂度"选型</b>；
            路由多，只是"可能"意味着共享状态更多，但它不是决定因素。
            从 Context 起步，等真的遇到异步难管 / 性能吃紧 / 调试困难，再升级到 RTK 也不迟 ——
            因为两者 reducer 心智一致，迁移成本低。
          </p>
        </blockquote>
      </section>

      <section className="sum-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote>
          <p>
            "useReducer + Context 本质是<b>手写的轻量 Redux</b>：useReducer 给我集中的
            reducer 和稳定的 dispatch，Context 负责跨组件广播，合起来就实现了单一数据源和
            单向数据流，而且零依赖。我会把 state 和 dispatch <b>拆成两个 Context</b>，
            避免只用 dispatch 的组件被 state 变化牵连重渲染。
          </p>
          <p>
            它适合<b>全局状态不算复杂、异步简单</b>的中小应用，比如登录态、主题、权限这类
            读多写少的共享数据。而 Redux 的价值在于<b>中间件（复杂异步编排）、DevTools
            （时间旅行调试）和 selector 精准订阅（性能）</b>，适合大型、多业务域、
            异步复杂或团队协作的项目。
          </p>
          <p>
            选型我<b>不看路由数量，而看状态共享复杂度和异步复杂度</b>。
            我一般从 Context 起步，等真遇到异步难管、性能吃紧或调试困难，再平滑升级到 RTK，
            因为两者 reducer 心智一致，迁移成本很低。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
