import { useState } from 'react'
import { TRAIN_STAGES, COMPARE_ROWS, TRAPS, TOKEN_TRICKS } from './shared.js'

/* =========================================================
 * ⑤ 本质与陷阱：把"背后发生了什么"讲到能接住追问
 * ---------------------------------------------------------
 * 四个视角切换：
 *   A) 训练 vs 推理 —— 很多人分不清"学的时候"和"答的时候"
 *   B) 无状态与 KV Cache —— 为什么每轮要重传上下文、为什么顺序影响成本
 *   C) 规模与显存速算 —— 参数量/精度/上下文 → 需要多少显存（量级估算）
 *   D) 八个必踩陷阱 —— 幻觉、可复现、窗口、计费、断流、注入、密钥、token
 * ========================================================= */

const VIEWS = [
  { key: 'train', label: 'A · 训练 vs 推理' },
  { key: 'state', label: 'B · 无状态与 KV Cache' },
  { key: 'size', label: 'C · 规模与显存速算' },
  { key: 'trap', label: 'D · 八个陷阱' },
]

/* 参数量 → 结构（层数/隐藏维度，取公开模型的典型值，只为量级估算） */
const SIZES = [
  { p: 7, layers: 32, hidden: 4096, label: '7B（可本地跑）' },
  { p: 13, layers: 40, hidden: 5120, label: '13B' },
  { p: 70, layers: 80, hidden: 8192, label: '70B（要多卡）' },
]
const PRECISIONS = [
  { k: 'fp16', bytes: 2, label: 'FP16 / BF16' },
  { k: 'int8', bytes: 1, label: 'INT8 量化' },
  { k: 'int4', bytes: 0.5, label: 'INT4 量化' },
]
const SEQ_LENS = [2048, 8192, 32768, 128000]
const GPUS = [
  { name: '单张 4090', vram: 24 },
  { name: '单张 A100 80G', vram: 80 },
]

const GB = 1e9

