import { useMemo, useState } from 'react'
import {
  badCounter,
  chainSum,
  createAccumulator,
  createChainedAccumulator,
  createCounter,
  memoize,
  slowCompute,
} from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：闭包累加 + memoize 缓存，全部当场真执行
 * ---------------------------------------------------------
 * ① 累加器：加一次记一行，total 活在闭包里越加越大
 * ② 全局变量 vs 闭包：并排加 1，看谁污染了谁
 * ③ memoize：同参数第二次立刻返回（命中），换参数才真算（慢）
 * ④ 链式变体：add(1)(2)(3) 靠"每次返回闭包自己"
 * ========================================================= */

export default function RunDemo() {
  // ① 闭包累加器：实例存在 state 里，切 tab 重渲染也不丢进度
  const [acc] = useState(createAccumulator)
  const [accLogs, setAccLogs] = useState([])

  // ② 两个闭包计数器 + 一个全局计数器（同一份"加 1"，结果天差地别）
  const [counters] = useState(() => [createCounter(), createCounter()])
  const [closureReadout, setClosureReadout] = useState([0, 0])
  const [globalReadout, setGlobalReadout] = useState(0)

  // ③ memoize：onEvent 只记日志，缓存本体藏在 memoize 的闭包里
  const [memoEvents, setMemoEvents] = useState([])
  const [memoStats, setMemoStats] = useState({ hit: 0, miss: 0 })
  const [memoInput, setMemoInput] = useState(100)
  const computeMemoized = useMemo(
    () => memoize(slowCompute, (event) => {
      setMemoStats((s) => ({ ...s, [event.type]: s[event.type] + 1 }))
      setMemoEvents((list) => [...list.slice(-9), event])
    }),
    [],
  )

  // ④ 链式累加
  const [chain] = useState(createChainedAccumulator)
  const [chainLogs, setChainLogs] = useState([])

  const runAccumulate = (step) => {
    const result = acc(step)
    setAccLogs((list) => [...list, { step, result }])
  }

  const addAllClosure = () => {
    setClosureReadout(counters.map((c) => c.add(1)))
  }

  const addGlobalOnce = () => {
    badCounter.add(1)
    setGlobalReadout(badCounter.read())
  }

  const runMemo = () => {
    const startAt = performance.now()
    computeMemoized(memoInput)
    const cost = Math.round(performance.now() - startAt)
    setMemoEvents((list) => {
      const next = [...list]
      next[next.length - 1] = { ...next[next.length - 1], cost }
      return next
    })
  }

  const runChain = (step) => {
    chain(step)
    setChainLogs((list) => [...list, { step, result: chain.total }])
  }

  return (
    <div className="demo-wrap clo-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 闭包到底"记住"了什么</h2>
        <p className="demo-sub">
          面试题「用闭包写一个累加的函数 / 缓存的函数」，本质是一句话：
          <b>函数记得住它出生时那个作用域里的变量</b>。下面四组全部<b>当场执行</b>，
          加一次记一行、命中/未命中实时统计，不是看截图背结论。
        </p>
      </div>

      {/* ① 闭包累加器 */}
      <section className="clo-card">
        <div className="clo-card-head">
          <span className="clo-card-title">① 闭包累加器（面试原题）</span>
          <code className="clo-card-src">
            const add = createAccumulator(); add(n) 每次都加在同一个 total 上
          </code>
        </div>
        <pre className="clo-code">{`function createAccumulator() {
  let total = 0;            // ← 外部函数结束后本应销毁，
  return function add(step) {   //   但被内层函数引用 → 活了下来
    total += step;
    return total;
  };
}`}</pre>
        <div className="btn-row">
          {[1, 10, 100].map((step) => (
            <button key={step} className="ghost" onClick={() => runAccumulate(step)}>
              +{step}
            </button>
          ))}
          <button className="ghost" onClick={() => setAccLogs([])}>↺ 清空记录</button>
        </div>
        {accLogs.length ? (
          <div className="clo-logs">
            {accLogs.map((log, i) => (
              <code className="clo-chip" key={i}>
                +{log.step} → <b>{log.result}</b>
              </code>
            ))}
            <span className="clo-total">当前累计：{accLogs[accLogs.length - 1].result}</span>
          </div>
        ) : (
          <p className="clo-empty">还没加。点 +1 / +10 / +100，看 total 怎么被闭包一路记住。</p>
        )}
      </section>

      {/* ② 全局变量 vs 闭包私有变量 */}
      <section className="clo-card">
        <div className="clo-card-head">
          <span className="clo-card-title">② 对拍：全局变量 vs 闭包私有变量</span>
          <code className="clo-card-src">不用闭包 = 状态谁都能改；用闭包 = 每个实例各存各的</code>
        </div>
        <div className="clo-duel">
          <div className="clo-duel-side clo-duel-bad">
            <p className="clo-duel-title">❌ 全局 total（无封装）</p>
            <button className="ghost" onClick={addGlobalOnce}>加一次 1</button>
            <p className="clo-duel-readout">total = {globalReadout}</p>
            <p className="clo-tip">只有一份，任何代码都能读改，两个"计数器"共用一个数。</p>
          </div>
          <div className="clo-duel-side clo-duel-good">
            <p className="clo-duel-title">✅ 闭包 total × 2 实例</p>
            <button className="clo-primary" onClick={addAllClosure}>两个实例各加一次 1</button>
            <p className="clo-duel-readout">
              counterA = {closureReadout[0]}，counterB = {closureReadout[1]}
            </p>
            <p className="clo-tip">
              每次调用 createCounter() 都开一个<b>新的私有作用域</b>，total 互不干扰、外面碰不到。
            </p>
          </div>
        </div>
      </section>

      {/* ③ memoize 缓存函数 */}
      <section className="clo-card">
        <div className="clo-card-head">
          <span className="clo-card-title">③ 闭包缓存函数（memoize，你说的"缓存"就是它）</span>
          <code className="clo-card-src">cache 藏在闭包里：命中直接返回，未命中才真算</code>
        </div>
        <pre className="clo-code">{`function memoize(fn) {
  const cache = new Map();        // ← 闭包私有：外面拿不到，函数记得住
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);  // 命中：0ms
    const result = fn(...args);                 // 未命中：真算
    cache.set(key, result);
    return result;
  };
}`}</pre>
        <div className="btn-row clo-toolbar">
          <label className="clo-field">
            参数 n =
            <input
              type="number"
              min="1"
              max="100000"
              value={memoInput}
              onChange={(e) => setMemoInput(Number(e.target.value))}
            />
          </label>
          <button className="clo-primary" onClick={runMemo}>▶ 计算 slowCompute({memoInput})</button>
          <button className="ghost" onClick={() => setMemoInput(100)}>把 n 改回 100（必命中）</button>
        </div>
        <p className="clo-stats">
          实时统计：✅ 命中 <b>{memoStats.hit}</b> 次 ｜ ⚠️ 未命中（真算）<b>{memoStats.miss}</b> 次
        </p>
        {memoEvents.length ? (
          <div className="clo-logs clo-logs-stack">
            {memoEvents.map((event, i) => (
              <p className="clo-event" key={i}>
                <span className={event.type === 'hit' ? 'clo-tag clo-tag-hit' : 'clo-tag clo-tag-miss'}>
                  {event.type === 'hit' ? '✅ 缓存命中' : '⚠️ 未命中·真算'}
                </span>
                slowCompute({event.args[0]}) → {event.result}
                {event.cost != null && <>｜耗时 <b>{event.cost}ms</b></>}
              </p>
            ))}
          </div>
        ) : (
          <p className="clo-empty">
            先随便算一次（慢），再<b>原样重复点同一个按钮</b>——第二次几乎 0ms，就是闭包里的 cache 生效了。
          </p>
        )}
      </section>

      {/* ④ 链式调用变体 */}
      <section className="clo-card">
        <div className="clo-card-head">
          <span className="clo-card-title">④ 进阶变体：add(1)(2)(3) 链式累加</span>
          <code className="clo-card-src">每次把 total 装进"返回的闭包自己"往下带</code>
        </div>
        <pre className="clo-code">{`function createChainedAccumulator() {
  let total = 0;
  const add = (step) => {
    total += step;
    add.total = total;   // 回读 total 供展示
    return add;          // ← 返回自己，所以能一直加下去
  };
  return add;
}
const sum = chainSum();  // 另一变体：靠 valueOf 在隐式转数字时交出 total`}</pre>
        <div className="btn-row">
          {[1, 2, 3].map((step) => (
            <button key={step} className="ghost" onClick={() => runChain(step)}>
              .add({step})
            </button>
          ))}
          <button className="ghost" onClick={() => setChainLogs([])}>↺ 重新开始</button>
        </div>
        {chainLogs.length ? (
          <div className="clo-logs">
            {chainLogs.map((log, i) => (
              <code className="clo-chip" key={i}>
                .add({log.step}) → <b>{log.result}</b>
              </code>
            ))}
          </div>
        ) : (
          <p className="clo-empty">点 .add(1) .add(2) .add(3)，看 total 怎么沿着一串串闭包传递。</p>
        )}
        <p className="clo-tip">
          💡 当场验证 chainSum(1)(2)(3) 的真值：
          <code className="clo-chip">{chainSum(1)(2)(3).getTotal() === 6 ? '1+2+3 = 6 ✅' : '异常'}</code>
        </p>
      </section>
    </div>
  )
}
