/* =========================================================
 * 🕘 主题访问统计（最近看过）
 * ---------------------------------------------------------
 * 用 localStorage 记录每个主题的访问次数与最近访问时间，
 * 首页据此在顶部置顶「最近看过」区块，搜索结果也吃热度加成。
 *
 * 存储 key：topic-visit-stats → { [topicId]: { count, lastAt } }
 * ========================================================= */

const STORAGE_KEY = 'topic-visit-stats'

// 读取全部访问记录；localStorage 不可用或数据损坏时返回空对象（功能静默降级）
export function getVisits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

function saveVisits(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    /* 写不进去（隐私模式等）就不记了，不报错 */
  }
}

// 进入主题页时调用：次数 +1，最近时间刷新为现在
export function recordVisit(id) {
  const stats = getVisits()
  const prev = stats[id] ?? { count: 0, lastAt: 0 }
  stats[id] = { count: prev.count + 1, lastAt: Date.now() }
  saveVisits(stats)
}

// 清空全部记录（首页「清空记录」按钮用）
export function clearVisits() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* 同上，静默降级 */
  }
}

// 访问过的按最近时间倒序排前面，没访问过的保持原有顺序
export function sortTopicsByRecency(list) {
  const stats = getVisits()
  return [...list].sort(
    (a, b) => (stats[b.id]?.lastAt ?? 0) - (stats[a.id]?.lastAt ?? 0),
  )
}

// 最近看过的前 limit 个主题（按 lastAt 倒序）
export function getRecentTopics(list, limit = 3) {
  const stats = getVisits()
  return list
    .filter((t) => stats[t.id]?.lastAt)
    .sort((a, b) => stats[b.id].lastAt - stats[a.id].lastAt)
    .slice(0, limit)
}

// 时间戳 → 「刚刚 / N 分钟前 / 今天 / 昨天 / N 天前 / M月D日」
export function formatRelativeTime(ts) {
  const diff = Date.now() - ts
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} 分钟前`
  const dayMs = 24 * 60 * 60 * 1000
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()
  if (ts >= startOfToday) return '今天'
  if (ts >= startOfToday - dayMs) return '昨天'
  const days = Math.floor((startOfToday - ts) / dayMs)
  if (days < 7) return `${days} 天前`
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
