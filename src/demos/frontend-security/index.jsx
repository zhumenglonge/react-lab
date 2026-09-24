import { useState } from 'react'
import AttackDemo from './AttackDemo.jsx'
import FintechDemo from './FintechDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：前端安全 & 攻击防护（金融向）
 * ---------------------------------------------------------
 * 面试原题「前端代码（尤其金融）有哪些安全考虑？
 *   技术上做了哪些防攻击手段？」合并成一个主题：
 *   ① 🛡️ 攻击 vs 防御：XSS/CSRF/点击劫持/MITM/泄露/重放/供应链… 逐个给前端手段 + 代码
 *   ② 🏦 金融前端专项：脱敏/金额精度/幂等/加签/越权/密钥/防重放/可追溯
 *   ③ 🎯 面试总结：零信任本质 + 分层防御清单 + 高频追问 + 话术
 * ========================================================= */

const SUB_TABS = [
  { key: 'attack', label: '🛡️ 攻击 vs 防御', node: <AttackDemo /> },
  { key: 'fintech', label: '🏦 金融专项', node: <FintechDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function FrontendSecurity() {
  const [tab, setTab] = useState('attack')
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