export default function EssenceDemo() {
  const [view, setView] = useState('train')
  const [sizeKey, setSizeKey] = useState(7)
  const [precKey, setPrecKey] = useState('fp16')
  const [seq, setSeq] = useState(8192)

  const size = SIZES.find((s) => s.p === sizeKey)
  const prec = PRECISIONS.find((p) => p.k === precKey)
  const weightGB = size.p * prec.bytes
  /* KV Cache ≈ 2(K+V) × 层数 × 隐藏维度 × 序列长度 × 每元素字节（未上优化） */
  const kvGB = (2 * size.layers * size.hidden * seq * 2) / GB
  const overheadGB = weightGB * 0.15 /* 激活/显存碎片等运行时开销，量级估算 */
  const needGB = weightGB + kvGB + overheadGB
  const trainGB = size.p * 16 /* 训练：权重+梯度+优化器状态，Adam 典型 ~16 字节/参数 */

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h2>⑤ 本质与陷阱 · 面试官真正想追的东西</h2>
        <p className="desc">
          把八步流程讲顺只是及格线。这一栏补的是"能接住追问"的那层：
          <b>学到的知识在参数里、回答时不查库、推理阶段不学习、上下文每轮重传</b>。
        </p>
      </div>

      <div className="lm-chips">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            className={v.key === view ? 'lm-chip on' : 'lm-chip'}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ---------- A) 训练 vs 推理 ---------- */}
      {view === 'train' && (
        <>
          <section className="lm-card">
            <h4>🧪 模型先被"训"出来，才被你"用"<span className="lm-tag">三段式训练</span></h4>
            {TRAIN_STAGES.map((s, i) => (
              <div key={s.title} className="lm-train-row">
                <div className="lm-train-head">{s.icon} {i + 1}. {s.title}</div>
                <p className="lm-lead">{s.text}</p>
                <p className="lm-trap">⚠️ {s.trap}</p>
              </div>
            ))}
          </section>

          <section className="lm-card">
            <h4>🔬 训练 / 推理 逐项对比<span className="lm-tag">面试最爱问"你的调优是发生在哪个阶段"</span></h4>
            <table className="lm-compare">
              <thead>
                <tr><th>维度</th><th>训练阶段</th><th>推理阶段（你问问题时）</th></tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((r) => (
                  <tr key={r.k}>
                    <td>{r.k}</td><td>{r.pre}</td><td>{r.inf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="lm-note">
              <b>所以"多问几次它就学会我习惯"是错的</b>。想让它长期记住，只有三条路：
              把内容每轮塞进上下文（贵、有上限）、外挂检索/记忆系统（RAG + 向量库）、
              或者攒数据集重新微调（慢、要训练成本）。
            </p>
          </section>
        </>
      )}

      {/* ---------- B) 无状态与 KV Cache ---------- */}
      {view === 'state' && (
        <>
          <section className="lm-card">
            <h4>🗃️ 模型是无状态的：所谓"上下文"就是每轮重传</h4>
            <pre className="code">{`第 1 轮请求  messages = [system, user1]                     → 计费 prompt=A
第 2 轮请求  messages = [system, user1, asst1, user2]        → 计费 prompt=A+B
第 3 轮请求  messages = [system, user1, asst1, user2, asst2, user3] → 计费 prompt=A+B+C
（服务端不会替你"记得"上一轮，除非它显式存 conversation 并再传）`}</pre>
            <p className="lm-lead">
              这也解释了窗口上限：<b>对话越长越贵越慢</b>，超过窗口就只能砍。
              厂商的 <code>conversation_id</code> / 缓存类参数只是把"重传"这件事挪到服务端，
              并不是给模型装了记忆。
            </p>
          </section>

          <section className="lm-card">
            <h4>⚡ KV Cache：一次生成内的加速，不是跨请求的记忆</h4>
            <div className="lm-vs">
              <div className="lm-vs-col lm-v-ok">
                <div className="lm-vs-head">✅ KV Cache 做的事</div>
                <p>
                  同一次生成里，历史 token 每层的 Key/Value 算过一次就存下来，
                  新 token 只需要算自己那一行 → 逐 token 输出的成本从 O(n²) 降到近似 O(n)。
                  这是"打字机能一秒蹦几十个字"的原因。
                </p>
              </div>
              <div className="lm-vs-col lm-v-bad">
                <div className="lm-vs-head">❌ KV Cache 不做的事</div>
                <p>
                  它不跨请求、不跨用户（换一次连接就没了），也不会让你少传一次上下文。
                  想复用<b>固定前缀</b>要靠服务端的 prompt/prefix caching ——
                  所以把 system prompt、工具声明、few-shot 例子放<b>最前面</b>，把变的部分放后面。
                </p>
              </div>
            </div>
            <p className="lm-trap">
              ⚠️ 代价：KV Cache 要占显存，且随「并发 × 上下文长度」增长。这就是长上下文推理很贵、
              以及很多服务会把长对话路由到更大机型的原因。
            </p>
          </section>

          <section className="lm-card">
            <h4>💰 省 token 的五个实操（高频追问：你怎么控制成本）</h4>
            <table className="lm-compare">
              <thead><tr><th>做法</th><th>为什么有效</th></tr></thead>
              <tbody>
                {TOKEN_TRICKS.map((t) => (
                  <tr key={t.k}><td>{t.k}</td><td>{t.v}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {/* ---------- C) 规模与显存 ---------- */}
      {view === 'size' && (
        <section className="lm-card">
          <h4>📐 显存速算台<span className="lm-tag">量级估算，用于回答"能不能本地跑"</span></h4>
          <div className="lm-chips">
            {SIZES.map((s) => (
              <button key={s.p} className={s.p === sizeKey ? 'lm-chip on' : 'lm-chip'} onClick={() => setSizeKey(s.p)}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="lm-chips">
            {PRECISIONS.map((p) => (
              <button key={p.k} className={p.k === precKey ? 'lm-chip on' : 'lm-chip'} onClick={() => setPrecKey(p.k)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="lm-chips">
            {SEQ_LENS.map((s) => (
              <button key={s} className={s === seq ? 'lm-chip on' : 'lm-chip'} onClick={() => setSeq(s)}>
                上下文 {s.toLocaleString()} token
              </button>
            ))}
          </div>

          <table className="lm-compare">
            <thead><tr><th>项</th><th>公式</th><th>估算</th></tr></thead>
            <tbody>
              <tr><td>模型权重</td><td><code>参数量 × 每参数字节</code></td><td><b>{weightGB.toFixed(1)} GB</b></td></tr>
              <tr><td>KV Cache</td><td><code>2 × 层数 {size.layers} × 隐藏 {size.hidden} × 序列 {seq.toLocaleString()} × 2B</code></td><td><b>{kvGB.toFixed(1)} GB</b></td></tr>
              <tr><td>运行时开销</td><td><code>权重 × 15%（激活/碎片，估）</code></td><td>{overheadGB.toFixed(1)} GB</td></tr>
              <tr><td>推理合计</td><td><code>上面三项相加</code></td><td><b>{needGB.toFixed(1)} GB</b></td></tr>
              <tr><td>如果还要训练</td><td><code>参数量 × ~16B（权重+梯度+优化器）</code></td><td className="lm-bad">≈ {trainGB.toFixed(0)} GB（得多卡/LoRA）</td></tr>
            </tbody>
          </table>

          <div className={'lm-verdict is-' + (needGB <= GPUS[0].vram ? 'success' : needGB <= GPUS[1].vram ? 'warning' : 'danger')}>
            {needGB <= GPUS[0].vram
              ? `🟢 ${needGB.toFixed(1)} GB → 单张 4090（24GB）能跑推理 ✅`
              : needGB <= GPUS[1].vram
                ? `🟠 ${needGB.toFixed(1)} GB → 单张 4090 装不下 ❌，需要 A100 80G 级或双卡/更短上下文`
                : `🔴 ${needGB.toFixed(1)} GB → 单卡 80G 也紧张 ❌，要靠量化、更短上下文或多卡张量并行`}
          </div>
          <p className="lm-note">
            口径说明：这是<b>数量级估算</b>，真实还受 GQA/MQA（KV 头数减少）、PagedAttention、
            FlashAttention、批大小影响。但面试要的是这句话：
            <b>"7B FP16 大概 14G 权重 + 上下文带来的 KV Cache，长上下文时 KV Cache 能吃掉比权重还多的显存"</b>。
            顺带解释了一个现象：<b>模型越大多卡，单 token 计算越慢</b>，所以秒回的小模型未必是"更聪明"。
          </p>
        </section>
      )}

      {/* ---------- D) 陷阱 ---------- */}
      {view === 'trap' && (
        <section className="lm-card">
          <h4>⚠️ 八个必踩陷阱（答对任意两三个就是加分）</h4>
          <div className="lm-trap-grid">
            {TRAPS.map((t, i) => (
              <div key={t.title} className="lm-trap-card">
                <div className="lm-trap-idx">{String(i + 1).padStart(2, '0')}</div>
                <div className="lm-trap-title">{t.title}</div>
                <p className="lm-trap-detail">{t.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
