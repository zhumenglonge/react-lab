import { useState } from 'react'
import QnACards from './QnACards.jsx'
import SpokenRef from './SpokenRef.jsx'
import './styles.css'

/* =========================================================
 * 主题：英文面试（外企面试原题 + 地道口语）
 * ---------------------------------------------------------
 * 场景：投外企会碰到英文面，当场被问到的题和不会说的口语，
 * 攒成一份「线上能刷」的问答，而不是躺在 Markdown 里。
 *   ① 💬 问答闪卡：题目先出声答 → 再逐段对照参考话术（30s/要点/加分句/收尾/坑）
 *   ② 🗣️ 口语 & 用词：短句速查（可搜索）+ 语法坑 + 英式 vs 美式
 * 原始记录在根目录 english-interview-notes.md，新题先写那儿，再同步到 shared.js
 * ========================================================= */

const SUB_TABS = [
  { key: 'qa', label: '💬 问答闪卡', node: <QnACards /> },
  { key: 'spoken', label: '🗣️ 口语 & 用词', node: <SpokenRef /> },
]

export default function EnglishInterview() {
  const [tab, setTab] = useState('qa')
  const current = SUB_TABS.find((t) => t.key === tab)

  return (
    <div className="topic-root">
      <nav className="tabs">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            className={t.key === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main className="content">{current.node}</main>
    </div>
  )
}
