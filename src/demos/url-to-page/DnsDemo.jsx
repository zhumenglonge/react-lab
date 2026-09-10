import { useState, useEffect } from 'react'

/* =========================================================
 * ② DNS 解析：域名 → IP 的逐级查找链
 * ---------------------------------------------------------
 * 强调两个必考概念：递归查询（客户端↔本地解析器）与
 * 迭代查询（本地解析器↔根/顶级/权威）。节点按类型着色。
 * ========================================================= */

const CHAIN = [
  {
    icon: '🌐',
    name: '浏览器 DNS 缓存',
    type: 'cache',
    desc: '浏览器自己缓存最近解析过的域名，命中就直接用，最省时间。',
  },
  {
    icon: '💻',
    name: '操作系统缓存 / hosts',
    type: 'cache',
    desc: '没命中就查系统 DNS 缓存和 hosts 文件（本机可手动配置域名→IP 映射）。',
  },
  {
    icon: '📶',
    name: '路由器缓存',
    type: 'cache',
    desc: '再问局域网路由器，它通常也缓存了最近解析过的结果。',
  },
  {
    icon: '🏢',
    name: 'ISP 递归解析器',
    type: 'recursive',
    desc: '本机都没有，就交给网络服务商（ISP）的本地 DNS 服务器。它是"递归解析器"——你只问它一次，它替你把后面的活全干了，自己也有缓存。',
  },
  {
    icon: '🌍',
    name: '根域名服务器 (.)',
    type: 'iterative',
    desc: '递归解析器先问根服务器。根不知道具体 IP，但会告诉它："去问 .com 的顶级域服务器，地址在这儿。"',
  },
  {
    icon: '🏷️',
    name: '顶级域服务器 (.com)',
    type: 'iterative',
    desc: '接着问 .com 顶级域服务器，它回复："example.com 的权威服务器地址在这儿。"',
  },
  {
    icon: '🎯',
    name: '权威服务器 (example.com)',
    type: 'iterative',
    desc: '最后问 example.com 的权威域名服务器，它保管着 www 的真实记录，返回 A 记录（IPv4）或 AAAA 记录（IPv6）。',
  },
]

const TYPE_LABEL = { cache: '查缓存', recursive: '递归查询', iterative: '迭代查询' }
const RESULT_IP = '93.184.216.34'
const STEP_MS = 1600

export default function DnsDemo() {
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      const next = step + 1
      setStep(next)
      if (next >= CHAIN.length - 1) setPlaying(false)
    }, STEP_MS)
    return () => clearTimeout(t)
  }, [playing, step])

  const play = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (step >= CHAIN.length - 1) setStep(-1)
    setPlaying(true)
  }
  const reset = () => {
    setPlaying(false)
    setStep(-1)
  }
  const jump = (i) => {
    setPlaying(false)
    setStep(i)
  }

  const done = step >= CHAIN.length - 1
  const playLabel = playing ? '⏸ 暂停' : step < 0 ? '▶ 开始解析' : done ? '↻ 再来一次' : '继续'

  return (
    <div>
      <div className="demo-header">
        <h2>② DNS 解析 · 域名怎么变成 IP</h2>
        <p className="demo-sub">
          网络层只认 IP，不认 <code>www.example.com</code>。DNS 就是互联网的"电话簿"，把域名翻译成 IP。
          点"开始解析"，看它如何<b>逐级查找</b>——先查一堆缓存，都没命中再由递归解析器去问根 / 顶级 / 权威服务器。
        </p>
      </div>

      <div className="demo-box">
        <div className="up-dns-query">
          <span className="up-dns-q-label">要解析的域名</span>
          <code className="up-dns-domain">www.example.com</code>
          <span className="up-dns-q-arrow">→</span>
          <code className={'up-dns-ip' + (done ? ' up-dns-ip-on' : '')}>{done ? RESULT_IP : '? . ? . ? . ?'}</code>
        </div>

        <div className="up-dns-chain">
          {CHAIN.map((n, i) => {
            const state = i === step ? ' up-dns-active' : i < step ? ' up-dns-passed' : ''
            return (
              <div key={i} className={'up-dns-node' + state} onClick={() => jump(i)}>
                <div className="up-dns-icon">{i < step ? '✓' : n.icon}</div>
                <div className="up-dns-text">
                  <div className="up-dns-name">
                    {n.name}
                    <span className={'up-dns-type up-dns-type-' + n.type}>{TYPE_LABEL[n.type]}</span>
                  </div>
                  {i <= step && <div className="up-dns-desc">{n.desc}</div>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="up-dns-note">
          {step < 0
            ? '点"开始解析"，看一次完整的 DNS 查询要经过哪些环节'
            : done
              ? `✅ 解析完成：www.example.com → ${RESULT_IP}。拿到 IP 就能建立 TCP 连接了（去 ③ tab）。`
              : `正在查询：${CHAIN[step].name}`}
        </div>

        <div className="btn-row">
          <button onClick={play}>{playLabel}</button>
          <button className="ghost" onClick={reset}>重置</button>
        </div>
      </div>

      <p className="tip">
        💡 两个必考概念：<b>递归查询</b>——你只问本地解析器一次，它负责把最终答案给你（客户端 ↔ 解析器）；
        <b>迭代查询</b>——本地解析器分别去问根 / 顶级 / 权威，每一级只告诉它"下一步该问谁"（解析器 ↔ 各级服务器）。
        另外，解析结果会被<b>多级缓存</b>，所以通常只有第一次慢，之后基本瞬间命中。
      </p>
    </div>
  )
}
