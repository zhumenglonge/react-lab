/* =========================================================
 * 共享数据与纯函数：TS 基础原子类型
 * ---------------------------------------------------------
 * TS 的类型只活在编译期，运行时全被擦除。所以「实跑」栏不是跑类型，
 * 而是跑两样能真跑的东西：
 *   ① 原子类型探测台：对每种基础类型的真实值跑 typeof，
 *      揭示「TS 类型关键字」和「JS 运行时 typeof」的对应与陷阱
 *      （null → "object"、NaN → "number" 这类经典坑）。
 *   ② 特殊类型足迹：void / never / any / unknown 在运行时长什么样。
 * 只放普通 JS（无组件），满足 react-refresh 约定。
 * ========================================================= */

// 真跑 typeof：返回运行时 typeof 字符串（异常兜底）
export function runTypeof(fn) {
  try {
    const v = fn()
    return { threw: false, text: typeof v, raw: v }
  } catch (e) {
    return { threw: true, text: `${e.name}: ${e.message}` }
  }
}

// 真跑一段逻辑：返回值或抛错信息（用于特殊类型足迹）
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
  if (typeof v === 'bigint') return `${v}n`
  if (typeof v === 'symbol') return v.toString()
  if (Array.isArray(v)) return `[${v.map(fmtResult).join(', ')}]`
  if (v && typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/* ---------- ① 原子类型探测台 ----------
 * ts: TS 里的类型关键字
 * value: 展示用的值写法
 * run: 返回一个该类型的真实 JS 值（真跑 typeof 的对象）
 * trap: 是否是「typeof 结果和直觉不符」的经典坑 */
export const PROBE = [
  {
    id: 'string',
    ts: 'string',
    value: "'hello'",
    run: () => 'hello',
    note: '所有字符串字面量都属于 string；TS 还能进一步收窄成字面量类型 "hello"。',
  },
  {
    id: 'number',
    ts: 'number',
    value: '42 / 3.14 / 0xff',
    run: () => 42,
    note: 'JS 只有一种数字类型（IEEE 754 双精度），整数/浮点/十六进制都是 number。',
  },
  {
    id: 'boolean',
    ts: 'boolean',
    value: 'true / false',
    run: () => true,
    note: '只有 true / false 两个值。',
  },
  {
    id: 'bigint',
    ts: 'bigint',
    value: '10n',
    run: () => 10n,
    note: 'ES2020 新增，表示任意精度整数（字面量后带 n）。typeof 结果是独立的 "bigint"，不再是 "number"。',
  },
  {
    id: 'symbol',
    ts: 'symbol',
    value: "Symbol('id')",
    run: () => Symbol('id'),
    note: 'ES6 新增，每个 Symbol 值都唯一，常用作对象属性的唯一键。typeof 结果是 "symbol"。',
  },
  {
    id: 'undefined',
    ts: 'undefined',
    value: 'undefined',
    run: () => undefined,
    note: '既是类型也是唯一的值。strict 下要显式声明 `| undefined` 才能赋 undefined。',
  },
  {
    id: 'null',
    ts: 'null',
    value: 'null',
    run: () => null,
    trap: true,
    note: '陷阱：typeof null === "object"（JS 第一版遗留 bug，为兼容从未修复）。但 TS 里 null 是独立的原子类型，和 object 完全无关。',
  },
  {
    id: 'nan',
    ts: 'number',
    value: 'NaN',
    run: () => NaN,
    trap: true,
    note: '陷阱：NaN 在 TS 和 typeof 里都属于 number——它是「非法的数字」而不是独立类型。判断要用 Number.isNaN()。',
  },
]

/* ---------- ② 特殊类型的运行时足迹 ----------
 * 这些类型没有对应的 typeof 结果，只在编译期存在；
 * 这里真跑一段代码，看它们落到运行时是什么样子。 */
export const SPECIAL_RUN = [
  {
    id: 'void',
    ts: 'void',
    title: 'void · 函数没有返回值',
    decl: 'function log(msg: string): void { /* 只打印，不 return */ }',
    run: () => {
      function log() {
        /* 不返回任何东西 */
      }
      return log()
    },
    expect: '运行结果是 undefined（typeof "undefined"）',
    note: 'void 表示「不返回有意义的值」。运行时它就是一个返回 undefined 的普通函数——void 只是编译期的约束。',
  },
  {
    id: 'never',
    ts: 'never',
    title: 'never · 永远到不了正常返回',
    decl: 'function fail(msg: string): never { throw new Error(msg) }',
    run: () => {
      function fail(msg) {
        throw new Error(msg)
      }
      return fail('boom')
    },
    expect: '运行时直接抛错，函数永远不会正常返回',
    note: 'never 是「不可能出现的值」：抛异常的函数、死循环、穷尽性检查的 default 分支。它和 void 的区别是——void 会正常返回 undefined，never 根本回不来。',
  },
  {
    id: 'any',
    ts: 'any',
    title: 'any · 关掉类型检查',
    decl: 'let x: any = 1; x = "str"; x.foo.bar',
    run: () => {
      const x = 1
      return typeof x // any 变量在运行时就是普通值，没有任何额外痕迹
    },
    expect: '运行时看不出它是 any——any 只存在于编译期',
    note: 'any 等于局部放弃类型检查，会顺着赋值/调用一路传染。TS 编译器对它完全放行，错了要到运行时才炸。',
  },
  {
    id: 'unknown',
    ts: 'unknown',
    title: 'unknown · 类型安全的 any',
    decl: 'let v: unknown = JSON.parse(s); /* 用前必须收窄 */',
    run: () => {
      const v = JSON.parse('{"a":1}')
      // unknown 要求先收窄才能用；这里演示不收窄直接取属性会怎样
      return typeof v === 'object' && v !== null ? Object.keys(v) : 'need-narrow'
    },
    expect: '能接收任何值，但用之前必须 typeof / instanceof / 断言收窄',
    note: 'unknown 是 any 的安全版：一样能装任何值，区别是 unknown 不允许你直接操作它，编译器强迫你先收窄。处理外部输入（接口返回、JSON.parse）一律先当 unknown。',
  },
]
