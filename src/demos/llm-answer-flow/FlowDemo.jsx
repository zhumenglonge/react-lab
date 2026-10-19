import { useState, useEffect } from 'react'
import { FLOW_STAGES, tokenizeMini, estimateCost } from './shared.js'

/* =========================================================
 * ① 全流程八步：一次「问大模型」从回车到上屏的完整旅程
 * ---------------------------------------------------------
 * 交互：换问法 / 调历史轮数 / 调 temperature / 切流式，点"发起请求"
 * 让 8 个阶段一步步播完，最后给出一张"这次请求的账本"。
 * 纯确定性计算：不放 Date.now()、不放 Math.random（规避 react-hooks/purity）。
 * ========================================================= */

const STEP_MS = 1400

/* 三种典型问法：影响 prompt / completion 的 token 量级 */
const PRESETS = [
  {
    key: 'short',
    label: '「用一句话解释什么是闭包」',
    question: '请用一句话解释什么是闭包',
    completion: 42,
    needTool: false,
    note: '纯参数里的知识，一次前向循环就能答完。',
  },
  {
    key: 'long',
    label: '「（附 3 段源码）这个报错怎么修？」',
    question: '下面是我的代码，报 Maximum update depth exceeded，怎么修',
    completion: 320,
    needTool: false,
    note: '代码非常吃 token：粘贴的上下文把 Prefill 时间直接拉长。',
  },
  {
    key: 'tool',
    label: '「北京现在多少度？」',
    question: '北京现在多少度',
    completion: 60,
    needTool: true,
    note: '参数里没有的事实 → 只能靠工具回注，否则它就编一个给你。',
  },
]

/* 每轮历史平均 token（含往返内容），用于估算上下文膨胀 */
const PER_ROUND = 340
/* 估算吞吐（示意量级）：Prefill 0.2ms/token，Decode 40ms/token，排队+网络 150ms */
const PREFILL_MS_PER_TOKEN = 0.2
const DECODE_MS_PER_TOKEN = 40
const OVERHEAD_MS = 150

