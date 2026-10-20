/* =========================================================
 * Event Loop · 共享数据（纯数据，无 JSX，不导出组件）
 * ---------------------------------------------------------
 * 三段"面试原题级"代码，逐帧拆成有向的执行序列。
 * 每一步记录：
 *   out   —— 这一帧真正打印出来的内容（对应 console.log 的参数）
 *   kind  —— 'sync' 同步 | 'micro' 微任务 | 'macro' 宏任务
 *   micro / macro —— 本帧执行"时"两条队列里还在等待的任务名
 *                    （本帧自己已出栈，故不计入）
 *   why   —— 这一帧为什么排在这里（讲清入队时机与先后）
 * 这些顺序是浏览器/V8 真实的事件循环行为，不是随手排的。
 * ========================================================= */

// 队列任务展示时的短标签（带文字冗余，不只靠颜色）
export const KIND_LABEL = {
  sync: '⚙️ 同步',
  micro: '🟦 微任务',
  macro: '🟨 宏任务',
}

export const SNIPPETS = [
  {
    id: 'race',
    tab: '① setTimeout vs Promise',
    title: '宏任务 vs 微任务：最经典的输出顺序',
    code: `console.log('script start')                       // 同步
setTimeout(() => console.log('timeout1'), 0)  // 宏任务
Promise.resolve().then(() => console.log('promise1')) // 微任务
Promise.resolve().then(() => console.log('promise2')) // 微任务
console.log('script end')                        // 同步`,
    hint: '先跑完整段同步，再一次性清空微任务，最后才轮到宏任务。',
    steps: [
      {
        out: 'script start', kind: 'sync', micro: [], macro: [],
        why: '第一行同步代码，直接进调用栈执行；此刻两条队列都还是空的。',
      },
      {
        out: 'script end', kind: 'sync', micro: ['promise1', 'promise2'], macro: ['timeout1'],
        why: '同步走到最后一行。中途 setTimeout 已把 timeout1 排进宏任务队列，两个 .then 已把 promise1、promise2 排进微任务队列——同步阶段只负责"排队"，不负责执行回调。',
      },
      {
        out: 'promise1', kind: 'micro', micro: ['promise2'], macro: ['timeout1'],
        why: '调用栈清空后，事件循环先"整条清空微任务队列"，promise1 是队首，先执行。',
      },
      {
        out: 'promise2', kind: 'micro', micro: [], macro: ['timeout1'],
        why: 'promise2 仍在微任务队列里，接着被清空。注意：所有微任务跑完之前，绝不会再碰宏任务。',
      },
      {
        out: 'timeout1', kind: 'macro', micro: [], macro: [],
        why: '微任务空了，事件循环才从宏任务队列取出 timeout1 执行——哪怕它的延迟是 0ms。',
      },
    ],
  },

  {
    id: 'asyncawait',
    tab: '② async/await 后续归微任务',
    title: 'await 后面的代码，本质是微任务',
    code: `console.log('A')
async function async1() {
  console.log('async1 start')   // 同步
  await async2()                // async2 同步执行；await 让出，后续挂微任务
  console.log('async1 end')     // 微任务
}
function async2() { console.log('async2') } // 同步
async1()
console.log('B')                              // 同步
setTimeout(() => console.log('timeout'), 0)   // 宏任务
Promise.resolve().then(() => console.log('promise')) // 微任务`,
    hint: 'await 之下的代码 ≈ 放进 .then 回调；async1 end 比 promise 先入队，所以先执行。',
    steps: [
      {
        out: 'A', kind: 'sync', micro: [], macro: [],
        why: '顶层第一行同步打印。',
      },
      {
        out: 'async1 start', kind: 'sync', micro: [], macro: [],
        why: 'async1() 被调用，函数体从上到下仍是同步执行，先打印 async1 start。',
      },
      {
        out: 'async2', kind: 'sync', micro: ['async1 end'], macro: [],
        why: 'await async2() 会先"同步跑完" async2 的函数体打印 async2；async2 返回后，await 把 async1 剩余代码（async1 end）作为微任务入队，函数在此让出。',
      },
      {
        out: 'B', kind: 'sync', micro: ['async1 end'], macro: ['timeout'],
        why: '回到顶层继续同步：打印 B，随后 setTimeout 把 timeout 排进宏任务队列。（promise 的 .then 行在 B 之后，稍后才入队）',
      },
      {
        out: 'async1 end', kind: 'micro', micro: ['promise'], macro: ['timeout'],
        why: '同步栈清空，开始清微任务。async1 end 早在 async2 返回时就入队了，排在 promise 前面，先执行。',
      },
      {
        out: 'promise', kind: 'micro', micro: [], macro: ['timeout'],
        why: 'promise.then 的回调是同步阶段最后入队的微任务，接着被清空。',
      },
      {
        out: 'timeout', kind: 'macro', micro: [], macro: [],
        why: '微任务全空后，才取宏任务 timeout 执行。',
      },
    ],
  },

  {
    id: 'chained',
    tab: '③ Promise 链式 then',
    title: '链式 .then：每次 resolve 才把下一个回调入队',
    code: `console.log('script start')
setTimeout(() => console.log('setTimeout'), 0)
Promise.resolve()
  .then(() => console.log('promise1'))
  .then(() => console.log('promise2'))
Promise.resolve()
  .then(() => console.log('promise3'))
console.log('script end')`,
    hint: 'promise2 不是同步阶段排的——它要等 promise1 执行完 resolve 后才入队，所以落在 promise3 之后。',
    steps: [
      {
        out: 'script start', kind: 'sync', micro: [], macro: [],
        why: '顶层同步打印。',
      },
      {
        out: 'script end', kind: 'sync', micro: ['promise1', 'promise3'], macro: ['setTimeout'],
        why: '同步结束时，两条 Promise 链的"第一个 then"分别入队：promise1、promise3。而 promise2 是第二个 then，此时还没资格入队——它要等 promise1 那条先跑完。',
      },
      {
        out: 'promise1', kind: 'micro', micro: ['promise3', 'promise2'], macro: ['setTimeout'],
        why: '清空微任务：队首 promise1 执行；它 resolve 后，才把下一环 promise2 追加到微任务队列尾部（排在 promise3 之后）。',
      },
      {
        out: 'promise3', kind: 'micro', micro: ['promise2'], macro: ['setTimeout'],
        why: 'promise3 在 promise2 之前就已在队列里，所以先于 promise2 打印——这是本题最大的陷阱。',
      },
      {
        out: 'promise2', kind: 'micro', micro: [], macro: ['setTimeout'],
        why: 'promise2 是最后才入队的微任务，微任务队列直到此时才空。',
      },
      {
        out: 'setTimeout', kind: 'macro', micro: [], macro: [],
        why: '微任务彻底清空，事件循环取出宏任务 setTimeout。最终顺序：…promise1 → promise3 → promise2 → setTimeout。',
      },
    ],
  },
]
