import { useEffect, useRef, useState } from 'react'
import {
  createQueue,
  runSliced,
  runMicroChain,
  busyWork,
  WORK_MS,
  URGENT_MS,
  MICRO_MAX,
} from './shared.js'
import { highlightJs } from './highlight.jsx'

/* =========================================================
 * ⚔️ 实跑对拍：忙循环 vs 时间切片 + 优先级队列
 * ---------------------------------------------------------
 * 两种跑法都用真函数（shared.js）在主线程上真跑：
 *   B 微任务连续片 —— 「假异步」：await Promise.resolve() 从不让出宏任务队列
 *   C 切片+让步    —— 正解：每片之间清 urgent 队列 + setTimeout 让路
 * 「插入紧急任务」按钮的响应延迟（排队等待 ms）当场量出来。
 * ========================================================= */

const MODES = [
  {
    id: 'micro',
    tab: 'B · 微任务续片（假异步）',
    hint: `循环虽然切成了片，但每片之间只 await 微任务、从不让出事件循环：新宏任务（点击）照样进不来。也因为停不下来，它只跑 ${MICRO_MAX} 片就被看门狗强制停止——真写成无限微任务链，页面会永久卡死。先「预埋」一个紧急任务再开跑，它倒真能优先——因为早就在自家队列里。`,
  },
  {
    id: 'sliced',
    tab: 'C · 切片 + 让步（正解）',
    hint: `每片忙 ${WORK_MS}ms（不让它闲着），片间先清空 urgent 再 setTimeout 让路。跑起来后点「插入紧急任务」：下一片开始前它就优先执行了，等待时间当场量给你看。循环不会自己停——它真是一个“不闲着”的循环，点「⏹ 停止」才能在下一个让步点把它请下来。`,
  },
]

/* 下面各段都是真实跑的代码：①shared.js 里的 createQueue + runSliced 核心段（注释有压缩），
 * B/C 两版只差让步行——shared.js 里由 yieldWay 参数切换 */
const CODE_CORE = `// ① queue 的真身：shared.js 的 createQueue() —— 一个闭包私有数组 + 三个动作
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

// ② 调度器：shared.js 的 runSliced 核心段（q 就是 createQueue() 的返回）
async function step() {
  // 让步点：队首是 urgent 就先挨个跑掉（你点「⚡ 插入紧急任务」就是 add('urgent') 进这里）
  while (q.peek() && q.peek().kind === 'urgent') {
    const t = q.next();
    onEvent({ kind: 'urgent', text: \`⚡ 优先执行「\${t.label}」（排队等了 \${Date.now() - t.t0}ms）\` });
    busyWork(URGENT_MS);                   // 紧急任务本身也真忙一会儿
  }
  busyWork(WORK_MS);                       // 再干一片循环任务：不闲着
  await new Promise((r) => setTimeout(r, 0)); // 让出事件循环：外层新任务在这之后被处理
  step();                                  // 下一片，回到让步点（没有片数上限，一直跑）
}
// 停止 = 协作式：cancel() 只置一个 stopped 标志，
// step 在下个让步点读到它才体面退场——正在忙的那一片依旧跑完`

// B 组真跑的版本：与 C 版只有「让步行」不同（shared.js 里由 yieldWay 参数切换）——
// await Promise.resolve() 只排微任务：微任务队列永远清不完，事件循环轮不到新宏任务。
// 差异行如实替换，避免「展示 setTimeout、实际跑 Promise.resolve」的误导
const CODE_CORE_MICRO = CODE_CORE
  .replace(
    'await new Promise((r) => setTimeout(r, 0)); // 让出事件循环：外层新任务在这之后被处理',
    'await Promise.resolve();                    // 只排微任务：从不让出事件循环，点击等新宏任务永远挤不进来'
  )
  .replace(
    '下一片，回到让步点（没有片数上限，一直跑）',
    '下一片，回到让步点（片数由看门狗上限兜底，到点强制停——真无限跑页面会永久卡死）'
  )
  .replace(
    '// 停止 = 协作式：cancel() 只置一个 stopped 标志，\n// step 在下个让步点读到它才体面退场——正在忙的那一片依旧跑完',
    '// 停止 = 协作式：cancel() 置 stopped 标志，但微任务链里只有下个 await 点能读到它，\n// 实际退场靠看门狗兜底强制停——「停不下来」是 B 组暴露的第二个问题'
  );

