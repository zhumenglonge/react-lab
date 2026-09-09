import { useState, useReducer } from 'react'

/* =========================================================
 * 场景 3：异步请求（loading / data / error）
 * 特点：三个状态是"互斥的状态机" —— 任一时刻只能有一种
 * 结论：useReducer 天然适合表达"状态迁移"
 * ========================================================= */

// 模拟一个可能失败的请求：输入偶数成功、奇数失败
function fakeFetch(n) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (n % 2 === 0) resolve({ id: n, msg: `请求 ${n} 成功啦 🎉` })
      else reject(new Error(`请求 ${n} 失败了 💥（因为它是奇数）`))
    }, 800)
  })
}

// ---------- 方式 A：useState ----------
function FetchWithState() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const run = async (n) => {
    // 每次都要小心地把三个状态都 set 对，漏一个就出 bug
    setLoading(true)
    setData(null)
    setError(null)
    try {
      const res = await fakeFetch(n)
      setLoading(false) // 别忘了！
      setData(res)
    } catch (e) {
      setLoading(false) // 又得写一次！
      setError(e.message)
    }
  }

  return (
    <div className="demo-box">
      <h4>useState 版本 ⚠️ 状态易漂移</h4>
      <FetchUI loading={loading} data={data} error={error} onRun={run} />
      <pre className="code">{`setLoading(true); setData(null); setError(null)
try {
  const res = await fakeFetch(n)
  setLoading(false)   // 成功分支要关 loading
  setData(res)
} catch (e) {
  setLoading(false)   // 失败分支也要关 loading
  setError(e.message)
}`}</pre>
      <p className="tip">
        👉 三个 setState 得成对出现，成功/失败两条分支都要各自维护，
        一旦漏掉 <code>setLoading(false)</code> 就会一直转圈。
      </p>
    </div>
  )
}

// ---------- 方式 B：useReducer ----------
const initial = { status: 'idle', data: null, error: null }
// status: 'idle' | 'loading' | 'success' | 'error'  —— 一个明确的状态机

function fetchReducer(state, action) {
  switch (action.type) {
    case 'START':
      // 一次返回，三个字段一起归位，不可能"漏 set"
      return { status: 'loading', data: null, error: null }
    case 'SUCCESS':
      return { status: 'success', data: action.payload, error: null }
    case 'ERROR':
      return { status: 'error', data: null, error: action.payload }
    default:
      return state
  }
}

function FetchWithReducer() {
  const [state, dispatch] = useReducer(fetchReducer, initial)

  const run = async (n) => {
    dispatch({ type: 'START' })
    try {
      const res = await fakeFetch(n)
      dispatch({ type: 'SUCCESS', payload: res })
    } catch (e) {
      dispatch({ type: 'ERROR', payload: e.message })
    }
  }

  return (
    <div className="demo-box">
      <h4>useReducer 版本 ✅ 推荐</h4>
      <FetchUI
        loading={state.status === 'loading'}
        data={state.data}
        error={state.error}
        onRun={run}
      />
      <pre className="code">{`dispatch({ type: 'START' })
// reducer 内部一次性把 loading/data/error 归位
return { status: 'loading', data: null, error: null }`}</pre>
      <p className="tip">
        👉 用 <code>status</code> 表达状态机，每次 dispatch 都是一次明确的"状态迁移"，
        不可能出现 loading=true 同时 data 又有值的鬼状态。
      </p>
    </div>
  )
}

// ---------- 共用 UI ----------
function FetchUI({ loading, data, error, onRun }) {
  return (
    <div className="fetch">
      <div className="btn-row">
        <button onClick={() => onRun(2)} disabled={loading}>
          请求 2（会成功）
        </button>
        <button onClick={() => onRun(3)} disabled={loading}>
          请求 3（会失败）
        </button>
      </div>
      <div className="result">
        {loading && <div className="loading">⏳ loading...</div>}
        {!loading && data && (
          <div className="ok">✅ {data.msg}</div>
        )}
        {!loading && error && <div className="err">❌ {error}</div>}
        {!loading && !data && !error && (
          <div className="idle">点击上方按钮发起请求</div>
        )}
      </div>
    </div>
  )
}

export default function FetchDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>场景 3：异步请求（状态机）</h3>
        <p className="desc">
          loading / data / error 是互斥的三种状态 ——{' '}
          <b>useReducer</b> 用 <code>status</code> 字段把它建模成状态机，迁移路径清晰可控。
        </p>
      </div>
      <div className="demo-grid">
        <FetchWithState />
        <FetchWithReducer />
      </div>
    </div>
  )
}
