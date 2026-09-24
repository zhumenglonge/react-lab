/* =========================================================
 * 共享数据与纯函数：type vs interface · any/unknown/never
 * ---------------------------------------------------------
 * TS 类型只活在编译期，浏览器跑不了 tsc。所以这里的「实跑」分两类：
 *   ① 编译期行为对拍（预置 tsc --strict 的真实结果）：
 *      - 同名 interface 合并 vs type 冲突
 *      - any / unknown / never 的操作放行矩阵
 *   ② 真跑运行时代码：any 放行导致的运行时炸 vs unknown 收窄后的安全，
 *      这部分是浏览器里真执行的 JS。
 * 只放普通 JS（无组件），满足 react-refresh 约定。
 * ========================================================= */

// 真跑一段 JS：返回值或抛错信息
export function safeRun(fn) {
  try {
    const v = fn()
    return { threw: false, text: fmtResult(v), kind: typeof v }
  } catch (e) {
    return { threw: true, text: `${e.name}: ${e.message}` }
  }
}

function fmtResult(v) {
  if (v === undefined) return 'undefined'
  if (typeof v === 'string') return `"${v}"`
  if (Array.isArray(v)) return `[${v.map(fmtResult).join(', ')}]`
  if (v && typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/* ---------- ① 同名声明：interface 合并 vs type 冲突 ---------- */
export const MERGE = {
  iface: {
    code: `interface User { name: string }
interface User { age: number }

const u: User = { name: '张三', age: 20 }`,
    ok: true,
    verdict: '✅ 自动合并',
    detail: '两个同名 interface 被合并成一个 { name: string; age: number }，u 必须同时满足两者。这叫「声明合并（declaration merging）」，是 interface 独有的能力。',
  },
  type: {
    code: `type User = { name: string }
type User = { age: number }`,
    ok: false,
    verdict: '❌ 编译报错',
    detail: "type 不允许同名重复定义，tsc 直接报：Duplicate identifier 'User'.(2300)。想扩展已有 type 只能用交叉：type User2 = User & { age: number }。",
  },
  note: '声明合并最实用的场景是给第三方库/全局对象「打补丁」——比如给 Window、给某个 npm 包导出的 interface 追加字段，只有 interface 能做到，type 不行。',
}

/* ---------- ② any / unknown / never 操作放行矩阵 ----------
 * ok: 'yes' | 'no' | 'na'，msg 为 tsc --strict 的真实报错或说明 */
export const MATRIX = [
  {
    op: '声明并赋任意值',
    cells: {
      any: { ok: 'yes', msg: 'let a: any = 1; a = "x"; a = {} 全放行' },
      unknown: { ok: 'yes', msg: 'let u: unknown = 1; u = "x" 也能接收任何值' },
      never: { ok: 'no', msg: "Type 'number' is not assignable to type 'never' —— never 装不下任何值" },
    },
  },
  {
    op: '不收窄直接访问属性 x.foo',
    cells: {
      any: { ok: 'yes', msg: '完全放行，错了到运行时才炸' },
      unknown: { ok: 'no', msg: "'x' is of type 'unknown' —— 强迫你先收窄" },
      never: { ok: 'yes', msg: 'never 是所有类型的子类型，操作被放行（但实际执行不到）' },
    },
  },
  {
    op: '赋值给 string 变量',
    cells: {
      any: { ok: 'yes', msg: '放行，但不安全——运行时可能根本不是 string' },
      unknown: { ok: 'no', msg: "Type 'unknown' is not assignable to type 'string'" },
      never: { ok: 'yes', msg: 'never 可赋给任何类型（bottom type），常用于穷尽性检查' },
    },
  },
  {
    op: 'typeof / instanceof 收窄后使用',
    cells: {
      any: { ok: 'na', msg: '本就放行，无需收窄' },
      unknown: { ok: 'yes', msg: '收窄成具体类型后即可安全操作——这是 unknown 的标准用法' },
      never: { ok: 'na', msg: '没有值可收窄，不适用' },
    },
  },
  {
    op: '作为函数返回类型',
    cells: {
      any: { ok: 'yes', msg: 'function f(): any —— 等于放弃返回值检查' },
      unknown: { ok: 'yes', msg: 'function f(): unknown —— 调用方拿到后必须收窄' },
      never: { ok: 'yes', msg: 'function f(): never —— 仅当函数抛异常 / 死循环，永不正常返回' },
    },
  },
]

/* ---------- ③ any 放行 vs unknown 拦截：真跑运行时后果 ---------- */
export const RUNTIME = [
  {
    id: 'any',
    tag: 'any',
    title: 'any 放行 · 运行时才炸',
    ts: `function deep(x: any) {
  return x.profile.name // 编译期一声不吭
}
deep({ id: 1 })`,
    js: `function deep(x) {
  return x.profile.name
}
deep({ id: 1 })`,
    run: () => {
      function deep(x) {
        return x.profile.name
      }
      return deep({ id: 1 })
    },
    note: 'x.profile 是 undefined，再取 .name 当场 TypeError。any 把这类空值访问在编译期完全放行，问题一路漏到线上。',
  },
  {
    id: 'unknown',
    tag: 'unknown',
    title: 'unknown 收窄 · 运行时安全',
    ts: `function nameOf(x: unknown) {
  if (typeof x === 'object' && x !== null
      && 'name' in x) return (x as {name:string}).name
  return '(无名)'
}`,
    js: `function nameOf(x) {
  if (typeof x === 'object' && x !== null && 'name' in x) return x.name
  return '(无名)'
}
[nameOf({ name: '张三' }), nameOf({ id: 1 })]`,
    run: () => {
      function nameOf(x) {
        if (typeof x === 'object' && x !== null && 'name' in x) return x.name
        return '(无名)'
      }
      return [nameOf({ name: '张三' }), nameOf({ id: 1 })]
    },
    note: 'unknown 强迫你先用 typeof / in 收窄，收窄后再访问就安全了。同样是不确定的输入，unknown 把「先检查再用」变成编译期的硬性要求，运行时不会炸。',
  },
]
