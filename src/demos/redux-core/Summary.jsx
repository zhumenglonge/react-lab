/* ==================== 面试总结页 ====================
 * 作用域统一挂在 .rx-summary 下，样式自带一份（懒加载不依赖其它主题）。
 * 目标：既答得出"原理"，也说得出"真实项目怎么写"。
 * ========================================================= */

/* 手写 mini-redux ↔ 真实 Redux Toolkit 的对应关系 */
const RTK_SOURCE = `// ===== 现代 Redux = Redux Toolkit（RTK），实战就这么写 =====
import { createSlice, configureStore } from '@reduxjs/toolkit'
import { Provider, useSelector, useDispatch } from 'react-redux'

// ① createSlice：一次生成 reducer + action creators
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    // 内置 Immer，看着像"直接改 state"，其实生成的仍是新对象
    increment: (state) => { state.value += 1 },
  },
})
export const { increment } = counterSlice.actions

// ② configureStore：创建 store（默认已集成 thunk + DevTools）
const store = configureStore({ reducer: counterSlice.reducer })

// ③ Provider 注入 + 组件里用 useSelector / useDispatch
<Provider store={store}><Counter /></Provider>

function Counter() {
  const value = useSelector((s) => s.counter.value)
  const dispatch = useDispatch()
  return <button onClick={() => dispatch(increment())}>{value}</button>
}`

