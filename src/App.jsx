import { Suspense, useEffect, useState } from 'react'
import './App.css'
import { topics, groupTopicsByCategory } from './demos/registry.js'

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

/* ==================== 首页：主题目录 ==================== */
function HomePage({ onPick }) {
  const groups = groupTopicsByCategory()

  return (
    <>
      <header className="app-header">
        <h1>🧪 React 学习实验室</h1>
        <p className="subtitle">
          每一个面试考点，都用可运行的对比 demo 讲透
        </p>
      </header>

      <div className="home">
        <div className="home-stats">
          <span><b>{topics.length}</b>个主题</span>
          <span><b>{groups.length}</b>个分类</span>
        </div>

        {topics.length === 0 && (
          <div className="empty-tip">
            还没有主题，去 <code>src/demos/registry.js</code> 注册一个吧 👇
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
                    <h3 className="topic-title">{t.title}</h3>
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
