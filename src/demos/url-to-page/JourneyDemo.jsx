import { useState, useEffect } from 'react'

/* =========================================================
 * ① 全流程：一次导航的完整生命周期，分 8 个阶段
 * ---------------------------------------------------------
 * 交互：假地址栏 + 阶段分组 + 竖直时间线（当前阶段展开细节）。
 * 自动播放引擎与 FlowDemo 同套路：setState 全放在 setTimeout
 * 回调里（异步），避免 effect 体内同步 setState 触发 lint。
 * ========================================================= */

const STAGES = [
  {
    phase: 'prep',
    icon: '⌨️',
    title: 'URL 解析',
    brief: '判断输入的是网址还是搜索词，补协议、做编码',
    detail:
      '浏览器先看这串字符是不是合法 URL：是就补全协议（如 https://）、对中文和特殊字符做百分号编码（percent-encoding）；不是就交给默认搜索引擎拼成搜索 URL。同时检查 HSTS 列表，决定要不要强制走 HTTPS。',
    code: '输入 www.example.com\n→ 补全 https://www.example.com\n→ 特殊字符百分号编码\n→ 交给网络进程去取资源',
  },
  {
    phase: 'prep',
    icon: '🗂️',
    title: '检查缓存',
    brief: '强缓存 / 协商缓存 / Service Worker，命中就不发请求',
    detail:
      '真正发请求前会层层查缓存：Service Worker → 内存缓存(Memory Cache) → 磁盘缓存(Disk Cache)。是否直接用本地副本由强缓存（Cache-Control: max-age / Expires）决定；过期了则用协商缓存（ETag / Last-Modified）问服务器"还能用吗"，能用就返回 304，不必重新下载。',
    code: '强缓存命中 → 200 (from disk cache)，不发请求\n强缓存过期 → 带 If-None-Match 问服务器\n  资源没变 → 304 Not Modified（用本地副本）\n  资源变了 → 200 + 新内容',
  },
  {
    phase: 'net',
    icon: '📍',
    title: 'DNS 解析',
    brief: '把域名 www.example.com 翻译成 IP 地址',
    detail:
      '网络层只认 IP，所以要把域名解析成 IP（如 93.184.216.34）。查找顺序：浏览器 DNS 缓存 → 系统缓存(hosts) → 路由器 → ISP 递归解析器 → 根域名服务器 → 顶级域(.com) → 权威服务器。细节见 ② DNS 解析 tab。',
    code: 'www.example.com\n→ 交给递归解析器代查（它对外迭代）\n→ 根服务器 → .com 顶级域 → example.com 权威\n← 返回 A 记录 93.184.216.34',
  },
  {
    phase: 'net',
    icon: '🤝',
    title: '建立 TCP 连接',
    brief: '三次握手建立可靠连接，HTTPS 再做 TLS 握手',
    detail:
      '拿到 IP 后与服务器建立 TCP 连接——通过"三次握手"确认双方收发能力都正常（SYN → SYN+ACK → ACK）。如果是 HTTPS，还要在此基础上做 TLS 握手：验证证书、协商加密套件、用非对称加密交换出对称密钥，之后数据都用对称加密传输。细节见 ③ TCP 握手 tab。',
    code: '客户端 — SYN(seq=x) —▶ 服务器\n客户端 ◀— SYN+ACK(seq=y, ack=x+1) — 服务器\n客户端 — ACK(ack=y+1) —▶ 服务器   ✅ ESTABLISHED\n(HTTPS 再叠一层 TLS 握手协商密钥)',
  },
  {
    phase: 'net',
    icon: '📤',
    title: '发送 HTTP 请求',
    brief: '构造请求报文：请求行 + 请求头 + 请求体',
    detail:
      '连接建好后，浏览器构造 HTTP 请求报文发出：请求行（方法 GET、路径 /、协议 HTTP/1.1）、请求头（Host、User-Agent、Accept、Cookie、缓存校验字段等）、请求体（GET 通常没有，POST 才带表单/JSON 数据）。',
    code: 'GET / HTTP/1.1\nHost: www.example.com\nUser-Agent: Mozilla/5.0 ...\nAccept: text/html\nCookie: session=abc123',
  },
  {
    phase: 'net',
    icon: '📥',
    title: '服务器处理并返回响应',
    brief: '响应报文：状态行 + 响应头 + 响应体（HTML）',
    detail:
      '服务器（Nginx / 后端服务 / CDN）处理请求：查数据库、渲染页面等，然后返回响应报文——状态行（HTTP/1.1 200 OK）、响应头（Content-Type、Content-Length、Cache-Control、Set-Cookie 等）、响应体（HTML 文档）。常见状态码：200 成功、301/302 重定向、304 缓存、404 未找到、500 服务器错误。',
    code: 'HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nContent-Length: 1256\nCache-Control: max-age=3600\n\n<!DOCTYPE html><html>…</html>',
  },
  {
    phase: 'render',
    icon: '🎨',
    title: '浏览器解析与渲染',
    brief: 'DOM + CSSOM → 渲染树 → 布局 → 绘制 → 合成',
    detail:
      '拿到 HTML 后进入关键渲染路径：解析 HTML 构建 DOM 树，解析 CSS 构建 CSSOM 树，两者合成渲染树（Render Tree，只含可见节点），再布局（Layout / 回流，算位置和大小）、绘制（Paint，填像素）、合成（Composite，多图层合成上屏）。遇到 <script> 会阻塞解析（除非 async/defer）。细节见 ④ 渲染流程 tab。',
    code: 'HTML → DOM 树\nCSS  → CSSOM 树\nDOM + CSSOM → 渲染树\n→ Layout 布局 → Paint 绘制 → Composite 合成',
  },
  {
    phase: 'close',
    icon: '🔚',
    title: '连接结束',
    brief: '四次挥手断开，或 keep-alive 复用连接',
    detail:
      '页面加载完，若不需保持连接就通过 TCP "四次挥手"优雅断开（FIN → ACK → FIN → ACK，主动关闭方还要等 2MSL 的 TIME_WAIT）。现代 HTTP/1.1 默认 keep-alive 复用同一条连接请求后续资源；HTTP/2 更进一步，一条连接上多路复用所有请求。',
    code: 'keep-alive：连接保留，后续资源复用\n关闭时四次挥手：\n客户端 — FIN —▶ 服务器\n客户端 ◀— ACK — 服务器\n客户端 ◀— FIN — 服务器\n客户端 — ACK —▶ 服务器（TIME_WAIT 2MSL）',
  },
]

