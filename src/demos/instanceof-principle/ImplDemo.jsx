import { useState } from 'react'
import { CASES, myInstanceof } from './shared.js'

/* =========================================================
 * 🛠️ 手写实现 + 对拍：证明我写的和原生 instanceof 结果一致
 * ---------------------------------------------------------
 * 左边是可直接背的手写版 myInstanceof（三步：拦原始值 → 取 B.prototype → 爬链比对），
 * 右边把所有用例真跑一遍，并排展示「原生 instanceof」「myInstanceof」「预期」，
 * 三列全绿说明实现正确。这不是截图，是当场执行的结果。
 * ========================================================= */

const IMPL_SOURCE = `function myInstanceof(obj, Ctor) {
  // ① 原始类型（含 null）没有原型链，直接 false
  if (obj === null ||
      (typeof obj !== 'object' && typeof obj !== 'function')) {
    return false
  }
  // ② 取右侧构造器的 prototype 作为「查找目标」
  const proto = Ctor.prototype
  if (proto === null ||
      (typeof proto !== 'object' && typeof proto !== 'function')) {
    throw new TypeError('右侧不是可调用对象')
  }
  // ③ 从 obj 的原型开始，沿链向上逐个比对
  let cur = Object.getPrototypeOf(obj)   // 等价于 obj.__proto__
  while (cur !== null) {
    if (cur === proto) return true        // 命中 B.prototype
    cur = Object.getPrototypeOf(cur)      // 继续往上爬
  }
  return false                            // 爬到 null 仍未命中
}`

const HASINSTANCE_SOURCE = `// 进阶追问：Symbol.hasInstance 能自定义 instanceof 行为
const Numberish = {
  [Symbol.hasInstance](x) {
    return typeof x === 'number'   // 让原始数字也「算」它的实例
  }
}
1 instanceof Numberish        // true（原生 instanceof 会先查这个方法）
123 instanceof Numberish      // true

// 所以严格说，a instanceof B 的完整流程是：
//   1. 若 B 有 @@hasInstance，就调用它，返回其结果
//   2. 否则走默认的 OrdinaryHasInstance（就是上面的爬原型链）`

export default function ImplDemo() {
  const [ran, setRan] = useState(false)

  // 真跑：原生 vs 手写，逐个比对预期
  const rows = CASES.map((c) => {
    const native = c.left instanceof c.Right
    let mine
    let threw = false
    try {
      mine = myInstanceof(c.left, c.Right)
    } catch {
      mine = null
      threw = true
    }
    return { ...c, native, mine, threw, ok: !threw && mine === native && native === c.expect }
  })
  const allPass = rows.every((r) => r.ok)

  return (
    <div className="demo-wrap iof-root">
      <div className="demo-header">
        <h2>🛠️ 手写实现 · 当场和原生 instanceof 对拍</h2>
        <p className="demo-sub">
          面试让你「手写一个 instanceof」，本质就是<b>把原型链查找翻译成代码</b>：拦掉原始值 → 取
          <code>B.prototype</code> → 用 <code>Object.getPrototypeOf</code> 一路往上比。
          右边点「运行」，看它和原生结果是否<b>逐个一致</b>。
        </p>
      </div>

      <div className="demo-grid iof-impl-grid">
        {/* 左：手写源码 */}
        <div className="demo-box">
          <h4>myInstanceof 源码（可背版）</h4>
          <pre className="code">{IMPL_SOURCE}</pre>
          <p className="iof-note">
            三步记忆：<b>①拦原始 ②取 proto ③爬链比</b>。循环用 <code>Object.getPrototypeOf</code>
            比 <code>__proto__</code> 更规范（后者是历史遗留的访问器）。
          </p>
          <pre className="code">{HASINSTANCE_SOURCE}</pre>
        </div>

        {/* 右：对拍表 */}
        <div className="demo-box">
          <h4>真实用例对拍</h4>
          <div className="btn-row" style={{ justifyContent: 'flex-start' }}>
            <button className="iof-primary" onClick={() => setRan(true)}>▶ 运行全部用例</button>
            <button className="ghost" onClick={() => setRan(false)}>↺ 清空</button>
          </div>

          {!ran ? (
            <p className="iof-note">点「运行」，下方会当场执行 <code>left instanceof Right</code> 与 <code>myInstanceof(...)</code> 并排比对。</p>
          ) : (
            <>
              <table className="iof-table">
                <thead>
                  <tr>
                    <th>用例</th>
                    <th>原生</th>
                    <th>手写</th>
                    <th>预期</th>
                    <th>一致</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="iof-td-code">{r.code}</td>
                      <td className={r.native ? 'iof-bool-true' : 'iof-bool-false'}>{String(r.native)}</td>
                      <td className={r.mine ? 'iof-bool-true' : 'iof-bool-false'}>{r.threw ? 'throw' : String(r.mine)}</td>
                      <td className={r.expect ? 'iof-bool-true' : 'iof-bool-false'}>{String(r.expect)}</td>
                      <td>{r.ok ? <span className="iof-same">✅</span> : <span className="iof-bool-false">❌</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={'iof-result ' + (allPass ? 'iof-result-true' : 'iof-result-false')}>
                {allPass ? `✅ ${rows.length}/${rows.length} 全部与原生一致` : '❌ 有用例不一致，检查实现'}
                <span className="iof-result-why">
                  注意 <code>Object.create(null) instanceof Object</code>、<code>null instanceof Object</code>、
                  <code>1 instanceof Number</code> 都是 <b>false</b>——手写版必须正确处理这三种「非典型」情况。
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="tip">
        💡 面试官常追问的边界：① <b>原始类型</b>直接 false（别去爬链）；② 右侧不是构造器要
        <b>抛 TypeError</b>；③ 完整版还要先判断 <code>Symbol.hasInstance</code>（见左侧进阶代码）；
        ④ 想更严谨可加<b>循环引用保护</b>（正常原型链不会成环，但可防手贱造出的环）。
      </p>
    </div>
  )
}