function badgeOf(kind) {
  if (kind === 'slice') return { label: '🔁 循环片', cls: 'slice' };
  if (kind === 'urgent') return { label: '⚡ 紧急', cls: 'urgent' };
  if (kind === 'click') return { label: '🖱️ 点击', cls: 'click' };
  if (kind === 'done') return { label: '✅ 结束', cls: 'done' };
  return { label: 'ℹ️ 信息', cls: 'info' };
}

export default function RunDemo() {
  const [mode, setMode] = useState('sliced');
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);
  const [latencies, setLatencies] = useState([]);
  const [fps, setFps] = useState(0);
  const queueRef = useRef(null);
  if (!queueRef.current) queueRef.current = createQueue(); // 渲染期惰性初始化，不走 setState
  const cancelRef = useRef(null);
  const startRef = useRef(performance.now()); // 未开跑时的时间基准 = 组件挂载时刻
  const clickCountRef = useRef(0);

  /* rAF 心跳：主线程被占住时它就不跳 —— 页面卡不卡一眼可见 */
  useEffect(() => {
    let alive = true;
    let last = performance.now();
    let frames = 0;
    (function tick() {
      if (!alive) return;
      requestAnimationFrame(() => {
        frames += 1;
        const now = performance.now();
        if (now - last >= 200) {
          setFps(Math.round((frames * 1000) / (now - last)));
          frames = 0;
          last = now;
        }
        tick();
      });
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => () => cancelRef.current?.cancel(), []); // 卸载时停掉在跑的调度器

  const push = (kind, text) =>
    setEvents((prev) => [...prev, { kind, text, t: Math.round(performance.now() - startRef.current) }]);

  const init = () => {
    cancelRef.current?.cancel();
    setEvents([]);
    setLatencies([]);
    clickCountRef.current = 0;
    queueRef.current = createQueue();
  };

  const pickMode = (id) => { setMode(id); init(); };

  const start = () => {
    startRef.current = performance.now();
    setRunning(true);
    setLatencies([]);
    const q = queueRef.current;
    const onEvent = (ev) => {
      push(ev.kind, ev.text);
      if (ev.kind === 'urgent') {
        const m = /排队等了 (\d+)ms/.exec(ev.text);
        if (m) setLatencies((prev) => [...prev, { wait: Number(m[1]) }]);
      }
    };
    const onDone = () => setRunning(false);
    if (mode === 'micro') {
      cancelRef.current = runMicroChain(q, { onEvent, onDone });
    } else {
      cancelRef.current = runSliced(q, { onEvent, onDone });
    }
  };

  /* 「插入紧急任务」：模拟外层新任务到来 */
  const urgentLabel = () => `紧急任务 #${clickCountRef.current + 1}`;
  const insertUrgent = () => {
    clickCountRef.current += 1;
    queueRef.current.add('urgent', () => busyWork(0), urgentLabel());
    push('click', `🖱️ 外头来了新任务「${urgentLabel()}」→ 已插到队列最前面`);
  };

  const waits = latencies.map((l) => l.wait).filter((w) => w !== null);
  const avg = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : null;

  return (
    <div className="demo-wrap sp-root">
      <div className="demo-header">
        <h2>⚔️ 实跑对拍 · 循环不许闲着，新任务却要优先</h2>
        <p className="demo-sub">
          面试原题：<b>「写一段代码，函数里有个循环不让它闲着；外头来了新任务，能优先执行」</b>。
          关键矛盾：JS 单线程，<b>纯同步循环绝不可能被中断</b>——正解是把循环切成片，
          <b>片间留出让步点</b>。下面两种跑法都是真的在主线程上执行，右下角
          <b>rAF 心跳</b>和<b>等待毫秒数</b>会诚实告诉你页面卡没卡。
        </p>
      </div>

      {/* ① 模式选择 + 核心代码 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">🎬 选一种跑法</span>
          <span className="sp-card-src">shared.js · runSliced / runMicroChain</span>
        </div>
        <div className="sp-picks">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={m.id === mode ? 'sp-pick active' : 'sp-pick'}
              onClick={() => pickMode(m.id)}
              disabled={running}
            >
              {m.tab}
            </button>
          ))}
        </div>
        <pre className="sp-code">{highlightJs(mode === 'micro' ? CODE_CORE_MICRO : CODE_CORE)}</pre>
        <p className="sp-hint">💡 {MODES.find((m) => m.id === mode).hint}</p>
      </section>

      {/* ② 控制台 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">🖥️ 执行日志（真实顺序 + 相对毫秒）</span>
          <div className="sp-controls">
            <button className="sp-btn" onClick={init} disabled={running}>⏮ 重置</button>
            <button
              id="sp-urgent-btn"
              className="sp-btn sp-btn-urgent"
              onClick={insertUrgent}
              disabled={running}
            >
              ⚡ {running ? '插入紧急任务（下一让步点优先跑）' : '先预埋一个紧急任务'}
            </button>
            <button className="sp-btn sp-btn-play" onClick={start} disabled={running}>▶ 开跑</button>
            <button
              className="sp-btn sp-btn-stop"
              onClick={() => cancelRef.current?.cancel()}
              disabled={!running}
              title={mode === 'micro' ? '微任务链里 cancel() 只能在 await 点被读到，实际退出靠看门狗' : '在下一个让步点体面停止循环'}
            >
              ⏹ 停止
            </button>
          </div>
        </div>

        <div className="sp-stage">
          <div className="sp-log">
            {events.length === 0 && (
              <p className="sp-empty">
                还没开跑。建议姿势：选 <b>C · 切片 + 让步</b>，点「▶ 开跑」，
                然后在它跑的过程中连点两次 <b>⚡ 插入紧急任务</b>，看它在哪一帧被优先执行、等了多少毫秒；
                看完点 <b>⏹ 停止</b>——循环没有片数上限，它真会一直跑。
              </p>
            )}
            {events.map((e, i) => {
              const b = badgeOf(e.kind);
              return (
                <div key={i} className={'sp-line' + (i === events.length - 1 ? ' sp-line-now' : '')}>
                  <span className={`sp-badge sp-badge-${b.cls}`}>{b.label}</span>
                  <span className="sp-time">t+{e.t}ms</span>
                  <span className="sp-line-text">{e.text}</span>
                </div>
              );
            })}
          </div>

          <aside className="sp-side">
            <div className={'sp-fps' + (fps < 5 && fps > 0 ? ' sp-fps-frozen' : running && fps === 0 ? ' sp-fps-frozen' : '')}>
              <span className="sp-col-title">🫀 rAF 心跳（页面卡不卡）</span>
              <span className="sp-fps-num">{fps === 0 ? '🧊 冻住' : `${fps} fps`}</span>
            </div>
            <div className="sp-col-title">📊 时间轴（宽 = 占用时长）</div>
            <div className="sp-timeline">
              {events.filter((e) => e.kind === 'slice' || e.kind === 'urgent').map((e, i) => (
                <span
                  key={i}
                  className={'sp-bar-' + (e.kind === 'slice' ? 'slice' : 'urgent')}
                  style={{ flexGrow: e.kind === 'slice' ? WORK_MS : URGENT_MS }}
                  title={e.text}
                />
              ))}
              {events.some((e) => e.kind === 'slice' || e.kind === 'urgent') === false && (
                <span className="sp-q-empty">（开跑后出现）</span>
              )}
            </div>
            <ul className="sp-legend">
              <li><span className="sp-dot sp-dot-slice" />🔁 循环片 {WORK_MS}ms（不许闲着）</li>
              <li><span className="sp-dot sp-dot-urgent" />⚡ 紧急任务 {URGENT_MS}ms（队首优先）</li>
            </ul>
          </aside>
        </div>

        {/* ③ 对拍结论 */}
        {!running && events.length > 0 && (
          <div className={'sp-verdict sp-verdict-' + mode}>
            {mode === 'micro' && (
              <>🎭 <b>结论</b>：await 微任务续片 = 「假异步」。切片之间从没让出事件循环，
                跑完前点进来的新任务进不了队列（只有早就预埋进自家队列的才被优先）。
                微任务检查点清不干净就永不进入宏任务 —— 这也是 <b>微任务占星</b> 陷阱。</>
            )}
            {mode === 'sliced' && (
              <>✅ <b>结论</b>：{latencies.length === 0
                ? '循环可以永不停机地跑下去（这就是“不闲着”），点「⏹ 停止」它才在让步点退场；你没插紧急任务——点 ⚡ 再跑一遍试试。'
                : `插了 ${latencies.length} 个紧急任务，平均排队 ${avg}ms、最多 ${Math.max(...waits)}ms 就被优先执行，其余时间循环一片没少干；这条结论是按下「⏹ 停止」后才敢下的。`}
                {' '}这就是 React Fiber 时间切片 / scheduler 的雏形。</>
            )}
          </div>
        )}
      </section>

      <p className="sp-hint sp-note">
        ⚠️ 诚实声明：日志里的毫秒是本机真实测量，机器忙时数字会浮动；
        「优先」的代价是让步点之间的窗口（≈一片 {WORK_MS}ms + 一次宏任务切换），做不到零延迟——单线程没有真抢占，见「本质与陷阱」。
      </p>
    </div>
  );
}
