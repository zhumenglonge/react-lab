/* =========================================================
 * 防抖 & 节流 · 共享工具（纯函数，无 JSX，不导出组件）
 * ---------------------------------------------------------
 * 浏览器里"当场真跑"：RunDemo 拿到的是 debounce / throttle
 * 真实执行后记下的时间线，不是演示截图。
 * 两个实现就是面试手写题的标准答案（定时器版 / 时间戳版）。
 * ========================================================= */

// 标准防抖：事件一连串进来，只等"安静 wait 毫秒"后才执行一次。
// 细节：定时器到点执行时用的是"最后一次调用"攒下的实参（尾部执行）。
export function debounce(fn, wait, onEvent) {
  let timer = null
  const debounced = function (...args) {
    const startAt = Date.now()
    onEvent?.({ type: 'pending', args, at: startAt, delay: 0 })
    clearTimeout(timer) // 拍死上一次倒计时，重新计时
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, args)
      const now = Date.now()
      onEvent?.({ type: 'run', args, at: now, delay: now - startAt })
    }, wait)
  }
  // 对齐 lodash：组件卸载/重新绑定时要能取消待定的一次（防内存泄漏 + 误触发）
  debounced.cancel = () => {
    clearTimeout(timer)
    timer = null
  }
  return debounced
}

// 标准节流：高频轰炸下，每 wait 毫秒最多放行一次（首次立即执行）。
// 细节：区间内被拦下的调用会挂一个"尾炮"，保证最后一个参数不被弄丢。
export function throttle(fn, wait, onEvent) {
  let timer = null
  let lastArgs = null
  const throttled = function (...args) {
    lastArgs = args
    if (timer) {
      onEvent?.({ type: 'blocked', args, at: Date.now(), delay: 0 })
      return // 本区间已放行过，只记参数不执行
    }
    fn.apply(this, args)
    onEvent?.({ type: 'run', args, at: Date.now(), delay: 0 })
    timer = setTimeout(() => {
      timer = null
      if (lastArgs) {
        // 尾巴补偿：区间内至少来过一次，用最后参数在末尾再补一发
        fn.apply(this, lastArgs)
        onEvent?.({ type: 'run-tail', args: lastArgs, at: Date.now(), delay: 0 })
        lastArgs = null
      }
    }, wait)
  }
  throttled.cancel = () => {
    clearTimeout(timer)
    timer = null
    lastArgs = null
  }
  return throttled
}

// 时间戳版节流（追问高发）：纯比较时间差，没有 setTimeout，
// 所以首次立即执行、最后一次"安静下来"的事件会被丢弃（无尾炮）。
export function throttleTimestamp(fn, wait) {
  let last = 0
  return function throttled(...args) {
    const now = Date.now()
    if (now - last >= wait) {
      last = now
      fn.apply(this, args)
    }
  }
}

// 一句话对比口诀（RunDemo 顶部展示用，纯数据）
export const RIDER_SUMMARY = {
  debounce: '别停，停下来我才干活',
  throttle: '再热闹，我也按固定班次干活',
}
