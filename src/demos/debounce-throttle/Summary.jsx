/* =========================================================
 * 🎯 面试总结：防抖 & 节流
 * 作用域挂在 .dbt-summary 下，样式随本主题懒加载，不依赖其它主题。
 * ========================================================= */

// 高频追问点（模块级常量，未导出，符合 react-refresh 约定）
const NOTES = [
  {
    q: '什么场景用防抖、什么场景用节流？',
    a: '判断标准是"过程要不要响应"。搜索联想、表单校验、resize 结束后重算布局——只关心最终状态，用防抖；scroll 加载更多、mousemove 拖拽、按钮防连点、高频打点——每个区间都要有反馈，用节流。一句话：只关心"最终状态"用防抖，必须"过程也响应"用节流。',
  },
  {
    q: '防抖会不会把中间事件弄丢？',
    a: '会，防抖天生只执行最后一次。所以点赞计数、埋点这种每个事件都有语义的场景不能用防抖。另外如果要"点了立刻有反应"，就开 leading 选项（首次立即执行，wait 内忽略后续），lodash 默认是 trailing-only。',
  },
  {
    q: '节流怎么实现？两种实现有什么区别？',
    a: '定时器版：首次立即执行，然后挂一个 setTimeout，区间内的调用只记录参数，到点用最后参数补一发"尾炮"——最后一个事件不丢。时间戳版：只比较 Date.now() - last >= wait，没有定时器，实现更短，但最后一个事件可能被直接丢掉（要等下一个事件到达才可能补上）。被追问时主动说出"尾炮"这个差异是加分项。',
  },
  {
    q: 'React 组件里用防抖要注意什么？',
    a: '两个坑：① 在函数体里直接 debounce(fn, 500)，每次渲染都是新闭包新 timer，防抖形同虚设——要用 useMemo/useRef 固定一份，或直接用 ahooks 的 useDebounceFn；② 组件卸载要 cancel（useEffect cleanup 里 clearTimeout / debounced.cancel()），否则定时器到点还会对已卸载组件回调。',
  },
  {
    q: '防抖节流和 requestAnimationFrame 什么关系？',
    a: 'rAF 是节流的一种原生形态：回调里判断"本帧是否已排过任务"，没排就 rAF 排一个——视觉更新天然对齐 60fps（~16.7ms），比 setTimeout 节流更平滑也不掉帧。滚动、拖拽这类纯视觉更新优先想到 rAF。',
  },
  {
    q: 'maxWait 是干什么的？',
    a: 'lodash debounce 的选项：事件一直不停、倒计时一直被重置时，最多等 maxWait 毫秒也必须执行一次——相当于给防抖上了"最长等待保险"。 lodash 文档也说了，throttle 可以用带 maxWait 的 debounce 表达，这就是两者的统一性。',
  },
  {
    q: '防抖节流和闭包是什么关系？',
    a: '它们就是闭包最高频的两个实战：timer / lastArgs / last 时间戳都关在内层函数带回的词法环境里，私有、持久、外面改不了。骨架和累加器完全一样：外层函数声明私有变量 → 内层函数读写它 → 返回内层函数。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap dbt-root dbt-summary">
      <section className="dbt-block">
        <h3>🧠 一句话本质</h3>
        <p className="dbt-lead">
          <b>防抖等安静，节流按班次。</b>两个都是"闭包 + setTimeout"给高频事件降频：
          防抖每次触发都<b>重置倒计时</b>，安静 wait 毫秒后才干一次；
          节流每 wait 毫秒<b>最多放行一次</b>，首次立即执行。
          选型只看一条：<b>只关心最终状态用防抖，过程也要响应用节流。</b>
        </p>
      </section>

      <section className="dbt-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="dbt-quote">
          <p>
            "<b>防抖</b>：事件触发时先 <code>clearTimeout</code> 把上一次排的执行撤销，
            再重新挂一个 <code>setTimeout(fn, wait)</code>——只要事件一直来，倒计时就一直重置，
            直到<b>安静 wait 毫秒</b>才真正执行一次。timer 关在闭包里，这是典型的闭包应用。
            典型场景是搜索框联想：连续输入只关心最终输入，中间输入不值得发请求。"
          </p>
          <p>
            "<b>节流</b>：不管事件多密集，<b>每 wait 毫秒最多执行一次</b>。两种写法——
            定时器版是首次立即执行，然后区间内来的调用直接拦住、只把参数记进 <code>lastArgs</code>，
            区间结束用最后参数<b>补一发尾炮</b>；时间戳版更简单，比较 <code>Date.now() - last &gt;= wait</code>，
            但没有尾炮，<b>最后一个事件可能被丢</b>。典型场景是 scroll 加载更多、按钮防连点。"
          </p>
          <p>
            "一句话区分：<b>防抖是'别停，停下来我才干活'，节流是'再热闹我也按固定班次干活'</b>。
            选型看'过程要不要响应'：只要最终结果用防抖，过程也要反馈用节流。"
          </p>
        </blockquote>
      </section>

      <section className="dbt-block">
        <h3>❓ 高频追问清单</h3>
        {NOTES.map((n) => (
          <div className="dbt-note" key={n.q}>
            <p className="dbt-note-q">❓ {n.q}</p>
            <p className="dbt-note-a">{n.a}</p>
          </div>
        ))}
      </section>

      <section className="dbt-block">
        <h3>🎁 加分收尾（主动说）</h3>
        <ul className="dbt-list">
          <li>"工程里我们不手写：lodash / ahooks 的 <code>useDebounceFn</code> 已经把 <b>leading/trailing、cancel、flush、maxWait</b> 和组件卸载 cleanup 都封好了，手写是为了懂原理。"</li>
          <li>"React 18 里 <code>useDeferredValue / useTransition</code> 是同一思想在<b>渲染侧</b>的延伸——不拦事件，把低优先级更新往后挪。"</li>
          <li>"纯视觉更新我会优先考虑 <b>rAF 节流</b>，对齐帧率不掉帧；防误点这种'首次必须立即'的场景用 <b>leading 防抖</b>或直接禁用按钮 + 幂等 token。"</li>
        </ul>
      </section>
    </div>
  )
}
