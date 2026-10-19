import { useState, useEffect } from 'react'
import { HANDSHAKE_STEPS } from './shared.js'

/* =========================================================
 * ① 握手与调用全程：一条消息从 Host 到 Server 再回到模型
 * ---------------------------------------------------------
 * 交互：逐步播放 8 个环节，当前环节展开说明 + JSON-RPC 消息体。
 * 自动播放引擎与 FlowDemo 同套路：setState 全放在 setTimeout
 * 回调里（异步），避免 effect 体内同步 setState 触发 lint。
 * 纯确定性演示：不放 Date.now()、不放 Math.random。
 * ========================================================= */

const STEP_MS = 1500

/* 每一步的"谁发给谁"（与 HANDSHAKE_STEPS 一一对应） */
const DIRECTIONS = [
  { label: '用户 → Host', kind: 'UI 输入' },
  { label: 'Client → Server', kind: 'JSON-RPC 请求' },
  { label: 'Server → Client', kind: 'JSON-RPC 响应' },
  { label: 'Client → Server', kind: 'JSON-RPC 请求' },
  { label: 'Server → Client', kind: 'JSON-RPC 响应' },
  { label: 'Host → 模型 API', kind: 'HTTPS 请求' },
  { label: '模型 → Host', kind: 'API 响应' },
  { label: 'Client → Server', kind: 'JSON-RPC 请求' },
  { label: 'Server → Client → 模型 → 用户', kind: '结果回注' },
]

const ACTOR_LINES = [
  { name: 'Host（应用）', text: '用户面对的 AI 应用本体，内置 Client；负责把发现来的工具清单喂给模型、管理授权与确认。' },
  { name: 'Client（连接器）', text: '协议消息的收发方，也是 tools/call 的执行发起方 —— 一个 Client 严格对应一个 Server（1:1）。' },
  { name: 'Server（工具方）', text: '只声明"我有什么、参数怎么填"，返回执行结果；它不执行模型的调用意图，也看不到完整对话。' },
]

export default function HandshakeDemo() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  const last = HANDSHAKE_STEPS.length - 1

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      const next = step + 1
      if (next >= HANDSHAKE_STEPS.length) {
        setStep(last)
        setPlaying(false)
      } else {
        setStep(next)
      }
    }, STEP_MS)
    return () => clearTimeout(t)
  }, [playing, step, last])

  const play = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (step >= last) setStep(0)
    setPlaying(true)
  }
  const prev = () => { setPlaying(false); setStep((s) => Math.max(s - 1, 0)) }
  const next = () => { setPlaying(false); setStep((s) => Math.min(s + 1, last)) }
  const reset = () => { setPlaying(false); setStep(0) }

  const current = HANDSHAKE_STEPS[step]
  const landed = !playing && step >= last

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>① 握手与调用全程 · 九步走完一条 MCP 连接</h2>
        <p className="desc">
          很多人对 MCP 的印象停在「AI 调了个工具」，但协议的部分发生在<b>调用之前</b>：
          启动时 initialize 协商、运行时 tools/list 发现，之后才轮到 tools/call。
          点「开始播放」，看每一步的消息体长什么样、是谁发给谁。
        </p>
      </div>

      <div className="mcp-timeline">
        {HANDSHAKE_STEPS.map((s, i) => {
          const state = i === step ? ' mcp-stage-active' : i < step ? ' mcp-stage-done' : ''
          return (
            <div
              key={s.title}
              className={'mcp-stage' + state}
              onClick={() => { setPlaying(false); setStep(i) }}
            >
              <div className="mcp-stage-badge">{i < step ? '✓' : s.icon}</div>
              <div className="mcp-stage-main">
                <div className="mcp-stage-title">{s.title}</div>
                {i === step && (
                  <>
                    <p className="mcp-stage-text">{s.body}</p>
                    {s.msg && (
                      <div className="mcp-msg">
                        <div className="mcp-msg-meta">
                          <span className="mcp-msg-dot" />
                          <b>{DIRECTIONS[i].label}</b>
                          <span className="mcp-tag">{DIRECTIONS[i].kind}</span>
                        </div>
                        <pre>{JSON.stringify(s.msg, null, 2)}</pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mcp-controls">
        <div className="btn-row">
          <button onClick={play}>{playing ? '⏸ 暂停' : '▶ 开始播放'}</button>
          <button className="ghost" onClick={prev} disabled={step === 0}>← 上一步</button>
          <button className="ghost" onClick={next} disabled={step >= last}>下一步 →</button>
          <button className="ghost" onClick={reset}>重置</button>
        </div>
        <span className="mcp-progress">第 {step + 1} / {HANDSHAKE_STEPS.length} 步 · {current.title}</span>
      </div>

      {landed && (
        <div className="mcp-card">
          <h4>🧾 这一圈跑完，三个角色各自干了什么 <span className="mcp-tag">对应「本质与陷阱」第 2 条</span></h4>
          <div className="mcp-roles">
            {ACTOR_LINES.map((a) => (
              <div key={a.name} className="mcp-role-line">
                <b>{a.name}</b>
                <span>{a.text}</span>
              </div>
            ))}
          </div>
          <p className="mcp-note">
            两个容易漏掉的细节：<b>①第 6 步之后模型才参与</b> —— 前面 5 步全是应用层协议对话，模型 API 一次都没被调；
            <b>②第 9 步是第二次请求</b> —— 工具结果回注后整段上下文重传，token 两轮计费（同 llm-answer-flow 的账本）。
          </p>
        </div>
      )}

      <p className="tip">
        💡 面试复述这条链的顺序别乱：<b>initialize（协商）→ tools/list（发现）→ 清单喂模型 → 模型出 tool_calls →
        tools/call（执行）→ 结果回注（二次请求）</b>。前两步是 MCP 协议独有的，后四步和直连 function calling 一样 ——
        说清"哪一段才是 MCP 增加的"，这题就赢了一半。
      </p>
    </div>
  )
}
