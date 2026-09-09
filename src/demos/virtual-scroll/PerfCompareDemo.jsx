import { useState, useRef, useLayoutEffect, useCallback } from 'react'
import VirtualList from './VirtualList.jsx'

/* =========================================================
 * 场景 ①：性能对比 —— 眼见为实
 * ---------------------------------------------------------
 * 同样的数据、同样高的滚动区：
 *   左边「暴力全渲染」：count 有多大，DOM 就有多大
 *   右边「虚拟滚动」  ：DOM 数量只跟可视区有关，与 count 无关
 * 两个硬指标：真实 DOM 节点数（实测）+ 挂载耗时（performance.now）
 * ========================================================= */

const VIEWPORT_HEIGHT = 360
const ITEM_HEIGHT = 44

const SIZES = [
  { label: '1 千条', value: 1000 },
  { label: '1 万条', value: 10000 },
  { label: '10 万条', value: 100000 },
]

// 模拟一个"有点分量"的列表项：头像位 + 名字 + 描述 + 分数（每条 5 个 DOM 元素）
function Row({ index }) {
  const score = (index * 37) % 100
  return (
    <div className="vs-row">
      <span className="vs-avatar">{index % 10}</span>
      <span className="vs-name">用户 #{index}</span>
      <span className="vs-desc">这是第 {index} 行的描述文本</span>
      <span className="vs-score">{score}</span>
    </div>
  )
}

// ❌ 反面：一次性把 count 条全部塞进 DOM
function NaiveList({ count }) {
  const items = []
  for (let i = 0; i < count; i++) {
    items.push(
      <div key={i} className="vs-static-item" style={{ height: ITEM_HEIGHT }}>
        <Row index={i} />
      </div>,
    )
  }
  return (
    <div className="vs-scroll" style={{ height: VIEWPORT_HEIGHT }}>
      {items}
    </div>
  )
}

// 一个对比面板：自己负责「重新挂载计时」和「DOM 节点统计」，互不干扰
function Panel({ kind, count }) {
  const isVirtual = kind === 'virtual'
  const [mountKey, setMountKey] = useState(0)
  const [duration, setDuration] = useState(null)
  const [nodeCount, setNodeCount] = useState(0)
  const listRef = useRef(null)
  const t0 = useRef(0)

  const measure = useCallback(() => {
    t0.current = performance.now()
    setMountKey((k) => k + 1) // key 变化 → 整棵列表销毁重建，模拟"首屏渲染"
  }, [])

  // 列表 DOM 构建完成后（layout 阶段同步执行）读取耗时 + 实测真实节点数
  useLayoutEffect(() => {
    if (!listRef.current) return
    if (t0.current) {
      setDuration(performance.now() - t0.current)
      t0.current = 0
    }
    setNodeCount(listRef.current.querySelectorAll('*').length)
  }, [mountKey, count])

  return (
    <div className={`vs-panel ${isVirtual ? 'good' : 'bad'}`}>
      <div className="vs-panel-head">
        <span className="vs-badge">{isVirtual ? '✅ 虚拟滚动' : '❌ 暴力全渲染'}</span>
        <code>{isVirtual ? '只渲染可视区 ~20 条' : `渲染全部 ${count.toLocaleString()} 条`}</code>
      </div>

      <div className="vs-metrics">
        <div className="vs-metric">
          <span className="vs-metric-label">挂载耗时</span>
          <b className={isVirtual ? 'good' : 'bad'}>
            {duration == null ? '点击测量' : `${duration.toFixed(1)} ms`}
          </b>
        </div>
        <div className="vs-metric">
          <span className="vs-metric-label">真实 DOM 节点</span>
          <b className={isVirtual ? 'good' : 'bad'}>{nodeCount.toLocaleString()}</b>
        </div>
      </div>

      <div className="btn-row">
        <button className="vs-btn" onClick={measure}>⏱ 重新挂载并计时</button>
      </div>

      <div className="vs-list-host" ref={listRef}>
        {isVirtual ? (
          <VirtualList
            key={mountKey}
            itemCount={count}
            itemHeight={ITEM_HEIGHT}
            height={VIEWPORT_HEIGHT}
            renderItem={(i) => <Row index={i} />}
          />
        ) : (
          <NaiveList key={mountKey} count={count} />
        )}
      </div>
    </div>
  )
}

export default function PerfCompareDemo() {
  const [sizeIdx, setSizeIdx] = useState(1) // 默认 1 万条
  const size = SIZES[sizeIdx].value

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>① 性能对比：眼见为实</h3>
        <p className="desc">
          同样的数据、同样高的滚动区，左边把 <b>{size.toLocaleString()}</b> 条一次性全渲染，
          右边只渲染可视区那 ~20 条。分别点两边的「⏱ 重新挂载并计时」，看差距。
        </p>
      </div>

      <div className="btn-row vs-size-row">
        <span className="vs-tag">数据量</span>
        {SIZES.map((s, i) => (
          <button
            key={s.value}
            className={i === sizeIdx ? 'vs-btn' : 'vs-btn ghost'}
            onClick={() => setSizeIdx(i)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {size >= 100000 && (
        <p className="tip warn vs-warn">
          ⚠️ 10 万条时「暴力全渲染」可能让页面卡顿数秒、内存飙升 —— 这正是真实项目里长列表的性能事故现场。
          而虚拟滚动一侧始终丝滑。若浏览器卡住，稍等片刻或切回小数据量即可。
        </p>
      )}

      <div className="demo-grid">
        {/* key 带上 size：切换数据量时面板整体重建，指标自动归零 */}
        <Panel key={`naive-${size}`} kind="naive" count={size} />
        <Panel key={`virtual-${size}`} kind="virtual" count={size} />
      </div>

      <pre className="code">{`// ❌ 暴力全渲染：DOM 数量 = 数据条数，10 万条就是 10 万个节点
{items.map((_, i) => <Row key={i} index={i} />)}

// ✅ 虚拟滚动：DOM 数量 = 可视区条数（≈20），与总条数无关
const { startIndex, endIndex } = computeWindow({ scrollTop, itemCount, itemHeight, height, overscan })
for (let i = startIndex; i <= endIndex; i++) {
  nodes.push(<Row key={i} index={i} />)   // 永远只有这一小段真实存在
}`}</pre>

      <p className="tip">
        👉 重点看 <b>「真实 DOM 节点」</b>这个数字：暴力一侧会随数据量暴涨到几十万，虚拟一侧永远是几十。
        DOM 节点越多，内存占用越高、重排重绘越慢、滚动越卡 —— 这就是虚拟滚动要解决的核心问题。
        （耗时数字受机器和 dev 模式 StrictMode 双挂载影响，看<b>数量级</b>即可。）
      </p>
    </div>
  )
}
