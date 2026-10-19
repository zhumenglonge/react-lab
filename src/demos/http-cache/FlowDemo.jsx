import { useState, useEffect, useMemo } from 'react'

/* =========================================================
 * ① 缓存流水线：强缓存 / 协商缓存的决策模拟器
 * ---------------------------------------------------------
 * 交互：调 max-age、已存入时长、服务器内容是否变更、本地是否有副本，
 * 点"发起请求"让决策流水线一步步跑，最终落到
 *   200 (from cache) / 304 Not Modified / 200 全新下载 三种结果之一。
 * 纯函数式：所有分支由当前配置确定性地算出，渲染期无副作用
 * （不放 Date.now()/随机，规避 react-hooks/purity）。
 * ========================================================= */

const STEP_MS = 1500

/* 把秒数格式化成人能读的时间 */
function fmt(sec) {
  if (sec <= 0) return '0s'
  if (sec < 60) return `${sec}s`
  if (sec < 3600) return `${Math.round(sec / 60)}min`
  const h = sec / 3600
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`
}

/* 结果元信息：状态码标签 + 网络开销 + 语义色调 */
const RESULT_META = {
  strong: {
    code: '200 (from cache)',
    tone: 'success',
    req: '0 次请求',
    traffic: '0 流量 · 直接用本地',
    headers:
      '请求：（不发！浏览器自己拍板）\n响应：HTTP/1.1 200 OK (from disk cache)\n       Cache-Control: max-age=3600',
  },
  'not-modified': {
    code: '304 Not Modified',
    tone: 'accent',
    req: '1 次往返',
    traffic: '仅响应头 · 无 body',
    headers:
      '请求：GET /assets/app.js\n       If-None-Match: "a1b2c3"\n响应：HTTP/1.1 304 Not Modified\n       ETag: "a1b2c3"\n（没有响应体，浏览器继续用本地副本）',
  },
  'revalidate-new': {
    code: '200 OK · 内容已变',
    tone: 'warning',
    req: '1 次往返',
    traffic: '完整响应体 · 重新下载',
    headers:
      '请求：GET /assets/app.js\n       If-None-Match: "a1b2c3"\n响应：HTTP/1.1 200 OK\n       ETag: "d4e5f6"   ← 指纹变了\n       Cache-Control: max-age=3600\n\n<新的文件内容…>',
  },
  new: {
    code: '200 OK · 首次下载',
    tone: 'warning',
    req: '1 次往返',
    traffic: '完整响应体 · 存入缓存',
    headers:
      '请求：GET /assets/app.js   （本地无副本）\n响应：HTTP/1.1 200 OK\n       ETag: "a1b2c3"\n       Cache-Control: max-age=3600\n\n<文件内容…>   ← 同时写入本地缓存',
  },
}

export default function FlowDemo() {
  const [hasCache, setHasCache] = useState(true)
  const [maxAge, setMaxAge] = useState(3600)
  const [elapsed, setElapsed] = useState(120)
  const [serverChanged, setServerChanged] = useState(false)

  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  /* 根据当前配置，确定性地算出流水线阶段与最终结果 */
  const { stages, result } = useMemo(() => {
    const fresh = elapsed < maxAge && maxAge > 0
    const list = [
      {
        icon: '🗂️',
        title: '第 1 步 · 请求资源，先翻本地缓存',
        text: hasCache
          ? `本地有一份副本：${fmt(elapsed)}前存入，Cache-Control: max-age=${fmt(maxAge)}。`
          : '本地没有该资源的缓存副本（首次访问这个 URL）。',
      },
    ]
    let res
    if (!hasCache) {
      list.push({
        icon: '🌐',
        title: '第 2 步 · 缓存未命中，走网络全新请求',
        text: '没有副本可用，直接向服务器发起请求，下载完整资源。',
      })
      res = 'new'
    } else if (fresh) {
      res = 'strong'
      list.push({
        icon: '⚡',
        title: '第 2 步 · 强缓存命中：没过期，本地自己拍板',
        text: `距上次存入仅 ${fmt(elapsed)}，还没到 max-age(${fmt(maxAge)})，不用问服务器——不发请求，状态码显示 from disk/memory cache。`,
      })
    } else {
      list.push({
        icon: '⏳',
        title: '第 2 步 · 强缓存过期：不敢自己决定',
        text: `已存入 ${fmt(elapsed)}，超过 max-age(${fmt(maxAge)})，副本"过期"了 → 进入协商缓存。`,
      })
      list.push({
        icon: '📤',
        title: '第 3 步 · 发送协商请求：带着"指纹"去问服务器',
        text: '请求头带上 If-None-Match: <上次 ETag>（和/或 If-Modified-Since），问服务器"这份还能用吗"。',
      })
      if (!serverChanged) {
        res = 'not-modified'
        list.push({
          icon: '🔁',
          title: '第 4 步 · 304 Not Modified：服务器说还能用',
          text: '资源内容没变，服务器只回 304（除头部外没有 body），浏览器继续用本地副本——省流量，但省不掉一次往返。',
        })
      } else {
        res = 'revalidate-new'
        list.push({
          icon: '🆕',
          title: '第 4 步 · 200 OK：内容变了，重新下载',
          text: '服务器发现 ETag 对不上（内容已变），返回 200 + 新内容 + 新 ETag，并刷新本地缓存。',
        })
      }
    }
    return { stages: list, result: res }
  }, [hasCache, maxAge, elapsed, serverChanged])

  /* 配置变化时，重置流水线，避免停留在旧结果（在各控件 onChange 里同步重置，不放 effect） */
  const setConfig = (apply) => (e) => {
    setPlaying(false)
    setStep(0)
    apply(e)
  }

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      const next = step + 1
      if (next >= stages.length - 1) {
        setStep(stages.length - 1)
        setPlaying(false)
      } else {
        setStep(next)
      }
    }, STEP_MS)
    return () => clearTimeout(t)
  }, [playing, step, stages.length])

  const play = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (step >= stages.length - 1) setStep(0)
    setPlaying(true)
  }
  const next = () => { setPlaying(false); setStep((s) => Math.min(s + 1, stages.length - 1)) }
  const prev = () => { setPlaying(false); setStep((s) => Math.max(s - 1, 0)) }
  const reset = () => { setPlaying(false); setStep(0) }
  const jump = (i) => { setPlaying(false); setStep(i) }

  const landed = step >= stages.length - 1
  const meta = RESULT_META[result]
  const isFresh = maxAge > 0 && elapsed < maxAge
  const willNegotiate = hasCache && !isFresh

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>① 缓存流水线 · 谁来拍板用哪份资源？</h2>
        <p className="desc">
          浏览器请求一个资源时，缓存分<b>两层决策</b>：先看<b>强缓存</b>（本地自己判断新不新鲜），
          过期了再看<b>协商缓存</b>（拉着服务器一起判断还能不能用）。调下面四个开关，
          点"发起请求"看它落到 <code>200 (from cache)</code> / <code>304</code> / <code>200 全新下载</code> 哪一个。
        </p>
      </div>

      {/* 控制面板 */}
      <div className="hc-panel">
        <div className="hc-ctrl-row">
          <label className="hc-switch">
            <input type="checkbox" checked={hasCache} onChange={setConfig(() => setHasCache(!hasCache))} />
            <span>本地有缓存副本</span>
          </label>
          <label className="hc-switch">
            <input
              type="checkbox"
              checked={serverChanged}
              onChange={setConfig(() => setServerChanged(!serverChanged))}
              disabled={!willNegotiate}
            />
            <span>服务器内容已变更（ETag 对不上）</span>
          </label>
        </div>

        <div className="hc-slider">
          <div className="hc-slider-head">
            <span>Cache-Control: max-age</span>
            <b>{fmt(maxAge)}</b>
          </div>
          <input
            type="range" min="0" max="7200" step="60"
            value={maxAge}
            onChange={setConfig((e) => setMaxAge(Number(e.target.value)))}
          />
          <div className="hc-slider-scale"><span>0（立即过期）</span><span>2h</span></div>
        </div>

        <div className="hc-slider">
          <div className="hc-slider-head">
            <span>副本已存入时长</span>
            <b>{fmt(elapsed)}</b>
          </div>
          <input
            type="range" min="0" max="7200" step="60"
            value={elapsed}
            onChange={setConfig((e) => setElapsed(Number(e.target.value)))}
          />
          <div className="hc-slider-scale"><span>刚存入</span><span>2h 前</span></div>
        </div>

        <div className={'hc-verdict ' + (!hasCache ? 'is-none' : isFresh ? 'is-fresh' : 'is-stale')}>
          {!hasCache
            ? '🚫 无本地副本 → 只能走网络全新下载'
            : isFresh
              ? '🟢 强缓存新鲜：' + fmt(elapsed) + ' < max-age ' + fmt(maxAge) + ' → 直接用本地，不发请求'
              : '🟠 强缓存已过期：' + fmt(elapsed) + ' ≥ max-age ' + fmt(maxAge) + ' → 需回服务器协商'}
        </div>
      </div>

      {/* 流水线 */}
      <div className="hc-timeline">
        {stages.map((s, i) => {
          const state = i === step ? ' hc-stage-active' : i < step ? ' hc-stage-done' : ''
          return (
            <div key={i} className={'hc-stage' + state} onClick={() => jump(i)}>
              <div className="hc-stage-badge">{i < step ? '✓' : s.icon}</div>
              <div className="hc-stage-main">
                <div className="hc-stage-title">{s.title}</div>
                {i === step && <p className="hc-stage-text">{s.text}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* 控制条 */}
      <div className="hc-controls">
        <div className="btn-row">
          <button onClick={play}>{playing ? '⏸ 暂停' : '▶ 发起请求'}</button>
          <button className="ghost" onClick={prev} disabled={step === 0}>← 上一步</button>
          <button className="ghost" onClick={next} disabled={step >= stages.length - 1}>下一步 →</button>
          <button className="ghost" onClick={reset}>重置</button>
        </div>
        <span className="hc-progress">第 {step + 1} / {stages.length} 步</span>
      </div>

      {/* 结果卡 */}
      {landed && (
        <div className={'hc-result hc-result-' + meta.tone}>
          <div className="hc-result-head">
            <span className="hc-result-badge">🏁 最终结果</span>
            <span className="hc-result-code">{meta.code}</span>
          </div>
          <div className="hc-result-cost">
            <span>网络请求：<b>{meta.req}</b></span>
            <span>传输开销：<b>{meta.traffic}</b></span>
          </div>
          <pre className="code">{meta.headers}</pre>
        </div>
      )}

      <p className="tip">
        💡 一句话抓住本质：<b>强缓存是"不问服务器、本地自己决定用不用"</b>（靠 <code>Cache-Control</code>），
        <b>协商缓存是"要问服务器还能不能用"</b>（靠 <code>ETag</code>/<code>Last-Modified</code>，命中返 <code>304</code>）。
        强缓存命中最快（零往返），协商缓存省流量但省不掉一次往返。
      </p>
    </div>
  )
}
