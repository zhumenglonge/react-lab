/* =========================================================
 * 🧠 本质 · 对比 · 陷阱：TS 和 JS 的区别
 * ---------------------------------------------------------
 * 纯静态讲解页，样式作用域挂在 .tsj-root 下，随本主题懒加载。
 * ========================================================= */

// 核心区别对比表
const COMPARE = [
  ['类型系统', '<b>动态弱类型</b>：变量的类型运行时才确定，随时可变', '<b>静态强类型</b>：类型写代码时就定死，编译期校验'],
  ['暴露错误的时机', '运行时才炸（甚至静默算错不炸）', '<b>编译期</b>标红 + IDE 实时波浪线，代码到不了线上'],
  ['运行方式', '浏览器 / Node 直接跑', '浏览器不认识 TS，需 tsc / esbuild / SWC / Babel <b>编译成 JS</b> 再跑'],
  ['语法范围', 'ECMAScript 标准', 'JS 的<b>超集</b>：+ 类型标注、interface、泛型、enum、装饰器'],
  ['运行时类型', '类型就是值本身', '<b>类型全部擦除</b>，产物是纯 JS（enum / 装饰器例外，会 emit 代码）'],
  ['工具链体验', '基础补全', '类型驱动的精准补全、跳转定义、<b>安全重构</b>、自动导入'],
  ['适合场景', '脚本、小工具、快速原型、教学', '中大型项目、多人协作、长期维护的业务代码'],
]

// TS 新增的能力（JS 没有的语法）
const EXTRAS = [
  ['类型标注', '<code>let n: number = 1</code> / <code>function f(s: string): boolean</code>'],
  ['interface / type', '<code>interface User { name: string }</code>、联合 <code>string | null</code>、交叉 <code>A & B</code>'],
  ['泛型', '<code>function first&lt;T&gt;(arr: T[]): T</code> —— 类型的"参数"，写一次适配所有类型'],
  ['enum', '<code>enum Status { Idle, Running }</code> —— 注意它会编译出真实对象，不是纯类型'],
  ['类型收窄', '<code>typeof</code> / <code>in</code> / <code>instanceof</code> / 自定义类型守卫 <code>x is T</code>'],
]

// 高频陷阱
const PITFALLS = [
  {
    t: 'TS 类型在运行时不存在，管不了脏数据',
    d: 'interface 声明的接口返回值只是"编译期的承诺"，后端真返回了缺字段的 JSON，TS 毫无办法。运行时校验要靠 zod / io-ts 这类库，或手写类型守卫。这是"上了 TS 为什么还会 undefined 报错"的标准答案。',
  },
  {
    t: 'any 是投降，unknown 才是底线',
    d: 'any 会沿着赋值和调用一路传染，等于局部关掉类型检查——写了 any 的 TS 项目是付费写了个 JS。接到不确定类型时用 unknown，它强迫你先用 typeof / instanceof 收窄再使用。',
  },
  {
    t: 'as 断言是"相信我"，错了照样运行时炸',
    d: '类型断言不做任何转换和检查，只是让编译器闭嘴。data as User 之后 data 缺字段，炸的还是运行时。优先用类型守卫收窄，少用 as，禁用 as any。',
  },
  {
    t: 'enum / 装饰器不是"纯类型"，会产出运行时代码',
    d: '类型擦除针对 interface、type、类型标注；enum 会编译成一个真实对象（IIFE），装饰器会编译成函数调用。所以"TS 编译后什么都没有"这句要加个例外。',
  },
  {
    t: '类型标错，检查全白费',
    d: 'TS 只能保证"代码符合你声明的类型"，不能保证"你声明的类型符合现实"。把 age 标成 string 且全项目一致，编译器一声不吭。类型系统的上限是你对业务建模的准确度。',
  },
  {
    t: '渐进迁移别开着手刹写 strict',
    d: '新项目直接 strict: true；老项目迁移先关 strictNullChecks 再逐步打开，否则一次涌出几千个报错等于没报。tsconfig 的 strict 家族是 TS 价值的大头，能开尽开。',
  },
]

export default function EssenceDemo() {
  return (
    <div className="demo-wrap tsj-root tsj-essence">
      <section className="tsj-block">
        <h3>🧠 一句话本质</h3>
        <p className="tsj-lead">
          TS = <b>JS + 静态类型系统</b>。任何合法的 JS 都是合法的 TS（超集关系）；
          TS 加的类型层只活在<b>编译期</b>——tsc 把它检查一遍然后<b>整个擦掉</b>，
          产物还是纯 JS。所以一句话讲区别：<b>JS 的错误在运行时暴露，
          TS 把大部分错误提前到编译期</b>，代价是多一道编译和学类型的成本。
        </p>
      </section>

      <section className="tsj-block">
        <h3>⚔️ 逐维度对比</h3>
        <table className="tsj-compare">
          <thead>
            <tr>
              <th>维度</th>
              <th>JavaScript</th>
              <th>TypeScript</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
                <td dangerouslySetInnerHTML={{ __html: r[2] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tsj-block">
        <h3>➕ TS 在 JS 之上加了什么</h3>
        <table className="tsj-compare">
          <thead>
            <tr>
              <th>能力</th>
              <th>写法示例</th>
            </tr>
          </thead>
          <tbody>
            {EXTRAS.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td dangerouslySetInnerHTML={{ __html: r[1] }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tsj-block">
        <h3>⚠️ 高频陷阱</h3>
        <ul className="tsj-list">
          {PITFALLS.map((p) => (
            <li key={p.t}>
              <b>{p.t}</b>
              {p.d}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
