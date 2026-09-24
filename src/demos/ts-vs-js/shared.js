/* =========================================================
 * 共享数据与纯函数：TS 和 JS 的区别
 * ---------------------------------------------------------
 * TS 无法在浏览器运行，所以每个用例的「实跑」跑的是
 * 类型擦除后的等价 JS——让你亲眼看到：TS 在编译期拦下的错，
 * JS 要么运行时才炸、要么静默算出离谱结果。
 * 只放普通 JS（无组件），满足 react-refresh 约定。
 * ========================================================= */

// 真跑一段 JS：返回值或抛出的错误信息
export function safeRun(fn) {
  try {
    return { threw: false, text: fmtResult(fn()) }
  } catch (e) {
    return { threw: true, text: `${e.name}: ${e.message}` }
  }
}

function fmtResult(v) {
  if (typeof v === 'string') return `"${v}"`
  if (Array.isArray(v)) return `[${v.map(fmtResult).join(', ')}]`
  if (v && typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/* ---------- 四个对拍用例 ----------
 * ts: 带类型的源码（展示用）
 * tsError: tsc --strict 的编译期报错（真实报错文案）
 * js: 类型擦除后实际运行的代码（展示用，与 runJs 一致）
 * runJs: 当场执行的函数 */

export const CASES = [
  {
    id: 'typo',
    title: '① 属性名打错',
    ts: `interface User { name: string }
const u: User = { name: '张三' }
console.log(u.nmae.toUpperCase())`,
    tsError: `Property 'nmae' does not exist on type 'User'. Did you mean 'name'?`,
    js: `const u = { name: '张三' }
console.log(u.nmae.toUpperCase())`,
    runJs: () => {
      const u = { name: '张三' }
      return u.nmae.toUpperCase()
    },
    note: 'JS 里 u.nmae 静默变 undefined，直到 .toUpperCase() 才在运行时炸；TS 在编译期标红，甚至猜出你想写 name。拼写错误是 TS 拦截率最高的一类 bug。',
  },
  {
    id: 'mixed-array',
    title: '② 数组混入错误类型',
    ts: `const list: number[] = [1, 2, 3]
list.push('4') // 编译报错
const sum = list.reduce((a, b) => a + b)`,
    tsError: `Argument of type 'string' is not assignable to parameter of type 'number'.`,
    js: `const list = [1, 2, 3]
list.push('4')
const sum = list.reduce((a, b) => a + b)`,
    runJs: () => {
      const list = [1, 2, 3]
      list.push('4')
      return list.reduce((a, b) => a + b)
    },
    note: 'JS 里 push 毫无怨言，reduce 时 6 + "4" 变成字符串拼接，结果是 "64"——不报错、不崩溃，就是安静地算错，这类静默 bug 最难查。TS 在 push 那一行就拦住。',
  },
  {
    id: 'null',
    title: '③ 空值访问',
    ts: `function firstChar(s: string | null) {
  return s.trim()[0] // strictNullChecks 下报错
}`,
    tsError: `'s' is possibly 'null'.`,
    js: `function firstChar(s) {
  return s.trim()[0]
}
firstChar(null)`,
    runJs: () => {
      function firstChar(s) {
        return s.trim()[0]
      }
      return firstChar(null)
    },
    note: 'JS 的空引用要到「那条路径真被跑到」才炸，测试没覆盖就带病上线；TS 开 strictNullChecks 后，s 可能为 null 在写代码那一刻就要求你处理。',
  },
  {
    id: 'erasure',
    title: '④ 类型在运行时被擦除',
    ts: `interface User { name: string }
const u: User = { name: '张三' }
// 编译后 interface 和 : User 全部消失`,
    tsError: '', // 本例没有编译错误，展示的是擦除本身
    js: `const u = { name: '张三' }
Object.keys(u)`,
    runJs: () => {
      const u = { name: '张三' }
      return { keys: Object.keys(u), hasInterface: typeof User !== 'undefined' }
    },
    jsResultHint: '{ keys: ["name"], hasInterface: false }',
    note: 'tsc 编译只是「删掉类型标注」：运行时没有 interface、没有类型信息，产物就是普通 JS。所以 TS 类型保证不了接口返回的脏数据——运行时校验要靠 zod 这类库。',
  },
]
