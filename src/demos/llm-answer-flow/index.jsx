import { useState } from 'react'
import FlowDemo from './FlowDemo.jsx'
import TokenDemo from './TokenDemo.jsx'
import SampleDemo from './SampleDemo.jsx'
import StreamDemo from './StreamDemo.jsx'
import EssenceDemo from './EssenceDemo.jsx'
import Summary from './Summary.jsx'
import './styles.css'

/* =========================================================
 * 主题：问大模型一个问题，背后发生了什么
 * ---------------------------------------------------------
 * 面试题「你问大模型一个问题，它背后发生了什么，最终又是怎么回答出来的」，
 * 按项目的三栏式规范拆成六栏（① ~ ④ 实跑对拍，⑤ 本质与陷阱，🎯 面试总结）：
 *   ① 全流程：8 步推理流水线播放器（messages → tokenize → 前向 → 采样
 *      → 自回归 → SSE → 前端渲染），先建立整体印象
 *   ② Token·窗口：真跑一个迷你 tokenizer，看切分/计数/计费 + 窗口塞爆怎么砍
 *   ③ 采样台：logits → softmax，temperature / top-p 实时改概率分布，
 *      可复现地抽 20 次 + 贪心对比，把"抽骰子不是查库"讲透
 *   ④ 流式与工具：SSE chunk 边收边解析打字机 vs 一次性返回 + function
 *      calling 四轮往返
 *   ⑤ 本质与陷阱：训练三段 vs 推理、状态与 KV Cache、8 个必踩坑
 *   🎯 面试总结：主线话术 + 阶段速查表 + 高频追问 + 模板
 * 每个子 demo 自包含数据与交互，删除本文件夹即可整体移除。
 * ========================================================= */

const SUB_TABS = [
  { key: 'flow', label: '① 全流程八步', node: <FlowDemo /> },
  { key: 'token', label: '② Token 与窗口', node: <TokenDemo /> },
  { key: 'sample', label: '③ 采样台', node: <SampleDemo /> },
  { key: 'stream', label: '④ 流式与工具', node: <StreamDemo /> },
  { key: 'essence', label: '⑤ 本质与陷阱', node: <EssenceDemo /> },
  { key: 'summary', label: '🎯 面试总结', node: <Summary /> },
]

export default function LlmAnswerFlow() {
  const [tab, setTab] = useState('flow')
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
