import { useState, useRef, useEffect, useCallback } from 'react'

/* =========================================================
 * ② 本质与陷阱：三组可交互的原理对比
 * ---------------------------------------------------------
 * A. 重排 vs 合成：改 left/width 触发 layout+paint；改 transform 只走合成（GPU）——真跑动画
 * B. 防抖 vs 节流：同一串输入事件，防抖"停下来才执行一次"，节流"固定间隔必执行一次"——实时计数
 * C. 预加载三兄弟：preload / prefetch / preconnect 各自适用场景
 * 交互都在事件处理器/ effect 里做，渲染期无副作用（规避 react-hooks/purity）。
 * ========================================================= */

const SECTIONS = [
  { key: 'reflow', label: 'A · 重排 vs 合成' },
  { key: 'debounce', label: 'B · 防抖 vs 节流' },
  { key: 'preload', label: 'C · 预加载三兄弟' },
]

export default function PrincipleDemo() {
  const [sec, setSec] = useState('reflow')
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>② 本质与陷阱 · 三组能"跑"出来的原理</h2>
        <p className="desc">
          面试官最爱追问"为什么快"。这三组把最常考的性能原理做成可点可跑的对比——
          动画怎么不卡、输入怎么少触发、资源怎么提前拿。
        </p>
      </div>

      <div className="fp-chips fp-sec-chips">
        {SECTIONS.map((s) => (
          <button key={s.key} className={'fp-chip' + (s.key === sec ? ' on' : '')} onClick={() => setSec(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {sec === 'reflow' && <ReflowSection />}
      {sec === 'debounce' && <DebounceSection />}
      {sec === 'preload' && <PreloadSection />}
    </div>
  )
}

/* ---------------- A. 重排 vs 合成 ---------------- */
function ReflowSection() {
  const [mode, setMode] = useState('composite')
  const [runId, setRunId] = useState(0)

  const pipeline =
    mode === 'layout'
      ? [
          { stage: 'Layout 布局（重排）', hit: true, note: '改 left/width 逼浏览器重算几何与整棵布局树' },
          { stage: 'Paint 绘制（重绘）', hit: true, note: '几何变了要重新像素填充' },
          { stage: 'Composite 合成', hit: true, note: '最后再合成上屏' },
        ]
      : [
          { stage: 'Layout 布局（重排）', hit: false, note: 'transform 不改几何，跳过布局 ✅' },
          { stage: 'Paint 绘制（重绘）', hit: false, note: '提升为合成层后跳过绘制 ✅' },
          { stage: 'Composite 合成', hit: true, note: '交给 GPU 平移/缩放，主线程不忙 ✅' },
        ]

  return (
    <div className="fp-card">
      <h4>🎬 同样让方块动，代价天差地别</h4>
      <div className="fp-chips">
        <button className={'fp-chip' + (mode === 'layout' ? ' on' : '')} onClick={() => { setMode('layout'); setRunId((r) => r + 1) }}>
          改 left / width（触发重排）
        </button>
        <button className={'fp-chip' + (mode === 'composite' ? ' on' : '')} onClick={() => { setMode('composite'); setRunId((r) => r + 1) }}>
          改 transform（只合成）
        </button>
      </div>

      <div className="fp-stage-area">
        <div className="fp-track">
          <div key={runId} className={'fp-ball fp-ball-' + mode} />
        </div>
        <div className="btn-row">
          <button onClick={() => setRunId((r) => r + 1)}>▶ 重播动画</button>
        </div>
      </div>

      <div className="fp-pipeline">
        {pipeline.map((p) => (
          <div key={p.stage} className={'fp-pl-node' + (p.hit ? ' hit' : ' skip')}>
            <div className="fp-pl-title">
              <span>{p.hit ? '✅' : '⏭️'}</span> {p.stage}
            </div>
            <p className="fp-pl-note">{p.note}</p>
          </div>
        ))}
      </div>

      <p className="fp-card-note">
        <b>结论：</b>动画/位移优先用 <code>transform</code> + <code>opacity</code>（可加 <code>will-change</code> 提前提升合成层），
        它绕开重排与重绘，几乎不吃主线程。而改 <code>left/top/width/height/margin</code> 会触发<b>重排</b>，代价最高。
        另一个陷阱是<b>布局抖动</b>：JS 里"读几何属性 → 写样式"交替（如循环里边取 offsetHeight 边改 style），每次都强制同步重排——
        应<b>批量读、批量写</b>。
      </p>
    </div>
  )
}

/* ---------------- B. 防抖 vs 节流 ---------------- */
function DebounceSection() {
  const [text, setText] = useState('')
  const [counts, setCounts] = useState({ input: 0, debounce: 0, throttle: 0 })

  const debRef = useRef(null)
  const thTimerRef = useRef(null)
  const lastThRef = useRef(0)
  const DEBOUNCE_MS = 500
  const THROTTLE_MS = 800

  useEffect(() => () => {
    clearTimeout(debRef.current)
    clearTimeout(thTimerRef.current)
  }, [])

  const fireDebounce = useCallback(() => setCounts((c) => ({ ...c, debounce: c.debounce + 1 })), [])
  const fireThrottle = useCallback(() => setCounts((c) => ({ ...c, throttle: c.throttle + 1 })), [])

  const onChange = (e) => {
    setText(e.target.value)
    setCounts((c) => ({ ...c, input: c.input + 1 }))

    // 防抖：每次输入重置计时，停止 DEBOUNCE_MS 后才执行一次
    clearTimeout(debRef.current)
    debRef.current = setTimeout(fireDebounce, DEBOUNCE_MS)

    // 节流：每 THROTTLE_MS 必执行一次（ Leading + 尾部补偿）
    const now = performance.now()
    const elapsed = now - lastThRef.current
    if (elapsed >= THROTTLE_MS) {
      lastThRef.current = now
      fireThrottle()
    } else if (!thTimerRef.current) {
      thTimerRef.current = setTimeout(() => {
        thTimerRef.current = null
        lastThRef.current = performance.now()
        fireThrottle()
      }, THROTTLE_MS - elapsed)
    }
  }

  const reset = () => {
    clearTimeout(debRef.current)
    clearTimeout(thTimerRef.current)
    thTimerRef.current = null
    lastThRef.current = 0
    setText('')
    setCounts({ input: 0, debounce: 0, throttle: 0 })
  }

  return (
    <div className="fp-card">
      <h4>⌨️ 连续敲几个字，看谁触发得少</h4>
      <input
        className="fp-input"
        type="text"
        value={text}
        placeholder="在这里快速连续输入……"
        onChange={onChange}
      />
      <div className="btn-row">
        <button className="ghost" onClick={reset}>清空重置</button>
      </div>

      <div className="fp-count-row">
        <div className="fp-count">
          <span className="fp-count-k">原始输入事件</span>
          <span className="fp-count-v">{counts.input}</span>
        </div>
        <div className="fp-count fp-count-deb">
          <span className="fp-count-k">🛡️ 防抖实际执行</span>
          <span className="fp-count-v">{counts.debounce}</span>
          <div className="fp-dots">{Array.from({ length: counts.debounce }).map((_, i) => <i key={i} />)}</div>
        </div>
        <div className="fp-count fp-count-thr">
          <span className="fp-count-k">🚦 节流实际执行</span>
          <span className="fp-count-v">{counts.throttle}</span>
          <div className="fp-dots">{Array.from({ length: counts.throttle }).map((_, i) => <i key={i} />)}</div>
        </div>
      </div>

      <div className="fp-vs">
        <div className="fp-vs-col">
          <div className="fp-vs-head">🛡️ 防抖 Debounce</div>
          <p>事件连续触发时<b>只认最后一下</b>：每次触发重置计时，停下来 N ms 后才执行一次。</p>
          <div className="fp-vs-verdict">适合：搜索框联想、表单校验、窗口 resize 结束后再算。</div>
        </div>
        <div className="fp-vs-col">
          <div className="fp-vs-head">🚦 节流 Throttle</div>
          <p>无论触发多密，<b>固定间隔必执行一次</b>，保证过程中持续有反馈。</p>
          <div className="fp-vs-verdict">适合：滚动加载、拖拽、埋点上报——需要"过程也有响应"。</div>
        </div>
      </div>

      <p className="fp-card-note">
        <b>一句话区分：</b>防抖是"<b>你停下我才干活</b>"，节流是"<b>再忙也每隔一会儿干一次</b>"。
        陷阱：防抖会给<b>每次</b>输入都新建/清除计时器，节流要保证<b>尾部</b>也补一次（否则最后一次操作丢失）；
        组件卸载时都要记得 <code>clearTimeout</code>，避免在已销毁组件上 setState。
      </p>
    </div>
  )
}

/* ---------------- C. 预加载三兄弟 ---------------- */
const PRELOAD_ITEMS = [
  {
    key: 'preload', tag: '<link rel="preload">', tone: 'accent',
    head: '给"当前页马上要用"的关键资源',
    body: '提前用高优先级下载当前页面关键资源（首屏字体、关键 CSS、首图），避免等 HTML 解析到才发现要下——直接压 LCP。',
    when: '确定这一页一定会用到、且是关键路径资源时用。',
  },
  {
    key: 'prefetch', tag: '<link rel="prefetch">', tone: 'success',
    head: '给"下一页可能要用"的资源',
    body: '低优先级、在浏览器空闲时预取未来导航才需要的资源（如点击"详情"后的分包）。用户还没走就先备好。',
    when: '能预测用户下一步去哪（下一页/下一步）时用，别抢当前页带宽。',
  },
  {
    key: 'preconnect', tag: '<link rel="preconnect">', tone: 'warning',
    head: '提前和第三方域名"握手"',
    body: '对后面要用到的域名（CDN、字体、API 域）提前完成 DNS + TCP + TLS 握手，真正请求时省掉建连时间。',
    when: '页面依赖关键第三方域名时用；滥用会白占连接，反而变慢。',
  },
]

function PreloadSection() {
  const [pick, setPick] = useState('preload')
  const item = PRELOAD_ITEMS.find((i) => i.key === pick)
  return (
    <div className="fp-card">
      <h4>🔗 preload / prefetch / preconnect，别混</h4>
      <div className="fp-chips">
        {PRELOAD_ITEMS.map((i) => (
          <button key={i.key} className={'fp-chip' + (i.key === pick ? ' on' : '')} onClick={() => setPick(i.key)}>
            {i.key}
          </button>
        ))}
      </div>

      <div className={'fp-pl-detail fp-pl-' + item.tone}>
        <div className="fp-pl-tag">{item.tag}</div>
        <p className="fp-pl-head">{item.head}</p>
        <p className="fp-pl-body">{item.body}</p>
        <p className="fp-pl-when"><b>什么时候用：</b>{item.when}</p>
      </div>

      <p className="fp-card-note">
        <b>记忆锚点：</b>三者对象不同——<code>preload</code> 是"<b>现在就要、当前页</b>"、
        <code>prefetch</code> 是"<b>以后可能、下一页</b>"、<code>preconnect</code> 不下载内容、只"<b>提前把路修通</b>"。
        答对这组区别，能顺带展示你懂资源优先级。
      </p>
    </div>
  )
}
