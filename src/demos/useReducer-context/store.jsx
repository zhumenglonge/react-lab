import { useReducer } from 'react'
import {
  appReducer,
  initialState,
  StateContext,
  DispatchContext,
} from './store.js'

/* =========================================================
 * StoreProvider 组件（只导出组件，符合 react-refresh 约束）
 * ---------------------------------------------------------
 * 用 useReducer 持有全局状态，把 state / dispatch 分别通过两个
 * Context 下发。只要组件被包在 <StoreProvider> 里，就能用
 * useAppState() / useAppDispatch() 直接读写这份全局状态。
 *
 * 为什么 dispatch 单独一个 Provider？
 *   dispatch 引用天生稳定（React 保证不变），把它和 state 拆开后，
 *   "只 dispatch、不读 state" 的组件在 state 变化时不会重渲染。
 * ========================================================= */

export default function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>
        {children}
      </StateContext.Provider>
    </DispatchContext.Provider>
  )
}
