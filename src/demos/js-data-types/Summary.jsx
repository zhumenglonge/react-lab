import { DATA_TYPES } from './shared.js'

/* ==================== 🎯 面试总结页 ====================
 * 作用域挂在 .jst-summary 下，样式自带一份（懒加载不依赖其它主题）。
 * 目标：把「JS 数据类型有哪些」从答案、判断方法、追问、话术四个层面讲透。
 * ========================================================= */

const DETECT_CODE = `// 1️⃣ typeof：分得清 6 种原始类型，但 null 是坑
typeof 'x'          // 'string'
typeof 10n          // 'bigint'
typeof null         // 'object'   ❌ 历史 bug

// 2️⃣ instanceof：查原型链，只对引用类型有意义
[] instanceof Array   // true
{} instanceof Object  // true
// ⚠️ 跨 iframe / 跨 window 会失效（Array 构造器不是同一个）

// 3️⃣ Object.prototype.toString.call：最准，8 种全分得清
Object.prototype.toString.call(null)      // '[object Null]'
Object.prototype.toString.call([])        // '[object Array]'
Object.prototype.toString.call(Symbol())  // '[object Symbol]'
Object.prototype.toString.call(42)        // '[object Number]'

// 4️⃣ 专用 API（生产代码优先用这些）
Array.isArray([])      // true，跨 iframe 也准
Number.isNaN(NaN)      // true，不像全局 isNaN 会先做类型转换
Number.isInteger(1)    // true
x === null             // 判 null 唯一可靠的方式`

const NULL_VS_UNDEF = [
  ['含义', '「没赋值」——声明了但未初始化，或对象上没这个属性', '「主动置空」——这里本该有对象，但现在没有'],
  ['谁给的', 'JS 引擎自动给', '程序员手动赋值'],
  ['typeof', '"undefined"', '"object" ⚠️ 历史 bug'],
  ['转数字', 'Number(undefined) → NaN', 'Number(null) → 0'],
  ['转布尔', 'false（假值）', 'false（假值）'],
  ['相等', 'undefined == null → true（宽松相等把两者视为同一类"空"）', 'undefined === null → false（严格相等先比类型）'],
  ['JSON', 'JSON.stringify({ a: undefined }) → "{}"（属性被丢弃）', 'JSON.stringify({ a: null }) → \'{"a":null}\'（保留）'],
]

const TYPEOF_VS_INSTANCEOF = [
  ['原理', '读取值的内部「类型标签」', '沿原型链查找 constructor.prototype'],
  ['擅长', '原始类型（除 null）+ 函数', '引用类型的细分（Array / Date / 自定义类）'],
  ['对 null', '返回 "object" ❌', 'null instanceof Object → false（null 没有原型）'],
  ['对数组', '返回 "object" ❌ 分不出来', '[] instanceof Array → true ✅'],
  ['跨 iframe', '可靠', '失效（不同 window 的构造器不是同一个）'],
  ['最佳替代', '—', 'Array.isArray() / Object.prototype.toString.call()'],
]

