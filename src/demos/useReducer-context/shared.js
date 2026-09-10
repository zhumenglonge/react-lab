import { useRef } from 'react'

/* =========================================================
 * 本主题共享工具 hook（非组件，单独放 .js，符合 react-refresh 约定）
 * ---------------------------------------------------------
 * useRenderCount：统计组件"被渲染了多少次"，用于「③ 性能优化」
 * 直观对比"合并 Context / 拆分 Context"时消费者的重渲染差异。
 *
 * ⚠️ 关于 lint（react-hooks/refs）：
 *   "渲染计数"本质就是要观察渲染行为本身，只能在渲染期读写 ref。
 *   该规则禁止渲染期访问 ref（React Compiler 无法静态分析），
 *   但这里属于「教学演示刻意为之」，故就近关闭；生产代码不要这样写。
 *   注：本项目 usememo-usecallback/shared.js 用的是同一套计数思路。
 *
 * ⚠️ 关于 StrictMode：开发环境渲染函数会被调用两次，计数绝对值会成对偏大；
 *   我们看的是「相对变化」——点击 +1 后谁在涨、谁不动，结论不受影响。
 * ========================================================= */

/* eslint-disable react-hooks/refs -- 渲染计数必须观察渲染期，教学演示刻意保留 */
export function useRenderCount() {
  const ref = useRef(0)
  ref.current += 1
  return ref.current
}
/* eslint-enable react-hooks/refs */
