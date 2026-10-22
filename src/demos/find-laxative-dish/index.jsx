import { useState } from 'react'
import './styles.css'

/* =========================================================
 * 🧠 逻辑推理题：10 盘菜里快速找出泻药（并行 + 二进制编码）
 * ---------------------------------------------------------
 * 考"串行转并行"与"信息编码"。方案 A 用人多硬堆，
 * 方案 B 用二进制编码：4 个人 1 分钟锁定，并附可交互反推解码器。
 * ========================================================= */

const QUESTION =
  '假如你是厨师，有 10 个徒弟，他们各自炒了一个菜，但其中一个徒弟在菜里放了泻药。泻药无色无味，唯一的检查办法是吃下去、一分钟见效。要怎么才能快速找出那盘有泻药的菜？'

// 4 个测试者，分别对应二进制的 4 个 bit（权值 1/2/4/8）
const PEOPLE = [
  { name: 'P1', bit: 1 },
  { name: 'P2', bit: 2 },
  { name: 'P3', bit: 4 },
  { name: 'P4', bit: 8 },
]

// k 个人一轮能覆盖 2^k 道菜；列出常见区间的“菜数 N → 需要人数 k”
const RULES = [
  { range: '2', k: 1, cap: '2' },
  { range: '3 ~ 4', k: 2, cap: '4' },
  { range: '5 ~ 8', k: 3, cap: '8' },
  { range: '9 ~ 16', k: 4, cap: '16' },
  { range: '17 ~ 32', k: 5, cap: '32' },
]

// 10 道菜编号 → 4 位二进制（P4 P3 P2 P1），bit=1 表示对应的人要吃这道
function toBinary(n) {
  return [8, 4, 2, 1].map((v) => (n & v ? '1' : '0')).join('')
}
function eatersOf(n) {
  return PEOPLE.filter((p) => n & p.bit).map((p) => p.name)
}

