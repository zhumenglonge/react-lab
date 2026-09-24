/* =========================================================
 * 共享数据与纯函数：Array.prototype.some vs every
 * ---------------------------------------------------------
 * 只放「能被当场执行」的采集逻辑和用例，不含组件，
 * 以满足 react-refresh（组件与非组件导出分文件）的约定。
 * ========================================================= */

/* ---------- 带「短路计数」的执行器 ----------
 * 通过包装谓词，统计数组实际被检查了几个元素，
 * 直观展示 some / every 一旦能判定结果就立刻停止遍历。 */

export function runSome(array, pred) {
  let checked = 0
  const result = array.some((v, i) => {
    checked += 1
    return pred(v, i)
  })
  return { result, checked, total: array.length }
}

export function runEvery(array, pred) {
  let checked = 0
  const result = array.every((v, i) => {
    checked += 1
    return pred(v, i)
  })
  return { result, checked, total: array.length }
}

/* ---------- 用例清单 ----------
 * 每个用例：一条真实数组 + 一个谓词，配一句教学要点。 */

export const CASES = [
  {
    id: 'gt2',
    label: '是否存在 > 2 的元素',
    array: [1, 2, 3, 4, 5],
    predLabel: 'v => v > 2',
    pred: (v) => v > 2,
    note: 'some 扫到第 3 个（3 > 2）命中就停；every 第 1 个（1）不满足就停——各自在能判定的那一刻短路。',
  },
  {
    id: 'all-even',
    label: '是否全部为偶数',
    array: [2, 4, 6, 7, 8],
    predLabel: 'v => v % 2 === 0',
    pred: (v) => v % 2 === 0,
    note: 'every 扫到第 4 个（7 是奇数）即可判定 false；some 只要找到第一个偶数就 true。',
  },
  {
    id: 'has-nan',
    label: '是否存在 NaN',
    array: [1, 2, NaN, 4],
    predLabel: 'v => Number.isNaN(v)',
    pred: (v) => Number.isNaN(v),
    note: 'some 常用于「校验有没有非法值」；这里扫到第 3 个命中。',
  },
  {
    id: 'all-truthy',
    label: '是否全部为真值',
    array: [1, 'a', 0, true],
    predLabel: 'v => Boolean(v)',
    pred: (v) => Boolean(v),
    note: 'every 扫到第 3 个（0 是假值）就返回 false。',
  },
  {
    id: 'empty',
    label: '空数组陷阱',
    array: [],
    predLabel: 'v => true（任意）',
    pred: () => true,
    note: '⚠️ 空数组：some() 恒为 false，every() 恒为 true（“空真/vacuous truth”），且都不调用回调。这是最高频的坑。',
  },
]
