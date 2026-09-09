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