export default function FindLaxativeDish() {
  // 反推解码器：勾选"哪些人 1 分钟后拉肚子"，拼出菜编号
  const [sick, setSick] = useState({ P1: false, P2: false, P3: false, P4: false })
  const dishNo = PEOPLE.reduce((sum, p) => sum + (sick[p.name] ? p.bit : 0), 0)
  const bits = [8, 4, 2, 1].map((v) => (dishNo & v ? '1' : '0')).join(' ')
  const valid = dishNo >= 1 && dishNo <= 10

  const toggle = (name) => setSick((s) => ({ ...s, [name]: !s[name] }))

  return (
    <div className="lx-page">
      <header className="lx-header">
        <span className="lx-icon">🌶️</span>
        <div>
          <h2>逻辑题：10 盘菜里快速找出泻药</h2>
          <p className="lx-meta">并行 + 二进制编码 · 面试原题 · 记录于 2026-10-22</p>
        </div>
      </header>

      <section className="lx-card">
        <h3>📌 题目原文</h3>
        <blockquote className="lx-question">“{QUESTION}”</blockquote>
      </section>

      <section className="lx-card lx-pitfall">
        <h3>⚠️ 先避开坑：串行 vs 并行</h3>
        <p className="lx-text">
          “一个一个尝”是<b>串行</b>：一个人每次只吃一道、等 1 分钟……最坏要 9~10 轮、花 9~10 分钟。
          题目给的“10 个徒弟”其实是<b>障眼法</b>——真正能提速的是把串行变成<b>并行 + 编码</b>，
          <b>1 分钟</b>就能锁定。
        </p>
      </section>

      <section className="lx-card">
        <h3>🅰️ 方案 A：人多硬堆（直观，1 分钟）</h3>
        <p className="lx-text">
          让 10 个徒弟<b>每人尝一道不同的菜</b>。1 分钟后，谁拉肚子，他尝的那道就是有泻药的菜。
        </p>
        <p className="lx-sub">1 分钟出结果，代价是用了 10 个人、每人只承担 1 种可能。</p>
      </section>

      <section className="lx-card">
        <h3>🅱️ 方案 B：二进制编码（只用 4 人，1 分钟）★加分答法</h3>
        <p className="lx-text">
          把每个人当成一个 <b>bit</b>：一轮测试每人只产生“拉 / 不拉”两种结果，n 个人一次能区分 2ⁿ 道菜。
          10 道菜只需 ⌈log₂10⌉ = 4 个人（2⁴ = 16 ≥ 10）。
        </p>
        <ol className="lx-rules">
          <li>给 10 道菜编号 1~10，写成 4 位二进制（从左到右是 P4 P3 P2 P1）。</li>
          <li>
            让第 i 个人吃下<b>所有“第 i 位是 1”的菜</b>（每道混着尝一小口）。
          </li>
          <li>
            1 分钟后：拉肚子的人记 <b>1</b>、没事的人记 <b>0</b>，从高位到低位拼出的二进制数，就是有泻药那盘菜的<b>编号</b>。
          </li>
        </ol>

        <h4 className="lx-table-title">二进制编号对照表（谁该吃哪道）</h4>
        <table className="lx-table">
          <thead>
            <tr>
              <th>菜编号</th>
              <th>二进制<br />(P4 P3 P2 P1)</th>
              <th>该吃这道菜的人</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <tr key={n}>
                <td className="lx-num">{n}</td>
                <td className="lx-bin">{toBinary(n)}</td>
                <td>{eatersOf(n).join('、')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="lx-sub">
          例：编号 <b>7</b> = <code>0111</code> → 由 P1、P2、P3 同吃。若这三人同时拉肚子，反推 <code>0111</code> = 7，直接锁定。
        </p>
      </section>

      <section className="lx-card">
        <h3>🎛️ 反推解码器（勾出“拉肚子的人”，看是哪盘菜）</h3>
        <div className="lx-toggles">
          {PEOPLE.map((p) => (
            <button
              key={p.name}
              className={`lx-toggle ${sick[p.name] ? 'lx-toggle-on' : ''}`}
              onClick={() => toggle(p.name)}
            >
              {p.name} <span className="lx-toggle-bit">bit={p.bit}</span>
              <span className="lx-toggle-state">{sick[p.name] ? '🤢 拉' : '🙂 没事'}</span>
            </button>
          ))}
        </div>
        <div className="lx-readout">
          <span className="lx-readout-bits">{bits || '0 0 0 0'}</span>
          {valid ? (
            <span className="lx-readout-ok">→ 有泻药的是第 <b>{dishNo}</b> 盘 🎯</span>
          ) : (
            <span className="lx-readout-none">
              {dishNo === 0 ? '→ 没人拉肚子，说明结果还没出 / 无人生病' : '→ 组合超出 1~10，请重勾'}
            </span>
          )}
        </div>
      </section>

      <section className="lx-card">
        <h3>📐 通用规律：二进制几位 = 几个人</h3>
        <p className="lx-text">
          每个人的“拉 / 不拉”正好对应一个 bit 的 1 / 0，于是三个量互相锁死：
        </p>
        <div className="lx-formula">
          <span>人数 = 二进制位数 = k</span>
          <span>k 个人一轮最多区分 <b>2<sup>k</sup></b> 道菜</span>
          <span>给定 N 道菜 → 需 <b>k = ⌈log₂N⌉</b> 人（取最小的 k 使 2<sup>k</sup> ≥ N）</span>
        </div>
        <table className="lx-table">
          <thead>
            <tr><th>菜数 N</th><th>需要人数 / 位数 k</th><th>2<sup>k</sup>（能力上限）</th></tr>
          </thead>
          <tbody>
            {RULES.map((r) => (
              <tr key={r.range}>
                <td>{r.range}</td>
                <td className="lx-num">{r.k}</td>
                <td className="lx-bin">{r.cap}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="lx-note">
          <h4>⚠️ 两个易错点</h4>
          <ul>
            <li><b>正好是 2 的幂时：</b>“位数”是“装下 N 个编号最少要几位”，不是“N 本身写成二进制有几位”。例：8 道菜只要 <b>3 位</b>（2³=8，编号 0~7 即可），不是“8=1000 是 4 位”。</li>
            <li><b>成立前提：</b>① 只有 1 盘菜有毒（否则组合叠加、解不唯一）；② 一轮只读“拉 / 不拉”两个状态（若见效还能分程度 / 时间点，信息量超过 1 bit，人还能更少）。</li>
          </ul>
        </div>
      </section>

      <section className="lx-card lx-conclusion">
        <h3>✅ 结论 & 记忆点</h3>
        <p className="lx-slogan">
          串行一个个尝是 O(n)；并行把每人 1 分钟的“是/否”当成一个 bit，n 个人一轮就能区分 2ⁿ 种可能——
          把 <b>10 分钟 → 1 分钟</b>、<b>10 人 → 4 人</b>。
        </p>
        <div className="lx-note">
          <h4>🧐 面试官若追问</h4>
          <ul>
            <li><b>为什么不能更少人？</b>一轮只有“拉/不拉”两种结果，2³ = 8 &lt; 10，3 人不够，最少 4 人。</li>
            <li><b>只有你自己一个人呢？</b>退化成方案 A 串行（最坏 9~10 分钟），或分轮次二分（先吃 1~5 混合样判断落在哪半，对折思路）。</li>
            <li><b>现实层面：</b>泻药不该真吃——本题纯考“并行 + 信息编码”的模型思维。</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
