import { useSyncExternalStore } from 'react'

/* =========================================================
 * 把 Redux store 连接到 React（react-redux 的底层原理）
 * ---------------------------------------------------------
 * store 是框架无关的纯 JS 对象，React 通过 useSyncExternalStore 订阅它：
 *   · subscribe  —— 告诉 React "怎么监听变化"
 *   · getState   —— 告诉 React "怎么读取当前快照"
 * 任何 dispatch 让 state 变化后，React 会自动重渲染订阅了它的组件。
 * 这就是 useSelector 的心智：组件订阅 store，状态一变就重画。
 * ========================================================= */

export function useStore(store) {
  // useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return useSyncExternalStore(store.subscribe, store.getState, store.getState)
}
