/* =========================================================
 * 🎯 面试总结：话术模板 + 手写代码 + 高频追问
 * ---------------------------------------------------------
 * 答题框架：先复述三条要求 → 给双指针解 + 不变式 → 报复杂度 → 补一句真值判断。
 * ========================================================= */

export default function Summary() {
  return (
    <div className="mz-root mz-summary">
      <div className="demo-header">
        <h2>🎯 30 秒讲清「移动零」，再接住追问</h2>
        <p className="demo-sub">
          题不难，但要一次命中<b>原地 / 单趟 / 保序 / 最少操作</b>四条，并主动点出真值判断的坑。
        </p>
      </div>

      <section className="mz-block">
        <h3>话术模板（要求 → 解法 → 不变式 → 复杂度 → 加分点）</h3>
        <blockquote className="mz-quote">
          <p>
            「这题要满足三点：<b>原地修改、尽量少的操作、非零元素相对顺序不变</b>。我用<b>双指针</b>：
            <code>slow</code> 指向下一个非零该放的位置，<code>fast</code> 从头扫描。」
          </p>
          <p>
            「fast 遇到 0 就跳过，遇到非零就把它<b>和 slow 位置交换</b>然后 slow++。不变式是：
            slow 左边全是已就位的非零、中间全是 0。一趟 O(n) 走完，非零保持原顺序聚在左边，0 全到右边，
            空间 O(1)，交换次数等于非零元素跨越的 0 的个数——是最少的。」
          </p>
          <p>
            「补充两点：判据一定写 <code>x !== 0</code> 而不是 <code>if (x)</code>，
            否则 false / 空串 / null 会被误当 0 移走；如果面试官不要求原地，一行
            <code>[...a.filter(x=&gt;x!==0), ...a.filter(x=&gt;x===0)]</code> 也能过，但会新建数组。」
          </p>
        </blockquote>
      </section>

      <section className="mz-block">
        <h3>手写区：面试纸上要能默写出来的两段</h3>
        <pre className="mz-code mz-code-full">{`// ① 双指针交换（原地、单趟、保序、最少操作）—— LeetCode 283 首选
function moveZeroes(nums) {
  let slow = 0
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== 0) {          // 只认数字 0，别用 if (nums[fast])
      ;[nums[slow], nums[fast]] = [nums[fast], nums[slow]]
      slow++
    }
  }
  return nums
}
// [1,2,0,0,4,5,6] -> [1,2,4,5,6,0,0]

// ② 覆盖写 + 补零（赋值次数 = 数组长度）
function moveZeroesWrite(nums) {
  let slow = 0
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) nums[slow++] = nums[i]
  }
  while (slow < nums.length) nums[slow++] = 0   // 别忘了把尾部补 0
  return nums
}`}</pre>
      </section>

      <section className="mz-block">
        <h3>高频追问</h3>
        <ul className="mz-list">
          <li><b>「能原地吗？空间多少？」</b>双指针是原地 O(1)；filter 版新建数组 O(n)，若题目要求原地就不能用。</li>
          <li><b>「非零元素相对顺序会变吗？」</b>不会。slow 只在遇到非零时前进，非零按出现先后依次就位，天然稳定。会变顺序的是两端向中间逼近的 partition 写法。</li>
          <li><b>「操作次数最少怎么理解？」</b>交换版每个非零最多被交换一次、0 从不主动搬动，写次数最少；覆盖写版正好写 n 次。都能做到单趟 O(n)。</li>
          <li><b>「数组里有 false / null / 空串怎么办？」</b>它们是"非零"，不该移动——所以判据必须是 <code>!== 0</code>，不能写 <code>if (x)</code>（本页 truthy 对拍实测会把 false/null 一起移走）。</li>
          <li><b>「-0 会怎样？」</b><code>-0 === 0</code> 为 true，会被当成 0 一起移到末尾，通常符合预期；要精确区分 -0 得用 <code>Object.is(x, 0)</code>。</li>
          <li><b>「改成删除所有 0 呢？」</b>双指针框架一样，只是收尾不同：删除版返回 <code>nums.slice(0, slow)</code>（或改长度），移动版把 [slow, n) 补 0。先跟面试官确认题意是"移动"还是"删除"。</li>
        </ul>
      </section>
    </div>
  )
}
