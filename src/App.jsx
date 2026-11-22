import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { topics, groupTopicsByCategory, searchTopicsByTitle } from './demos/registry.js'
import {
  recordVisit,
  getVisits,
  clearVisits,
  getRecentTopics,
  sortTopicsByRecency,
  formatRelativeTime,
} from './demos/visitStats.js'

/* =========================================================
 * 应用根组件：只负责"目录页 <-> 主题页"的切换
 * ---------------------------------------------------------
 * 所有 demo 内容都在 src/demos/ 下，通过 registry.js 注册。
 * 这里不写业务，只做路由和骨架，永远不需要改。
 * ========================================================= */

// 从 URL hash 解析当前主题 id：#/topic/xxx 或 #/
function readHash() {
  const h = window.location.hash
  const m = h.match(/^#\/topic\/(.+)$/)
  return m ? m[1] : null
}

function App() {
  const [activeId, setActiveId] = useState(readHash)

  // 监听浏览器前进/后退
  useEffect(() => {
    const onHash = () => setActiveId(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const goto = (id) => {
    window.location.hash = id ? `#/topic/${id}` : '#/'
    setActiveId(id)
  }

  const active = topics.find((t) => t.id === activeId)

  // 进入主题页就算一次访问：点进去、刷新直接落在主题页都算；主题内切 tab 不算
  useEffect(() => {
    if (activeId && topics.some((t) => t.id === activeId)) {
      recordVisit(activeId)
    }
  }, [activeId])

  return (
    <div className="app">
      {active ? (
        <TopicPage topic={active} onBack={() => goto(null)} />
      ) : (
        <HomePage onPick={goto} />
      )}
    </div>
  )
}

/* 把标题中命中的关键词包成 <mark>，只高亮第一处 */
function highlightTitle(title, keyword) {
  const q = keyword.trim()
  if (!q) return title
  const idx = title.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return title
  return (
    <>
      {title.slice(0, idx)}
      <mark className="search-hit">{title.slice(idx, idx + q.length)}</mark>
      {title.slice(idx + q.length)}
    </>
  )
}

/* ==================== 首页：主题目录 ==================== */
function HomePage({ onPick }) {
  const [keyword, setKeyword] = useState('')
  const inputRef = useRef(null)
  // 访问记录快照：只在「清空记录」时原地更新；看完主题回到首页会重新挂载、重新读取
  const [visits, setVisits] = useState(() => getVisits())

  const searching = keyword.trim() !== ''
  // 只按标题过滤，subtitle / tags 不参与匹配
  const matchedRaw = useMemo(() => searchTopicsByTitle(keyword), [keyword])
  // 搜索结果吃热度加成：看过的按最近时间排前面，回车打开的就是最常看的匹配项
  const matched = useMemo(
    () => (searching ? sortTopicsByRecency(matchedRaw) : matchedRaw),
    [searching, matchedRaw],
  )
  const groups = useMemo(() => groupTopicsByCategory(matched), [matched])
  // 首页顶部的「最近看过」：最多 3 个，按访问时间倒序（直接每次算，
  // visits 变化或从主题页回来重新挂载时都会拿到最新记录）
  const recentTopics = getRecentTopics(topics, 3)

  const clearStats = () => {
    if (!window.confirm('清空全部「最近看过」记录？')) return
    clearVisits()
    setVisits({})
  }

  // 按 / 快速聚焦搜索框（已在输入框里打字时不抢焦点）
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const el = document.activeElement
      const typing =
        el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable
      if (typing) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const clear = () => {
    setKeyword('')
    inputRef.current?.focus()
  }

  return (
    <>
      <header className="app-header">
        <h1>🧪 React 学习实验室</h1>
        <p className="subtitle">
          每一个面试考点，都用可运行的对比 demo 讲透
        </p>
      </header>

      <div className="home">
        <div className="search-bar">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            className="search-input"
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              // 回车直接进第一个匹配项，Esc 清空
              if (e.key === 'Enter' && matched.length > 0) {
                onPick(matched[0].id)
              }
              if (e.key === 'Escape' && searching) {
                e.preventDefault()
                clear()
              }
            }}
            placeholder="搜索主题标题（按 / 聚焦）"
            aria-label="按标题搜索主题"
          />
          {searching && (
            <button className="search-clear" onClick={clear} aria-label="清空搜索">
              ✕
            </button>
          )}
        </div>

        <div className="home-stats">
          {searching ? (
            <>
              <span>匹配 <b>{matched.length}</b> 个 / 共 {topics.length} 个主题</span>
              {matched.length > 0 && <span>回车打开第一个</span>}
            </>
          ) : (
            <>
              <span><b>{topics.length}</b>个主题</span>
              <span><b>{groups.length}</b>个分类</span>
            </>
          )}
        </div>

        {!searching && recentTopics.length > 0 && (
          <section className="category recent-section" aria-label="最近看过的主题">
            <div className="recent-head">
              <h2 className="category-title">🕘 最近看过</h2>
              <button className="recent-clear" onClick={clearStats}>
                清空记录
              </button>
            </div>
            <div className="topic-grid recent-grid">
              {recentTopics.map((t) => (
                <button
                  key={t.id}
                  className="topic-card"
                  onClick={() => onPick(t.id)}
                >
                  <div className="topic-card-head">
                    <span className="topic-icon">{t.icon}</span>
                    <h3 className="topic-title">{t.title}</h3>
                  </div>
                  <div className="recent-meta">
                    🕐 {formatRelativeTime(visits[t.id].lastAt)}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {topics.length === 0 && (
          <div className="empty-tip">
            还没有主题，去 <code>src/demos/registry.js</code> 注册一个吧 👇
          </div>
        )}

        {searching && matched.length === 0 && (
          <div className="empty-tip">
            没有标题带「{keyword.trim()}」的主题
            <div className="empty-tip-sub">
              搜索只匹配标题，换个更短的关键词试试，或
              <button className="link-btn" onClick={clear}>清空搜索</button>
            </div>
          </div>
        )}

        {groups.map((g) => (
          <section key={g.name} className="category">
            <h2 className="category-title">{g.name}</h2>
            <div className="topic-grid">
              {g.items.map((t) => (
                <button
                  key={t.id}
                  className="topic-card"
                  onClick={() => onPick(t.id)}
                >
                  <div className="topic-card-head">
                    <span className="topic-icon">{t.icon}</span>
                    <h3 className="topic-title">
                      {highlightTitle(t.title, keyword)}
                    </h3>
                  </div>
                  <p className="topic-subtitle">{t.subtitle}</p>
                  <div className="topic-tags">
                    {t.difficulty && (
                      <span className="tag difficulty">{t.difficulty}</span>
                    )}
                    {t.tags?.slice(1).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                  {t.createdAt && (
                    <div className="topic-meta">📅 {t.createdAt}</div>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}

/* ==================== 主题页：懒加载 + 返回 ==================== */
function TopicPage({ topic, onBack }) {
  const { Component } = topic
  return (
    <>
      <div className="topic-header">
        <button className="back-btn" onClick={onBack}>← 返回目录</button>
        <div className="topic-header-info">
          <h2>
            <span>{topic.icon}</span>
            <span>{topic.title}</span>
          </h2>
          <p>{topic.subtitle}</p>
        </div>
      </div>
      <Suspense fallback={<div className="loading-fallback">⏳ 主题加载中...</div>}>
        <Component />
      </Suspense>
    </>
  )
}

export default App
