/* =========================================================
 * 🎯 面试总结：TS 和 JS 的区别
 * 作用域挂在 .tsj-summary 下，样式随本主题懒加载。
 * ========================================================= */

const NOTES = [
  {
    q: 'TS 和 JS 是什么关系？',
    a: '超集关系：任何合法的 JS 都是合法的 TS。TS = JS + 静态类型系统 + 编译期检查，最终还是要编译回 JS 才能运行——浏览器和 Node 都不认识 TS。',
  },
  {
    q: '核心区别是什么？',
    a: '① 类型：JS 动态弱类型（运行时才定），TS 静态强类型（写代码就定）；② 暴露错误时机：JS 运行时才炸甚至静默算错，TS 编译期标红；③ 类型擦除：TS 编译后类型层整个消失，产物是纯 JS；④ 工具链：TS 有类型驱动的补全、跳转、安全重构。',
  },
  {
    q: '为什么要用 TS？收益在哪？',
    a: '错误左移（编译期拦掉拼写、空值、类型混用一大类 bug）、类型即文档（接口形状一目了然）、重构有信心（改字段全项目标红）、团队协作契约清晰。项目越大、人越多、活得越久，收益越明显。',
  },
  {
    q: 'TS 的代价 / 缺点？',
    a: '学习成本（泛型、类型体操）、多一道编译（工程配置和构建时间）、类型写得啰嗦、以及最重要的——它保证不了运行时数据（接口返回的脏数据要靠 zod 等运行时校验）。',
  },
  {
    q: 'interface 和 type 有什么区别？',
    a: '对象形状上大多 interchangeable。区别：interface 支持声明合并（同名自动合并）、可被 class implements；type 能表达联合、交叉、元组、条件类型等复杂类型，且可以起别名给任何类型。团队规范二选一即可，开源库偏好 interface 描述对象。',
  },
  {
    q: 'any 和 unknown 有什么区别？',
    a: 'any 完全关闭检查且会传染；unknown 是"类型安全的 any"——可以接收任何值，但使用前必须 typeof / instanceof / 断言收窄。处理外部输入一律先 unknown。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap tsj-root tsj-summary">
      <section className="tsj-block">
        <h3>🧠 一句话本质</h3>
        <p className="tsj-lead">
          TS 是 JS 的<b>超集</b>：JS + <b>静态类型系统</b>。类型只活在<b>编译期</b>，
          tsc 检查完就<b>全部擦除</b>，产物还是纯 JS。区别一句话：
          <b>JS 的错误运行时才暴露，TS 把大部分错误拦在编译期</b>。
        </p>
      </section>

      <section className="tsj-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="tsj-list">
          {NOTES.map((n) => (
            <li key={n.q}>
              <b>{n.q}</b>
              {n.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="tsj-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="tsj-quote">
          <p>
            "TS 是 JS 的<b>超集</b>——任何合法的 JS 都是合法的 TS，它在 JS 之上加了
            <b>静态类型系统</b>：类型标注、interface、泛型这些。"
          </p>
          <p>
            "核心区别是<b>暴露错误的时机</b>：JS 动态类型，拼错属性名、传错参数、空值访问都要
            到运行时才炸，甚至像数组混入字符串这种会<b>静默算错</b>；TS 把这类错误提前到
            <b>编译期</b>，IDE 里当场标红。另外 TS 有<b>类型擦除</b>——编译产物就是纯 JS，
            类型信息运行时不存在，所以接口数据还需要 zod 这类运行时校验兜底。"
          </p>
          <p>
            "收益上：错误左移、类型即文档、重构安全、团队协作有契约；代价是学习成本和一道编译。
            我的实践是新项目直接 <code>strict</code>，外部输入用 <code>unknown</code> 收窄，
            尽量不用 <code>any</code> 和 <code>as</code>。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
