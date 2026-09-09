import { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { CommLog } from './shared.jsx'
import { useCommLog } from './shared.js'

/* =========================================================
 * 场景 4：Ref 转发（命令式通信）
 *   前三种都在"传数据"，这一种是"直接调用子组件的方法"。
 *   子组件用 forwardRef + useImperativeHandle 暴露方法句柄，
 *   父组件拿着 ref 像操作 DOM 一样命令子组件做事（聚焦/清空/抖动）。
 * ========================================================= */

// 子组件：一个自定义输入框，只向外暴露 focus / clear / shake 三个命令
const FancyInput = forwardRef(function FancyInput(_props, ref) {
  const inputRef = useRef(null)
  const [shake, setShake] = useState(false)

  // 只暴露父组件需要的方法，内部实现细节对外隐藏
  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current?.focus()
    },
    clear() {
      if (inputRef.current) inputRef.current.value = ''
    },
    shake() {
      setShake(true)
      setTimeout(() => setShake(false), 500)
    },
  }))

  return (
    <input
      ref={inputRef}
      className={`cc-fancy-input ${shake ? 'cc-shake' : ''}`}
      defaultValue="我是子组件内部的内容"
    />
  )
})

export default function RefDemo() {
  const childRef = useRef(null)
  const { log, push } = useCommLog()

  const callFocus = () => {
    childRef.current?.focus()
    push('父 → 子：ref.current.focus() 让子组件的输入框聚焦', 'down')
  }
  const callClear = () => {
    childRef.current?.clear()
    push('父 → 子：ref.current.clear() 清空子组件输入框', 'down')
  }
  const callShake = () => {
    childRef.current?.shake()
    push('父 → 子：ref.current.shake() 触发子组件抖动动画', 'down')
  }

  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>场景 4：Ref 转发（命令式调用子组件方法）</h3>
        <p className="desc">
          不是传数据，而是<b>父组件直接命令子组件"做某件事"</b>：聚焦、清空、抖动。
        </p>
      </div>

      <div className="cc-tree">
        <div className="cc-node cc-node-parent">
          <div className="cc-node-tag">👨‍👩‍👧 父组件 Parent（持有 childRef）</div>
          <div className="btn-row">
            <button onClick={callFocus}>调用子组件 focus()</button>
            <button onClick={callClear}>调用子组件 clear()</button>
            <button onClick={callShake}>调用子组件 shake()</button>
          </div>

          <div className="cc-flow cc-flow-down">
            ↓ 通过 ref 直接拿到子组件暴露的方法句柄
          </div>

          <div className="cc-node cc-node-child">
            <div className="cc-node-tag">🧒 子组件 FancyInput</div>
            <FancyInput ref={childRef} />
            <p className="cc-mini-tip">
              useImperativeHandle 只暴露 focus / clear / shake，其余内部细节对外不可见。
            </p>
          </div>
        </div>
      </div>

      <CommLog log={log} />

      <pre className="code">{`// 子组件：forwardRef + useImperativeHandle 暴露方法
const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef(null)
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { inputRef.current.value = '' },
  }))
  return <input ref={inputRef} />
})

// 父组件：拿着 ref 命令式调用
function Parent() {
  const childRef = useRef(null)
  return (
    <>
      <button onClick={() => childRef.current.focus()}>聚焦</button>
      <FancyInput ref={childRef} />
    </>
  )
}`}</pre>

      <p className="tip">
        👉 <b>适用</b>：聚焦、滚动、播放动画、触发校验等"命令式 DOM 操作"。
        <b>不要</b>用它传业务数据 —— 那会绕过 React 的声明式数据流，让状态难以追踪。
        能用 props 解决的，优先用 props。
      </p>
    </div>
  )
}
