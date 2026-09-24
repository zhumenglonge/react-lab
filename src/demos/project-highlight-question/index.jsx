import './styles.css'

/* =========================================================
 * 🗣️ 行为面试题：介绍印象最深 / 有亮点的项目
 * ---------------------------------------------------------
 * 题目已记录，答案待填充。
 * ========================================================= */

const QUESTION = '你会要求你介绍一个你认为印象最深，或者说比较有亮点的一个项目。然后在这个项目里面，说说你参与的一个内容，或者你觉得值得去分享的一些东西。'

export default function ProjectHighlightQuestion() {
  return (
    <div className="phq-page">
      <header className="phq-header">
        <span className="phq-icon">🗣️</span>
        <div>
          <h2>面试题：介绍印象最深 / 有亮点的项目</h2>
          <p className="phq-meta">行为面试 · 已记录待作答 · 记录于 2026-09-24</p>
        </div>
      </header>

      <section className="phq-card">
        <h3>📌 题目原文</h3>
        <blockquote className="phq-question">
          “你会要求你介绍一个你认为印象最深，或者说比较有亮点的一个项目。
          然后在这个项目里面，说说你参与的一个内容，
          或者你觉得值得去分享的一些东西。”
        </blockquote>
      </section>

      <section className="phq-card">
        <h3>✍️ 我的回答</h3>
        <p className="phq-todo">（待填充：选哪个项目、我负责的部分、亮点与值得分享的细节……）</p>
      </section>
    </div>
  )
}

export { QUESTION }
