/* =========================================================
 * 移动零 · 共享工具（纯函数，无 JSX，不导出组件）
 * ---------------------------------------------------------
 * 面试原题「把数组里的 0 都移到末尾，保持非零元素相对顺序，
 * 且尽量少的操作次数、必须原地」——就是 LeetCode 283。
 * 这里给 3 种写法 + 双指针逐快照 + truthy 陷阱，全部当场真跑。
 * ========================================================= */

export const DEFAULT_ARR = [1, 2, 0, 0, 4, 5, 6]

// ① 双指针覆盖写（两趟，原地）：slow 指向下一个非零该落的位置，
//    第一趟把非零依次写到前面，第二趟从 slow 起补 0。写操作 = 非零个数 + 零个数 = n。
export function moveZeroesWrite(input) {
  const arr = [...input]
  let slow = 0
  let writes = 0
  for (let fast = 0; fast < arr.length; fast += 1) {
    if (arr[fast] !== 0) {
      arr[slow] = arr[fast]
      writes += 1
      slow += 1
    }
  }
  while (slow < arr.length) {
    arr[slow] = 0
    writes += 1
    slow += 1
  }
  return { result: arr, ops: writes, opsKind: '次赋值' }
}

// ② 双指针交换（单趟，原地）：非零就与 slow 位交换。
//    自增指针重合时不交换，实际交换次数 = 非零元素"跨过"的零数量。
export function moveZeroesSwap(input) {
  const arr = [...input]
  let slow = 0
  let swaps = 0
  for (let fast = 0; fast < arr.length; fast += 1) {
    if (arr[fast] !== 0) {
      if (slow !== fast) {
        ;[arr[slow], arr[fast]] = [arr[fast], arr[slow]]
        swaps += 1
      }
      slow += 1
    }
  }
  return { result: arr, ops: swaps, opsKind: '次交换' }
}

// ③ filter 一行（非原地，新建数组）：非零拼前面、零拼后面。
//    最容易写出来，但不满足"原地"，且遍历两遍、额外 O(n) 空间。
export function moveZeroesFilter(input) {
  const result = [
    ...input.filter((v) => v !== 0),
    ...input.filter((v) => v === 0),
  ]
  return { result, ops: input.length * 2, opsKind: '次遍历(filter 双趟)' }
}

export const MOVE_METHODS = [
  { key: 'swap', name: '② 双指针交换（推荐）', src: 'if (arr[f]!==0){ swap(arr,slow++,f) }', note: '单趟、原地、保序；交换次数最少' },
  { key: 'write', name: '① 双指针覆盖写', src: '非零写到 slow++，收尾补 0', note: '单趟读+补零，赋值次数=数组长度' },
  { key: 'filter', name: '③ filter 一行', src: '[...a.filter(v=>v!==0), ...a.filter(v=>v===0)]', note: '好记，但新建数组、不原地' },
]

const IMPL = { swap: moveZeroesSwap, write: moveZeroesWrite, filter: moveZeroesFilter }
export function runMethod(key, arr) {
  return IMPL[key](arr)
}

// 展示用格式化：把 0 / -0 / false / null / undefined / 字符串 都区分开显示
export function fmtVal(v) {
  if (Object.is(v, -0)) return '-0'
  if (v === 0) return '0'
  if (typeof v === 'string') return `"${v}"`
  return String(v)
}
export function fmtArr(arr) {
  return `[${arr.map(fmtVal).join(', ')}]`
}

// 双指针（交换版）逐快照，给"本质"栏做可视化：每一步记录 slow / fast / 数组 / 动作
export function traceSwap(input) {
  const arr = [...input]
  const steps = []
  let slow = 0
  steps.push({ slow, fast: -1, arr: [...arr], action: '初始：slow=0 指向下一个非零该放的位置' })
  for (let fast = 0; fast < arr.length; fast += 1) {
    if (arr[fast] !== 0) {
      const v = arr[fast] // 交换前先取值，否则文案会读到被换过来的 0
      if (slow !== fast) {
        ;[arr[slow], arr[fast]] = [arr[fast], arr[slow]]
        steps.push({ slow, fast, arr: [...arr], action: `arr[${fast}]=${v} 非零 → 与 slow(${slow}) 交换，slow++`, moved: true })
      } else {
        steps.push({ slow, fast, arr: [...arr], action: `arr[${fast}]=${v} 非零，与 slow 重合 → 仅 slow++`, moved: false })
      }
      slow += 1
    } else {
      steps.push({ slow, fast, arr: [...arr], action: `arr[${fast}]=0 → fast 继续前进，slow 不动`, moved: false })
    }
  }
  return steps
}

// truthy 陷阱：把"移动 0"写成"过滤掉 falsy"，遇到 false/''/null/undefined 就误伤
const TRAP_ARR = [0, 'a', false, 0, 2, 0, null]

export function truthyTrap() {
  return {
    input: TRAP_ARR,
    // 错误：用真值判断（等价于 filter(Boolean)），把非零的 falsy 也当 0 移走
    wrongTruthy: [...TRAP_ARR.filter(Boolean), ...TRAP_ARR.filter((v) => !v)],
    // 正确：只认数字 0
    correct: [
      ...TRAP_ARR.filter((v) => v !== 0),
      ...TRAP_ARR.filter((v) => v === 0),
    ],
    // 佐证：false / '' / null / undefined 都是 falsy，但!== 0
    isFalsyButNotZero: [false, '', null, undefined].map((v) => ({
      val: fmtVal(v),
      falsy: !v,
      eqZero: v === 0,
    })),
    // -0 === 0 为 true，所以"移动 0"会连 -0 一起移动
    // eslint-disable-next-line no-compare-neg-zero
    negZeroEqZero: -0 === 0,
  }
}
