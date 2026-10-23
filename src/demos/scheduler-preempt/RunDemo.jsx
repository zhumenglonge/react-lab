import { useEffect, useRef, useState } from 'react'
import {
  createQueue,
  runSliced,
  runNaive,
  runMicroChain,
  busyWork,
  WORK_MS,
  URGENT_MS,
  NAIVE_MS,
  MICRO_MAX,
} from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：忙循环 vs 时间切片 + 优先级队列
 * ---------------------------------------------------------
 * 三种跑法都用真函数（shared.js）在主线程上真跑：
 *   A 裸同步循环   —— 期间点击/定时器全部排队，rAF 计数器卡死
 *   B 微任务连续片 —— 「假异步」：await Promise.resolve() 从不让出宏任务队列
 *   C 切片+让步    —— 正解：每片之间清 urgent 队列 + setTimeout 让路
 * 「插入紧急任务」按钮的响应延迟（排队等待 ms）当场量出来。
 * ========================================================= */

const MODES = [
  {
    id: 'naive',
    tab: 'A · 裸同步循环（错误示范）',
    hint: `一整段 ${NAIVE_MS}ms 的 while 占住调用栈。跑起来之后狂点「插入紧急任务」：按钮不会立刻响应，rAF 计数器直接冻住——事件全在排队。`,
  },
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

/* 下面两段都是真实跑的代码：①shared.js 里的 createQueue + runSliced 核心段（注释有压缩）；②runNaive 全文 */
const CODE_CORE = `// ① queue 的真身：shared.js 的 createQueue() —— 一个闭包私有数组 + 三个动作
function createQueue() {
  const tasks = [];                        // 队列本体，外面摸不到
  return {
    peek: () => tasks[0] || null,          // 只看队首，不取出
    add(kind, fn, label) {
      const task = { kind, fn, label, t0: Date.now() };
      kind === 'urgent' ? tasks.unshift(task)  // 紧急任务：插队首
                        : tasks.push(task);    // 循环任务：排队尾
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

const CODE_NAIVE = `// A 组真跑的 runNaive（shared.js）：一整段同步 while，占死主线程
function runNaive({ totalMs }) {
  busyWork(totalMs);      // 里面就是 while (Date.now() - start < ms) {} —— 不让它闲着 ✔
  // 但没有任何让步点：期间点击/定时器/rAF 全部排队，新任务永远轮不到 ✘
}`;

function badgeOf(kind) {
  if (kind === 'slice') return { label: '🔁 循环片', cls: 'slice' };
  if (kind === 'urgent') return { label: '⚡ 紧急', cls: 'urgent' };
  if (kind === 'click') return { label: '🖱️ 点击', cls: 'click' };
  if (kind === 'gap') return { label: '🧊 冻结', cls: 'gap' };
  if (kind === 'done') return { label: '✅ 结束', cls: 'done' };
  return { label: 'ℹ️ 信息', cls: 'info' };
}

export default function RunDemo() {
  const [mode, setMode] = useState('sliced');
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);
  const [latencies, setLatencies] = useState([]);
  const [fps, setFps] = useState(0);
  const [accumulated, setAccumulated] = useState(0); // naive 模式：冻结期间积压的点击数
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
    setAccumulated(0);
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
    if (mode === 'naive') {
      clickCountRef.current = 0;
      // 先让出一拍，让「冻结前」的状态先渲染出来，再同步死循环
      setTimeout(() => {
        runNaive({ onEvent, onDone });
        // 冻结期间积压的点击：要等事件循环恢复后、作为后续宏任务才派发——
        // 所以再延后一拍去读计数（这个细节本身就是本题的考点）
        setTimeout(() => {
          const clicks = clickCountRef.current;
          if (clicks > 0) {
            push('click', `🖱️ 冻结期间积压了 ${clicks} 次点击 → 事件循环恢复后才挨个派发（onClick 回调是积压的宏任务）`);
            push('urgent', `⚡ 紧急任务第 1 个此刻才执行，其余 ${Math.max(0, clicks - 1)} 个继续排队 — 全程零优先`);
            setAccumulated(clicks);
          }
        }, 0);
      }, 60);
    } else if (mode === 'micro') {
      cancelRef.current = runMicroChain(q, { onEvent, onDone });
    } else {
      cancelRef.current = runSliced(q, { onEvent, onDone });
    }
  };

  /* 「插入紧急任务」：模拟外层新任务到来 */
  const urgentLabel = () => `紧急任务 #${clickCountRef.current + 1}`;
  const insertUrgent = () => {
    clickCountRef.current += 1;
    if (mode === 'naive') return; // naive：能点进来说明循环已结束，真实积压数在开跑流程里统计
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
          <b>片间留出让步点</b>。下面三种跑法都是真的在主线程上执行，右下角
          <b>rAF 心跳</b>和<b>等待毫秒数</b>会诚实告诉你页面卡没卡。
        </p>
      </div>

      {/* ① 模式选择 + 核心代码 */}
      <section className="sp-card">
        <div className="sp-card-head">
          <span className="sp-card-title">🎬 选一种跑法</span>
          <span className="sp-card-src">shared.js · runSliced / runNaive / runMicroChain</span>
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
        <pre className="sp-code">{mode === 'naive' ? CODE_NAIVE : CODE_CORE}</pre>
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
              disabled={running && mode !== 'naive'}
            >
              ⚡ {mode === 'naive' ? '在冻结期间点我试试' : running ? '插入紧急任务（下一让步点优先跑）' : '先预埋一个紧急任务'}
            </button>
            <button className="sp-btn sp-btn-play" onClick={start} disabled={running}>▶ 开跑</button>
            <button
              className="sp-btn sp-btn-stop"
              onClick={() => cancelRef.current?.cancel()}
              disabled={!running || mode === 'naive'}
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
            {mode === 'naive' && (
              <>🧊 <b>结论</b>：错得最直白——循环确实没闲着，但紧急任务要等整整 {NAIVE_MS}ms
                {accumulated > 0 ? `（你这期间点了 ${accumulated} 次，全部积压到循环结束后才派发）` : '（点 ⚡ 按钮试试，它根本不理你）'}。
                期间 rAF 冻住。这版代码面试写出来直接挂。</>
            )}
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
