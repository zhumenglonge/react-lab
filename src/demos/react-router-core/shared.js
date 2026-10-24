/* =========================================================
 * 主题：React Router 三个标签（BrowserRouter / Routes / Route）
 * 共享数据 + 迷你匹配器
 * ---------------------------------------------------------
 * 本项目没有安装 react-router-dom（用的是 App.jsx 里手写的
 * hash 路由），所以这里手写几十行"迷你匹配器"来还原 v6 的
 * 匹配规则，让"到底哪个 Route 命中"可以当场算给你看：
 *
 *   ① 嵌套摊平：父 path + 子 path = 完整匹配路径
 *   ② index 路由：命中的是"父路径本身"
 *   ③ 按具体度打分：静态段(100) > :动态段(10) > * 通配(1)
 *      —— v6 是先排序再匹配，不是简单的"谁写在前面谁先命中"
 * ========================================================= */

/* 演示用路由表：与①里的 JSX 代码块一一对应 */
export const ROUTE_TREE = {
  key: 'layout',
  path: '/',
  element: '<Layout />',
  role: '父路由（布局壳）：自己不含业务内容，只提供导航 + <Outlet /> 插槽',
  children: [
    {
      key: 'index',
      index: true,
      element: '<Home />',
      role: 'index：代表"父路径本身"（即 /），不是 path="/"，也不是 path=""',
    },
    {
      key: 'topic',
      path: 'topic/:id',
      element: '<TopicPage />',
      role: '动态段 :id：任何一段路径都会被吃进来，参数用 useParams() 读',
    },
    {
      key: 'catch',
      path: '*',
      element: '<NotFound />',
      role: 'splat 通配：前面都没命中才轮到它，专门做 404 兜底',
    },
  ],
}

/* 地址栏候选：四类典型路径 */
export const DEMO_URLS = [
  { url: '/', hint: '父路径本身 → 命中 index' },
  { url: '/topic/react-fiber', hint: '带参数的详情页 → 命中 :id' },
  { url: '/topic/不存在的主题', hint: ':id 什么都吃，得自己校验' },
  { url: '/about', hint: '没有对应路由 → 落到 * 兜底' },
]

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function safeDecode(s) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

/* 把完整路径编译成正则 + 参数名列表 + 具体度分数 */
function compile(fullPath, isIndex) {
  if (isIndex) {
    // index 的匹配条件就一句话：pathname 恰好等于父路径
    return { re: new RegExp(`^${escapeRe(fullPath)}$`), keys: [], score: 1000 }
  }
  const keys = []
  let score = 0
  let src = ''
  for (const seg of fullPath.split('/')) {
    if (!seg) continue
    if (seg === '*') {
      keys.push('*')
      score += 1
      src += '/(.*)'
    } else if (seg.startsWith(':')) {
      keys.push(seg.slice(1))
      score += 10
      src += '/([^/]+)'
    } else {
      score += 100
      src += `/${escapeRe(seg)}`
    }
  }
  if (!src) src = '/'
  return { re: new RegExp(`^${src}$`), keys, score }
}

const joinPath = (parent, child) =>
  child.startsWith('/') ? child : `${parent.replace(/\/$/, '')}/${child}`

/* 把嵌套路由摊平成一份"待匹配清单" */
export function flattenRoutes() {
  return ROUTE_TREE.children.map((r) => {
    const fullPath = r.index ? ROUTE_TREE.path : joinPath(ROUTE_TREE.path, r.path)
    return { ...r, fullPath, ...compile(fullPath, !!r.index) }
  })
}

function renderTree(hit) {
  if (!hit) {
    return [
      '<Layout>',
      '  <Outlet />   ← 没有任何子路由命中，这里渲染为空（整页空白）',
      '</Layout>',
    ].join('\n')
  }
  const child =
    hit.params.id !== undefined ? `<TopicPage id="${hit.params.id}" />` : hit.element
  return ['<Layout>', `  <Outlet /> → ${child}`, '</Layout>'].join('\n')
}

/* 核心：给定 pathname，算出每个 Route 的匹配情况 + 最终命中的那一个 */
export function matchPathname(pathname) {
  const results = flattenRoutes().map((r) => {
    const m = r.re.exec(pathname)
    const params = {}
    if (m) r.keys.forEach((k, i) => (params[k] = safeDecode(m[i + 1] ?? '')))

    // 逐条给出人话版的"命中 / 未命中"理由
    let reason
    if (r.index) {
      reason = m
        ? `pathname 正好是父路径 ${r.fullPath}`
        : `pathname 是 "${pathname}"，不是父路径本身（index 只认 ${r.fullPath}）`
    } else if (r.path === '*') {
      reason = m ? 'splat 通配，任何路径都能命中（兜底）' : '未命中'
    } else {
      reason = m
        ? `pathname 匹配 ${r.fullPath}，取出 ${Object.keys(params).map((k) => `${k}="${params[k]}"`).join(' ')}`
        : `pathname 不是 ${r.fullPath} 的形状`
    }

    return {
      key: r.key,
      label: r.index ? `index（= ${r.fullPath}）` : r.path,
      fullPath: r.fullPath,
      element: r.element,
      role: r.role,
      score: r.score,
      matched: !!m,
      params,
      reason,
    }
  })

  // v6 是按具体度排名取最优，而不是"谁写在前面谁先赢"
  const hits = results.filter((r) => r.matched).sort((a, b) => b.score - a.score)
  const hit = hits[0] ?? null

  return {
    pathname,
    results,
    hit,
    shadowed: hits.slice(1), // 也匹配上了、但被更具体的路由压住的
    render: renderTree(hit),
  }
}
