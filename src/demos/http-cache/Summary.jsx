/* ==================== 面试总结页 ====================
 * 作用域统一挂在 .hc-summary 下，样式自带一份（懒加载不依赖其它主题）。
 * 目标：把"强制缓存 vs 协商缓存"从本质、字段、项目策略、话术四个层面讲透。
 * ========================================================= */

const DECIDE_FLOW = `浏览器请求资源
  │
  ├─【强缓存】不问服务器，本地自己判断新不新鲜
  │     看 Cache-Control(max-age) / 旧式 Expires
  │     ├─ 没过期 → 200 (from disk/memory cache)，不发请求 ✅ 最快
  │     └─ 过期 / no-cache → 进入协商缓存 ↓
  │
  ├─【协商缓存】带"指纹"去问服务器还能不能用
  │     请求头 If-None-Match: <上次 ETag>（或 If-Modified-Since）
  │     ├─ 内容没变 → 304 Not Modified，继续用本地副本 ✅ 省流量不省往返
  │     └─ 内容变了 → 200 + 新内容 + 新 ETag，刷新缓存
  │
  └─【无缓存 / no-store】→ 200 全新下载并写入缓存`

export default function Summary() {
  return (
    <div className="demo-wrap hc-summary">
      <section className="hc-block">
        <h3>🧠 一句话本质</h3>
        <p className="hc-lead">
          HTTP 缓存分两层：<b>强缓存</b>是"浏览器自己决定用不用本地副本，根本不发请求"，
          靠 <code>Cache-Control</code>（旧 <code>Expires</code>）；<b>协商缓存</b>是"本地副本过期了，
          带上指纹去问服务器还能不能用"，靠 <code>ETag</code>/<code>Last-Modified</code>，命中返回 <code>304</code>。
          答题顺序：<b>先强缓存、再协商缓存、都失效才全新下载</b>。
        </p>
      </section>

      <section className="hc-block">
        <h3>🚀 决策主线（开口第一段就背这个）</h3>
        <pre className="code">{DECIDE_FLOW}</pre>
      </section>

      <section className="hc-block">
        <h3>📋 强缓存 vs 协商缓存 对比表</h3>
        <table className="hc-compare">
          <thead>
            <tr><th>维度</th><th>强缓存</th><th>协商缓存</th></tr>
          </thead>
          <tbody>
            <tr><td>发不发请求</td><td><b>不发</b>，直接用本地副本</td><td><b>发</b>，问服务器"还能用吗"</td></tr>
            <tr><td>控制字段</td><td>Cache-Control / Expires</td><td>ETag·If-None-Match、Last-Modified·If-Modified-Since</td></tr>
            <tr><td>命中状态码</td><td>200 (from disk/memory cache)</td><td>304 Not Modified</td></tr>
            <tr><td>判断者</td><td>浏览器自己</td><td>浏览器 + 服务器一起</td></tr>
            <tr><td>节省</td><td>省往返 + 省流量（最快）</td><td>省流量，但省不掉一次往返</td></tr>
            <tr><td>顺序</td><td>先判断</td><td>强缓存失效后才走</td></tr>
          </tbody>
        </table>
      </section>

      <section className="hc-block">
        <h3>🏷️ Cache-Control 取值速查</h3>
        <table className="hc-compare">
          <thead>
            <tr><th>取值</th><th>含义</th><th>是否发请求</th></tr>
          </thead>
          <tbody>
            <tr><td>max-age=3600</td><td>相对时长缓存 1 小时（主流，取代 Expires）</td><td>有效期内不发</td></tr>
            <tr><td>no-cache</td><td>⚠️ 可存但每次用前必须协商（≠ 不缓存！）</td><td>每次都问服务器</td></tr>
            <tr><td>no-store</td><td>完全不缓存（敏感页/支付页）</td><td>每次全新下载</td></tr>
            <tr><td>public</td><td>浏览器 + CDN/代理都能存</td><td>看 max-age</td></tr>
            <tr><td>private</td><td>只允许浏览器存（默认，含用户数据）</td><td>看 max-age</td></tr>
            <tr><td>immutable</td><td>有效期内绝不变，连 304 协商都跳过</td><td>有效期内不发</td></tr>
          </tbody>
        </table>
      </section>

      <section className="hc-block">
        <h3>⚠️ 三个必踩的陷阱（答对是加分项）</h3>
        <ul>
          <li><b>no-cache 不等于不缓存。</b>它禁用的是"强缓存"，缓存仍然会存、只是每次使用前要回服务器协商；真正不缓存的是 <code>no-store</code>。</li>
          <li><b>Expires 会因客户端时钟不准而误判。</b>它写死绝对到期时刻，用户电脑时间偏了就直接失效或过早失效；<code>Cache-Control: max-age</code> 用相对时长免疫这个问题，且优先级更高。</li>
          <li><b>Last-Modified 有两个盲区。</b>粒度只到秒（秒内改动漏判）、"改了又改回原样"会误判失效；<code>ETag</code> 是内容哈希能解决，但服务器有计算开销，两者同时存在时 ETag 优先。</li>
        </ul>
      </section>

      <section className="hc-block">
        <h3>🛠️ 项目里怎么落地（高频追问：你们的缓存策略）</h3>
        <p className="hc-lead">核心思想：<b>入口 HTML 及时更新 + 带 hash 的静态资源长缓存</b>。</p>
        <table className="hc-compare">
          <thead>
            <tr><th>资源类型</th><th>推荐策略</th><th>原因</th></tr>
          </thead>
          <tbody>
            <tr><td>入口 index.html</td><td>Cache-Control: no-cache（或很短 max-age）</td><td>保证发版后能立刻拿到新版，去引用新的 hash 资源</td></tr>
            <tr><td>带 hash 的 JS/CSS<br/>main.a1b2c3.js</td><td>max-age=31536000, immutable</td><td>文件名变了就是新资源，可缓存一年；内容更新靠改文件名</td></tr>
            <tr><td>图片/字体</td><td>按业务设 max-age（较长）</td><td>变化少，命中强缓存提速</td></tr>
            <tr><td>接口数据</td><td>no-store / no-cache 按需</td><td>要求实时，不能给用户看旧数据</td></tr>
          </tbody>
        </table>
        <p className="hc-note">
          <b>实战排查题</b>："发版后用户还看到旧页面怎么办？" —— 先查<b>入口 HTML 是不是被强缓存了</b>
          （应给 HTML 配 no-cache），再查<b>静态资源有没有带内容 hash</b>。这两点答上来就是做过真实项目。
        </p>
      </section>

      <section className="hc-block">
        <h3>❓ 高频追问点</h3>
        <ul>
          <li><b>304 到底省了什么？</b>省了响应体（不重复下载资源），但没省 TCP/TLS 连接与一次请求往返，所以比强缓存慢。</li>
          <li><b>ETag 怎么来的？</b>通常是服务器对资源内容算的哈希（或 inode/大小/时间组合），内容变则变；弱点是有计算开销、集群多机要保证一致（否则换台机器 ETag 就变了导致失效）。</li>
          <li><b>强缓存、协商缓存和 Service Worker / CDN 什么关系？</b>浏览器侧还有 SW 缓存与内存/磁盘缓存分级；CDN 是同一套 Cache-Control 在边缘节点的复用（<code>s-maxage</code> 给代理、<code>max-age</code> 给浏览器）。</li>
          <li><b>public 和 private 区别？</b>public 允许 CDN 等共享缓存存，private 只允许最终用户浏览器存（含个性化/登录态响应）。</li>
          <li><b>怎么强制刷新绕过缓存？</b>Cmd/Ctrl+Shift+R 硬刷新，或 DevTools 勾 Disable cache；原理是发请求时带上 no-cache 语义跳过强缓存。</li>
        </ul>
      </section>

      <section className="hc-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote>
          <p>
            "浏览器缓存分两层。<b>第一层强缓存</b>——浏览器看 <code>Cache-Control</code>（早期是 <code>Expires</code>），
            比如 <code>max-age=3600</code> 就是存下来一小时内有效；有效期内它自己就能拍板，<b>根本不发请求</b>，
            状态码是 200 (from disk cache)，这是最快的。<code>Expires</code> 的问题是写死绝对时间、怕客户端时钟不准，
            所以被相对时长的 <code>max-age</code> 取代，两者并存时 max-age 优先。"
          </p>
          <p>
            "<b>第二层协商缓存</b>——当强缓存过期、或设了 <code>no-cache</code>，浏览器会带着上次的'指纹'去问服务器还能不能用：
            有两种字段，<code>Last-Modified</code> 对应请求头的 <code>If-Modified-Since</code>（时间戳，只到秒级），
            和更精确的 <code>ETag</code> 对应 <code>If-None-Match</code>（内容哈希）。服务器说资源没变就返回 <b>304</b>，
            不带响应体，浏览器继续用本地副本——省了流量但省不掉一次往返；如果说变了，就返回 200 + 新内容 + 新 ETag 刷新缓存。
            ETag 能解决 Last-Modified 的'秒内改动'和'改了又改回原样'两个盲区，所以优先级更高。"
          </p>
          <p>
            "落到我们项目里：入口 HTML 配 <code>no-cache</code> 保证发版即时生效，带内容 hash 的 JS/CSS 配
            <code>max-age=31536000, immutable</code> 直接缓存一年——文件名一变就是新资源，既吃满长缓存又不会出现用户看旧页面的问题。"
          </p>
        </blockquote>
      </section>
    </div>
  )
}
