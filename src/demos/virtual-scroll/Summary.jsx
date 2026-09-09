/* =========================================================
 * 场景 ③：面试总结页
 * ---------------------------------------------------------
 * 一句话概括 / 核心原理 / 方案对比 / 定高vs不定高 / 面试话术 /
 * 常见误区 / 主流库选型 / 什么时候不需要
 * ========================================================= */

export default function Summary() {
  return (
    <div className="demo-wrap vs-summary">
      <section className="vs-block">
        <h3>🧠 一句话概括</h3>
        <blockquote>
          <p>
            <b>虚拟滚动</b>（Virtual Scrolling，又叫虚拟列表 Virtual List / 窗口化 Windowing）：
            不管列表有多少条数据，<b>只渲染可视区 + 少量缓冲</b>的那几十个 DOM 节点，
            滚动时动态回收移出屏幕的、渲染新进入屏幕的。
          </p>
          <p>
            它把 DOM 数量从 <b>O(n)</b>（n = 总条数）降到 <b>O(可视条数)</b>，
            从根本上解决长列表的<b>卡顿、内存暴涨、首屏慢</b>。
          </p>
        </blockquote>
      </section>

      <section className="vs-block">
        <h3>⚙️ 核心原理（5 步）</h3>
        <ol className="vs-flow">
          <li><b>撑开总高度</b>：用 spacer 撑起 <code>itemCount × itemHeight</code>，滚动条长度才正确</li>
          <li><b>监听滚动</b>：拿到容器的 <code>scrollTop</code></li>
          <li><b>计算可见区间</b>：<code>firstVisible = floor(scrollTop / itemHeight)</code>，再推出 start / end</li>
          <li><b>加缓冲 overscan</b>：上下各多渲染几条，防止快速滚动时露白</li>
          <li><b>定位渲染</b>：只渲染这一段，用<b>绝对定位</b>（<code>top = i × itemHeight</code>）或 <code>translateY</code> 放到正确位置</li>
        </ol>
      </section>

      <section className="vs-block">
        <h3>📊 长列表四种方案对比</h3>
        <table className="vs-compare">
          <thead>
            <tr><th>方案</th><th>做法</th><th>优点</th><th>缺点</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>全量渲染</td>
              <td>一次性渲染所有条目</td>
              <td>实现最简单，可整页搜索 / 打印</td>
              <td>❌ 数据一多就卡死</td>
            </tr>
            <tr>
              <td>分页</td>
              <td>翻页，每页只加载 N 条</td>
              <td>简单、后端友好、SEO 好</td>
              <td>需点击翻页，浏览体验割裂</td>
            </tr>
            <tr>
              <td>无限滚动</td>
              <td>滚到底部再请求下一批，<b>追加</b>到 DOM</td>
              <td>浏览连贯</td>
              <td>❌ DOM 越滚越多，滚久了照样卡</td>
            </tr>
            <tr>
              <td>虚拟滚动</td>
              <td>只渲染可视区，滚动时<b>复用</b> DOM</td>
              <td>✅ 条数再多也不卡、内存恒定</td>
              <td>实现复杂、不定高难、整页搜索/打印需额外处理</td>
            </tr>
          </tbody>
        </table>
        <p className="tip">
          注意「无限滚动」和「虚拟滚动」常被搞混：前者是<b>数据分批加载</b>（DOM 一直累加），
          后者是<b>渲染按需复用</b>（DOM 恒定）。两者可以叠加使用。
        </p>
      </section>

      <section className="vs-block">
        <h3>📐 定高 vs 不定高（难点在这里）</h3>
        <ul className="vs-list">
          <li>
            <b>定高</b>：最简单，直接 <code>index × itemHeight</code> 算位置（本 demo 就是这种）。
          </li>
          <li>
            <b>不定高</b>的三种思路：
            <ol className="vs-flow">
              <li><b>预估 + 测量</b>：先给个估计高度占位，渲染后用 <code>ResizeObserver</code> 测真实高度并缓存，回写修正总高度和各项位置</li>
              <li><b>前缀和 + 二分查找</b>：维护每项高度的前缀和数组，用 <code>scrollTop</code> 二分定位 <code>startIndex</code></li>
              <li><b>直接上库</b>：<code>@tanstack/react-virtual</code> 内置动态测量，不定高首选</li>
            </ol>
          </li>
        </ul>
      </section>

      <section className="vs-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote>
          <p>
            "虚拟滚动解决的是<b>长列表渲染性能</b>问题。核心思想是：无论数据有多少条，
            DOM 里<b>只保留可视区加上下一点点缓冲</b>的那几十个节点。
          </p>
          <p>
            实现上分几步：先用一个占位元素撑起 <code>总条数 × 每项高度</code> 的总高度，
            让滚动条表现正常；然后监听容器的 <code>scrollTop</code>，
            用 <code>scrollTop / itemHeight</code> 算出当前第一条可见项的索引，
            进而得到需要渲染的 <code>startIndex</code> 和 <code>endIndex</code>；
            最后只渲染这一段，并通过<b>绝对定位</b>或 <code>translateY</code> 把它们放到正确的滚动位置。
          </p>
          <p>
            这里有两个工程细节：一是 <b>overscan 缓冲</b>，上下多渲染几条，
            避免快速滚动时出现白屏；二是<b>不定高</b>列表比较麻烦，
            需要渲染后测量真实高度再回写修正，一般我会直接用 <code>@tanstack/react-virtual</code>
            或 <code>react-window</code> 这类成熟的库，而不是自己造轮子。"
          </p>
        </blockquote>
      </section>

      <section className="vs-block">
        <h3>⚠️ 常见误区</h3>
        <ul className="vs-list">
          <li>
            <b>误区 1</b>：把虚拟滚动当成「懒加载」——
            懒加载是<b>数据层</b>分批请求，虚拟滚动是<b>渲染层</b>只画可视区，两码事（但常配合用）。
          </li>
          <li>
            <b>误区 2</b>：以为加了虚拟滚动就一定快 ——
            如果<b>单项本身渲染很重</b>（复杂计算、深层子组件），可视区那几十条也可能卡，还得配合 <code>memo</code>。
          </li>
          <li>
            <b>误区 3</b>：不定高列表直接套用定高公式 ——
            会导致滚动条跳动、位置错乱、滚动到中间"对不上号"。
          </li>
          <li>
            <b>误区 4</b>：以为虚拟滚动万能 ——
            需要浏览器原生 <code>Ctrl+F</code> 搜索整页、打印全部、或 SEO 抓取首屏内容时，它反而是障碍。
          </li>
        </ul>
      </section>

      <section className="vs-block">
        <h3>🧰 主流库怎么选</h3>
        <table className="vs-compare">
          <thead>
            <tr><th>库</th><th>特点</th><th>适用</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>react-window</code></td>
              <td>轻量、API 简单、体积小</td>
              <td>✅ 定高列表 / 简单网格首选</td>
            </tr>
            <tr>
              <td><code>react-virtualized</code></td>
              <td>功能全（表格、无限加载），但较重</td>
              <td>需要现成复杂组件时</td>
            </tr>
            <tr>
              <td><code>@tanstack/react-virtual</code></td>
              <td>headless（只给逻辑不给样式）、不定高支持最好</td>
              <td>✅ 当下主流、动态高度、要自定义 UI</td>
            </tr>
            <tr>
              <td><code>vue-virtual-scroller</code></td>
              <td>Vue 生态的等价方案</td>
              <td>Vue 项目</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="vs-block">
        <h3>✅ 什么时候「不」需要虚拟滚动</h3>
        <ul className="vs-list">
          <li>条数很少（几十到一两百条），全量渲染毫无压力 —— <b>别过度优化</b></li>
          <li>需要浏览器原生 <code>Ctrl+F</code> 搜索整页内容</li>
          <li>需要打印 / 导出<b>完整</b>列表</li>
          <li>SEO 要求全部内容出现在首屏 HTML 里</li>
        </ul>
        <p className="tip">
          👉 一句话：<b>数据量会持续增长、且以浏览为主</b>的长列表才值得上虚拟滚动；
          否则简单的全量渲染或分页反而更省心。
        </p>
      </section>
    </div>
  )
}
