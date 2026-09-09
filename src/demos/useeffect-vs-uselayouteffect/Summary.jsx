/* ==================== 面试总结页 ====================
 * 作用域统一挂在 .uel-summary 下，样式自带一份（懒加载不依赖其它主题）。
 * ========================================================= */
export default function Summary() {
  return (
    <div className="demo-wrap uel-summary">
      <section className="uel-sum-block">
        <h3>🧠 一张表看懂区别</h3>
        <table className="uel-compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>useEffect</th>
              <th>useLayoutEffect</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>触发时机</td>
              <td>浏览器<b>绘制之后</b></td>
              <td>DOM 提交后、<b>绘制之前</b></td>
            </tr>
            <tr>
              <td>执行方式</td>
              <td><b>异步</b>调度，不阻塞绘制</td>
              <td><b>同步</b>执行，会阻塞绘制</td>
            </tr>
            <tr>
              <td>常见用途</td>
              <td>数据请求、订阅、事件监听、日志、定时器</td>
              <td>测量尺寸、同步定位浮层、恢复滚动、防闪烁</td>
            </tr>
            <tr>
              <td>视觉表现</td>
              <td>在其中改布局，用户可能看到中间态（闪一下）</td>
              <td>在其中改布局，用户看不到中间态（无闪烁）</td>
            </tr>
            <tr>
              <td>性能</td>
              <td>好，不阻塞主线程绘制</td>
              <td>同步阻塞，耗时长会拖慢渲染与交互</td>
            </tr>
            <tr>
              <td>SSR</td>
              <td>安全</td>
              <td>服务端无 DOM，不执行并告警（需特殊处理）</td>
            </tr>
            <tr>
              <td>类比 class</td>
              <td>异步，不严格等于 componentDidUpdate</td>
              <td>时机接近 componentDidMount / DidUpdate（同步）</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="uel-sum-block">
        <h3>🟰 两者的相同点</h3>
        <ul>
          <li>都在 <b>commit 阶段之后</b>触发（DOM 已经更新完）。</li>
          <li><b>依赖数组语义完全一致</b>：不传=每次渲染后都跑；<code>[]</code>=只在挂载后跑一次；<code>[a, b]</code>=a/b 变化后跑。</li>
          <li>都支持 <b>返回清理函数</b>，在下次执行前 / 卸载时调用。</li>
          <li>首次挂载时都会执行一次。</li>
        </ul>
      </section>

      <section className="uel-sum-block">
        <h3>🧭 怎么选？决策路径</h3>
        <ul>
          <li><b>默认无脑用 useEffect</b> —— 覆盖 99% 的副作用场景，且不阻塞绘制、性能更好。</li>
          <li>只有当副作用<b>需要读取 / 修改 DOM 布局</b>，并且<b>必须在浏览器绘制前同步完成</b>、不能让用户看到中间态时，才换 <b>useLayoutEffect</b>。</li>
          <li>典型 layout 场景：tooltip / popover 定位、根据内容尺寸调整位置、路由切换后恢复滚动、动画起始态同步。</li>
          <li>口诀：<b>先 useEffect，看到闪烁再 useLayoutEffect</b>。</li>
        </ul>
      </section>

      <section className="uel-sum-block">
        <h3>⚠️ 容易被追问的点</h3>
        <ul>
          <li><b>为什么 layout 能防闪烁？</b>它在 paint 前同步执行，其中的 setState 会让 React 在 paint 前再做一次同步渲染，浏览器只绘制最终结果，看不到中间态。</li>
          <li><b>为什么它可能拖慢性能？</b>同步阻塞浏览器绘制，耗时越长，首屏白屏 / 交互卡顿越明显。</li>
          <li><b>SSR 警告怎么解决？</b>服务端没有布局概念，useLayoutEffect 不执行且 React 会告警。改用 useEffect，或同构写法：
            <code>const useIsoLayout = typeof window !== 'undefined' ? useLayoutEffect : useEffect</code>。</li>
          <li><b>加分：还有 useInsertionEffect</b>，比 layout 更早，专为 CSS-in-JS 库在渲染前注入样式而设计，业务代码基本用不到。</li>
        </ul>
      </section>

      <section className="uel-sum-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote>
          <p>"两者签名、依赖数组、清理函数都一模一样，<b>区别只在执行时机</b>。</p>
          <p>
            <b>useLayoutEffect</b> 在 DOM 更新之后、浏览器<b>绘制之前同步</b>执行，所以它能读到最新的布局、并在用户看到画面之前同步改掉它——适合测量尺寸、定位浮层、防止中间态闪烁这类场景。代价是它<b>阻塞绘制</b>，里面放耗时逻辑会让页面卡顿。
          </p>
          <p>
            <b>useEffect</b> 在浏览器<b>绘制之后异步</b>执行，不阻塞渲染，性能更好——数据请求、订阅、事件监听、打日志这些绝大多数副作用都该用它。
          </p>
          <p>
            另外 useLayoutEffect 依赖真实 DOM，<b>SSR 下不执行还会告警</b>，服务端渲染要注意。
          </p>
          <p>
            一句话：<b>默认用 useEffect；只有需要在绘制前同步操作 DOM 布局、避免视觉闪烁时，才用 useLayoutEffect</b>。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
