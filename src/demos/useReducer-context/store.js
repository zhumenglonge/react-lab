import { createContext, useContext } from 'react'

/* =========================================================
 * 全局 Store：useReducer + Context（非组件部分）
 * ---------------------------------------------------------
 * 这里只放"不是组件"的东西：state 初始值、reducer、Context 对象、
 * 消费用的自定义 hook。Provider 组件放在 store.jsx —— 遵循本项目
 * react-refresh 约定：组件与非组件必须分文件（对照 shared.js / shared.jsx）。
 *
 * 这就是"轻量版 Redux"：一份全局 state + 一个集中更新的 reducer，
 * 通过 Context 广播给任意深度的组件，无需层层传 props。
 * ========================================================= */

// ① 全局状态的初始值 —— 整个应用通常就这一份
export const initialState = {
  user: { name: '游客', vip: false },
  theme: 'dark',
  todos: [
    { id: 1, text: '学会 useReducer + Context', done: true },
    { id: 2, text: '把项目里的 Redux 换成它', done: false },
  ],
}

// ② reducer：集中处理所有全局状态的更新（纯函数，好测试、好回放）
export function appReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: { name: action.payload.name, vip: action.payload.vip },
      }
    case 'LOGOUT':
      return { ...state, user: initialState.user }
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' }
    case 'ADD_TODO': {
      const id = Date.now()
      return {
        ...state,
        todos: [...state.todos, { id, text: action.payload, done: false }],
      }
    }
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload ? { ...t, done: !t.done } : t
        ),
      }
    case 'REMOVE_TODO':
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.payload),
      }
    default:
      return state
  }
}

// ③ 两个 Context：state 与 dispatch 分开下发。
//    dispatch 引用永远稳定，只用 dispatch 的组件不会因 state 变化而重渲染
//    —— 这是性能关键，详见「③ 性能优化」tab。
export const StateContext = createContext(null)
export const DispatchContext = createContext(null)

// ④ 自定义 hook：让消费组件一行拿到全局 state / dispatch。
//    顺带做"必须在 Provider 内使用"的兜底校验，避免拿到默认值 null。
export function useAppState() {
  const ctx = useContext(StateContext)
  if (ctx === null) {
    throw new Error('useAppState 必须在 <StoreProvider> 内部使用')
  }
  return ctx
}

export function useAppDispatch() {
  const ctx = useContext(DispatchContext)
  if (ctx === null) {
    throw new Error('useAppDispatch 必须在 <StoreProvider> 内部使用')
  }
  return ctx
}
