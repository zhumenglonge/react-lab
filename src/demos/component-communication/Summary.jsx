/* ==================== 面试总结页 ====================
 * 作用域统一挂在 .cc-summary 下，样式自带一份（懒加载不依赖其它主题）。
 * ========================================================= */
export default function Summary() {
  return (
    <div className="demo-wrap cc-summary">
      <section className="cc-sum-block">
        <h3>🧠 一张表看懂所有通信方式</h3>
        <table className="cc-compare">
          <thead>
            <tr>
              <th>方式</th>
              <th>方向</th>
              <th>适用场景</th>
              <th>关键点</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Props</td>
              <td>父 → 子</td>
              <td>最基本的数据下发</td>
              <td>数据、函数都能传；单向数据流</td>
            </tr>
            <tr>
              <td>回调函数</td>
              <td>子 → 父</td>
              <td>子组件通知父组件</td>
              <td>父传函数下去，子调用它上报</td>
            </tr>
            <tr>
              <td>Context</td>
              <td>祖先 → 后代（跨层）</td>
              <td>主题 / 语言 / 登录用户等全局数据</td>
              <td>免 Props 钻取；中间层零改动</td>
            </tr>
            <tr>
              <td>状态提升</td>
              <td>兄弟 ↔ 兄弟</td>
              <td>兄弟组件共享数据</td>
              <td>提到最近共同父组件做中转</td>
            </tr>
            <tr>
              <td>Ref 转发</td>
              <td>父 → 子（命令式）</td>
              <td>聚焦 / 滚动 / 动画 / 校验</td>
              <td>forwardRef + useImperativeHandle</td>
            </tr>
            <tr>
              <td>状态管理库</td>
              <td>全局任意组件</td>
              <td>大型应用跨页面 / 跨模块共享</td>
              <td>Redux / Zustand / Jotai / MobX</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="cc-sum-block">
        <h3>🧭 怎么选？决策路径</h3>
        <ul>
          <li><b>父子相邻</b> → 直接 props + 回调，最简单，永远是首选。</li>
          <li><b>隔了很多层</b>、且是全局性数据 → Context（免层层透传）。</li>
          <li><b>兄弟之间</b> → 状态提升到最近共同父组件，一个改、一个用。</li>
          <li><b>要命令子组件做 DOM 动作</b>（聚焦 / 滚动 / 动画）→ Ref。</li>
          <li><b>跨页面、跨模块、多人协作的大应用</b> → 上状态管理库（Redux / Zustand 等）。</li>
          <li>补充手段：<b>事件总线 EventBus</b> 可解耦任意组件，但数据流会变隐晦，慎用；<b>URL / 路由参数</b> 适合页面间传参。</li>
        </ul>
      </section>

      <section className="cc-sum-block">
        <h3>⚠️ 容易被追问的点</h3>
        <ul>
          <li><b>Props 钻取（Prop Drilling）</b>：层层透传很啰嗦，用 Context 或状态管理库解决。</li>
          <li><b>Context 性能</b>：value 变化会让所有消费者重渲染，高频数据要拆分 Context 或配合 memo。</li>
          <li><b>单向数据流</b>：子组件不能直接改父组件 state，只能通过回调"请求"父组件改。</li>
          <li><b>Ref 不是用来传数据的</b>：它绕过了声明式数据流，只适合命令式操作。</li>
          <li><b>key 不算通信</b>：它是给 diff 用的身份标识，别拿它当传值手段。</li>
        </ul>
      </section>

      <section className="cc-sum-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote>
          <p>"React 组件通信，<b>先看组件间的层级关系</b>再选方案。</p>
          <p>
            <b>父传子</b>用 props，<b>子传父</b>用父组件传下来的回调函数 —— 这是单向数据流的基础。
            <b>兄弟之间</b>不能直接通信，要把共享状态'提升'到最近的共同父组件，一个负责改、一个负责用。
          </p>
          <p>
            如果层级很深，一层层传 props 会造成'Props 钻取'，这时用 <b>Context</b>：祖先 Provider 提供、后代 useContext 直接取，中间层完全不用参与。
            如果要<b>命令式地操作子组件</b>，比如聚焦输入框、触发动画，可以用 ref 配合 forwardRef 和 useImperativeHandle。
          </p>
          <p>
            到了<b>大型应用</b>，跨页面、跨模块共享状态多，就引入 <b>Redux / Zustand</b> 这类状态管理库做全局通信。
          </p>
          <p>
            一句话总结：<b>相邻用 props，跨层用 Context，兄弟靠提升，命令式用 Ref，全局上状态管理库</b>。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
