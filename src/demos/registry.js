import { lazy } from 'react'

/* =========================================================
 * 📚 Demo 主题注册中心
 * ---------------------------------------------------------
 * 新增一个学习主题，只需要两步：
 *   1. 在 src/demos/ 下新建一个文件夹，写一个 index.jsx 作为主题入口
 *      （内部可以是 tab、可以是单页，随便组织）
 *   2. 在下面 topics 数组里加一条记录
 *
 * 每个主题自包含（组件、样式、状态都在自己文件夹里），
 * 删除时直接把整个文件夹 + 这里的注册条目一起删即可。
 * ========================================================= */

const rawTopics = [
  {
    id: 'useState-vs-useReducer',
    icon: '🎯',
    title: 'useState vs useReducer',
    subtitle: '什么时候用哪个？三个场景讲透',
    tags: ['Hooks', '状态管理', '面试高频'],
    difficulty: '初级',
    createdAt: '2026-09-09',
    loader: () => import('./useState-vs-useReducer/index.jsx'),
  },
  {
    id: 'virtual-dom-diff',
    icon: '🌳',
    title: '虚拟 DOM Diff 算法',
    subtitle: 'Tree / Component / Element 三大策略 + key 陷阱',
    tags: ['原理', '性能优化', '面试高频'],
    difficulty: '中级',
    createdAt: '2026-09-09',
    loader: () => import('./virtual-dom-diff/index.jsx'),
  },
  {
    id: 'usememo-usecallback',
    icon: '⚡',
    title: 'useMemo / useCallback',
    subtitle: '缓存值 vs 缓存函数，什么时候该用、什么时候是过度优化',
    tags: ['Hooks', '性能优化', '面试高频'],
    difficulty: '中级',
    createdAt: '2026-09-09',
    loader: () => import('./usememo-usecallback/index.jsx'),
  },
  {
    id: 'virtual-scroll',
    icon: '📜',
    title: '虚拟滚动 / 长列表优化',
    subtitle: '10 万条也不卡：手写 VirtualList + 性能对比 + 原理可视化',
    tags: ['性能优化', '长列表', '面试高频'],
    difficulty: '中级',
    createdAt: '2026-09-09',
    loader: () => import('./virtual-scroll/index.jsx'),
  },
  {
    id: 'component-communication',
    icon: '🔗',
    title: '组件间通信方式',
    subtitle: '父子 / 跨层级 / 兄弟 / Ref 四种场景，可运行 demo 看清数据往哪流',
    tags: ['组件通信', '数据流', '面试高频'],
    difficulty: '初级',
    createdAt: '2026-09-09',
    loader: () => import('./component-communication/index.jsx'),
  },
  {
    id: 'useeffect-vs-uselayouteffect',
    icon: '⏱️',
    title: 'useEffect vs useLayoutEffect',
    subtitle: '绘制后异步 vs 绘制前同步：阻塞对比 + 防闪烁定位，一眼看懂',
    tags: ['Hooks', '副作用', '面试高频'],
    difficulty: '中级',
    createdAt: '2026-09-09',
    loader: () => import('./useeffect-vs-uselayouteffect/index.jsx'),
  },
  {
    id: 'redux-core',
    icon: '🔄',
    title: 'Redux 核心原理',
    subtitle: '手写 mini-redux：createStore / 单向数据流 / thunk 异步，原理与实战一次讲透',
    tags: ['状态管理', 'Redux', '面试高频'],
    difficulty: '中级',
    createdAt: '2026-09-10',
    loader: () => import('./redux-core/index.jsx'),
  },
  {
    id: 'useReducer-context',
    icon: '🧩',
    title: 'useReducer + Context 全局状态',
    subtitle: '轻量版 Redux：Context 广播 + reducer 集中更新，中小应用够用（含性能拆分）',
    tags: ['状态管理', 'Context', '面试高频'],
    difficulty: '中级',
    createdAt: '2026-09-10',
    loader: () => import('./useReducer-context/index.jsx'),
  },
  {
    id: 'url-to-page',
    icon: '🌐',
    title: '从输入 URL 到页面展示',
    subtitle: 'DNS → TCP → HTTP → 渲染：把"浏览器输入网址发生了什么"一步步跑给你看',
    tags: ['网络', '浏览器原理', '面试高频'],
    difficulty: '中级',
    createdAt: '2026-09-10',
    loader: () => import('./url-to-page/index.jsx'),
  },
  {
    id: 'js-data-types',
    icon: '🧬',
    title: 'JS 数据类型（8 种）',
    subtitle: '默写挑战 + 口诀 + 闪卡 + typeof 陷阱：把“数据类型有哪些”焊进长期记忆，忘了就回来填一遍',
    tags: ['JS 基础', '数据类型', '面试高频'],
    difficulty: '初级',
    createdAt: '2026-09-13',
    loader: () => import('./js-data-types/index.jsx'),
  },
  {
    id: 'instanceof-principle',
    icon: '🔗',
    title: 'instanceof 原理与实现',
    subtitle: '原型链查找可视化 + 手写 myInstanceof 当场对拍原生：把“instanceof 原理”讲透',
    tags: ['JS 基础', '原型链', '面试高频'],
    difficulty: '中级',
    createdAt: '2026-09-18',
    loader: () => import('./instanceof-principle/index.jsx'),
  },
  {
    id: 'react-fiber',
    icon: '🧵',
    title: 'React Fiber 架构',
    subtitle: '链表 + 时间切片：可视化 work loop 遍历 + Stack/Fiber 可中断渲染对比，讲透「为什么需要 Fiber」',
    tags: ['原理', 'React 架构', '面试高频'],
    difficulty: '中级',
    createdAt: '2026-09-18',
    loader: () => import('./react-fiber/index.jsx'),
  },

  {
    id: 'for-in-vs-for-of',
    icon: '🔁',
    title: 'for...in vs for...of',
    subtitle: '8 种数据当场对拍：一个遍历键名（含原型链）、一个遍历值（走 Symbol.iterator），区别一网打尽',
    tags: ['JS 基础', '循环遍历', '面试高频'],
    difficulty: '初级',
    createdAt: '2026-09-24',
    loader: () => import('./for-in-vs-for-of/index.jsx'),
  },

  {
    id: 'some-vs-every',
    icon: '🔍',
    title: 'some vs every',
    subtitle: '存在即真 vs 全真才真：实跑短路计数 + some/every/find/filter 家族对比 + 空数组陷阱',
    tags: ['JS 基础', '数组方法', '面试高频'],
    difficulty: '初级',
    createdAt: '2026-09-24',
    loader: () => import('./some-vs-every/index.jsx'),
  },

  {
    id: 'frontend-security',
    icon: '🛡️',
    title: '前端安全 & 攻击防护（金融向）',
    subtitle: 'XSS/CSRF/点击劫持/MITM/重放/供应链逐个给前端手段，叠加金融专项：脱敏/金额精度/幂等/加签/越权/密钥',
    tags: ['安全', '工程实践', '面试高频'],
    difficulty: '中级',
    createdAt: '2026-09-24',
    loader: () => import('./frontend-security/index.jsx'),
  },

  {
    id: 'project-highlight-question',
    icon: '🗣️',
    title: '面试题：印象最深的项目',
    subtitle: '行为面试原题「介绍一个印象最深/有亮点的项目，说说你参与的内容」——题目已记录，答案待填充',
    tags: ['行为面试', '项目经验', '面试高频'],
    difficulty: '开放题',
    createdAt: '2026-09-24',
    loader: () => import('./project-highlight-question/index.jsx'),
  },

  {
    id: 'reverse-questions',
    icon: '❓',
    title: '反问环节：该问什么',
    subtitle: '面试官问“你有什么想了解的”时：可勾选反问清单 + 避雷/分角色 + “还有问题吗≠通过”的信号解读',
    tags: ['行为面试', '软技能', '面试高频'],
    difficulty: '开放题',
    createdAt: '2026-09-24',
    loader: () => import('./reverse-questions/index.jsx'),
  },

  /* 👇 未来在这里继续加，例如：
  {
    id: 'useEffect-deep-dive',
    icon: '🔁',
    title: 'useEffect 深度剖析',
    subtitle: '依赖数组、清理函数、闭包陷阱',
    tags: ['Hooks', '副作用'],
    difficulty: '中级',
    createdAt: '2026-09-10',
    loader: () => import('./useEffect-deep-dive/index.jsx'),
  },
  */
]

// 把 loader 转成 lazy 组件，只创建一次，避免每次 render 都重新挂载
export const topics = rawTopics.map((t) => ({
  ...t,
  Component: lazy(t.loader),
}))

// 按分类聚合，方便首页分组展示（现在只有一个分组，未来可扩展）
export function groupTopicsByCategory() {
  // 目前先按 tags 里第一个作为分类
  const groups = new Map()
  for (const t of topics) {
    const cat = t.tags?.[0] ?? '其他'
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat).push(t)
  }
  return Array.from(groups.entries()).map(([name, items]) => ({ name, items }))
}
