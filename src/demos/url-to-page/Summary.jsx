/* ==================== 面试总结页 ====================
 * 作用域统一挂在 .up-summary 下，样式自带一份（懒加载不依赖其它主题）。
 * 目标：把"输入 URL 发生了什么"从流程、缓存、渲染、话术四个层面讲透。
 * ========================================================= */

/* 完整流程主线（面试开口第一段就背这个） */
const CACHE_FLOW = `【强缓存】先看本地副本还"新鲜"吗？
  Cache-Control: max-age=3600  （或旧式 Expires）
  ├─ 没过期 → 直接用本地，状态码 200 (from disk/memory cache)，不发请求 ✅
  └─ 过期了 → 进入协商缓存 ↓

【协商缓存】带着"指纹"去问服务器还能不能用
  请求头 If-None-Match: <上次的 ETag>   （或 If-Modified-Since）
  ├─ 资源没变 → 304 Not Modified，用本地副本，不传 body ✅
  └─ 资源变了 → 200 + 新内容，并更新缓存`

export default function Summary() {
  return (
    <div className="demo-wrap up-summary">
      <section className="up-sum-block">
        <h3>🧠 一句话本质</h3>
        <p className="up-lead">
          从输入 URL 到页面展示，本质是一条<b>"先找缓存、再走网络、最后渲染"</b>的流水线：
          浏览器解析 URL → 查缓存 → DNS 把域名解析成 IP → 和服务器建立 TCP(+TLS) 连接 →
          发 HTTP 请求 → 服务器返回响应 → 浏览器把 HTML/CSS 渲染成像素上屏 → 连接收尾。
          答题诀窍是<b>先把主线说顺，再挑环节深挖</b>。
        </p>
      </section>

      <section className="up-sum-block">
        <h3>🚀 完整流程主线（背下来）</h3>
        <p className="up-flowline">
          解析 URL <span>→</span> 查缓存 <span>→</span> DNS 解析 <span>→</span> TCP 三次握手(+TLS)
          <span>→</span> 发 HTTP 请求 <span>→</span> 服务器响应 <span>→</span> 浏览器渲染
          <span>→</span> 断开/复用连接
        </p>
      </section>

      <section className="up-sum-block">
        <h3>📋 各阶段速查表</h3>
        <table className="up-compare">
          <thead>
            <tr><th>阶段</th><th>关键动作</th><th>高频考点</th></tr>
          </thead>
          <tbody>
            <tr><td>URL 解析</td><td>判断网址/搜索词、补协议、百分号编码</td><td>HSTS 强制 HTTPS、URL encode</td></tr>
            <tr><td>查缓存</td><td>强缓存 → 协商缓存 → 命中就不发请求</td><td>Cache-Control / ETag / 304</td></tr>
            <tr><td>DNS 解析</td><td>域名 → IP，多级缓存逐级查</td><td>递归查询 vs 迭代查询</td></tr>
            <tr><td>TCP 连接</td><td>三次握手建连，HTTPS 再 TLS 握手</td><td>为什么是三次、TLS 密钥协商</td></tr>
            <tr><td>HTTP 请求</td><td>请求行 + 请求头 + 请求体</td><td>GET/POST 区别、常见请求头</td></tr>
            <tr><td>服务器响应</td><td>状态行 + 响应头 + 响应体</td><td>状态码 200/301/304/404/500</td></tr>
            <tr><td>浏览器渲染</td><td>DOM/CSSOM → 渲染树 → 布局 → 绘制 → 合成</td><td>回流 vs 重绘、阻塞、async/defer</td></tr>
            <tr><td>连接收尾</td><td>四次挥手断开，或 keep-alive 复用</td><td>TIME_WAIT、HTTP/2 多路复用</td></tr>
          </tbody>
        </table>
      </section>

      <section className="up-sum-block">
        <h3>🗂️ 缓存机制：强缓存 vs 协商缓存（超高频）</h3>
        <table className="up-compare">
          <thead>
            <tr><th>维度</th><th>强缓存</th><th>协商缓存</th></tr>
          </thead>
          <tbody>
            <tr><td>发不发请求</td><td><b>不发</b>，直接用本地副本</td><td><b>发</b>，问服务器"还能用吗"</td></tr>
            <tr><td>控制字段</td><td>Cache-Control: max-age / Expires</td><td>ETag / If-None-Match、Last-Modified / If-Modified-Since</td></tr>
            <tr><td>命中状态码</td><td>200 (from cache)</td><td>304 Not Modified</td></tr>
            <tr><td>判断顺序</td><td>先判断</td><td>强缓存失效后才走</td></tr>
          </tbody>
        </table>
        <pre className="code">{CACHE_FLOW}</pre>
        <p className="up-note">
          <code>Cache-Control</code> 常见值：<b>max-age=3600</b>（缓存 1 小时）、<b>no-cache</b>（跳过强缓存、直接走协商）、
          <b>no-store</b>（完全不缓存）、<b>public/private</b>（能否被 CDN 等中间代理缓存 / 只允许浏览器缓存）。
          ETag 比 Last-Modified 更精确（后者只到秒级、且"改了但内容没变"会误判）。
        </p>
      </section>

      <section className="up-sum-block">
        <h3>🎨 回流 vs 重绘 vs 合成（渲染必考）</h3>
        <table className="up-compare">
          <thead>
            <tr><th></th><th>回流 Reflow / Layout</th><th>重绘 Repaint</th><th>合成 Composite</th></tr>
          </thead>
          <tbody>
            <tr><td>触发</td><td>几何变化：位置、尺寸、增删节点、resize</td><td>外观变化：颜色、背景、visibility</td><td>transform、opacity、will-change</td></tr>
            <tr><td>代价</td><td>最大（要重算布局，还可能连锁）</td><td>中（重新填像素）</td><td>最小（GPU 处理）</td></tr>
            <tr><td>关系</td><td>回流<b>必</b>导致重绘</td><td>重绘<b>不一定</b>回流</td><td>可跳过前两者</td></tr>
          </tbody>
        </table>
        <p className="up-note">
          优化：<b>批量改样式</b>（一次性改 class，别一条条改）、动画元素<b>脱离文档流</b>（absolute/fixed）、
          动画优先用 <code>transform / opacity</code>、避免频繁读取 <code>offsetTop/clientWidth</code> 等触发布局的属性、
          用 <code>DocumentFragment</code> 或离线 DOM 批量插入。
        </p>
      </section>

      <section className="up-sum-block">
        <h3>🔐 HTTPS 与 HTTP 版本演进（加分项）</h3>
        <ul>
          <li><b>HTTPS</b> = HTTP + TLS：用<b>非对称加密</b>协商出<b>对称密钥</b>（对称加密快），再用证书验证服务器身份，防窃听、防篡改、防冒充。</li>
          <li><b>HTTP/1.1</b>：默认 keep-alive 长连接，但同一连接上请求<b>排队</b>，有队头阻塞。</li>
          <li><b>HTTP/2</b>：二进制分帧、<b>多路复用</b>（一个连接并发多个请求）、头部压缩（HPACK）、服务器推送。</li>
          <li><b>HTTP/3</b>：基于 <b>QUIC（UDP）</b>，彻底解决 TCP 层队头阻塞，支持 0-RTT 快速建连、连接迁移。</li>
        </ul>
      </section>

      <section className="up-sum-block">
        <h3>⚠️ 高频追问点</h3>
        <ul>
          <li><b>为什么握手三次、挥手四次？</b>握手三次为确认双方收发都正常、防历史连接；挥手四次因 TCP 全双工，两方向分别关，服务器的 ACK 和 FIN 分开发。</li>
          <li><b>DNS 为什么用 UDP？</b>查询报文小、追求快，UDP 无连接开销；只有区域传输（数据量大、要可靠）才用 TCP。</li>
          <li><b>GET 和 POST 区别？</b>语义上 GET 取资源、幂等、参数在 URL、可缓存；POST 提交数据、非幂等、参数在 body。本质上都是 TCP 传输。</li>
          <li><b>输入 URL 后浏览器有哪些进程？</b>多进程架构：浏览器主进程、网络进程、渲染进程（每个站点隔离）、GPU 进程、插件进程等。</li>
          <li><b>怎么做性能优化？</b>DNS 预解析（<code>dns-prefetch</code>）、<code>preconnect</code>、CDN、缓存、减少请求数/体积、HTTP/2、懒加载、关键 CSS 内联、JS 加 <code>defer/async</code>。</li>
          <li><b>&lt;script&gt; 为什么阻塞？</b>解析到同步 script 会暂停 DOM 构建去下载并执行；<code>async</code> 下载不阻塞、下完立即执行（顺序不定），<code>defer</code> 下载不阻塞、等 DOM 解析完再按序执行。</li>
        </ul>
      </section>

      <section className="up-sum-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote>
          <p>"在地址栏输入 URL 到页面展示，我大致分成<b>网络</b>和<b>渲染</b>两大块来讲。</p>
          <p>
            <b>网络部分</b>：浏览器先<b>解析 URL</b>（判断是网址还是搜索词、补协议、编码），然后<b>查缓存</b>——先看强缓存 <code>Cache-Control</code> 有没有过期，没过期直接用本地；过期了就带 <code>ETag</code> 走协商缓存，服务器返回 <code>304</code> 就还用本地。缓存没命中，就<b>DNS 解析</b>把域名转成 IP，这一步是浏览器缓存→系统→路由器→ISP 递归解析器，再由它去问根、顶级、权威服务器（递归 + 迭代）。拿到 IP 后<b>建立 TCP 连接</b>，三次握手确认双方收发正常，HTTPS 还要再做 TLS 握手协商密钥。连接建好<b>发 HTTP 请求</b>，服务器处理后<b>返回响应</b>——状态行、响应头、响应体（HTML）。"
          </p>
          <p>
            <b>渲染部分</b>：浏览器走<b>关键渲染路径</b>——解析 HTML 建 <b>DOM 树</b>、解析 CSS 建 <b>CSSOM 树</b>，合成只含可见节点的<b>渲染树</b>，再经过 <b>Layout 布局</b>（算位置大小，即回流）、<b>Paint 绘制</b>（填像素，即重绘）、<b>Composite 合成</b>（GPU 把多图层合成上屏）。期间同步 <code>&lt;script&gt;</code> 会阻塞解析，可以用 <code>defer/async</code> 优化。最后请求结束，连接<b>四次挥手</b>关闭，或者 keep-alive 复用。"
          </p>
          <p>"如果让我挑一个环节深入，我可以展开讲<b>缓存策略</b>、<b>TCP 握手</b>或<b>渲染优化（回流/重绘）</b>中的任意一个。"</p>
        </blockquote>
      </section>
    </div>
  )
}
