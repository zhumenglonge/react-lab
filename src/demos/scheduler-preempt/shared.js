/* =========================================================
 * 共享数据与纯函数：忙循环里的优先级调度（时间切片）
 * ---------------------------------------------------------
 * 面试原题：「写一段代码，一个函数里有个循环不让它闲着；
 * 外头来了新任务，要能优先执行」。这里只放「能被当场执行」
 * 的真实现代码，不含组件，满足 react-refresh 约定。
 * RunDemo 直接调用这些函数真跑，日志就是真实发生的顺序。
 * ========================================================= */

export const WORK_MS = 50;     // 每片真实忙 50ms
export const URGENT_MS = 60;   // 插队任务真实忙 60ms
export const NAIVE_MS = 800;   // 裸跑对照组：一整段 800ms 同步长任务
export const MICRO_MAX = 20;   // B 组看门狗：微任务链不解让，最多跑 20 片强制停，防页面永久卡死

/* ---------- 烧时间：让主线程真忙 ms 毫秒（不让它闲着） ---------- */
export function busyWork(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    /* 空转占住调用栈：这期间主线程什么都干不了 */
  }
}

/* ---------- 优先级队列：urgent 插到队首，loop 排队尾 ---------- */
export function createQueue() {
  const tasks = []; // 数组当队列，tasks[0] 永远是下一个要跑的
  return {
    size: () => tasks.length,
    peek: () => tasks[0] || null,
    add(kind, fn, label) {
      const task = { kind, fn, label, t0: Date.now() };
      if (kind === 'urgent') tasks.unshift(task); // 插队：放到队首
      else tasks.push(task);                      // 循环任务：排队尾
      return task;
    },
    next() {
      return tasks.shift() || null;
    },
  };
}

/* 兼容同步 / Promise 两种任务：是 thenable 就 await，否则直接返回 */
function maybePromise(r) {
  return r && typeof r.then === 'function' ? r : Promise.resolve(r);
}

/**
 * ★ 本题手写核心：循环不闲着 + 新任务优先（没有片数上限，一直跑）
 *   1. 循环是「真的在干活」——每一片都占满主线程（busyWork 或业务 fn）；
 *   2. 每两片之间埋一个「让步点」：先清空队列里排在前面的 urgent，
 *      再 setTimeout 让出一次事件循环——外层新宏任务因此能挤进队列；
 *   3. 纯同步循环永远不可能被打断（单线程），被打断的不是循环本身，
 *      而是「循环下一片的执行时机」；
 *   4. 停止只靠 cancel()：在下一个让步点体面退场（协作式，不是抢占）。
 */
export function runSliced(q, { onEvent, onDone, sliceMs = WORK_MS, yieldWay = 'timeout', maxSlices = Infinity }) {
  let i = 0;
  let stopped = false;
  const latencies = [];

  function stop(text) {
    onEvent({ kind: 'done', text });
    onDone(latencies);
  }

  async function step() {
    if (stopped) {
      return stop(yieldWay === 'micro'
        ? '⏹ 已停止 — 注意：微任务链里 cancel() 只能在下一个 await 点被读到（实跑时靠看门狗兜底）'
        : '⏹ 已停止 — cancel() 在下一个让步点被读到（协作式退场，不是抢占）');
    }
    // —— 让步点：队首若是 urgent，先跑它（可能就是上次让出时挤进来的新任务）
    while (q.peek() && q.peek().kind === 'urgent') {
      const t = q.next();
      onEvent({ kind: 'urgent', text: `⚡ 优先执行插队任务「${t.label}」（排队等了 ${Date.now() - t.t0}ms）` });
      await maybePromise(t.fn());
      busyWork(URGENT_MS); // 模拟紧急任务本身也要忙一会儿
      latencies.push(Date.now() - t.t0);
    }
    if (i >= maxSlices) {
      return stop(yieldWay === 'micro'
        ? `⛔ 微任务链跑了 ${maxSlices} 片没让过一次路，看门狗强制停止（否则页面永久卡死）`
        : `⛔ 触发看门狗上限，强制停止`);
    }
    // —— 再干一片循环任务：不许闲着，这片照样占满主线程
    i += 1;
    const label = yieldWay === 'micro'
      ? `🔁 第 ${i} 片（微任务链从未让路 · 已连续霸占约 ${i * sliceMs}ms）`
      : `🔁 第 ${i} 片 · 忙 ${sliceMs}ms`;
    onEvent({ kind: 'slice', text: label, ms: sliceMs });
    busyWork(sliceMs);
    // —— 让出事件循环：外层新宏任务就是在这一步之后被处理的
    if (yieldWay === 'timeout') await new Promise((r) => setTimeout(r, 0));
    else await Promise.resolve(); // 对照组：微任务续片 → 永远轮不到新宏任务
    step();
  }

  step();
  return {
    cancel() {
      if (stopped) return;
      stopped = true; // 只置标志；退场日志与 onDone 由 step 在下一个让步点统一处理
    },
  };
}

/* ---------- 对照组 A：裸同步死循环（跑一次就懂：期间一切任务全排队） ---------- */
export function runNaive({ onEvent, onDone, totalMs = NAIVE_MS }) {
  const start = performance.now();
  onEvent({ kind: 'info', text: `▶ 开始 ${totalMs}ms 纯同步循环（没有任何让步点）` });
  busyWork(totalMs);
  onEvent({
    kind: 'gap',
    text: `⏱️ 主线程被占住 ${Math.round(performance.now() - start)}ms：期间点击/定时器/rAF 全部排队顺延`,
  });
  onEvent({ kind: 'done', text: '✅ 循环结束，事件循环这才处理攒下的任务' });
  onDone();
}

/* ---------- 对照组 B：微任务链续片（看似异步，其实一步没让；带看门狗防卡死） ---------- */
export function runMicroChain(q, { onEvent, onDone, sliceMs = WORK_MS, maxSlices = MICRO_MAX }) {
  return runSliced(q, { onEvent, onDone, sliceMs, yieldWay: 'micro', maxSlices });
}
