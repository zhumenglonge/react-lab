import { useState, useReducer } from 'react'

/* =========================================================
 * 场景 2：购物车
 * 特点：多个相关联的状态 + 多种更新操作
 * 结论：useReducer 明显更清晰、更好维护
 * ========================================================= */

const PRODUCTS = [
  { id: 1, name: '苹果', price: 5 },
  { id: 2, name: '香蕉', price: 3 },
  { id: 3, name: '橙子', price: 8 },
]

const COUPONS = {
  SAVE10: 0.9, // 9 折
  SAVE20: 0.8, // 8 折
}

function calcTotal(items, coupon) {
  const raw = items.reduce((sum, it) => sum + it.price * it.qty, 0)
  const rate = coupon ? COUPONS[coupon] : 1
  return (raw * rate).toFixed(2)
}

// ---------- 方式 A：useState ----------
function CartWithState() {
  // 三个状态，彼此关联，但被拆散了
  const [items, setItems] = useState([])
  const [coupon, setCoupon] = useState(null)
  const [lastAction, setLastAction] = useState('无')

  const addItem = (p) => {
    // 更新 items 的同时，还得同步更新 lastAction —— 逻辑开始分散
    const exist = items.find((it) => it.id === p.id)
    if (exist) {
      setItems(
        items.map((it) => (it.id === p.id ? { ...it, qty: it.qty + 1 } : it))
      )
    } else {
      setItems([...items, { ...p, qty: 1 }])
    }
    setLastAction(`添加了 ${p.name}`)
  }

  const changeQty = (id, delta) => {
    setItems(
      items
        .map((it) => (it.id === id ? { ...it, qty: it.qty + delta } : it))
        .filter((it) => it.qty > 0)
    )
    setLastAction(delta > 0 ? '数量 +1' : '数量 -1')
  }

  const applyCoupon = (code) => {
    // 用优惠券时，如果购物车是空的，还要顺手清空 lastAction —— 状态耦合
    if (items.length === 0) {
      setCoupon(null)
      setLastAction('购物车为空，无法使用优惠券')
      return
    }
    setCoupon(code)
    setLastAction(`使用了优惠券 ${code}`)
  }

  const clear = () => {
    setItems([])
    setCoupon(null)
    setLastAction('清空了购物车')
  }

  return (
    <div className="demo-box">
      <h4>useState 版本 ⚠️ 逻辑分散</h4>
      <CartUI
        items={items}
        coupon={coupon}
        lastAction={lastAction}
        onAdd={addItem}
        onQty={changeQty}
        onCoupon={applyCoupon}
        onClear={clear}
      />
      <pre className="code">{`const [items, setItems] = useState([])
const [coupon, setCoupon] = useState(null)
const [lastAction, setLastAction] = useState('无')

// 每个操作函数里都要手动 set 多个状态
// 一旦漏 set，就出现"状态不一致"的 bug`}</pre>
      <p className="tip">
        👉 三个 useState 彼此关联，但更新逻辑散落在各个事件处理函数里，
        状态一多就容易漏 set、出现不一致。
      </p>
    </div>
  )
}

// ---------- 方式 B：useReducer ----------
const initialState = {
  items: [],
  coupon: null,
  lastAction: '无',
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const p = action.payload
      const exist = state.items.find((it) => it.id === p.id)
      const items = exist
        ? state.items.map((it) =>
            it.id === p.id ? { ...it, qty: it.qty + 1 } : it
          )
        : [...state.items, { ...p, qty: 1 }]
      // 相关状态一次性返回，天然保持一致
      return { ...state, items, lastAction: `添加了 ${p.name}` }
    }
    case 'CHANGE_QTY': {
      const { id, delta } = action.payload
      const items = state.items
        .map((it) => (it.id === id ? { ...it, qty: it.qty + delta } : it))
        .filter((it) => it.qty > 0)
      return {
        ...state,
        items,
        lastAction: delta > 0 ? '数量 +1' : '数量 -1',
      }
    }
    case 'APPLY_COUPON': {
      if (state.items.length === 0) {
        return {
          ...state,
          coupon: null,
          lastAction: '购物车为空，无法使用优惠券',
        }
      }
      return {
        ...state,
        coupon: action.payload,
        lastAction: `使用了优惠券 ${action.payload}`,
      }
    }
    case 'CLEAR':
      return { items: [], coupon: null, lastAction: '清空了购物车' }
    default:
      return state
  }
}

function CartWithReducer() {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  return (
    <div className="demo-box">
      <h4>useReducer 版本 ✅ 推荐</h4>
      <CartUI
        items={state.items}
        coupon={state.coupon}
        lastAction={state.lastAction}
        onAdd={(p) => dispatch({ type: 'ADD_ITEM', payload: p })}
        onQty={(id, delta) =>
          dispatch({ type: 'CHANGE_QTY', payload: { id, delta } })
        }
        onCoupon={(code) =>
          dispatch({ type: 'APPLY_COUPON', payload: code })
        }
        onClear={() => dispatch({ type: 'CLEAR' })}
      />
      <pre className="code">{`dispatch({ type: 'ADD_ITEM', payload: p })
dispatch({ type: 'APPLY_COUPON', payload: 'SAVE10' })

// 所有更新逻辑集中在 cartReducer 里
// 每个 action 都是"意图明确"的一次状态迁移`}</pre>
      <p className="tip">
        👉 状态是一个整体，业务动作通过 dispatch(action) 表达意图，
        reducer 集中处理 —— 好测试、好调试、好扩展。
      </p>
    </div>
  )
}

// ---------- 共用的 UI ----------
function CartUI({ items, coupon, lastAction, onAdd, onQty, onCoupon, onClear }) {
  return (
    <div className="cart">
      <div className="products">
        {PRODUCTS.map((p) => (
          <button key={p.id} onClick={() => onAdd(p)}>
            添加 {p.name}（¥{p.price}）
          </button>
        ))}
      </div>

      <ul className="items">
        {items.length === 0 && <li className="empty">购物车空空如也</li>}
        {items.map((it) => (
          <li key={it.id}>
            <span>
              {it.name} × {it.qty} = ¥{it.price * it.qty}
            </span>
            <span>
              <button onClick={() => onQty(it.id, -1)}>-</button>
              <button onClick={() => onQty(it.id, +1)}>+</button>
            </span>
          </li>
        ))}
      </ul>

      <div className="coupons">
        <button onClick={() => onCoupon('SAVE10')}>用 SAVE10（9折）</button>
        <button onClick={() => onCoupon('SAVE20')}>用 SAVE20（8折）</button>
        <button onClick={onClear}>清空</button>
      </div>

      <div className="summary">
        <div>优惠券：{coupon ?? '无'}</div>
        <div>合计：¥{calcTotal(items, coupon)}</div>
        <div>最近动作：{lastAction}</div>
      </div>
    </div>
  )
}

export default function CartDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>场景 2：购物车（多状态关联）</h3>
        <p className="desc">
          items / coupon / lastAction 三个状态互相影响 ——{' '}
          <b>useReducer</b> 让更新逻辑集中、状态天然一致。
        </p>
      </div>
      <div className="demo-grid">
        <CartWithState />
        <CartWithReducer />
      </div>
    </div>
  )
}
