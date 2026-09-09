import { useState, useCallback } from 'react'
import VirtualList, { computeWindow } from './VirtualList.jsx'

/* =========================================================
 * 场景 ②：原理剖析 —— 它到底怎么算的
 * ---------------------------------------------------------
 * 左边一个真实可滚动的虚拟列表，右边把它的工作机制画出来：
 *   - 整体缩略图：可视窗口 / 渲染窗口随滚动移动
 *   - 实时计算值：scrollTop → firstVisible → start/end
 * 用较小的固定条数（200），是为了把每一步都看清楚。
 * ========================================================= */

const ITEM_COUNT = 200
const ITEM_HEIGHT = 44
const VIEWPORT_HEIGHT = 360
const MINIMAP_HEIGHT = 360 // 和可视区等高，方便上下对照
const OVERSCANS = [0, 3, 6]

function initWin(overscan) {
  return {
    scrollTop: 0,
    ...computeWindow({
      scrollTop: 0,
      itemCount: ITEM_COUNT,
      itemHeight: ITEM_HEIGHT,
      height: VIEWPORT_HEIGHT,
      overscan,
    }),
  }
}

function Row({ index }) {
  return (
    <div className="vs-row">
      <span className="vs-avatar">{index % 10}</span>
      <span className="vs-name">列表项 #{index}</span>
      <span className="vs-desc">top = {index} × {ITEM_HEIGHT} = {index * ITEM_HEIGHT}px</span>
    </div>
  )
}

const STEPS = [
  {
    n: '①',
    title: '撑开总高度',
    formula: 'totalHeight = itemCount × itemHeight',
    desc: '用一个空白 spacer 撑出"全部内容"的高度，滚动条长度才正确。',
  },
  {
    n: '②',
    title: '定位第一条可见项',
    formula: 'firstVisible = floor(scrollTop ÷ itemHeight)',
    desc: '滚动距离 ÷ 每项高度，就知道当前露出来的第一条是第几个。',
  },
  {
    n: '③',
    title: '算出渲染区间（含缓冲）',
    formula: 'start = firstVisible − overscan\nend = firstVisible + visibleCount − 1 + overscan',
    desc: '在可见区间基础上上下各多渲染 overscan 条，避免快速滚动时露白。',
  },
  {
    n: '④',
    title: '绝对定位到真实位置',
    formula: 'item.style.top = index × itemHeight',
    desc: '只渲染这一小段，每项绝对定位到它在整个列表里该在的位置。',
  },
]

export default function HowItWorksDemo() {
  const [overscan, setOverscan] = useState(3)
  const [win, setWin] = useState(() => initWin(3))

  // 回调保持稳定，避免 VirtualList 内部 effect 反复触发
  const onWindowChange = useCallback((info) => setWin(info), [])

  const pxPerItem = MINIMAP_HEIGHT / ITEM_COUNT

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>② 原理剖析：它到底怎么算的</h3>
        <p className="desc">
          左边是真实可滚动的虚拟列表（共 {ITEM_COUNT} 条），右边把它的工作机制画出来。
          <b>滚动左边</b>，观察「渲染窗口」如何跟着移动 —— 它永远只比可视区大一点点。
        </p>
      </div>

      {/* 四步图解 */}
      <div className="vs-steps">
        {STEPS.map((s) => (
          <div className="vs-step" key={s.n}>
            <div className="vs-step-n">{s.n}</div>
            <div className="vs-step-body">
              <b>{s.title}</b>
              <code className="vs-step-formula">{s.formula}</code>
              <p>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* overscan 调节 */}
      <div className="btn-row vs-size-row">
        <span className="vs-tag">overscan 缓冲</span>
        {OVERSCANS.map((o) => (
          <button
            key={o}
            className={o === overscan ? 'vs-btn' : 'vs-btn ghost'}
            onClick={() => setOverscan(o)}
          >
            上下各 {o} 条
          </button>
        ))}
      </div>

      <div className="vs-how-grid">
        {/* 左：真实列表 */}
        <div className="vs-how-col">
          <div className="vs-how-caption">① 真实列表（滚动我 👇）</div>
          <VirtualList
            itemCount={ITEM_COUNT}
            itemHeight={ITEM_HEIGHT}
            height={VIEWPORT_HEIGHT}
            overscan={overscan}
            renderItem={(i) => <Row index={i} />}
            onWindowChange={onWindowChange}
          />
        </div>

        {/* 中：整体缩略图 */}
        <div className="vs-how-col">
          <div className="vs-how-caption">② 整体缩略图</div>
          <div className="vs-minimap" style={{ height: MINIMAP_HEIGHT }}>
            <div
              className="vs-map-render"
              style={{ top: win.startIndex * pxPerItem, height: win.rendered * pxPerItem }}
            />
            <div
              className="vs-map-viewport"
              style={{ top: win.firstVisible * pxPerItem, height: win.visibleCount * pxPerItem }}
            />
            <span className="vs-map-end top">第 0 条</span>
            <span className="vs-map-end bottom">第 {ITEM_COUNT - 1} 条</span>
          </div>
          <div className="vs-map-legend">
            <span><i className="vs-dot viewport" />可视区 {win.visibleCount} 条</span>
            <span><i className="vs-dot render" />实际渲染 {win.rendered} 条</span>
          </div>
        </div>

        {/* 右：实时计算值 */}
        <div className="vs-how-col">
          <div className="vs-how-caption">③ 实时计算值</div>
          <dl className="vs-data">
            <div><dt>scrollTop</dt><dd>{Math.round(win.scrollTop)} px</dd></div>
            <div><dt>firstVisible</dt><dd>{win.firstVisible}</dd></div>
            <div><dt>startIndex</dt><dd className="hl">{win.startIndex}</dd></div>
            <div><dt>endIndex</dt><dd className="hl">{win.endIndex}</dd></div>
            <div><dt>渲染条数</dt><dd className="hl">{win.rendered} / {ITEM_COUNT}</dd></div>
            <div><dt>totalHeight</dt><dd>{win.totalHeight.toLocaleString()} px</dd></div>
          </dl>
          <p className="tip">
            总数据 <b>{ITEM_COUNT}</b> 条，但 DOM 里任何时刻只有
            <b className="hl"> {win.rendered} </b>条真实存在。
          </p>
        </div>
      </div>

      <pre className="code">{`function computeWindow({ scrollTop, itemCount, itemHeight, height, overscan }) {
  const totalHeight  = itemCount * itemHeight              // ① 撑开总高度
  const visibleCount = Math.ceil(height / itemHeight)      // ② 可视区能放几条
  const firstVisible = Math.floor(scrollTop / itemHeight)  // ② 第一条可见项
  const startIndex   = Math.max(0, firstVisible - overscan)// ③ 上缓冲
  const endIndex     = Math.min(itemCount - 1,
                        firstVisible + visibleCount - 1 + overscan) // ③ 下缓冲
  return { totalHeight, visibleCount, firstVisible, startIndex, endIndex }
}

// 渲染时：只遍历 [startIndex, endIndex]，每项绝对定位
for (let i = startIndex; i <= endIndex; i++) {
  nodes.push(<div key={i} style={{ position:'absolute', top: i * itemHeight }}>{renderItem(i)}</div>)
}`}</pre>

      <p className="tip">
        💡 把 <b>overscan</b> 调成 <b>0</b> 再快速滚动，你会看到边缘偶尔「露白」——
        这就是缓冲区存在的意义：提前把即将进入屏幕的项渲染好。生产环境一般设 3~5 条。
      </p>
    </div>
  )
}