const PHASES = [
  { key: 'prep', label: '准备阶段' },
  { key: 'net', label: '网络阶段' },
  { key: 'render', label: '渲染阶段' },
  { key: 'close', label: '收尾' },
]

const STEP_MS = 2400

export default function JourneyDemo() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      const next = step + 1
      setStep(next)
      if (next >= STAGES.length - 1) setPlaying(false)
    }, STEP_MS)
    return () => clearTimeout(t)
  }, [playing, step])

  const play = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (step >= STAGES.length - 1) setStep(0)
    setPlaying(true)
  }
  const next = () => {
    setPlaying(false)
    setStep((s) => Math.min(s + 1, STAGES.length - 1))
  }
  const prev = () => {
    setPlaying(false)
    setStep((s) => Math.max(s - 1, 0))
  }
  const reset = () => {
    setPlaying(false)
    setStep(0)
  }
  const jump = (i) => {
    setPlaying(false)
    setStep(i)
  }

  const activePhase = STAGES[step].phase

  return (
    <div>
      <div className="demo-header">
        <h2>① 全流程 · 从输入 URL 到页面展示</h2>
        <p className="demo-sub">
          在地址栏敲下 <code>www.example.com</code> 到页面出现在眼前，中间经历了 <b>8 个阶段</b>。
          点"自动播放"走一遍，或点任意阶段卡片跳到那一步；想看某环节的细节，去对应的 ②③④ tab。
        </p>
      </div>

      {/* 假地址栏 */}
      <div className="up-addrbar">
        <span className="up-addrbar-btns">
          <i /><i /><i />
        </span>
        <div className="up-addrbar-field">
          <span className="up-addrbar-lock">🔒</span>
          <span className="up-addrbar-url">https://www.example.com</span>
          <span className="up-addrbar-caret" />
        </div>
        <span className="up-addrbar-go">↵</span>
      </div>

      {/* 阶段分组 */}
      <div className="up-phases">
        {PHASES.map((p) => (
          <span key={p.key} className={'up-phase' + (p.key === activePhase ? ' up-phase-on' : '')}>
            {p.label}
          </span>
        ))}
      </div>

      {/* 时间线 */}
      <div className="up-timeline">
        {STAGES.map((s, i) => {
          const state = i === step ? ' up-stage-active' : i < step ? ' up-stage-done' : ''
          return (
            <div key={i} className={'up-stage' + state} onClick={() => jump(i)}>
              <div className="up-stage-badge">{i < step ? '✓' : s.icon}</div>
              <div className="up-stage-main">
                <div className="up-stage-head">
                  <span className="up-stage-idx">{i + 1}</span>
                  <span className="up-stage-title">{s.title}</span>
                  <span className="up-stage-brief">{s.brief}</span>
                </div>
                {i === step && (
                  <div className="up-stage-body">
                    <p className="up-stage-detail">{s.detail}</p>
                    <pre className="code">{s.code}</pre>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 控制条 */}
      <div className="up-controls">
        <div className="btn-row">
          <button onClick={play}>{playing ? '⏸ 暂停' : '▶ 自动播放'}</button>
          <button className="ghost" onClick={prev} disabled={step === 0}>← 上一步</button>
          <button className="ghost" onClick={next} disabled={step === STAGES.length - 1}>下一步 →</button>
          <button className="ghost" onClick={reset}>重置</button>
        </div>
        <span className="up-progress">进度 {step + 1} / {STAGES.length}</span>
      </div>

      <p className="tip">
        💡 面试标准答法：<b>先说骨架再说细节</b>——"解析 URL → 查缓存 → DNS 解析 → TCP 三次握手 →
        发 HTTP 请求 → 服务器响应 → 浏览器渲染(DOM/CSSOM/渲染树/布局/绘制) → 断开连接"。
        主线说顺，再挑一两个环节（缓存、握手、渲染）展开，就很稳。
      </p>
    </div>
  )
}
