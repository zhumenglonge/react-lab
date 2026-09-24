/* =========================================================
 * 🎯 面试总结：原型链与继承
 * 作用域挂在 .ptc-summary 下，样式随本主题懒加载。
 * ========================================================= */

const NOTES = [
  {
    q: '什么是原型链？',
    a: '每个对象都有隐式原型 __proto__（标准 API 是 Object.getPrototypeOf），一环扣一环向上直到 Object.prototype → null，这条链就是原型链。它的作用机制只有一条：查找属性时自身没有就沿链向上找，找到即用，到 null 为止返回 undefined。',
  },
  {
    q: 'prototype、__proto__、constructor 三者关系？',
    a: 'prototype 是函数才有的属性，指向"实例共享的原型对象"；__proto__ 是所有对象都有的隐式原型，new 时被接到构造函数的 prototype 上；constructor 是原型对象上指回构造函数的属性。三角闭环：p.__proto__ === Person.prototype，Person.prototype.constructor === Person。',
  },
  {
    q: 'new 一个对象发生了什么？',
    a: '四步：创建空对象 → 接原型线（obj.__proto__ = Fn.prototype）→ 绑定 this 执行构造函数 → 返回新对象（若构造函数自己返回了对象则以它为准）。手写 new 是高频手试题，关键就是第②步接线。',
  },
  {
    q: 'ES5 怎么实现继承？和 class extends 什么关系？',
    a: '寄生组合继承：Parent.call(this) 继承实例属性 + Child.prototype = Object.create(Parent.prototype) 继承原型方法 + 手动修 constructor。class extends 是完全相同的接线的语法糖，差别只在写法约束（必须 new、子类必须先 super()）。',
  },
  {
    q: '为什么不能写 Child.prototype = new Parent()？',
    a: '这会真执行一次 Parent，把实例属性（引用类型如数组）挂上 Child.prototype 被所有子实例共享——一个改了全都变。Object.create 只接线不执行，才没有副作用。',
  },
  {
    q: '原型链和 for...in / instanceof 有什么关系？',
    a: '都是沿同一条链爬：for...in 枚举链上所有可枚举属性（所以要 hasOwnProperty 过滤）；instanceof 沿链逐环问"是否 === B.prototype"。一条链，三种用法——属性查找、遍历、类型判断。',
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap ptc-root ptc-summary">
      <section className="ptc-block">
        <h3>🧠 一句话本质</h3>
        <p className="ptc-lead">
          原型链 = 对象用 <b>__proto__</b> 一环环串到 <b>null</b> 的查找路径；
          <b>找属性就是沿链爬楼梯</b>，自身没有就上一环再问。
          继承的本质不是复制代码，而是<b>把子原型的线接到父原型上</b>。
          口诀：<b>prototype 是函数的，__proto__ 是对象的，constructor 指回去</b>。
        </p>
      </section>

      <section className="ptc-block">
        <h3>⚠️ 高频追问点</h3>
        <ul className="ptc-list">
          {NOTES.map((n) => (
            <li key={n.q}>
              <b>{n.q}</b>
              {n.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="ptc-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote className="ptc-quote">
          <p>
            "每个对象都有一个隐式原型 <code>__proto__</code>，指向构造它的函数的{' '}
            <code>prototype</code>；这些原型自己也会有原型，一环扣一环直到{' '}
            <code>Object.prototype.__proto__ === null</code>，这就是<b>原型链</b>。"
          </p>
          <p>
            "它的工作方式是<b>属性查找</b>：访问 <code>obj.x</code> 时先看自有属性，
            没有就沿 <code>__proto__</code> 上一环继续找，命中即用，爬到 null 返回 undefined。
            <code>instanceof</code> 和 <code>for...in</code> 走的都是同一条链——前者逐环比较
            是否等于 B.prototype，后者枚举链上的可枚举属性。"
          </p>
          <p>
            "继承的本质是<b>接线不是复制</b>：ES5 寄生组合继承用 <code>Parent.call</code> 拿实例属性、
            <code>Object.create(Parent.prototype)</code> 接原型线；ES6 的 <code>class extends</code>{' '}
            是同一套接线的语法糖。注意别用 <code>new Parent()</code> 接线，那会让引用类型属性被所有子实例共享。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
