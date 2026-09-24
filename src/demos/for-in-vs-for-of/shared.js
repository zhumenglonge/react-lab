/* =========================================================
 * 共享数据与纯函数：for...in vs for...of
 * ---------------------------------------------------------
 * 只放「能被当场执行」的采集逻辑和测试目标，不含组件，
 * 以满足 react-refresh（组件与非组件导出分文件）的约定。
 * ========================================================= */

/* ---------- 采集器：真的跑一遍 for...in / for...of ---------- */

// for...in：收集枚举到的属性键名（默认含原型链上可枚举属性）
export function collectForIn(target) {
  const keys = []
  for (const k in target) keys.push(k)
  return keys
}

// for...in + hasOwnProperty：只保留自有属性，把原型链的剔掉
export function collectForInOwn(target) {
  const keys = []
  for (const k in target) {
    if (Object.prototype.hasOwnProperty.call(target, k)) keys.push(k)
  }
  return keys
}

// for...of：收集迭代出的「值」；不可迭代对象会抛错，这里捕获并回传
export function collectForOf(target) {
  try {
    const values = []
    for (const v of target) values.push(v)
    return { ok: true, values }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

// 统一格式化：字符串加引号、数组（如 Map 的 [k,v]）递归展开
export function fmt(v) {
  if (typeof v === 'string') return `"${v}"`
  if (Array.isArray(v)) return `[${v.map(fmt).join(', ')}]`
  return String(v)
}

/* ---------- 测试目标工厂 ---------- */

function makeArray() {
  return ['a', 'b', 'c']
}
function makePlainObj() {
  return { x: 1, y: 2, z: 3 }
}
function makeString() {
  return 'hey'
}
function makeArrayWithExtra() {
  const a = ['x', 'y']
  a.extra = '挂在数组上的自定义属性'
  return a
}
function makeSparse() {
  // eslint-disable-next-line no-sparse-arrays
  return [1, , 3] // 中间 index 1 是一个「洞」
}
function makeWithProto() {
  const parent = { inherited: '来自原型的可枚举属性' }
  const child = Object.create(parent)
  child.own = '自有属性 1'
  child.own2 = '自有属性 2'
  return child
}
function makeMap() {
  return new Map([['a', 1], ['b', 2]])
}
function makeSet() {
  return new Set(['p', 'q'])
}

/* ---------- 目标清单（含每项的教学要点） ---------- */

export const TARGETS = [
  {
    id: 'array',
    label: '普通数组',
    snippet: "const t = ['a', 'b', 'c']",
    make: makeArray,
    note: "for...in 拿到的是下标字符串 '0'/'1'/'2'，for...of 拿到的是值。",
  },
  {
    id: 'object',
    label: '普通对象',
    snippet: "const t = { x: 1, y: 2, z: 3 }",
    make: makePlainObj,
    note: '对象没有 Symbol.iterator，for...of 直接抛错；这正是 for...in 的主场。',
  },
  {
    id: 'string',
    label: '字符串',
    snippet: "const t = 'hey'",
    make: makeString,
    note: '两者都能跑：in 走下标，of 走每个字符。',
  },
  {
    id: 'array-extra',
    label: '数组 + 自定义属性',
    snippet: "const t = ['x', 'y']; t.extra = '…'",
    make: makeArrayWithExtra,
    note: "for...in 会把 extra 也枚举进来（它是可枚举属性），for...of 只认迭代出的两个元素。",
  },
  {
    id: 'sparse',
    label: '稀疏数组 [1, , 3]',
    snippet: 'const t = [1, , 3]  // index 1 是洞',
    make: makeSparse,
    note: "洞不是属性，for...in 跳过它（只给 '0'/'2'）；for...of 会把它当 undefined 迭代出来。",
  },
  {
    id: 'proto',
    label: '带原型链的对象',
    snippet: 'const t = Object.create({ inherited: … }); t.own = …; t.own2 = …',
    make: makeWithProto,
    note: 'for...in 默认连原型链上的可枚举属性一起遍历（inherited 也出来），所以要用 hasOwnProperty 过滤。',
  },
  {
    id: 'map',
    label: 'Map',
    snippet: "const t = new Map([['a', 1], ['b', 2]])",
    make: makeMap,
    note: 'Map 没有可枚举的自有属性，for...in 空手而归；for...of 迭代出 [键, 值] 数组。',
  },
  {
    id: 'set',
    label: 'Set',
    snippet: "const t = new Set(['p', 'q'])",
    make: makeSet,
    note: '同理：for...in 枚举不到，for...of 逐个给出值。',
  },
]
