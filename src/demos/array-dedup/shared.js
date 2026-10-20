/* =========================================================
 * 数组去重 · 共享工具（纯函数，无 JSX，不导出组件）
 * ---------------------------------------------------------
 * 面试原题「一个数字数组，怎么去重？」——这里给 6 种真能跑的写法，
 * RunDemo 拿到的都是浏览器当场执行的结果，不是背出来的截图。
 * 约定：所有方法都返回新数组、不改原数组（sort 版内部先 [...arr] 拷贝）。
 * ========================================================= */

// ① Set（ES6 首选）：Set 内部用 SameValueZero 判等，NaN 视为相等、+0/-0 视为相等
export function dedupSet(arr) {
  return [...new Set(arr)]
}

// ② indexOf 双循环（ES5 经典）：结果数组里找不到就 push；indexOf 用 ===，NaN !== NaN
export function dedupIndexOf(arr) {
  const res = []
  for (let i = 0; i < arr.length; i += 1) {
    if (res.indexOf(arr[i]) === -1) res.push(arr[i])
  }
  return res
}

// ③ filter + indexOf：第一个出现的位置等于当前下标才保留（去重本质 = 只留首次出现）
export function dedupFilter(arr) {
  return arr.filter((v, i) => arr.indexOf(v) === i)
}

// ④ Map 标记：key 存在与否判重，逻辑同 ② 但查找从 O(n) 降到 O(1)，适合大数据量
export function dedupMap(arr) {
  const seen = new Map()
  const res = []
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.set(v, true)
      res.push(v)
    }
  }
  return res
}

// ⑤ sort + 相邻比较：排完序重复项必然挨着，只留和前一个不同的；O(n log n) 且会打乱原始顺序
export function dedupSortAdjacent(arr) {
  const sorted = [...arr].sort((a, b) => a - b)
  return sorted.filter((v, i) => i === 0 || v !== sorted[i - 1])
}

// ⑥ reduce 版 filter：把 ③ 收进一次 reduce，面试常考「用 reduce 怎么写」
export function dedupReduce(arr) {
  return arr.reduce((acc, v) => (acc.includes(v) ? acc : [...acc, v]), [])
}

// 注册表：RunDemo 遍历它渲染卡片，顺序即面试推荐顺序
export const DEDUP_METHODS = [
  { key: 'set', name: '① Set 展开', src: '[...new Set(arr)]', note: 'ES6 首选，一行搞定；SameValueZero 判等' },
  { key: 'indexOf', name: '② indexOf 双循环', src: "res.indexOf(v) === -1 && res.push(v)", note: 'ES5 经典；NaN 去不掉——indexOf 找不到 NaN，每个都保留' },
  { key: 'filter', name: '③ filter + indexOf', src: 'arr.filter((v, i) => arr.indexOf(v) === i)', note: '只留首次出现；但 indexOf(NaN) 恒 -1，会把 NaN 全丢' },
  { key: 'map', name: '④ Map 标记', src: 'seen.has(v) || (seen.set(v, 1), res.push(v))', note: 'O(n) 查找，大数据量比 ②③ 快' },
  { key: 'sort', name: '⑤ sort + 相邻比较', src: 'sorted.filter((v, i) => i === 0 || v !== sorted[i - 1])', note: 'O(n log n)；打乱原序，且比较器遇 NaN 失效、结果不可靠' },
  { key: 'reduce', name: '⑥ reduce 版', src: "arr.reduce((a, v) => a.includes(v) ? a : [...a, v], [])", note: '每步展开新数组，最慢，仅展示思路' },
]

// 格式化数字：-0 单独标出来（`${-0}` 会打印 "0"，看不出去重差异）
export function fmtNum(n) {
  return Object.is(n, -0) ? '-0' : String(n)
}

export function fmtArr(arr) {
  return `[${arr.map(fmtNum).join(', ')}]`
}

// ②③⑥（=== 家族）与 ①④（SameValueZero 家族）对特殊值的处理差异，全部当场真跑出来
const SPECIAL_ARR = [NaN, 1, NaN, 2, 2, +0, -0, 3]

export function specialRun() {
  return {
    input: SPECIAL_ARR,
    set: dedupSet(SPECIAL_ARR),
    indexOf: dedupIndexOf(SPECIAL_ARR),
    filter: dedupFilter(SPECIAL_ARR),
    map: dedupMap(SPECIAL_ARR),
    sort: dedupSortAdjacent(SPECIAL_ARR),
    reduce: dedupReduce(SPECIAL_ARR),
    // 判等规则本身也用真跑验证：Set/Map 有 NaN、 indexOf/includes 没有
    setHasNaN: new Set([NaN]).has(NaN),
    mapHasNaN: new Map([[NaN, 1]]).has(NaN),
    indexOfFindsNaN: [NaN].indexOf(NaN), // -1：找不到
    includesFindsNaN: [NaN].includes(NaN), // true：includes 用 SameValueZero
    // 教学演示：刻意用 === 比较 -0，验证“任何方法都区分不了 +0/-0”这一结论
    // eslint-disable-next-line no-compare-neg-zero
    zeroSame: +0 === -0, // true：=== 认为 +0 与 -0 相等，所以没有任何方法能区分它们
  }
}

// 性能基准：生一批带重复的随机数，把还能扛住 O(n²) 的方法真跑一遍计时
export function bench(n = 50000) {
  const arr = Array.from({ length: n }, () => Math.floor(Math.random() * (n / 5)))
  const timed = (fn) => {
    const start = performance.now()
    const res = fn(arr)
    return { ms: performance.now() - start, len: res.length }
  }
  return {
    n,
    set: timed(dedupSet),
    map: timed(dedupMap),
    sort: timed(dedupSortAdjacent),
    // indexOf 版是 O(n²)，5 万项耗时约为 5 千项的 100 倍，基准里只喂 5000 项做量级演示
    indexOfSmall: timed((a) => dedupIndexOf(a.slice(0, 5000))),
  }
}