export default function Summary() {
  return (
    <div className="demo-wrap jst-root jst-summary">
      <section className="jst-block">
        <h3>🧠 一句话本质</h3>
        <p className="jst-lead">
          JS 有 <b>8 种数据类型</b>，按<b>存储方式</b>分成两大类：
          <b>7 种原始类型</b>（Number、String、Boolean、Undefined、Null、Symbol、BigInt）——值存在栈里、不可变、赋值即拷贝；
          <b>1 种引用类型</b>（Object）——值存在堆里、变量存地址，数组 / 函数 / 日期 / 正则 / Map / Set 都属于它。
          其中 <b>Symbol 是 ES6 新增</b>、<b>BigInt 是 ES2020 新增</b>，答出这句就没漏项了。
        </p>
      </section>

      <section className="jst-block">
        <h3>📋 8 种类型速查表（考前扫一眼）</h3>
        <table className="jst-table">
          <thead>
            <tr><th>类型</th><th>typeof</th><th>示例</th><th>引入</th><th>高频坑 / 考点</th></tr>
          </thead>
          <tbody>
            {DATA_TYPES.map((t) => (
              <tr key={t.id}>
                <td><b>{t.icon} {t.name}</b><br /><span className="jst-td-cn">{t.cn} · {t.group === 'primitive' ? '原始' : '引用'}</span></td>
                <td><code className="jst-code">{t.typeofResult}</code></td>
                <td><code className="jst-code">{t.examples[0]}</code></td>
                <td>{t.es}</td>
                <td>{t.key}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="jst-block">
        <h3>🕳️ undefined vs null（追问率第一）</h3>
        <table className="jst-table">
          <thead>
            <tr><th>维度</th><th>undefined</th><th>null</th></tr>
          </thead>
          <tbody>
            {NULL_VS_UNDEF.map((r) => (
              <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="jst-note">
          实践建议：函数参数「没传」用 <code>undefined</code>（配合默认参数），
          「明确表达空」用 <code>null</code>；判空统一写 <code>x == null</code>（一次覆盖两者）或分开写 <code>=== undefined</code> / <code>=== null</code>。
        </p>
      </section>

      <section className="jst-block">
        <h3>🔍 typeof vs instanceof（怎么判断类型）</h3>
        <table className="jst-table">
          <thead>
            <tr><th>维度</th><th>typeof</th><th>instanceof</th></tr>
          </thead>
          <tbody>
            {TYPEOF_VS_INSTANCEOF.map((r) => (
              <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>
            ))}
          </tbody>
        </table>
        <pre className="code">{DETECT_CODE}</pre>
      </section>

      <section className="jst-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="jst-list">
          <li><b>typeof null 为什么是 "object"？</b>1995 年 JS 用 32 位存值、低位存类型标签，对象的标签是 <code>000</code>，而 null 的内部表示全是 0，于是被误判。后来有提案修复（typeof null → "null"），因破坏存量代码兼容被否决，成为永久 bug。</li>
          <li><b>function 是第 9 种类型吗？</b>不是。<code>typeof</code> 对函数返回 "function" 只是特殊照顾，函数本质是「可调用的对象」，属于 Object。所以 typeof 有 8 个返回值，数据类型也是 8 种，但两者并非一一对应。</li>
          <li><b>0.1 + 0.2 为什么不等于 0.3？</b>Number 是 IEEE 754 双精度浮点，0.1、0.2 转成二进制都是无限循环，相加后为 <code>0.30000000000000004</code>。解决：整数用 BigInt，浮点比较用 <code>Math.abs(a - b) &lt; Number.EPSILON</code>，金额用「分为单位的整数」或 decimal 库。</li>
          <li><b>Symbol 有什么用？</b>① 做对象唯一键，防止属性名冲突（如给别人的对象挂元数据）；② 内置 well-known symbols 定制语言行为，如 <code>Symbol.iterator</code>（可被 for...of）、<code>Symbol.toPrimitive</code>（自定义转换）；③ 模拟私有属性（for...in / Object.keys 遍历不到）。注意 <code>Symbol.for()</code> 走全局注册表，<code>Symbol()</code> 每次都是新值。</li>
          <li><b>BigInt 解决什么问题？</b>Number 只能安全表示 <code>-(2^53-1) ~ 2^53-1</code>，超过就精度丢失（如数据库的 Long 型 ID、纳秒时间戳、加密运算）。BigInt 表示任意精度整数，但不能与 Number 混合运算，也不能用于 Math 方法。</li>
          <li><b>原始类型和引用类型的区别？</b>存储位置（栈 / 堆）、可变性（不可变 / 可变）、赋值语义（拷值 / 拷地址）、比较方式（比值 / 比地址）。这四点决定了深拷贝浅拷贝、函数传参、<code>const</code> 对象仍可改属性等一系列现象。</li>
          <li><b>JS 是值传递还是引用传递？</b>只有<b>值传递</b>。传对象时传的是「地址的副本」：函数内改属性会影响外面，但给形参<b>重新赋值</b>不会影响外面的变量。</li>
          <li><b>const 声明的对象为什么还能改？</b>const 锁的是「变量绑定」（不能重新赋值地址），不是对象内容。要冻结内容用 <code>Object.freeze()</code>（且只是浅冻结）。</li>
          <li><b>6 个假值背一下：</b><code>false</code>、<code>0</code>、<code>-0</code>、<code>0n</code>、<code>""</code>、<code>null</code>、<code>undefined</code>、<code>NaN</code>（严格说是 8 个写法，常考「0 和空字符串也是假值」「[] 和 {} 是真值」）。</li>
        </ul>
      </section>

      <section className="jst-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="jst-quote">
          <p>
            "JS 一共有 <b>8 种数据类型</b>，按存储方式分成两类：<b>7 种原始类型</b>和 <b>1 种引用类型</b>。
            原始类型是 Number、String、Boolean、Undefined、Null，加上 ES6 新增的 Symbol 和 ES2020 新增的 BigInt；
            引用类型只有 Object，数组、函数、日期、正则、Map、Set 都属于它。"
          </p>
          <p>
            "两类的区别在于<b>存储和赋值语义</b>：原始类型的值直接存在栈里、不可变，赋值是拷一份值，比较比值；
            引用类型的值放堆里，变量存的是地址，赋值拷的是地址，所以两个变量会指向同一个对象，比较也是比地址，
            <code>{'{}'} === {'{}'}</code> 是 false。"
          </p>
          <p>
            "顺带有个常考的坑：<code>typeof null</code> 返回 <b>"object"</b>，这是早期实现用类型标签导致的历史 bug；
            而 <code>typeof</code> 一个函数返回 <b>"function"</b>，但函数并不是第 9 种类型，它仍属于 Object。
            要精确判断类型，我会用 <code>Object.prototype.toString.call()</code> 或 <code>Array.isArray()</code> 这类专用方法，
            而不是依赖 typeof 或 instanceof（后者跨 iframe 会失效）。"
          </p>
        </blockquote>
      </section>

      <section className="jst-block">
        <h3>🔁 复习清单（照着做就不会再忘）</h3>
        <ol className="jst-steps">
          <li>背口诀：<b>数 字 布 未 空 符 大 + 对象</b>（谐音「书字不为空，付大款」）。</li>
          <li>记结构：<b>1 个引用 + 7 个原始</b>，7 = 一周七天。</li>
          <li>记时间线：<b>ES1 五样 → ES6 加 Symbol → ES2020 加 BigInt</b>（5 → 6 → 7）。</li>
          <li>绑 typeof：每种类型都配一个 typeof 结果，重点记两个例外（null → object、函数 → function）。</li>
          <li>去 ✍️ 默写挑战 用 <b>🔴 纯默写</b> 测一次；错了读「错因」，10 分钟后、第二天、第 4 天各再来一次。</li>
        </ol>
      </section>
    </div>
  )
}
