import { useState, useEffect } from 'react'
import { DISCLOSURE_LEVELS, DISCLOSURE_STEPS, CONTEXT_BLOCKS, SKILL_TREE } from './shared.js'

/* =========================================================
 * ① 渐进式披露三层：一个 PDF 表单 skill 是怎么"用到才加载"的
 * ---------------------------------------------------------
 * 左：skill 目录树（进入上下文的文件会点亮）
 * 右：上下文窗口（随步骤累加，显示实时 token 与占用条）
 * 上：三层卡片，高亮当前正在演示的那一层。
 * 自动播放引擎同 FlowDemo：setState 放 setTimeout 回调里，规避 lint。
 * 纯确定性，无 Date.now / Math.random。
 * ========================================================= */

const STEP_MS = 1700

/* 每个步骤对应"正在演示第几层"（0=L1 名片 / 1=L2 正文 / 2=L3 附件+代码） */
const STEP_LEVEL = [0, 0, 1, 2, 2]

/* 文件是否已在上下文：由该步 loaded 集合推导 */
function fileLoaded(path, loaded) {
  if (path === 'SKILL.md') return loaded.includes('skillmd')
  if (path === 'forms.md') return loaded.includes('forms')
  if (path === 'extract_fields.py') return loaded.includes('scriptout')
  return false
}

export default function DisclosureDemo() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  const last = DISCLOSURE_STEPS.length - 1

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      const next = step + 1
      if (next > last) {
        setStep(last)
        setPlaying(false)
      } else {
        setStep(next)
      }
    }, STEP_MS)
    return () => clearTimeout(t)
  }, [playing, step, last])

  const play = () => {
    if (playing) { setPlaying(false); return }
    if (step >= last) setStep(0)
    setPlaying(true)
  }
  const prev = () => { setPlaying(false); setStep((s) => Math.max(s - 1, 0)) }
  const next = () => { setPlaying(false); setStep((s) => Math.min(s + 1, last)) }
  const reset = () => { setPlaying(false); setStep(0) }

  const cur = DISCLOSURE_STEPS[step]
  const activeLevel = STEP_LEVEL[step]
  const totalTokens = cur.loaded.reduce((sum, k) => sum + (CONTEXT_BLOCKS[k]?.tokens ?? 0), 0)
  const ctxCap = 8000 /* 只为占用条的观感，非真实窗口 */
  const pct = Math.min(100, Math.round((totalTokens / ctxCap) * 100))

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>① 渐进式披露三层 · 用到才加载</h2>
        <p className="desc">
          这是 Agent Skills 的<b>命根子</b>：不是一上来把所有知识塞进上下文，而是像一本组织良好的手册 ——
          先看目录（L1 名片），需要才翻章节（L2 正文），再要才查附录（L3 附件）。
          点「播放」，看右侧上下文窗口怎么随步骤<b>一点点、且只在该用时</b>地长大。
        </p>
      </div>

      <div className="sk-levels">
        {DISCLOSURE_LEVELS.map((l, i) => (
          <div key={l.level} className={`sk-level ${i === activeLevel ? 'sk-level-active' : ''}`}>
            <span className="sk-level-badge">{l.level}</span>
            <div className="sk-level-name">{l.name}</div>
            <div className="sk-level-file">{l.file}</div>
            <p className="sk-level-when">{l.when}</p>
            <p className="sk-level-tokens">🪙 {l.tokenNote} · {l.why}</p>
          </div>
        ))}
      </div>

      <div className="sk-disclose">
        {/* 左：目录树 */}
        <div className="sk-tree">
          {SKILL_TREE.map((node) => {
            const lit = node.kind === 'file' && fileLoaded(node.path, cur.loaded)
            const cls = `sk-tree-row ${node.kind === 'dir' ? 'dir' : ''} ${lit ? 'lit' : ''}`
            return (
              <div key={node.path} className={cls} style={{ paddingLeft: `${0.4 + node.level * 1.1}rem` }}>
                <span>{node.kind === 'dir' ? '📂' : lit ? '🟢' : '📄'}</span>
                <span className="sk-tree-path">{node.path}</span>
                {node.tag && <span className="sk-tree-tag">{node.tag}</span>}
              </div>
            )
          })}
        </div>

        {/* 右：上下文窗口 */}
        <div className="sk-ctx">
          <div className="sk-ctx-head">
            <span>上下文窗口占用（示意）</span>
            <b>{totalTokens.toLocaleString()} token</b>
          </div>
          <div className="sk-ctx-track">
            <div className="sk-ctx-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="sk-ctx-blocks">
            {cur.loaded.map((k) => {
              const b = CONTEXT_BLOCKS[k]
              return (
                <div key={k} className={`sk-ctx-block tone-${b.tone}`}>
                  <span>{b.label}</span>
                  <span className="sk-ctx-k">+{b.tokens.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="sk-timeline" style={{ marginTop: '1rem' }}>
        <div className="sk-stage sk-stage-active">
          <div className="sk-stage-badge">{cur.icon}</div>
          <div className="sk-stage-main">
            <div className="sk-stage-title">{cur.title}</div>
            <p className="sk-stage-text">{cur.note}</p>
          </div>
        </div>
      </div>

      <div className="sk-controls">
        <div className="btn-row">
          <button onClick={play}>{playing ? '⏸ 暂停' : '▶ 播放全流程'}</button>
          <button className="ghost" onClick={prev} disabled={step === 0}>← 上一步</button>
          <button className="ghost" onClick={next} disabled={step >= last}>下一步 →</button>
          <button className="ghost" onClick={reset}>重置</button>
        </div>
        <span className="sk-progress">第 {step + 1} / {DISCLOSURE_STEPS.length} 步 · {cur.title}</span>
      </div>

      <p className="tip">
        💡 一句话记住这题：<b>MCP 是"连上就把全部工具 schema 平铺进上下文"，Skill 是"平时只留一张名片，用到才展开"。</b>
        把"渐进式披露"四个字 + 这三层讲清楚，就是这题的分水岭。
      </p>
    </div>
  )
}
