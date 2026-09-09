import { useState } from 'react'
import TimingDemo from './TimingDemo.jsx'
import FlickerDemo from './FlickerDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：useEffect vs useLayoutEffect
 * ---------------------------------------------------------
 * 入口文件：引入本主题专属样式 + 组织子 tab 切换。
 * 三个 tab：
 *   ① 执行时机（同步阻塞对比，眼见为实谁挡在绘制前）
 *   ② 防闪烁定位（useLayoutEffect 的正当用途）
 *   🎯 面试总结
 * ========================================================= */

const SUB_TABS = [
  { key: 'timing', label: '① 执行时机', node: <TimingDemo /> },
  { key: 'flicker', label: '② 防闪烁定位', node: <FlickerDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function UseEffectVsUseLayoutEffect() {
  const [tab, setTab] = useState('timing')
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
