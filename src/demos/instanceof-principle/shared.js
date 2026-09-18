/* =========================================================
 * 主题共享数据与工具（非组件，单独放 .js，符合 react-refresh 约定）
 * ---------------------------------------------------------
 * 面试原题：「instanceof 的实现原理？手写一个 instanceof」
 *
 * 一句话原理：a instanceof B 就是沿着 a 的原型链（[[Prototype]]）一路往上找，
 *   只要有一环 === B.prototype 就返回 true；走到 null 还没找到就返回 false。
 *   （规范 OrdinaryHasInstance：先取 C.prototype，非对象直接 false，再循环比原型）
 *
 * 本文件提供：
 *   1. myInstanceof  —— 手写实现（教学版，未处理 Symbol.hasInstance）
 *   2. CASES         —— 一批真实用例，供可视化与「对拍原生 instanceof」
 *   3. buildChain    —— 真跑一遍原型链，产出每一步，供动画逐帧展示
 *   4. protoName     —— 把原型对象显示成 Array.prototype / Object.prototype 这样的名字
 * 所有数据都在真实 JS 对象上跑，不造假数据。
 * ========================================================= */

/**
 * 手写 instanceof（教学版）。
 * @param {*} obj  左操作数
 * @param {*} Ctor 右操作数（构造器）
 * @returns {boolean}
 */
export function myInstanceof(obj, Ctor) {
  // ① 原始类型（含 null / undefined）没有原型链，直接 false
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return false
  }
  // ② 右侧必须是有 prototype 的对象，否则规范会抛 TypeError
  const proto = Ctor == null ? undefined : Ctor.prototype
  if (proto === null || (typeof proto !== 'object' && typeof proto !== 'function')) {
    throw new TypeError('Right-hand side of instanceof is not callable / has no prototype')
  }
  // ③ 从 obj 的原型开始，沿链向上逐个比对
  let cur = Object.getPrototypeOf(obj)
  while (cur !== null) {
    if (cur === proto) return true // 命中：B.prototype 在 a 的原型链上
    cur = Object.getPrototypeOf(cur)
  }
  return false // 走到原型链尽头（null）仍未命中
}

// 给原型对象起个可读名字：Array.prototype / Object.prototype …
export function protoName(node) {
  if (node === null) return 'null'
  const c = node.constructor
  if (c && typeof c.name === 'string' && c.name) return `${c.name}.prototype`
  if (node === Object.prototype) return 'Object.prototype'
  return '（匿名原型对象）'
}

function isObjectLike(v) {
  return v !== null && (typeof v === 'object' || typeof v === 'function')
}

/**
 * 真跑一遍原型链查找，产出可供动画逐帧渲染的步骤。
 * @returns {{
 *   primitive: boolean,       // 左侧是原始值 → 直接 false，没有链
 *   targetName: string,       // 右侧目标 B.prototype 的显示名
 *   startName: string,        // 左侧值的显示名
 *   steps: Array<{name:string, hit:boolean}>,  // 沿途每个原型，hit=是否命中目标
 *   reachedNull: boolean,     // 是否走到了原型链尽头 null
 *   result: boolean,          // 最终结果
 *   reason: 'primitive'|'hit'|'end'
 * }}
 */
export function buildChain(left, Right) {
  const target = Right.prototype
  const targetName = `${Right.name || '匿名构造器'}.prototype`

  if (!isObjectLike(left)) {
    return {
      primitive: true,
      targetName,
      startName: describe(left),
      steps: [],
      reachedNull: false,
      result: false,
      reason: 'primitive',
    }
  }

  const steps = []
  let cur = Object.getPrototypeOf(left)
  let result = false
  let reachedNull = false
  while (cur !== null) {
    const hit = cur === target
    steps.push({ name: protoName(cur), hit })
    if (hit) {
      result = true
      break
    }
    cur = Object.getPrototypeOf(cur)
  }
  if (!result) reachedNull = true

  return {
    primitive: false,
    targetName,
    startName: describe(left),
    steps,
    reachedNull,
    result,
    reason: result ? 'hit' : 'end',
  }
}

// 把左值显示成一段简短文字，用于「起点」卡片
export function describe(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return `[]（${v.constructor?.name ?? 'Array'} 实例）`
  if (typeof v === 'function') return `${v.name || '匿名'}（函数对象）`
  if (typeof v === 'object') {
    const n = v.constructor?.name
    return n ? `${n} 实例` : '对象'
  }
  return `${typeof v}：${String(v)}`
}

/* ---------- 用例集合（真实对象，跑起来和原生 instanceof 一致） ---------- */

class Person {
  constructor(name) {
    this.name = name
  }
}
class Student extends Person {}
function Foo() {}

export const CASES = [
  {
    id: 'arr-array',
    code: '[] instanceof Array',
    left: [],
    Right: Array,
    expect: true,
    note: '数组原型链的第一环就是 Array.prototype，一步命中。',
  },
  {
    id: 'arr-object',
    code: '[] instanceof Object',
    left: [],
    Right: Object,
    expect: true,
    note: '第一环 Array.prototype 不等于目标，继续向上走到 Object.prototype 才命中。',
  },
  {
    id: 'stu-person',
    code: 'new Student() instanceof Person',
    left: new Student(),
    Right: Person,
    expect: true,
    note: '继承的体现：Student 实例的原型链上是 Student.prototype → Person.prototype。',
  },
  {
    id: 'fn-function',
    code: 'f instanceof Function',
    left: Foo,
    Right: Function,
    expect: true,
    note: '函数也是对象，它的 [[Prototype]] 指向 Function.prototype。',
  },
  {
    id: 'function-self',
    code: 'Function instanceof Function',
    left: Function,
    Right: Function,
    expect: true,
    note: '经典彩蛋：Function 是自己的实例（Function.__proto__ === Function.prototype）。',
  },
  {
    id: 'num-number',
    code: '1 instanceof Number',
    left: 1,
    Right: Number,
    expect: false,
    note: '原始类型没有原型链，直接 false。判断原始类型该用 typeof。',
  },
  {
    id: 'null-object',
    code: 'null instanceof Object',
    left: null,
    Right: Object,
    expect: false,
    note: 'null 不是对象，第一步就被拦下返回 false。',
  },
  {
    id: 'proto-null',
    code: 'Object.create(null) instanceof Object',
    left: Object.create(null),
    Right: Object,
    expect: false,
    note: '纯字典对象没有原型，[[Prototype]] 直接是 null，走一步就到尽头。',
  },
]
