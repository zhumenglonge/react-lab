import { useState } from 'react'
import EssenceDemo from './EssenceDemo.jsx'
import MemoValueDemo from './MemoValueDemo.jsx'
import CallbackChildDemo from './CallbackChildDemo.jsx'
import PitfallsDemo from './PitfallsDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：useMemo vs useCallback
 * ---------------------------------------------------------
 * 面试题「它俩区别是什么？什么时候用？」的可运行答案：
 *   ① 本质区别（缓存值 vs 缓存函数，引用稳定性眼见为实）
 *   ② useMemo 实战（缓存昂贵计算）
 *   ③ useCallback 实战（配合 React.memo 跳过子组件渲染）
 *   ④ 常见误区（闭包陷阱 / 过度优化）
 *   🎯 面试总结
 * ========================================================= */

const SUB_TABS = [
  { key: 'essence', label: '① 本质区别', node: <EssenceDemo /> },
  { key: 'memo', label: '② useMemo 实战', node: <MemoValueDemo /> },
  { key: 'callback', label: '③ useCallback 实战', node: <CallbackChildDemo /> },
  { key: 'pitfalls', label: '④ 常见误区', node: <PitfallsDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function UseMemoUseCallback() {
  const [tab, setTab] = useState('essence')
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
