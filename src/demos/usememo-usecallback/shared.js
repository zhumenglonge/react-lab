import { useRef, useEffect } from 'react'

/* =========================================================
 * 共享工具 hook：让"引用变没变""渲染了几次"变得肉眼可见
 * ---------------------------------------------------------
 * ⚠️ 本项目开启了 <StrictMode>：开发环境下组件渲染函数会被调用两次，
 *    所以下面这些计数的「绝对值」会偏大（常常成对增长）。
 *    但我们看的是「相对变化」—— 点无关按钮后，缓存过的一侧不动、
 *    没缓存的一侧一直涨，这个对比在 StrictMode 下依然成立，不影响结论。
 * ========================================================= */

// 组件每真正渲染一次就 +1（挂在实例上，切走再回来会重新计数）
export function useRenderCount() {
  const ref = useRef(0)
  ref.current += 1
  return ref.current
}

// 返回「上一次提交时」的值 —— React 官方 usePrevious 模式。
// 在 effect 里更新，避免渲染期间写 ref，StrictMode 下也稳定。
function usePrevious(value) {
  const ref = useRef(undefined)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

// 判断某个引用相比「上一次渲染」是不是新的（换了身份）。
// true = 🆕 新引用（没被缓存住）；false = 🔗 还是原来那个（缓存生效）
export function useIsNewRef(value) {
  const prev = usePrevious(value)
  return prev === undefined ? true : !Object.is(prev, value)
}

/* ---------------------------------------------------------
 * 一个「昂贵计算」：故意跑一大圈循环，模拟真实项目里的重活
 * （大数据求和、复杂格式化、大列表过滤/排序等）。
 * statsRef 可选：传入 { current: { times, ms } } 用于统计
 * 这个重活到底被执行了几次、累计花了多少毫秒。
 * --------------------------------------------------------- */
export function heavyCompute(n, statsRef) {
  const start = performance.now()
  const iterations = 1500000
  let sum = 0
  for (let i = 0; i < iterations; i++) {
    sum += Math.sqrt(i + n)
  }
  const ms = performance.now() - start
  if (statsRef) {
    statsRef.current.times += 1
    statsRef.current.ms += ms
  }
  return { value: Math.round(sum), ms }
}
