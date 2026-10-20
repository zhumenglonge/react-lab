import { useState } from 'react'
import ImpactDemo from './ImpactDemo.jsx'
import PrincipleDemo from './PrincipleDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：前端性能优化方法
 * ---------------------------------------------------------
 * 面试高频开放题「前端性能优化有哪些方法？」，拆成三栏：
 *   ① 首屏优化模拟器（实跑对拍）：勾选各种优化手段 + 切网络场景 /
 *      首次·二次访问，看请求数 / 传输体积 / FCP / LCP 实时前后对比，
 *      并按 Core Web Vitals 阈值给出评级。
 *   ② 本质与陷阱：重排 vs 合成动画（真跑）、防抖 vs 节流（实时计数）、
 *      preload/prefetch/preconnect 三兄弟、SWR 策略与成熟库(ahooks/React Query)映射、
 *      构建分包策略可视化与 webpack/vite 打包分析。
 *   🎯 面试总结：分阶段答题主线 + 分层手段表 + Core Web Vitals + 话术模板。
 * 每个子 demo 自包含数据与交互，删除本文件夹即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'impact', label: '① 首屏优化模拟器', node: <ImpactDemo /> },
  { key: 'principle', label: '② 本质与陷阱', node: <PrincipleDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function FePerfOptimization() {
  const [tab, setTab] = useState('impact')
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
