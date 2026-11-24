// ① busyWork 真身：烧时间专用——从 start 起空转 ms 毫秒，期间 CPU 全被它占着
function busyWork(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {}   // 循环体是空的：纯耗时间，不让它闲着 ✔
}

// ② queue 的真身：shared.js 的 createQueue() —— 一个闭包私有数组 + 三个动作
function createQueue() {
    const tasks = [];                        // 队列本体，外面摸不到
    return {
        peek: () => tasks[0] || null,          // 只看队首，不取出
        add(kind, fn, label) {
            const task = { kind, fn, label, t0: Date.now() };
            kind === 'urgent' ? tasks.unshift(task) : tasks.push(task); // 紧急插队首 / 循环排队尾
        },
        next: () => tasks.shift() || null,     // 取出并删除队首
    };
}

// ③ 调度器：shared.js 的 runSliced 全文——B/C 共用这一份，差异只在调用参数：
//    B：runMicroChain → yieldWay:'micro' + 看门狗 20 片强制停；C：默认 yieldWay:'timeout'，无限跑
function maybePromise(r) {                 // 兼容同步 / Promise 两种任务
    return r && typeof r.then === 'function' ? r : Promise.resolve(r);
}

export function runSliced(q, { onEvent, onDone, sliceMs = WORK_MS, yieldWay = 'timeout', maxSlices = Infinity }) {
    let i = 0;             // 已跑的循环片数
    let stopped = false;   // 协作式停止的唯一开关（cancel() 只置它）
    const latencies = [];  // 每个 urgent 的排队等待 ms，结束时交给 onDone

    function stop(text) {  // 体面退场：发结束日志 + 回收延迟数据
        onEvent({ kind: 'done', text });
        onDone(latencies);
    }

    async function step() {
        if (stopped) {       // cancel() 置的标志要到让步点才被读到——协作式，不是抢占
            return stop(yieldWay === 'micro'
                ? '⏹ 已停止 — 注意：微任务链里 cancel() 只能在下一个 await 点被读到（实跑时靠看门狗兜底）'
                : '⏹ 已停止 — cancel() 在下一个让步点被读到（协作式退场，不是抢占）');
        }
        // —— 让步点 1：队首是 urgent 就先挨个跑掉（你点「⚡ 插入紧急任务」就是 add('urgent') 进这里）
        while (q.peek() && q.peek().kind === 'urgent') {
            const t = q.next();
            onEvent({ kind: 'urgent', text: `⚡ 优先执行插队任务「${t.label}」（排队等了 ${Date.now() - t.t0}ms）` });
            await maybePromise(t.fn());  // 真跑任务本身（按钮传的是空任务，靠下一行烧时间）
            busyWork(URGENT_MS);         // 紧急任务本身也真忙一会儿
            latencies.push(Date.now() - t.t0);
        }
        if (i >= maxSlices) {          // 看门狗：B 组微任务链跑满 20 片强制停，防页面永久卡死
            return stop(yieldWay === 'micro'
                ? `⛔ 微任务链跑了 ${maxSlices} 片没让过一次路，看门狗强制停止（否则页面永久卡死）`
                : '⛔ 触发看门狗上限，强制停止');
        }
        // —— 主循环干活：所谓「普通任务」就是这一片（它不走队列，它就是循环自身）
        i += 1;
        const label = yieldWay === 'micro'
            ? `🔁 第 ${i} 片（微任务链从未让路 · 已连续霸占约 ${i * sliceMs}ms）`
            : `🔁 第 ${i} 片 · 忙 ${sliceMs}ms`;
        onEvent({ kind: 'slice', text: label, ms: sliceMs });
        busyWork(sliceMs);
        // —— 让步点 2：让出事件循环，外层新宏任务（点击）在这之后才被处理
        if (yieldWay === 'timeout') await new Promise((r) => setTimeout(r, 0)); // C：宏任务让步 ✅ 事件循环能转一圈
        else await Promise.resolve();                                          // B：微任务续片 ❌ 微任务队列永远清不完
        step();                        // 下一片，回到让步点 1
    }

    step();                          // 立刻开跑第一片
    return {
        cancel() {                     // 停止 = 只置标志：手头这片跑完，下个让步点体面退场
            if (stopped) return;
            stopped = true;
        },
    };
}
runSliced(createQueue())