export default function FlowDemo() {
  const [presetKey, setPresetKey] = useState('short')
  const [rounds, setRounds] = useState(2)
  const [temperature, setTemperature] = useState(0.7)
  const [stream, setStream] = useState(true)

  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  const preset = PRESETS.find((p) => p.key === presetKey)
  const tok = tokenizeMini(preset.question)

  /* 本次请求的"账本"：全部由当前配置确定性地算出 */
  const promptTokens = tok.tokenCount + 180 + rounds * PER_ROUND + (preset.needTool ? 260 : 0)
  const completionTokens = preset.completion
  const cost = estimateCost(promptTokens, completionTokens)
  const ttft = Math.round(OVERHEAD_MS + promptTokens * PREFILL_MS_PER_TOKEN)
  const total = Math.round(ttft + completionTokens * DECODE_MS_PER_TOKEN)
  const perceive = stream ? ttft : total
  const tempVerdict =
    temperature <= 0.2
      ? { tone: 'success', icon: '🟢', text: `temperature=${temperature.toFixed(1)}：几乎每次同样（贪心边缘），事实题/抽取题用这个` }
      : temperature <= 1.0
        ? { tone: 'accent', icon: '🔵', text: `temperature=${temperature.toFixed(1)}：常规档，稳但仍有一点变化` }
        : temperature <= 1.5
          ? { tone: 'warning', icon: '🟠', text: `temperature=${temperature.toFixed(1)}：分布开始变平，长尾候选（包括"香蕉"）被抽中的机会上升` }
          : { tone: 'danger', icon: '🔴', text: `temperature=${temperature.toFixed(1)}：明显放飞，语法通顺但内容跑偏的概率很高` }

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      const next = step + 1
      if (next >= FLOW_STAGES.length) {
        setStep(FLOW_STAGES.length - 1)
        setPlaying(false)
      } else {
        setStep(next)
      }
    }, STEP_MS)
    return () => clearTimeout(t)
  }, [playing, step])

  /* 配置变更时同步重置播放器（在 onChange 里重置，不放 effect） */
  const applyConfig = (mutate) => (e) => {
    setPlaying(false)
    setStep(0)
    mutate(e)
  }

  const play = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (step >= FLOW_STAGES.length - 1) setStep(0)
    setPlaying(true)
  }
  const prev = () => { setPlaying(false); setStep((s) => Math.max(s - 1, 0)) }
  const next = () => { setPlaying(false); setStep((s) => Math.min(s + 1, FLOW_STAGES.length - 1)) }
  const reset = () => { setPlaying(false); setStep(0) }

  const landed = !playing && step >= FLOW_STAGES.length - 1
  const current = FLOW_STAGES[step]

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>① 一次提问的完整旅程 · 八步流水线</h2>
        <p className="desc">
          大模型回答问题的本质是一条极短的链路：<b>把上下文变成数字 → 一堆矩阵乘法算出"下一个词的概率"
          → 按概率抽一个 → 接回去再算一遍</b>，最后把抽出来的 token 流式推回浏览器。
          换个问法、加几轮历史、调一下 temperature，点「发起请求」看这条链路怎么跑，以及账怎么算。
        </p>
      </div>

      {/* 请求配置面板 */}
      <div className="lm-panel">
        <div className="lm-chips">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              className={p.key === presetKey ? 'lm-chip on' : 'lm-chip'}
              onClick={applyConfig(() => setPresetKey(p.key))}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="lm-slider">
          <div className="lm-slider-head">
            <span>带上多少轮历史对话（模型无状态，每轮都要重传）</span>
            <b>{rounds} 轮 ≈ {rounds * PER_ROUND} token</b>
          </div>
          <input
            type="range" min="0" max="20" step="1"
            value={rounds}
            onChange={applyConfig((e) => setRounds(Number(e.target.value)))}
          />
          <div className="lm-slider-scale"><span>0（单轮）</span><span>20 轮</span></div>
        </div>

        <div className="lm-slider">
          <div className="lm-slider-head">
            <span>采样温度 temperature</span>
            <b>{temperature.toFixed(1)}</b>
          </div>
          <input
            type="range" min="0" max="2" step="0.1"
            value={temperature}
            onChange={applyConfig((e) => setTemperature(Number(e.target.value)))}
          />
          <div className="lm-slider-scale"><span>0 保守（≈贪心）</span><span>2 放飞</span></div>
        </div>

        <div className="lm-ctrl-row">
          <label className="lm-switch">
            <input type="checkbox" checked={stream} onChange={applyConfig(() => setStream(!stream))} />
            <span>stream: true（SSE 流式返回）</span>
          </label>
          {preset.needTool && (
            <span className="lm-warn-pill">⚠️ 这题参数里没有答案，不调工具它只会"编"</span>
          )}
        </div>

        <div className={'lm-verdict is-' + tempVerdict.tone}>
          {tempVerdict.icon} {tempVerdict.text}
        </div>
      </div>

      {/* 流水线 */}
      <div className="lm-timeline">
        {FLOW_STAGES.map((s, i) => {
          const state = i === step ? ' lm-stage-active' : i < step ? ' lm-stage-done' : ''
          return (
            <div
              key={s.title}
              className={'lm-stage' + state}
              onClick={() => { setPlaying(false); setStep(i) }}
            >
              <div className="lm-stage-badge">{i < step ? '✓' : s.icon}</div>
              <div className="lm-stage-main">
                <div className="lm-stage-title">{s.title}</div>
                {i === step && (
                  <>
                    <p className="lm-stage-text">{s.text}</p>
                    <pre className="code lm-stage-code">{s.code}</pre>
                    <p className="lm-stage-kpi">🎛️ {s.kpi}</p>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 控制条 */}
      <div className="lm-controls">
        <div className="btn-row">
          <button onClick={play}>{playing ? '⏸ 暂停' : '▶ 发起请求'}</button>
          <button className="ghost" onClick={prev} disabled={step === 0}>← 上一步</button>
          <button className="ghost" onClick={next} disabled={step >= FLOW_STAGES.length - 1}>下一步 →</button>
          <button className="ghost" onClick={reset}>重置</button>
        </div>
        <span className="lm-progress">第 {step + 1} / {FLOW_STAGES.length} 步 · {current.title}</span>
      </div>

      {/* 账本 */}
      {landed && (
        <div className="lm-result">
          <div className="lm-result-head">
            <span className="lm-result-badge">🧾 这次请求的账本（估算，量级对就行）</span>
            {preset.note}
          </div>
          <div className="lm-kpi-grid">
            <div><span className="lm-k">Prompt token</span><b>{promptTokens.toLocaleString()}</b></div>
            <div><span className="lm-k">Completion token</span><b>{completionTokens.toLocaleString()}</b></div>
            <div><span className="lm-k">首字延迟 TTFT</span><b>{ttft} ms</b></div>
            <div><span className="lm-k">全部跑完</span><b>{total} ms</b></div>
            <div>
              <span className="lm-k">用户实际等到</span>
              <b>{perceive} ms{stream ? '（流式，后面边生成边看）' : '（非流式，全程干等）'}</b>
            </div>
            <div><span className="lm-k">本次费用</span><b>¥ {cost.total.toFixed(5)}</b></div>
          </div>
          <p className="lm-note">
            把 <b>{rounds} 轮历史</b>拉到 20 轮试试：TTFT 会随 prompt 长度线性变差，
            而"回答质量"却可能因为 <b>lost in the middle</b> 反而下降 —— 这就是"上下文不是免费记忆"。
            费用上 <b>output 单价通常是 input 的 3~5 倍</b>，所以截断回答比裁剪历史更省钱。
          </p>
        </div>
      )}

      <p className="tip">
        💡 面试开口第一句就抓这个本质：<b>大模型一次只产出一个 token</b>。
        所谓"回答一个问题"，就是把上下文编码成向量、过 N 层 Transformer 算出词表上的概率分布、
        抽一个词、接回输入再来一遍，直到结束符；全程<b>不查数据库、不更新权重</b>，
        所以它既会"一本正经地胡说"，也不会因为你问了这题就变聪明。
      </p>
    </div>
  )
}
