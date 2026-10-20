/* =========================================================
 * 🧠 本质与陷阱：防抖 & 节流
 * 作用域挂在 .dbt-essence 下，样式随本主题懒加载，不依赖其它主题。
 * ========================================================= */

// 高频陷阱清单（模块级常量，未导出，符合 react-refresh 约定）
const PITFALLS = [
  {
    name: '组件卸载没 cleanup，定时器到点照样执行',
    detail: '防抖的 setTimeout 在组件销毁后依然会回调，轻则报错"对已卸载组件 setState"，重则误触发请求。解法：卸载时调 debounced.cancel()（lodash 都提供这个 API），或在 useEffect 的 cleanup 里 clearTimeout。',
  },
  {
    name: 'React 里每次渲染都新建防抖函数 = 防抖失效',
    detail: '在组件函数体里直接 debounce(fn, 500)，每次渲染都是新闭包、各自的 timer，谁也不清谁的定时器——看起来"防了个寂寞"。解法：用 useMemo/useRef 把防抖函数固定一份，或用 ahooks 的 useDebounceFn（顺便就是 React Hooks 追问的抓手）。',
  },
  {
    name: '防抖把"最后一次"之外的事件全丢了',
    detail: '连续输入 8 个字，前 7 个事件不会被执行任何处理——搜索联想能接受（只要最终输入），但点赞计数、埋点上报这种"每个事件都有意义"的场景就是 bug，必须换节流或直接不做防抖。',
  },
  {
    name: '节流 wait 设得比事件间隔还小 = 白写',
    detail: 'mousemove 约 60Hz（~16ms 一次），节流设 10ms 等于没拦。经验值：滚动/resize 类视觉更新直接用 requestAnimationFrame 节流（~16.7ms 天然对齐帧率），比手写 setTimeout 更省，也更 smooth。',
  },
  {
    name: 'leading 与 trailing 没搞清楚就被追问',
    detail: '防抖默认只在尾部执行（trailing），点击场景要"立即响应"就得开 leading（首次触发马上执行，wait 内忽略后续）。lodash 的 debounce(fn, wait, { leading: false, trailing: true }) 是默认值；说清四个组合再谈实现，面试官基本不会再追问。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap dbt-root dbt-essence">
      <section className="dbt-block">
        <h3>🧠 一句话本质</h3>
        <p className="dbt-lead">
          两者都是<b>高频事件的降频器</b>：把"来一次干一次"改成"按我的节奏干"。
          区别只在节奏——<b>防抖等安静</b>（事件停下来 wait 毫秒后才执行一次，期间来一发就重置倒计时），
          <b>节流按班次</b>（不管多密集，每 wait 毫秒最多放行一次）。
          记住口诀：防抖是"<b>别停，停下来我才干活</b>"，节流是"<b>再热闹，我也按固定班次干活</b>"。
        </p>
        <p className="dbt-lead">
          实现上它们是<b>闭包的两大实战</b>：防抖的 <code>timer</code>、节流的 <code>last</code> 计时器，
          都是"私有且持久"的状态——和累加器/memoize 同一个骨架（外层放变量 → 内层读写 → 返回内层）。
        </p>
      </section>

      <section className="dbt-block">
        <h3>📊 对拍表：一张表分清</h3>
        <table className="dbt-compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>防抖 debounce</th>
              <th>节流 throttle</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>触发时机</td>
              <td>事件<b>停止</b>后 wait ms 执行一次</td>
              <td>每 wait ms <b>最多</b>执行一次（首次立即）</td>
            </tr>
            <tr>
              <td>高频轰炸下</td>
              <td>一直重置倒计时，<b>一次都不执行</b></td>
              <td>稳定按班次放行，<b>周期执行</b></td>
            </tr>
            <tr>
              <td>最后事件会丢吗</td>
              <td>不丢（等的就是它）</td>
              <td>定时器版补尾炮不丢；<b>时间戳版会丢</b></td>
            </tr>
            <tr>
              <td>闭包存的变量</td>
              <td><code>timer</code>（待执行的 setTimeout id）</td>
              <td><code>last</code> 时间戳 或 <code>timer</code></td>
            </tr>
            <tr>
              <td>响应感受</td>
              <td>延迟明显（要等安静）</td>
              <td>跟手（第一下就执行）</td>
            </tr>
            <tr>
              <td>典型场景</td>
              <td>搜索联想、表单校验、窗口 resize 结束后重算布局</td>
              <td>scroll 加载更多、mousemove 拖拽、按钮防连点、上报打点</td>
            </tr>
          </tbody>
        </table>
        <p className="dbt-tip">
          💡 选型一句话：<b>只关心"最终状态"用防抖，必须"过程也响应"用节流。</b>
          搜索框要的是用户最终输入 → 防抖；无限滚动要的是"边滚边加载" → 节流。
        </p>
      </section>

      <section className="dbt-block">
        <h3>🔗 为什么容易混：它们是一对"双胞胎"</h3>
        <ul className="dbt-list">
          <li>
            <b>目标相同：</b>都是给高频事件（resize/scroll/input/mousemove）限流，
            减少昂贵的回调执行（重算布局、发请求、重渲染）。
          </li>
          <li>
            <b>手段同源：</b>都靠闭包持有私有状态 + setTimeout 挪执行，
            手写模板都是"外层声明变量 → 内层读写 → 返回内层"三步。
          </li>
          <li>
            <b>唯一分歧：</b>防抖<b>撤销</b>已排定的执行换一个更晚的（clearTimeout 重来），
            节流<b>拒绝</b>区间内的新请求（到点才放行下一个）。一个是"改签"，一个是"限流"。
          </li>
          <li>
            <b>可以合体：</b>lodash 文档里写明 throttle(options) 可以用
            <b>带 maxWait 的 debounce</b> 表达——"再闹也最多等 maxWait 就必须干一次"，
            这就是节流；说清这一点，"混淆"这个问题本身就消解了。
          </li>
        </ul>
      </section>

      <section className="dbt-block">
        <h3>⚠️ 高频陷阱清单</h3>
        {PITFALLS.map((p) => (
          <div className="dbt-pit" key={p.name}>
            <p className="dbt-pit-name">⚠️ {p.name}</p>
            <p className="dbt-pit-detail">{p.detail}</p>
          </div>
        ))}
      </section>

      <section className="dbt-block">
        <h3>🌍 真实工程里的样子</h3>
        <ul className="dbt-list">
          <li><b>Lodash：</b>_.debounce / _.throttle，带 leading/trailing/maxWait 选项和 cancel/flush 方法；maxWait 保证"防抖再闹也有最长等待"。</li>
          <li><b>ahooks：</b>useDebounceFn / useThrottleFn，把"每渲染新建闭包"的坑封装掉了，还带自动 cancel。</li>
          <li><b>React 官方：</b>useDeferredValue / useTransition 是渲染侧的"防抖"思路——不是拦事件，而是把低优先级更新往后挪。</li>
          <li><b>rAF 节流：</b>滚动/拖拽类视觉更新用 requestAnimationFrame 对齐 60fps，比定时器节流更平滑，是"节流"的浏览器原生变体。</li>
        </ul>
      </section>
    </div>
  )
}
