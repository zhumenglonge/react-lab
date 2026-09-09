import { useState, useRef, useEffect, useCallback } from 'react'

/* =========================================================
 * 等高虚拟列表 —— 核心实现（约 40 行讲透原理）
 * ---------------------------------------------------------
 * 思路：不管有多少条数据，永远只渲染「可视区 + 上下缓冲」那几十条，
 *      其余空间用一个空白 spacer 撑高，制造"内容很多"的滚动错觉。
 *
 * computeWindow 是纯函数：输入滚动位置，输出「该渲染哪一段」。
 * 单独抽出来是为了让「讲解用的代码」和「真正运行的代码」是同一份，
 * 原理可视化页也会复用它。
 * ========================================================= */

export function computeWindow({ scrollTop, itemCount, itemHeight, height, overscan }) {
  // 1) 所有数据撑开的总高度（决定滚动条长度）
  const totalHeight = itemCount * itemHeight
  // 2) 可视区能放下多少条（向上取整，末行可能只露一半）
  const visibleCount = Math.ceil(height / itemHeight)
  // 3) 当前滚动位置对应的「第一个可见项」索引
  const firstVisible = Math.floor(scrollTop / itemHeight)
  // 4) 真正渲染的区间 = 可见区间 + 上下各 overscan 条缓冲
  const startIndex = Math.max(0, firstVisible - overscan)
  const endIndex = Math.min(itemCount - 1, firstVisible + visibleCount - 1 + overscan)

  return {
    totalHeight,
    visibleCount,
    firstVisible,
    startIndex,
    endIndex,
    rendered: Math.max(0, endIndex - startIndex + 1),
  }
}

export default function VirtualList({
  itemCount,
  itemHeight,
  height,
  overscan = 3,
  renderItem,
  className = '',
  onWindowChange,
}) {
  const [scrollTop, setScrollTop] = useState(0)

  // 用 ref 保存回调：父组件重渲染时不会让下面的 effect 反复触发（否则可能死循环）
  const cbRef = useRef(onWindowChange)
  cbRef.current = onWindowChange

  const win = computeWindow({ scrollTop, itemCount, itemHeight, height, overscan })

  // 把当前窗口信息上报给外部（原理可视化页用它画示意图）
  useEffect(() => {
    cbRef.current?.({ scrollTop, ...win })
    // 只在滚动 / 尺寸 / 数据量变化时上报
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTop, itemCount, itemHeight, height, overscan])

  const handleScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // 5) 只渲染 [startIndex, endIndex] 这一小段，每项绝对定位到它在整个列表里的真实位置
  const nodes = []
  for (let i = win.startIndex; i <= win.endIndex; i++) {
    nodes.push(
      <div key={i} className="vl-item" style={{ top: i * itemHeight, height: itemHeight }}>
        {renderItem(i)}
      </div>,
    )
  }

  return (
    <div
      className={`vl-viewport ${className}`.trim()}
      style={{ height }}
      onScroll={handleScroll}
    >
      {/* spacer 撑开总高度：没有它，滚动条会短得以为没内容 */}
      <div className="vl-spacer" style={{ height: win.totalHeight }}>
        {nodes}
      </div>
    </div>
  )
}
