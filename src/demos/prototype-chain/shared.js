/* =========================================================
 * 共享数据与纯函数：原型链与继承
 * ---------------------------------------------------------
 * 只放「能被当场执行」的查找逻辑和测试目标，不含组件，
 * 以满足 react-refresh（组件与非组件导出分文件）的约定。
 * ========================================================= */

/* ---------- 属性查找引擎：真的沿原型链爬一遍 ---------- */

// 给链条上的每一环起个可读名字
function protoName(obj) {
  if (obj === Object.prototype) return 'Object.prototype'
  if (obj === Function.prototype) return 'Function.prototype'
  if (obj === Array.prototype) return 'Array.prototype'
  const ctor = obj.constructor
  if (ctor && typeof ctor.name === 'string' && ctor.name) return `${ctor.name}.prototype`
  return '[[Prototype]]'
}

// 从 target 出发沿 __proto__ 爬链找 prop，记录每一环是否命中
export function buildLookup(target, targetName, prop) {
  const steps = []
  let cur = target
  let depth = 0
  let found = false

  while (cur !== null && depth < 10) {
    const hit = Object.prototype.hasOwnProperty.call(cur, prop)
    steps.push({
      label: depth === 0 ? `${targetName}（自身）` : protoName(cur),
      isOwn: depth === 0,
      hit,
    })
    if (hit) {
      found = true
      break
    }
    cur = Object.getPrototypeOf(cur)
    depth++
  }

  return {
    steps,
    found,
    reachedNull: !found,
    resultType: found ? typeof target[prop] : 'undefined',
  }
}

/* ---------- 查找用例 ---------- */

function makePerson() {
  function Person(name) {
    this.name = name
  }
  Person.prototype.sayHi = function sayHi() {
    return `你好，我是 ${this.name}`
  }
  return new Person('张三')
}

function makeArray() {
  return [1, 2, 3]
}

const MAKERS = { person: makePerson, array: makeArray }

export const LOOKUP_CASES = [
  {
    id: 'own',
    label: 'p.name',
    target: 'person',
    targetName: 'p',
    prop: 'name',
    note: '自有属性第 0 环就命中，根本不用爬链——这就是「自身属性遮蔽原型属性」的原因。',
  },
  {
    id: 'proto',
    label: 'p.sayHi',
    target: 'person',
    targetName: 'p',
    prop: 'sayHi',
    note: '实例共享的方法挂在构造函数的 prototype 上，第 1 环命中——原型链存在的意义：一份方法，所有实例共用。',
  },
  {
    id: 'objproto',
    label: 'p.toString',
    target: 'person',
    targetName: 'p',
    prop: 'toString',
    note: '万物通用的方法在 Object.prototype 上，链条倒数第 2 环才命中——每个对象天生就会 toString 的来源。',
  },
  {
    id: 'miss',
    label: 'p.salary',
    target: 'person',
    targetName: 'p',
    prop: 'salary',
    note: '一路爬到 null 都没有 → 返回 undefined。链的尽头是 null，null 没有原型。',
  },
  {
    id: 'arr',
    label: 'arr.push',
    target: 'array',
    targetName: 'arr',
    prop: 'push',
    note: '数组方法来自 Array.prototype（链：arr → Array.prototype → Object.prototype → null），这也是 [] instanceof Array 为 true 的原因。',
  },
]

// 按用例真跑一遍查找
export function runLookup(caseId) {
  const c = LOOKUP_CASES.find((x) => x.id === caseId) ?? LOOKUP_CASES[0]
  const target = MAKERS[c.target]()
  return { ...c, chain: buildLookup(target, c.targetName, c.prop) }
}

/* ---------- ES5 寄生组合继承 vs class extends 实跑对拍 ---------- */

export function runInheritCompare() {
  // ES5：寄生组合继承（call 偷构造 + Object.create 接原型线）
  function Parent(name) {
    this.name = name
    this.tags = ['es5']
  }
  Parent.prototype.say = function say() {
    return 'Parent.say'
  }
  function Child(name, age) {
    Parent.call(this, name) // 继承实例属性
    this.age = age
  }
  Child.prototype = Object.create(Parent.prototype) // 继承原型方法（只接线，不执行 Parent）
  Child.prototype.constructor = Child // 修回被切断的 constructor

  const c1 = new Child('张三', 18)

  // ES6：class extends（语法糖，引擎干的是同一套接线）
  class ParentC {
    constructor(name) {
      this.name = name
      this.tags = ['class']
    }
    say() {
      return 'Parent.say'
    }
  }
  class ChildC extends ParentC {
    constructor(name, age) {
      super(name) // 相当于 Parent.call(this, name)
      this.age = age
    }
  }

  const c2 = new ChildC('李四', 20)

  return [
    {
      label: '子实例 instanceof 子构造',
      code: 'c instanceof Child',
      es5: c1 instanceof Child,
      cls: c2 instanceof ChildC,
    },
    {
      label: '子实例 instanceof 父构造',
      code: 'c instanceof Parent',
      es5: c1 instanceof Parent,
      cls: c2 instanceof ParentC,
    },
    {
      label: '子原型接在父原型上',
      code: 'Child.prototype.__proto__ === Parent.prototype',
      es5: Object.getPrototypeOf(Child.prototype) === Parent.prototype,
      cls: Object.getPrototypeOf(ChildC.prototype) === ParentC.prototype,
    },
    {
      label: 'constructor 指回自己',
      code: 'Child.prototype.constructor === Child',
      es5: Child.prototype.constructor === Child,
      cls: ChildC.prototype.constructor === ChildC,
    },
    {
      label: '沿链继承到的方法可用',
      code: "c.say() === 'Parent.say'",
      es5: c1.say() === 'Parent.say',
      cls: c2.say() === 'Parent.say',
    },
    {
      label: '实例属性互不共享',
      code: '两个实例的 tags 不是同一个数组',
      es5: c1.tags !== new Child('王五', 1).tags,
      cls: c2.tags !== new ChildC('赵六', 2).tags,
    },
  ]
}

/* ---------- new 的四步（本质栏讲解用） ---------- */

export const NEW_STEPS = [
  ['① 创建空对象', 'const obj = {} —— 新对象诞生，一无所有'],
  ['② 接原型线', 'obj.__proto__ = Fn.prototype —— 挂上原型链（唯一关键的一步）'],
  ['③ 绑定 this 执行', 'Fn.call(obj, …args) —— 构造函数里的 this.xxx 全写到新对象上'],
  ['④ 决定返回值', '构造函数没返回对象就返回 obj；返回了对象则以它为准（常见陷阱）'],
]

/* ---------- 三角关系（本质栏画图用） ---------- */

export const TRIANGLE = [
  ['Person.prototype', '构造函数的 prototype 属性', '函数才有；存放实例共享的方法'],
  ['p.__proto__', '实例的隐式原型', '所有对象都有；new 时被接到 Person.prototype 上'],
  ['Person.prototype.constructor', '原型上的 constructor 属性', '指回 Person 自己；Object.create 接线后要手动修复'],
]