export default function Summary() {
  return (
    <div className="demo-wrap rx-summary">
      <section className="rx-sum-block">
        <h3>🧠 一句话本质</h3>
        <p className="rx-lead">
          Redux 是一个<b>可预测的状态容器</b>：整个应用的状态放在<b>唯一的 store</b> 里，
          state 是<b>只读</b>的，想改它只能 <b>dispatch 一个 action</b>，由<b>纯函数 reducer</b> 算出新 state。
          这套约束让状态变化全程可追踪、可预测、可调试。
        </p>
      </section>

      <section className="rx-sum-block">
        <h3>📜 三大原则（必背）</h3>
        <ol>
          <li><b>单一数据源</b>：整个应用只有一个 store，一棵状态树。</li>
          <li><b>State 只读</b>：唯一能改变 state 的方式就是 dispatch 一个 action，不能直接赋值修改。</li>
          <li><b>纯函数修改</b>：reducer 必须是纯函数 —— <code>(旧state, action) =&gt; 新state</code>，相同输入必得相同输出，无副作用、不改入参。</li>
        </ol>
      </section>

      <section className="rx-sum-block">
        <h3>🧩 核心概念</h3>
        <table className="rx-compare">
          <thead>
            <tr>
              <th>概念</th>
              <th>是什么 / 作用</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><b>Store</b></td><td>保存唯一状态树的对象，由 createStore 生成，全局只有一个</td></tr>
            <tr><td><b>Action</b></td><td>普通对象 <code>{'{ type, payload }'}</code>，描述"发生了什么"</td></tr>
            <tr><td><b>Reducer</b></td><td>纯函数，接收旧 state + action，返回新 state</td></tr>
            <tr><td><b>Dispatch</b></td><td>派发 action 的唯一入口，触发整个更新流程</td></tr>
            <tr><td><b>Subscribe</b></td><td>监听 state 变化，变化时回调（React 靠它触发重渲染）</td></tr>
            <tr><td><b>Selector</b></td><td>从 state 里取出需要的切片，配合订阅做性能优化</td></tr>
            <tr><td><b>Middleware</b></td><td>在 action 到达 reducer 前拦截处理，做日志 / 异步 / 鉴权等</td></tr>
          </tbody>
        </table>
      </section>

      <section className="rx-sum-block">
        <h3>🔄 工作流程（呼应 ② 号 tab）</h3>
        <p className="rx-flowline">
          View <span>→ dispatch(action) →</span> Middleware <span>→</span> Reducer(旧state, action)
          <span>→ 新state →</span> Store 更新 <span>→ 通知订阅者 →</span> View 重渲染
        </p>
        <p className="rx-note">永远单向、一个方向流动。不存在"组件 A 直接改组件 B 的状态"。</p>
      </section>

      <section className="rx-sum-block">
        <h3>🛠️ 真实项目怎么写（Redux Toolkit）</h3>
        <p className="rx-note">
          工作中基本不再手写 createStore，而是用官方推荐的 <b>Redux Toolkit</b>。它把样板代码大幅简化，
          并且<b>默认内置 thunk 和 DevTools</b>。下面是真实写法：
        </p>
        <pre className="code">{RTK_SOURCE}</pre>
      </section>

      <section className="rx-sum-block">
        <h3>🔗 手写 mini-redux ↔ RTK 一一对应</h3>
        <p className="rx-note">把这张表记住，你就同时答得出"原理"和"实战 API"了：</p>
        <table className="rx-compare">
          <thead>
            <tr>
              <th>本 demo 手写的</th>
              <th>真实 RTK 里叫</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>createStore(reducer)</td><td>configureStore({'{ reducer }'})</td></tr>
            <tr><td>手写 reducer + switch</td><td>createSlice({'{ reducers }'})（内置 Immer）</td></tr>
            <tr><td>dispatch({'{ type: "x" }'})</td><td>dispatch(increment()) —— action creator</td></tr>
            <tr><td>applyMiddleware(thunk)</td><td>RTK 默认已集成 thunk</td></tr>
            <tr><td>useStore(store)（useSyncExternalStore）</td><td>useSelector / useDispatch</td></tr>
          </tbody>
        </table>
      </section>

      <section className="rx-sum-block">
        <h3>⚖️ Redux vs Context + useReducer</h3>
        <table className="rx-compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>Redux</th>
              <th>Context + useReducer</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>适用规模</td><td>中大型、跨很多组件共享、状态复杂</td><td>中小型、局部共享（如主题、登录态）</td></tr>
            <tr><td>DevTools</td><td>强：时间旅行、action 回放</td><td>无</td></tr>
            <tr><td>中间件 / 异步</td><td>生态成熟（thunk / saga）</td><td>需自己实现</td></tr>
            <tr><td>性能</td><td>useSelector 精确订阅，细粒度重渲染</td><td>Context 一变，所有消费者都重渲染</td></tr>
            <tr><td>心智成本</td><td>概念多（RTK 已大幅简化）</td><td>轻量，React 内置，零依赖</td></tr>
          </tbody>
        </table>
        <p className="rx-note">
          结论：<b>状态被很多互不相关的组件共享、需要可追溯 / 中间件 / 时间旅行时用 Redux</b>；
          只是简单的跨层级传递（主题、语言、当前用户）用 Context 就够了。
        </p>
      </section>

      <section className="rx-sum-block">
        <h3>⚠️ 高频追问点</h3>
        <ul>
          <li><b>reducer 为什么必须是纯函数？</b>这样相同 action 必得相同 state，才能做时间旅行调试、变更检测（靠引用比较 <code>!==</code> 判断是否重渲染）。</li>
          <li><b>为什么不能直接改 state？</b>Redux 靠"新旧 state 引用是否变化"来决定要不要通知订阅者 / 重渲染；直接改原对象引用不变，界面不会更新。</li>
          <li><b>Redux 怎么处理异步？</b>用中间件。redux-thunk 让 action 可以是函数（函数里异步 dispatch 对象 action）；复杂场景用 redux-saga；RTK 推荐 createAsyncThunk。</li>
          <li><b>useSelector 为什么能只让相关组件重渲染？</b>它用 useSyncExternalStore 订阅，并对 selector 返回值做比较，只有选中的切片变了才重渲染当前组件。</li>
          <li><b>加分：store 怎么连进 React？</b>react-redux v8+ 底层就是本 demo 用的 <code>useSyncExternalStore</code> —— subscribe 监听变化、getState 读快照。</li>
        </ul>
      </section>

      <section className="rx-sum-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote>
          <p>"Redux 是把整个应用的状态集中放到<b>一个 store</b> 里的状态管理方案，遵循三条原则：<b>单一数据源、state 只读、用纯函数 reducer 修改</b>。</p>
          <p>
            它的数据流是<b>单向</b>的：组件 <b>dispatch 一个 action</b>（描述发生了什么）→ action 经过<b>中间件</b>（可做日志、异步）→ 交给 <b>reducer</b>，reducer 拿旧 state 和 action 算出<b>新 state</b>（纯函数，不修改原对象）→ store 更新并<b>通知订阅者</b> → 订阅了 store 的组件<b>重渲染</b>。
          </p>
          <p>
            核心 API 其实很简单：<code>createStore</code> 用闭包守住 state，对外只暴露 <code>getState / dispatch / subscribe</code>，我甚至能手写一个迷你版。
          </p>
          <p>
            异步靠<b>中间件</b>解决，最经典的是 thunk，让 action 可以是个函数，在请求回来后再 dispatch 真正的对象 action。
          </p>
          <p>
            实际项目里我用官方的 <b>Redux Toolkit</b>：<code>createSlice</code> 一次生成 reducer 和 action、<code>configureStore</code> 建 store（默认带 thunk 和 DevTools）、组件里用 <code>useSelector / useDispatch</code>，它底层靠 <code>useSyncExternalStore</code> 把 store 订阅进 React。"</p>
        </blockquote>
      </section>
    </div>
  )
}
