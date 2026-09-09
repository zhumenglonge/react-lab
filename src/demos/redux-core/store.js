/* =========================================================
 * 手写 mini-redux：Redux 的核心其实就这么点东西
 * ---------------------------------------------------------
 * 只依赖闭包，不依赖任何库。面试能默写出 createStore，
 * 基本就说明你真的懂 Redux 了。
 * 本文件全是纯函数（非组件），所以放 .js。
 * ========================================================= */

/* ---------- createStore：整个 Redux 的心脏 ----------
 * 用闭包守住唯一的 state，对外只暴露三个方法：
 *   getState()    读当前状态
 *   dispatch(a)   派发 action → 跑 reducer 换新 state → 通知所有订阅者
 *   subscribe(fn) 订阅变化，返回一个"取消订阅"函数
 */
export function createStore(reducer, preloadedState, enhancer) {
  // 兼容 createStore(reducer, enhancer) 的两参写法
  if (typeof preloadedState === 'function' && enhancer === undefined) {
    enhancer = preloadedState
    preloadedState = undefined
  }
  // 有 enhancer（如 applyMiddleware）就把创建流程交给它接管
  if (typeof enhancer === 'function') {
    return enhancer(createStore)(reducer, preloadedState)
  }

  let state = preloadedState
  let listeners = []

  function getState() {
    return state
  }

  function dispatch(action) {
    // reducer 是纯函数：(旧 state, action) => 新 state
    state = reducer(state, action)
    // 通知所有订阅者（先拷贝一份，避免遍历途中 subscribe/unsubscribe 改动数组）
    listeners.slice().forEach((listener) => listener())
    return action
  }

  function subscribe(listener) {
    listeners.push(listener)
    let subscribed = true
    return function unsubscribe() {
      if (!subscribed) return
      subscribed = false
      listeners = listeners.filter((l) => l !== listener)
    }
  }

  // 初始化：派发一个内部 action，让每个 reducer 返回自己的初始 state
  dispatch({ type: '@@redux/INIT' })

  return { getState, dispatch, subscribe }
}

/* ---------- combineReducers：把多个小 reducer 合成一个 ----------
 * 每个子 reducer 只负责状态树的一片；根 reducer 汇总它们的结果。
 */
export function combineReducers(reducers) {
  const keys = Object.keys(reducers)
  return function rootReducer(state = {}, action) {
    const next = {}
    let changed = false
    for (const key of keys) {
      const prevSlice = state[key]
      next[key] = reducers[key](prevSlice, action)
      changed = changed || next[key] !== prevSlice
    }
    // 没有任何切片变化就返回原对象，避免无意义的重渲染
    return changed ? next : state
  }
}

/* ---------- compose：从右到左组合函数 f(g(h(x))) ---------- */
export function compose(...fns) {
  if (fns.length === 0) return (arg) => arg
  if (fns.length === 1) return fns[0]
  return fns.reduce((a, b) => (...args) => a(b(...args)))
}

/* ---------- applyMiddleware：用 enhancer 增强 dispatch ----------
 * 中间件签名：store => next => action => {...}
 * 它像洋葱一样一层层包住原始 dispatch，可在 action 到达 reducer 前拦截处理。
 */
export function applyMiddleware(...middlewares) {
  return (createStoreFn) => (reducer, preloadedState) => {
    const store = createStoreFn(reducer, preloadedState)
    let dispatch = () => {
      throw new Error('中间件构建期间不允许 dispatch')
    }
    const middlewareAPI = {
      getState: store.getState,
      // 用箭头包一层，保证中间件里拿到的永远是"最终增强后"的 dispatch
      dispatch: (action, ...args) => dispatch(action, ...args),
    }
    const chain = middlewares.map((mw) => mw(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)
    return { ...store, dispatch }
  }
}

/* ---------- thunk 中间件：让 action 可以是"函数"，用来处理异步 ----------
 * 普通 action 是对象；如果是函数，就执行它，并把 dispatch/getState 交给它，
 * 由它自己决定何时（比如请求返回后）再派发真正的对象 action。
 */
export const thunk = ({ dispatch, getState }) => (next) => (action) => {
  if (typeof action === 'function') {
    return action(dispatch, getState)
  }
  return next(action)
}
