import { useState } from 'react'
import { SKILL_MD_EXAMPLE, FRONTMATTER_FIELDS } from './shared.js'

/* =========================================================
 * ② Skill 长什么样：一个目录 + 一个 SKILL.md
 * ---------------------------------------------------------
 * 左：真实 SKILL.md（可切换是否只高亮 L1 frontmatter）
 * 右：字段速查表 + "能带代码"说明。
 * ========================================================= */

export default function AnatomyDemo() {
  const [onlyMeta, setOnlyMeta] = useState(false)

  const metaEnd = SKILL_MD_EXAMPLE.indexOf('---', 3) + 3
  const meta = SKILL_MD_EXAMPLE.slice(0, metaEnd)
  const body = SKILL_MD_EXAMPLE.slice(metaEnd)

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>② 一个 Skill 长什么样</h2>
        <p className="desc">
          官方定义极简：<b>一个 skill 就是一个包含 SKILL.md 的目录</b>。SKILL.md 必须以 YAML frontmatter 开头，
          必填 <code>name</code> 和 <code>description</code>；正文和附带文件都是可选的"更深一层"。
        </p>
      </div>

      <div className="sk-anatomy">
        <div className="sk-card" style={{ marginBottom: 0 }}>
          <h4>
            📄 pdf/SKILL.md
            <label className="sk-chip" style={{ marginLeft: 'auto', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={onlyMeta}
                onChange={() => setOnlyMeta((v) => !v)}
                style={{ accentColor: 'var(--accent)', marginRight: '0.35em' }}
              />
              只点亮 L1 名片
            </label>
          </h4>
          <pre className="sk-md">
            {onlyMeta ? (
              <>
                <span style={{ background: 'var(--accent-bg)', color: 'var(--text-strong)' }}>{meta}</span>
                <span style={{ opacity: 0.4 }}>{body}</span>
              </>
            ) : (
              SKILL_MD_EXAMPLE
            )}
          </pre>
          <p className="sk-note">
            👆 勾上「只点亮 L1」= Agent 启动时的视角：整段 frontmatter 进了 system prompt，
            <b>正文和附件对它此刻是"隐身"的</b>，只有判断相关才会去读。
          </p>
        </div>

        <div className="sk-card" style={{ marginBottom: 0 }}>
          <h4>🧩 字段速查</h4>
          <table className="sk-field-table">
            <thead>
              <tr><th>字段</th><th>必填</th><th>作用</th></tr>
            </thead>
            <tbody>
              {FRONTMATTER_FIELDS.map((f) => (
                <tr key={f.field}>
                  <td>{f.field}</td>
                  <td><span className="sk-req">{f.req}</span></td>
                  <td>{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sk-card" style={{ marginTop: '1.2rem' }}>
        <h4>⚙️ Skill 还能带"能跑的代码"</h4>
        <p className="sk-lead">
          除了文本，skill 目录里可以放脚本。模型能把它们<b>当工具直接运行</b>，而不必把脚本本身或它处理的数据读进上下文 ——
          比如上面这个 <code>extract_fields.py</code> 直接抽出 PDF 表单字段，只把结果那一小段进上下文。
        </p>
        <div className="sk-duel">
          <div className="sk-duel-col tone-danger">
            <div className="sk-duel-head">让模型逐 token 生成</div>
            <p className="sk-lead" style={{ margin: 0 }}>排序、解析、精确计算用生成来做：又贵又不确定，还可能算错（幻觉）。</p>
          </div>
          <div className="sk-duel-col tone-success">
            <div className="sk-duel-head">交给 skill 里的脚本</div>
            <p className="sk-lead" style={{ margin: 0 }}>确定性、可复现、省 token；代码既是可执行工具，也能当文档参考 —— 但要写清哪种用法。</p>
          </div>
        </div>
      </div>

      <p className="tip">
        💡 面试被追问"具体文件长啥样"时，报出这个结构就够：<b>YAML frontmatter（name + description）→ Markdown 正文 → 按需引用的附件/脚本</b>。
        再补一句"description 是触发的命门，模型只凭它决定用不用这个 skill"，显示你真写过。
      </p>
    </div>
  )
}
