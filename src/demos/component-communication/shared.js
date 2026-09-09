import { useState } from 'react'

/* =========================================================
 * 本主题内复用的工具 hook（非组件，单独放 .js）
 * ---------------------------------------------------------
 * useCommLog：管理"通信日志"状态。每次 push 往头部插一条，
 * 最多保留 max 条；配合 shared.jsx 里的 <CommLog /> 组件，
 * 把组件间的每一次通信可视化。
 * ========================================================= */

// dir: 'down' 父→子 | 'up' 子→父 | 'both' 兄弟双向中转
export function useCommLog(max = 6) {
  const [log, setLog] = useState([])
  const push = (text, dir = 'down') =>
    setLog((prev) => [{ text, dir }, ...prev].slice(0, max))
  const clear = () => setLog([])
  return { log, push, clear }
}
