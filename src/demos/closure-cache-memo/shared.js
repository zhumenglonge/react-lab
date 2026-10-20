/* =========================================================
 * 闭包缓存与累加 · 共享工具（纯函数，无 JSX，不导出组件）
 * ---------------------------------------------------------
 * 这里的代码在浏览器里"当场真跑"，RunDemo 拿到的是执行结果，
 * 不是截图。memoize / createAccumulator 就是面试手写题的标准答案。
 * ========================================================= */

// 模拟一次"昂贵计算"：阻塞约 220ms，返回带参数的结果串
export function slowCompute(n) {
  const start = Date.now()
  while (Date.now() - start < 220) {
    /* 空转模拟耗时 */
  }
  let sum = 0
  for (let i = 1; i <= n; i += 1) sum += i
  return `1+2+…+${n} = ${sum}`
}

// 带命中统计的 memoize：缓存未命中→真算，命中→直接返回上次的结果
export function memoize(fn, onEvent) {
  const cache = new Map()
  return function memoized(...args) {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      onEvent?.({ type: 'hit', args, result: cache.get(key) })
      return cache.get(key)
    }
    const result = fn.apply(this, args)
    cache.set(key, result)
    onEvent?.({ type: 'miss', args, result })
    return result
  }
}

// 面试原题①：闭包累加器。每次调用把入参加进"私有"的 total 并返回
export function createAccumulator() {
  let total = 0
  return function add(step) {
    total += step
    return total
  }
}

// 对拍用反面教材：不用闭包，全局变量谁都碰得到，两个"计数器"互相污染
export const badCounter = {
  total: 0,
  add(step) {
    badCounter.total += step
    return badCounter.total
  },
  read() {
    return badCounter.total
  },
}

// 支持多实例的闭包计数器：每个实例各自持有互不相通的 total
export function createCounter() {
  let total = 0
  return {
    add(step) {
      total += step
      return total
    },
    read() {
      return total
    },
  }
}

// 链式调用版本：add(1)(2)(3)，靠"每次返回闭包自己"把 total 一层层带下去
export function createChainedAccumulator() {
  let total = 0
  const add = function (step) {
    total += step
    add.total = total // 回读 total，供外部展示当前累计值
    return add // 返回自己 → 可以继续 (.add)
  }
  add.total = 0
  return add
}

// 可链式调用的求和函数：sum(1)(2,3)([4,5]) => 15（经典变体）
export function chainSum(...args) {
  let total = 0
  const collect = (items) => {
    items.flat().forEach((v) => { total += Number(v) || 0 })
    return self
  }
  const self = (...a) => collect(a)
  self.valueOf = () => total
  self.getTotal = () => total
  return collect(args)
}
