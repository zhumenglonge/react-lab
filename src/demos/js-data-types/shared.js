/* =========================================================
 * 主题共享数据与工具（非组件，单独放 .js，符合 react-refresh 约定）
 * ---------------------------------------------------------
 * 面试原题：「JS 数据类型有哪些？」标准答案 = 8 种
 *   原始类型 7 种：number / string / boolean / undefined / null / symbol / bigint
 *   引用类型 1 种：object（数组、函数、日期、正则、Map/Set 都属于它）
 *
 * ⚠️ 本站统一用「全小写」记类型名（与 typeof 的返回值一致），避免大小写记混。
 *   只有两种情况仍用大写，因为它们是代码里真实的标识符 / API 输出：
 *   ① 全局构造器与 API：Symbol('id')、BigInt(10)、Object.keys()、Array.isArray()
 *   ② Object.prototype.toString.call() 的返回值：'[object Null]'
 *
 * 本文件提供：
 *   1. DATA_TYPES      —— 8 种类型的全部元信息（线索、示例、typeof 结果、坑）
 *   2. normalize/findType —— 宽松判分（忽略大小写空格，接受中文与常见缩写）
 *   3. diagnoseWrong   —— 答错时的「错因诊断」，这是本 demo 的教学核心
 *   4. shuffle         —— 打乱出题顺序，避免靠「位置」记住答案
 *   5. load/saveProgress —— localStorage 存档，跨天回来还能看到历史战绩
 * ========================================================= */

export const DATA_TYPES = [
  {
    id: 'number',
    name: 'number',
    cn: '数字',
    icon: '🔢',
    group: 'primitive',
    es: 'ES1（1995）',
    typeofResult: 'number',
    examples: ['42', '3.14', 'NaN', 'Infinity'],
    clue: '整数和小数都用它，双精度 64 位浮点数；NaN、Infinity 也归它管',
    key: '没有 int / float 之分；0.1 + 0.2 !== 0.3（精度丢失）；安全整数上限 2^53 - 1',
    aliases: ['number', 'num', '数字', '数值', 'double', 'float'],
  },
  {
    id: 'string',
    name: 'string',
    cn: '字符串',
    icon: '📝',
    group: 'primitive',
    es: 'ES1（1995）',
    typeofResult: 'string',
    examples: ['"hi"', "'a'", '`模板串 ${x}`'],
    clue: '文本，用单引号 / 双引号 / 反引号包裹；JS 没有 char，单个字符也是它',
    key: '不可变（immutable）：所有方法都返回新字符串，原串不动',
    aliases: ['string', 'str', '字符串', '文本'],
  },
  {
    id: 'boolean',
    name: 'boolean',
    cn: '布尔',
    icon: '✅',
    group: 'primitive',
    es: 'ES1（1995）',
    typeofResult: 'boolean',
    examples: ['true', 'false', '1 > 2'],
    clue: '只有 true / false 两个值，用于条件判断',
    key: '6 个假值要背：false、0、""、null、undefined、NaN（其余全是真值）',
    aliases: ['boolean', 'bool', '布尔', '布尔值'],
  },
  {
    id: 'undefined',
    name: 'undefined',
    cn: '未定义',
    icon: '❓',
    group: 'primitive',
    es: 'ES1（1995）',
    typeofResult: 'undefined',
    examples: ['undefined', 'let a; a', 'obj.notExist'],
    clue: '「声明了变量但没赋值」的默认值；函数不写 return 时也返回它',
    key: 'typeof 一个从未声明的变量也不报错，仍返回 "undefined"；null == undefined 为 true',
    aliases: ['undefined', 'undef', '未定义'],
  },
  {
    id: 'null',
    name: 'null',
    cn: '空值',
    icon: '🕳️',
    group: 'primitive',
    es: 'ES1（1995）',
    typeofResult: 'object ⚠️',
    examples: ['null', 'let a = null'],
    clue: '表示「主动赋的空值 / 这里本该有对象但没有」；它的 typeof 结果是个历史 bug',
    key: 'typeof null === "object"（1995 年 32 位实现里类型标签全是 0）；判空要用 === null',
    // 查看答案时才展开的「历史 bug 由来」，不放进 clue（clue 是作答前的提示）
    bugReason:
      '1995 年 JS 最初用 32 位存一个值，其中最低的几位是「类型标签」，对象的标签恰好是 000。' +
      '而 null 在底层是「空指针」，整段机器码全是 0（0x00），它的类型标签位自然也是 000，' +
      '于是 typeof 把它误判成 object。后来 ES 曾提案改成返回 "null"，但这会破坏海量依赖 ' +
      'typeof null === "object" 的老代码，最终不了了之，成了永久保留的历史 bug。',
    aliases: ['null', '空', '空值'],
  },
  {
    id: 'symbol',
    name: 'symbol',
    cn: '符号',
    icon: '🎭',
    group: 'primitive',
    es: 'ES6（2015）',
    typeofResult: 'symbol',
    examples: ['Symbol("id")', 'Symbol.iterator'],
    clue: 'ES6 新增，每个值都全局唯一，常用作对象属性 key 来防止命名冲突',
    key: 'Symbol.for() 走全局注册表；for...in / Object.keys 遍历不到 symbol 键',
    aliases: ['symbol', 'sym', '符号'],
  },
  {
    id: 'bigint',
    name: 'bigint',
    cn: '大整数',
    icon: '🐘',
    group: 'primitive',
    es: 'ES2020',
    typeofResult: 'bigint',
    examples: ['10n', 'BigInt(9007199254740993)'],
    clue: 'ES2020 新增，能表示任意精度整数，字面量在数字后面加一个 n',
    key: '解决 number 超过 2^53 - 1 的精度丢失；不能与 number 直接混合运算',
    aliases: ['bigint', '大整数', '大数'],
  },
  {
    id: 'object',
    name: 'object',
    cn: '对象',
    icon: '📦',
    group: 'object',
    es: 'ES1（1995）',
    typeofResult: 'object',
    examples: ['{}', '[]', 'function () {}', 'new Date()', 'new Map()'],
    clue: '唯一的「引用类型」：普通对象、数组、函数、日期、正则、Map/Set 全都属于它',
    key: '变量存的是堆内存地址；typeof 函数返回 "function"，但函数本质仍是 object',
    aliases: ['object', 'obj', '对象', '引用类型'],
  },
]

