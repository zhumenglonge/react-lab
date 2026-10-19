import { useState, useEffect, useMemo } from 'react'
import { TOOL_STEPS } from './shared.js'

/* =========================================================
 * ④ 流式与工具：前端真正接手的那两步
 * ---------------------------------------------------------
 * 三块实跑：
 *   A) SSE 打字机：逐条 event 到达 → 解析 delta → 累加进 state → 上屏；
 *      并排对比非流式（全部生成完才返回）用户要干等多久
 *   B) UTF-8 被切在 chunk 边界：真跑 TextEncoder/TextDecoder，
 *      看为什么必须留 buffer / 用 decode(chunk, { stream: true })
 *   C) function calling 四轮往返：messages 数组如何一步步长大
 * 计时用"已推进的 tick 数 × 每 tick 毫秒"累加，不在渲染期读 Date.now()。
 * ========================================================= */

const ANSWER =
  '闭包就是函数和它所引用的变量绑在一起的那个组合：内层函数即使在外层函数已经执行完之后，仍然"记得"那些变量。React 里的 useState、防抖、事件回调读到旧值，本质都是闭包。'

/* 服务端一般一次推 1~2 个字符（真实是按 token），这里切成小 delta 模拟 */
const DELTAS = ANSWER.match(/.{1,2}/gu) ?? []
const TOTAL_EVENTS = DELTAS.length + 1 /* +1 = data: [DONE] */
const MS_PER_TICK = 40 /* 一个 token 的生成间隔（示意量级） */

const RAW_EVENTS = DELTAS.map(
  (d) => `data: {"choices":[{"index":0,"delta":{"content":"${d}"}}]}\n\n`,
)
const DONE_EVENT = 'data: [DONE]\n\n'

/* ---- B) 字节切分实跑：naive vs stream 模式 ---- */
function byteSplitDemo(text, cutChars) {
  const bytes = new TextEncoder().encode(text)
  const prefixBytes = new TextEncoder().encode(text.slice(0, cutChars)).length
  const cut = Math.min(prefixBytes + 1, bytes.length - 1) /* +1 → 落到某个汉字的中间 */

  const head = bytes.slice(0, cut)
  const tail = bytes.slice(cut)

  /* ❌ 天真做法：每片各自 new TextDecoder().decode() */
  const naive = new TextDecoder('utf-8', { fatal: false }).decode(head) +
    new TextDecoder('utf-8', { fatal: false }).decode(tail)

  /* ✅ 正确做法：同一个 decoder 实例 + stream:true，把残缺字节留给下一片 */
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const streamed = decoder.decode(head, { stream: true }) + decoder.decode(tail)

  const broken = (naive.match(/\uFFFD/g) ?? []).length
  return {
    cut,
    totalBytes: bytes.length,
    headHex: Array.from(head.slice(-4)).map((b) => b.toString(16).padStart(2, '0')).join(' '),
    tailHex: Array.from(tail.slice(0, 4)).map((b) => b.toString(16).padStart(2, '0')).join(' '),
    naive,
    streamed,
    broken,
  }
}

/* 把乱码字符高亮出来，看得见"坏掉的地方" */
function markBroken(str) {
  return str.split('\uFFFD').map((seg, i, arr) => (
    <span key={i}>
      {seg}
      {i < arr.length - 1 && <b className="lm-bad">{'\ufffd'}</b>}
    </span>
  ))
}

