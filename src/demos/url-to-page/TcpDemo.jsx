import { useState, useEffect } from 'react'

/* =========================================================
 * ③ TCP 三次握手 + 四次挥手（时序图）
 * ---------------------------------------------------------
 * 两条生命线（客户端 / 服务器），报文一条条飞过去并累积，
 * 每步同步更新两端连接状态。可切换"建立连接/断开连接"。
 * ========================================================= */

const HANDSHAKE = [
  {
    dir: 'c2s',
    label: 'SYN',
    detail: 'seq=x',
    note: '客户端发起连接："我想和你建立连接，我的初始序号是 x。" 发送后客户端进入 SYN_SENT。',
    cState: 'SYN_SENT',
    sState: 'LISTEN',
  },
  {
    dir: 's2c',
    label: 'SYN + ACK',
    detail: 'seq=y, ack=x+1',
    note: '服务器同意并确认："好，我的初始序号是 y，确认收到你的 x，期待你的 x+1。" 服务器进入 SYN_RCVD。',
    cState: 'SYN_SENT',
    sState: 'SYN_RCVD',
  },
  {
    dir: 'c2s',
    label: 'ACK',
    detail: 'ack=y+1',
    note: '客户端再确认："收到你的 y，期待 y+1。" 双方都进入 ESTABLISHED，连接建成，可以传数据了。',
    cState: 'ESTABLISHED',
    sState: 'ESTABLISHED',
  },
]

const WAVE = [
  {
    dir: 'c2s',
    label: 'FIN',
    detail: 'seq=u',
    note: '客户端数据发完，请求断开："我没东西要发了。" 客户端进入 FIN_WAIT_1。',
    cState: 'FIN_WAIT_1',
    sState: 'CLOSE_WAIT',
  },
  {
    dir: 's2c',
    label: 'ACK',
    detail: 'ack=u+1',
    note: '服务器确认："知道了，但我可能还有数据没发完。" 客户端收到后进入 FIN_WAIT_2（半关闭）。',
    cState: 'FIN_WAIT_2',
    sState: 'CLOSE_WAIT',
  },
  {
    dir: 's2c',
    label: 'FIN',
    detail: 'seq=w',
    note: '服务器数据也发完了，请求断开："我也没了，关吧。" 服务器进入 LAST_ACK。',
    cState: 'FIN_WAIT_2',
    sState: 'LAST_ACK',
  },
  {
    dir: 'c2s',
    label: 'ACK',
    detail: 'ack=w+1',
    note: '客户端确认，进入 TIME_WAIT 等 2MSL（防最后的 ACK 丢失、让旧报文消散）后才 CLOSED；服务器收到即 CLOSED。',
    cState: 'TIME_WAIT',
    sState: 'CLOSED',
  },
]

const MODES = {
  handshake: { msgs: HANDSHAKE, init: { c: 'CLOSED', s: 'LISTEN' }, title: '三次握手 · 建立连接' },
  wave: { msgs: WAVE, init: { c: 'ESTABLISHED', s: 'ESTABLISHED' }, title: '四次挥手 · 断开连接' },
}

const STEP_MS = 1700

export default function TcpDemo() {
  const [mode, setMode] = useState('handshake')
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)

  const { msgs, init, title } = MODES[mode]

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      const next = step + 1
      setStep(next)
      if (next >= msgs.length - 1) setPlaying(false)
    }, STEP_MS)
    return () => clearTimeout(t)
  }, [playing, step, msgs])

  const switchMode = (m) => {
    setMode(m)
    setStep(-1)
    setPlaying(false)
  }
  const play = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (step >= msgs.length - 1) setStep(-1)
    setPlaying(true)
  }
  const reset = () => {
    setPlaying(false)
    setStep(-1)
  }

  const shown = step < 0 ? init : { c: msgs[step].cState, s: msgs[step].sState }
  const done = step >= msgs.length - 1
  const playLabel = playing ? '⏸ 暂停' : step < 0 ? '▶ 开始' : done ? '↻ 再来一次' : '继续'

  return (
    <div>
      <div className="demo-header">
        <h2>③ TCP 三次握手 / 四次挥手</h2>
        <p className="demo-sub">
          TCP 是<b>可靠</b>传输，靠"握手"确认双方收发能力都正常才传数据，靠"挥手"优雅关闭。
          切换下面两种模式，点"开始"看报文如何在<b>客户端 ↔ 服务器</b>之间逐条飞行，两端状态如何变化。
        </p>
      </div>

      <div className="demo-box">
        <div className="up-tcp-mode">
          {Object.keys(MODES).map((m) => (
            <button
              key={m}
              className={'up-tcp-mode-btn' + (m === mode ? ' on' : '')}
              onClick={() => switchMode(m)}
            >
              {MODES[m].title}
            </button>
          ))}
        </div>

        <div className="up-tcp-diagram">
          {/* 两端 actor + 实时状态 */}
          <div className="up-tcp-head">
            <div className="up-tcp-actor up-tcp-client">
              <span className="up-tcp-actor-name">🧑‍💻 客户端（浏览器）</span>
              <span className="up-tcp-state">{shown.c}</span>
            </div>
            <div className="up-tcp-actor up-tcp-server">
              <span className="up-tcp-actor-name">🖥️ 服务器</span>
              <span className="up-tcp-state">{shown.s}</span>
            </div>
          </div>

          {/* 时序区：两条生命线 + 累积的报文 */}
          <div className="up-tcp-body">
            <span className="up-tcp-lifeline up-tcp-lifeline-l" />
            <span className="up-tcp-lifeline up-tcp-lifeline-r" />
            {msgs.slice(0, step + 1).map((m, i) => (
              <div
                key={i}
                className={'up-tcp-msg up-tcp-' + m.dir + (i === step ? ' up-tcp-msg-active' : '')}
              >
                <span className="up-tcp-msg-label">
                  <b>{m.label}</b> <code>{m.detail}</code>
                </span>
                <span className="up-tcp-msg-line" />
              </div>
            ))}
            {step < 0 && <div className="up-tcp-idle">点"开始"，看{title}怎么走</div>}
          </div>
        </div>

        <div className="up-tcp-note">
          {step < 0
            ? `准备演示：${title}`
            : done
              ? `✅ ${title}完成。${mode === 'handshake' ? '连接已建立，可以发 HTTP 请求了（回到 ① 全流程第 5 步）。' : '连接已优雅关闭。'}`
              : `第 ${step + 1} 步：${msgs[step].note}`}
        </div>

        <div className="btn-row">
          <button onClick={play}>{playLabel}</button>
          <button className="ghost" onClick={reset}>重置</button>
        </div>
      </div>

      <p className="tip">
        💡 <b>为什么握手是三次？</b>为了确认"双方都能收也能发"：一次证明客户端能发、二次证明服务器能收能发、三次证明客户端能收。
        两次不够（服务器无法确认客户端能收），还能防止已失效的历史连接请求突然又到达而错误建连。
        <br />
        💡 <b>为什么挥手是四次？</b>因为 TCP 是全双工，两个方向要分别关闭；服务器收到 FIN 后可能还有数据没发完，
        所以它的 ACK 和 FIN 要分开发（中间隔着一段 CLOSE_WAIT），比握手多一次。
      </p>
    </div>
  )
}