export const PRIMITIVE_TYPES = DATA_TYPES.filter((t) => t.group === 'primitive')
export const OBJECT_TYPES = DATA_TYPES.filter((t) => t.group === 'object')

export const GROUP_LABEL = { primitive: '原始类型', object: '引用类型' }

/* ---------- 判分工具 ---------- */

// 宽松归一化：去空格 / 下划线 / 连字符，转小写
export function normalize(input) {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, '')
}

export function typeById(id) {
  return DATA_TYPES.find((t) => t.id === id) ?? null
}

// 把用户输入映射到某个类型；认不出返回 null
export function findType(input) {
  const n = normalize(input)
  if (!n) return null
  return (
    DATA_TYPES.find(
      (t) => t.id === n || normalize(t.name) === n || t.aliases.some((a) => normalize(a) === n),
    ) ?? null
  )
}

// 是否命中指定类型
export function isMatch(input, typeId) {
  return findType(input)?.id === typeId
}

/* ---------- 错因诊断（本 demo 的教学核心） ---------- */

// 常见错误答案 → 为什么错。message 只讲事实，不提「这一格」，盲填模式也能复用。
const CONFUSIONS = [
  {
    match: ['object', 'obj', '对象', '引用类型'],
    message:
      '被 typeof 骗到了：typeof null === "object" 是 JS 的历史 bug（1995 年 32 位实现中 null 的类型标签恰好全为 0），但 null 本身是独立的原始类型。',
  },
  {
    match: ['function', 'func', '函数'],
    message:
      'function 只是 typeof 的一个返回值，不是独立的数据类型——函数是「可调用的对象」，本质属于 object。',
  },
  {
    match: ['array', '数组', 'date', '日期', 'regexp', 'regex', '正则', 'map', 'set', 'json'],
    message:
      '数组 / 日期 / 正则 / Map / Set / JSON 都不是独立的数据类型，它们统统属于 object（引用类型）。',
  },
  {
    match: ['null', '空', '空值'],
    message:
      '区分两个「空」：undefined = 声明了但没赋值（系统给的默认值）；null = 主动赋的空值（程序员给的）。两者都是独立的原始类型。',
  },
  {
    match: ['undefined', 'undef', '未定义'],
    message:
      '区分两个「空」：undefined = 没赋值的默认值；null = 主动赋的空值，而且 typeof null 返回 "object"。',
  },
  {
    match: ['int', 'integer', 'long', 'double', 'float'],
    message: 'JS 没有 int / float / double 之分，整数和小数一律是 number（双精度 64 位浮点）。',
  },
  {
    match: ['char', 'character', '字符'],
    message: 'JS 没有 char 类型，单个字符也是 string。',
  },
  {
    match: ['true', 'false', '真', '假'],
    message: 'true / false 是「值」，类型名要写 boolean。',
  },
  {
    match: ['biginteger', 'bignum', '整数', 'int64'],
    message: '标准名字是 bigint（ES2020 新增），字面量写法是 10n。',
  },
  {
    match: ['symbols', '唯一值', '唯一标识', 'unique'],
    message: '标准名字是 symbol（ES6 新增），强调「每个值都全局唯一」。',
  },
  {
    match: ['list', '列表', 'arr'],
    message: 'JS 里没有 list 类型，数组属于 object。',
  },
]