export default function StreamDemo() {
  const [revealed, setRevealed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [nonStreaming, setNonStreaming] = useState(false)
  const [cutChars, setCutChars] = useState(6)
  const [toolStep, setToolStep] = useState(0)

  const done = revealed >= TOTAL_EVENTS

  /* 播放器：每 tick 推进一条 event（回调里 setState，符合 react-hooks 约束） */
  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      const nextTick = revealed + 1
      if (nextTick >= TOTAL_EVENTS) {
        setRevealed(TOTAL_EVENTS)
        setPlaying(false)
      } else {
        setRevealed(nextTick)
      }
    }, MS_PER_TICK)
    return () => clearTimeout(t)
  }, [playing, revealed])

  const play = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (done) setRevealed(0)
    setPlaying(true)
  }
  const stop = () => setPlaying(false)
  const reset = () => { setPlaying(false); setRevealed(0) }

  const arrivedText = DELTAS.slice(0, revealed).join('')
  const rawLog = RAW_EVENTS.slice(0, revealed).join('') + (done ? DONE_EVENT : '')
  const firstTokenMs = MS_PER_TICK /* 流式：第一条 delta 到达就能开始渲染 */
  const allMs = TOTAL_EVENTS * MS_PER_TICK

  const split = useMemo(() => byteSplitDemo('请用一句话解释什么是闭包', cutChars), [cutChars])

  /* C) messages 数组随工具调用轮次长大 */
  const messagesAt = [
    '[\n  { "role": "system", "content": "你是助手" },\n  { "role": "user", "content": "北京现在多少度？" },\n  { "role": "user", "content": "可用工具: get_weather(city)" }\n]',
    '[  ...上面全部,\n  { "role": "assistant", "content": null,\n    "tool_calls": [{ "name": "get_weather",\n                  "arguments": "{\\"city\\":\\"北京\\"}" }] }\n]  ← finish_reason: "tool_calls"，本轮没有答案',
    '[  ...上面全部,\n  { "role": "tool", "tool_call_id": "call_1",\n    "content": "{\\"temperature\\":26,\\"unit\\":\\"C\\"}" }\n]  ← 工具结果由你的代码写入，第二次请求（再次计费）',
    '[  ...上面全部,\n  { "role": "assistant", "content": "北京现在 26°C，晴。" }\n]  ← 模型把工具数值写成自然语言',
  ]

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>④ 流式回传与工具往返 · 前端接手的地方</h2>
        <p className="desc">
          模型那边算完一个 token 就推一条，<b>前端的活是让"能读"尽量早发生</b>：
          边收边解析、残缺字节留 buffer、跟随滚动、随时能中断。下面先跑打字机，
          再看一个真实会踩的坑（UTF-8 被切在 chunk 边界），最后跑工具调用的四轮往返。
        </p>
      </div>

      {/* ---------- A) 流式打字机 ---------- */}
      <section className="lm-card">
        <h4>⌨️ A · SSE 流式 vs 一次性返回<span className="lm-tag">同一份回答，两种体验</span></h4>

        <div className="lm-chips">
          <button className={playing ? 'lm-chip' : 'lm-chip on'} onClick={play}>
            {playing ? '⏸ 暂停接收' : done ? '▶ 重新发起请求' : '▶ 发起请求'}
          </button>
          <button className="lm-chip" onClick={stop}>⏹ 用户点「停止生成」（AbortController）</button>
          <button className="lm-chip" onClick={reset}>重置</button>
          <button
            className={nonStreaming ? 'lm-chip on' : 'lm-chip'}
            onClick={() => { setNonStreaming(!nonStreaming); reset() }}
          >
            {nonStreaming ? '❌ 已切到非流式（等全部生成完）' : '✅ 当前：流式 stream:true'}
          </button>
        </div>

        <div className="lm-streambar">
          <div className="lm-streambar-fill" style={{ width: (revealed / TOTAL_EVENTS) * 100 + '%' }} />
          <span>
            已到达 {revealed} / {TOTAL_EVENTS} 条 event ·{' '}
            {playing ? '正在接收…' : done ? '流已结束（收到 [DONE]）' : revealed === 0 ? '未开始' : '已中断'}
          </span>
        </div>

        <div className="lm-vs lm-vs-stream">
          <div className="lm-vs-col">
            <div className="lm-vs-head">📜 网络层看到的原始 SSE 报文</div>
            <pre className="code lm-scroll">{rawLog || '（点"发起请求"开始接收）'}</pre>
          </div>
          <div className="lm-vs-col">
            <div className="lm-vs-head">👀 用户看到的（state 累加 + 增量渲染）</div>
            <div className="lm-answer">
              {nonStreaming
                ? done
                  ? arrivedText
                  : <span className="lm-empty">⏳ 白屏等待中…（服务端要到全部 token 生成完才返回 JSON，约 {allMs} ms）</span>
                : arrivedText || <span className="lm-empty">（还没有文字上屏）</span>}
              {(!done || playing) && !nonStreaming && <span className="lm-caret">▍</span>}
            </div>
          </div>
        </div>

        <div className="lm-kpi-grid">
          <div><span className="lm-k">用户多久能看到第一个字</span><b>{nonStreaming ? `${allMs} ms` : `${firstTokenMs} ms`} {!nonStreaming && ' ✅'}</b></div>
          <div><span className="lm-k">多久能看完全部</span><b>{allMs} ms（相同）</b></div>
          <div><span className="lm-k">总 token 数 / 计费</span><b>{DELTAS.length} 个 delta，两种模式一模一样</b></div>
          <div><span className="lm-k">中断能省什么</span><b>{revealed > 0 && !done ? `已生成 ${revealed - 1} 段，剩余部分不再产生（也不再计费）` : '剩余 token 不再生成'}</b></div>
        </div>
        <p className="lm-note">
          <b>关键区分</b>：流式<b>不减少总时间、不减少费用</b>，它只是把「等待」换成「可阅读」——
          首字延迟（TTFT）从"全部生成完"提前到"第一个 token 出来"。
          面试问到"你怎么优化 AI 应用的体验"，答的就是<b>降 TTFT（少塞上下文、吃前缀缓存）+ 尽早渲染 + 可中断</b>。
        </p>
      </section>

      {/* ---------- B) UTF-8 边界坑 ---------- */}
      <section className="lm-card">
        <h4>🧱 B · 一个汉字被切成两半会怎样<span className="lm-tag">TextDecoder 真跑</span></h4>
        <p className="lm-lead">
          ReadableStream 给你的 chunk 是<b>字节</b>，边界不认识你的字符。一个汉字在 UTF-8 里占 3 字节，
          完全可能被切在第 2 字节上。拖动滑杆选择"切在第几个字之后"，看两种解码结果：
        </p>
        <div className="lm-slider">
          <div className="lm-slider-head">
            <span>切分位置</span>
            <b>第 {cutChars} 个字符之后（字节偏移 {split.cut} / {split.totalBytes}）</b>
          </div>
          <input type="range" min="1" max="10" step="1" value={cutChars} onChange={(e) => setCutChars(Number(e.target.value))} />
          <div className="lm-slider-scale"><span>开头</span><span>切在汉字中间</span></div>
        </div>
        <p className="lm-hex">
          前半片末尾字节：<code>{split.headHex}</code> · 后半片起始字节：<code>{split.tailHex}</code>
          {' '}（<code>e9 97 ad</code> 这类三字节序列被拦腰截断）
        </p>
        <div className="lm-vs">
          <div className="lm-vs-col lm-v-bad">
            <div className="lm-vs-head">❌ 每片各自 decode</div>
            <p className="lm-decode">{markBroken(split.naive)}</p>
            <p className="lm-vs-verdict">出现 {split.broken} 个替换字符 </p>
          </div>
          <div className="lm-vs-col lm-v-ok">
            <div className="lm-vs-head">✅ 复用 decoder + stream:true</div>
            <p className="lm-decode">{split.streamed}</p>
            <p className="lm-vs-verdict">残缺字节留到下一片，中文完整</p>
          </div>
        </div>
        <pre className="code">{`const reader = res.body.getReader()
const decoder = new TextDecoder()   // 同一个实例，别每次 new！
let buffer = ''

for (;;) {
  const { value, done } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })  // ← 残缺字节它自己留着
  const events = buffer.split('\\n\\n')          // 再按 SSE 事件边界切
  buffer = events.pop()                        // 尾巴可能是半条事件，下一轮再拼
  for (const ev of events) {
    if (!ev.startsWith('data: ')) continue
    const payload = ev.slice(6).trim()
    if (payload === '[DONE]') { finish(); continue }
    onDelta(JSON.parse(payload).choices[0].delta.content ?? '')
  }
}
decoder.decode()  // 结束时冲刷一次`}</pre>
        <p className="lm-note">
          <b>两层缓冲都要做</b>：字节层（多字节字符跨 chunk）+ 事件层（<code>\n\n</code> 分隔的 SSE 事件跨 chunk）。
          少写一层就会出现"偶尔乱码/偶尔丢字"这种最难复现的线上 bug。
        </p>
      </section>

      {/* ---------- C) function calling ---------- */}
      <section className="lm-card">
        <h4>🛠️ C · function calling：模型只会"说想调工具"，执行的是你</h4>
        <div className="lm-chips">
          {TOOL_STEPS.map((s, i) => (
            <button
              key={s.title}
              className={i === toolStep ? 'lm-chip on' : 'lm-chip'}
              onClick={() => setToolStep(i)}
            >
              第 {i + 1} 轮 · {s.role}
            </button>
          ))}
        </div>
        <div className="lm-stage-inline">
          <div className="lm-stage-badge">{toolStep + 1}</div>
          <div>
            <div className="lm-stage-title">{TOOL_STEPS[toolStep].title}</div>
            <p className="lm-stage-text">{TOOL_STEPS[toolStep].text}</p>
          </div>
        </div>
        <pre className="code lm-scroll lm-messages">{messagesAt[toolStep]}</pre>
        <p className="lm-note">
          <b>RAG / MCP / Agent 都是这套壳子</b>：模型生成"要调什么工具 + 参数" → 你的代码真的去执行 →
          结果作为新消息回注上下文 → 再让模型生成一次。所以工具结果的<b>真实性由你的后端负责</b>，
          模型只负责把它说成自然人话；而每一轮都把历史重传，<b>轮次越多越贵越慢</b>。
        </p>
      </section>

      <p className="tip">
        💡 把第 7、8 步说圆就是前端岗的加分项：<b>SSE 边收边渲染（ReadableStream + TextDecoder + 事件缓冲）、
        首字延迟优先优化、可中断、增量 Markdown 注意 XSS、密钥走后端代理</b>。
        追问"为什么用 SSE 不用 WebSocket？"—— 单向推送场景 SSE 更轻：走 HTTP、自动重连（<code>Last-Event-ID</code>）、
        不需要额外协议升级；只有要双向实时（协同、语音对话）才上 WebSocket。
      </p>
    </div>
  )
}
