import { useState } from 'react'
import {
  DEDUP_METHODS,
  bench,
  fmtArr,
  dedupSet,
  dedupIndexOf,
  dedupFilter,
  dedupMap,
  dedupSortAdjacent,
  dedupReduce,
} from './shared.js'

/* =========================================================
 * ⚔️ 实跑对拍：同一个数字数组，6 种去重写法当场各跑一遍
 * ---------------------------------------------------------
 * 输入可改（逗号/空格分隔），点「跑一遍」六种结果并排对比；
 * 底部「性能基准」真计时：Set/Map/sort 喂 5 万项，indexOf 只喂 5 千
 * （O(n²) 的量级差距亲眼可见，这就是面试话术里"为什么首选 Set"的实证）。
 * ========================================================= */

const DEFAULT_INPUT = '1, 2, 2, 3, 3, 3, 4, 1, 5, NaN, 0, -0, NaN, 5'

// 解析用户输入：支持逗号/空格分隔，允许 NaN / -0 字面量，非法 token 直接丢弃
function parseInput(text) {
  return text
    .split(/[,，\s]+/)
    .filter(Boolean)
    .map((t) => (/^nan$/i.test(t) ? NaN : Number(t)))
    .filter((n, i) => !Number.isNaN(n) || /^nan$/i.test(text.split(/[,，\s]+/).filter(Boolean)[i]))
}

// key → 实现，全部引用 shared.js 里那份（面试手写标准答案）
const IMPL = {
  set: dedupSet,
  indexOf: dedupIndexOf,
  filter: dedupFilter,
  map: dedupMap,
  sort: dedupSortAdjacent,
  reduce: dedupReduce,
}

export default function RunDemo() {
  const [input, setInput] = useState(DEFAULT_INPUT)
  const [results, setResults] = useState(null)
  const [benchResult, setBenchResult] = useState(null)

  const run = () => {
    const arr = parseInput(input)
    if (!arr.length) {
      setResults(null)
      return
    }
    setResults({ arr, rows: DEDUP_METHODS.map((m) => ({ ...m, out: IMPL[m.key](arr) })) })
  }

  const runBench = () => setBenchResult(bench(50000))

  return (
    <div className="dedup-root">
      <div className="demo-header">
        <h2>⚔️ 六种去重写法，同一条数组并排真跑</h2>
        <p className="demo-sub">
          面试原题<b>「一个数字数组，怎么去重？」</b>。改一改输入（支持 NaN、-0），
          点运行看六种写法的<b>真实返回</b>；NaN 在哪些方法里"去不掉"，一眼对拍出来。
        </p>
      </div>

      <div className="dedup-card">
        <div className="dedup-toolbar">
          <label className="dedup-field">
            数组
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="1, 2, 2, 3…"
            />
          </label>
          <button className="dedup-primary" onClick={run}>▶ 跑一遍六种方法</button>
        </div>

        {results ? (
          <>
            <p className="dedup-input-line">
              原始数组 <code>{fmtArr(results.arr)}</code>（{results.arr.length} 项）
            </p>
            <div className="dedup-results">
              {results.rows.map((r) => (
                <div key={r.key} className="dedup-row">
                  <div className="dedup-row-head">
                    <span className="dedup-row-name">{r.name}</span>
                    <code className="dedup-row-src">{r.src}</code>
                  </div>
                  <code className="dedup-row-out">{fmtArr(r.out)}</code>
                  <p className="dedup-row-note">{r.note}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="dedup-empty">还没跑 —— 点上面按钮，六种写法的结果会在这里并排展开。</p>
        )}
      </div>

      <div className="dedup-card">
        <div className="dedup-card-head">
          <span className="dedup-card-title">⏱ 性能基准：为什么大数据量首选 Set</span>
          <code className="dedup-card-src">performance.now() 真计时，每次点击都是新样本</code>
        </div>
        <div className="btn-row">
          <button className="dedup-primary" onClick={runBench}>跑 5 万项基准</button>
          {benchResult && (
            <span className="dedup-chip">
              本次去重结果：<b>{benchResult.set.len}</b> / {benchResult.n} 项唯一
            </span>
          )}
        </div>
        {benchResult ? (
          <table className="dedup-table">
            <thead>
              <tr><th>方法</th><th>数据量</th><th>耗时</th><th>量级</th></tr>
            </thead>
            <tbody>
              <tr><td>① Set 展开</td><td>50,000</td><td><b>{benchResult.set.ms.toFixed(1)} ms</b></td><td>O(n)</td></tr>
              <tr><td>④ Map 标记</td><td>50,000</td><td><b>{benchResult.map.ms.toFixed(1)} ms</b></td><td>O(n)</td></tr>
              <tr><td>⑤ sort + 相邻比较</td><td>50,000</td><td><b>{benchResult.sort.ms.toFixed(1)} ms</b></td><td>O(n log n)</td></tr>
              <tr><td>② indexOf 双循环</td><td>5,000（只敢喂 1/10）</td><td><b>{benchResult.indexOfSmall.ms.toFixed(1)} ms</b></td><td>O(n²)，5 千已如此，5 万耗时约再×100</td></tr>
            </tbody>
          </table>
        ) : (
          <p className="dedup-empty">indexOf 版是 O(n²)，每项都要线性扫结果数组；数据量从 5 千扩到 5 万（×10），耗时量级是平方（×100）。所以基准里它只喂 5 千项，量级差距已经很明显。</p>
        )}
      </div>
    </div>
  )
}