/**
 * 答错时给出针对性提示。
 * @param {string} input    用户填的原文
 * @param {string|null} targetId 期望的类型 id；盲填模式传 null（不追加「这一格」结论）
 */
export function diagnoseWrong(input, targetId) {
  const n = normalize(input)
  const target = targetId ? typeById(targetId) : null

  const hit = CONFUSIONS.find((c) => c.match.some((m) => normalize(m) === n))
  if (hit) {
    return target ? `${hit.message} 这一格要填的是 ${target.name}（${target.cn}）。` : hit.message
  }

  const guessed = findType(n)
  if (guessed) {
    return target
      ? `${guessed.name} 确实是 8 种类型之一，但不是这一格的答案；这格要的是 ${target.name}。`
      : `${guessed.name} 是 8 种类型之一，但它已经填在别处 / 放错了分组。`
  }

  return target
    ? `"${String(input).trim()}" 不在 8 种类型里。这格要的是 ${target.name}（${target.cn}），口诀：数 字 布 未 空 符 大 + 对象。`
    : `"${String(input).trim()}" 不在 8 种类型里。回忆口诀：数 字 布 未 空 符 大 + 对象。`
}

/* ---------- 渐进提示 ---------- */

/**
 * 三级提示：1 → 首字母 + 长度；2 → 再加一条关键线索；3 → 直接给答案
 * level 0 返回空串（未使用提示）
 */
export function buildHint(type, level) {
  if (level <= 0) return ''
  if (level === 1) {
    const name = type.name
    return `第 1 级：${name[0]}${'_'.repeat(Math.max(name.length - 1, 1))}（共 ${name.length} 个字母，中文叫「${type.cn}」）`
  }
  if (level === 2) {
    return `第 2 级：${type.clue}｜typeof 结果：${type.typeofResult}`
  }
  const answer = `第 3 级（答案）：${type.name} —— ${type.clue}`
  return type.bugReason ? `${answer}｜🐞 ${type.bugReason}` : answer
}

/* ---------- 出题顺序 ---------- */

// Fisher-Yates，不修改原数组
export function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/* ---------- localStorage 存档 ---------- */
// 用 try/catch 兜底：隐私模式 / 禁用存储时不能让整个 demo 崩掉

export function loadProgress(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveProgress(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 忽略：存不上也不影响本次练习 */
  }
}

export const STORAGE_KEYS = {
  quiz: 'jst:v1:quiz', // 默写战绩
  cards: 'jst:v1:cards', // 闪卡「不熟悉」计数
}
