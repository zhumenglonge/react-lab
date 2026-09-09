import { useState, useCallback } from 'react'

/* =========================================================
 * ④ 常见误区：闭包陷阱 / 漏写依赖 / 过度优化
 * ---------------------------------------------------------
 * 用错比不用更糟。这几条是面试和实战里的高频翻车点。
 * ========================================================= */

// ---- 可交互：闭包陷阱（依赖数组漏写）----
function StaleClosure() {
  const [count, setCount] = useState(0)
  const [msg, setMsg] = useState('先把 count 加到 3、4，再点对比下面两个读取按钮 👇')

  // ❌ 依赖数组漏了 count → 回调被「冻结」在定义那一刻的 count(=0)
  const readStale = useCallback(() => {
    setMsg(`❌ 过时闭包读到 count = ${count}`)
  }, [])

  // ✅ 依赖写全 → count 变化后回调也跟着更新，拿到最新值
  const readFresh = useCallback(() => {
    setMsg(`✅ 正确闭包读到 count = ${count}`)
  }, [count])

  return (
    <div className="demo-box full-width">
      <h4>🐛 交互复现：依赖漏写 → 闭包陷阱</h4>
      <div className="btn-row">
        <button className="primary-btn ghost" onClick={() => setCount((c) => c + 1)}>
          count + 1（当前 {count}）
        </button>
        <button className="primary-btn danger" onClick={readStale}>
          读取 count（漏写依赖 []）
        </button>
        <button className="primary-btn ok" onClick={readFresh}>
          读取 count（依赖 [count]）
        </button>
      </div>
      <div className="msg-box">{msg}</div>
      <pre className="code">{`// ❌ 漏写依赖：回调被冻结在 count = 0 那一刻
const readStale = useCallback(() => {
  setMsg(\`count = \${count}\`)   // 永远是 0
}, [])          // ← 少写了 count

// ✅ 写全依赖：count 变化后回调也更新
const readFresh = useCallback(() => {
  setMsg(\`count = \${count}\`)
}, [count])`}</pre>
      <p className="tip warn">
        点几次 <code>count + 1</code>，再点两个读取按钮：左边永远显示 <b>0</b>（闭包陷阱），
        右边显示真实值。这正是 <code>eslint-plugin-react-hooks</code> 的
        <code>exhaustive-deps</code> 规则要帮你抓的坑 —— 本项目已经装了它。
      </p>
    </div>
  )
}

const PITFALLS = [
  {
    icon: '🚫',
    title: '不写依赖数组 = 白缓存',
    body: (
      <>
        <code>useMemo(fn)</code> / <code>useCallback(fn)</code> 省略第二个参数，
        等于「每次渲染都重新算 / 重建」，和不写没区别，还白白多了一层开销。
      </>
    ),
  },
  {
    icon: '🐢',
    title: '廉价计算别用 useMemo',
    body: (
      <>
        <code>a + b</code>、字符串拼接、几项的 <code>map/filter</code> 本身比「比较依赖 + 取缓存」还快。
        缓存是有成本的，<b>只有计算真的贵才划算</b>。
      </>
    ),
  },
  {
    icon: '🧩',
    title: '单独用 useCallback 没意义',
    body: (
      <>
        缓存的函数如果没传给 <code>React.memo</code> 子组件、也没作为别的 Hook 的依赖，
        那这份「稳定引用」没人消费，纯属自我感动。
      </>
    ),
  },
  {
    icon: '⚠️',
    title: 'useMemo 不是「保证」，别拿来做副作用',
    body: (
      <>
        React 保留在必要时丢弃缓存的权利（如离屏组件）。所以别用 useMemo 执行副作用或做
        「只应运行一次」的逻辑 —— 那是 <code>useEffect</code> / 事件处理的活。
      </>
    ),
  },
]

export default function PitfallsDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>④ 常见误区与「什么时候不该用」</h3>
        <p className="desc">用错比不用更糟。先能亲手复现闭包陷阱，再记住四条判断标准。</p>
      </div>

      <StaleClosure />

      <div className="pit-grid">
        {PITFALLS.map((p) => (
          <div className="pit-card" key={p.title}>
            <div className="pit-title">
              <span className="pit-icon">{p.icon}</span>
              {p.title}
            </div>
            <p className="pit-body">{p.body}</p>
          </div>
        ))}
      </div>

      <p className="tip">
        💡 <b>React 19 的编译器（React Compiler）</b>能在编译期自动做记忆化，
        很多手写的 useMemo / useCallback 未来可以省掉（本项目正是 React 19）。
        但前提是你得先懂原理，才知道编译器在帮你缓存什么、什么时候仍需手动干预。
      </p>
    </div>
  )
}
