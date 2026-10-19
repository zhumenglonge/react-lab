import { useState } from 'react'
import { SIXTY_LINES, COMPARE_ROWS, PROJECT_PARA } from './shared.js'

/* ==================== 面试总结页 ====================
 * 作用域统一挂在 .mcp-summary 下，样式自带一份（懒加载不依赖其它主题）。
 * 目标：把「什么是 MCP」从 60 秒话术、一句话分工、高频追问、
 * 项目落地示例四个层面讲透 —— 顺着大模型项目追问也接得住。
 * ========================================================= */

const DONTS = [
  '别把 MCP 说成"模型的一种能力" —— 它是应用层协议，与模型 API 无关。',
  '别说"Server 帮模型执行了工具" —— 执行方是 Host 里的 Client，模型只输出意图。',
  '别说"MCP 替代了 function calling" —— 底层仍靠模型的 function calling 落地，MCP 是外层生态标准。',
  '别漏掉关系：Client ↔ Server 严格 1:1，Host 可挂多个 Server。',
  '别只背全称 —— 至少把 initialize / tools/list / tools/call 三个方法和 JSON-RPC 2.0 说出来。',
]

/* 高频追问：含 JSX 片段，按主题约定放在组件文件内，shared.js 保持纯数据 */
const FOLLOWUPS = [
  {
    q: 'MCP 和 function calling 什么区别？（最高频）',
    a: <>先给结论：<b>一个管"能不能调"，一个管"谁来提供、怎么接"</b>。function calling 是模型 API 的能力：你在请求里手写 tools 声明，模型输出调用意图，执行和回注都在你自己的代码里。MCP 是应用与工具之间的开放协议：工具方把能力封装成 Server，Host 运行时通过 tools/list 自动发现、协商、调用，跨应用跨组织复用。关系上 MCP 不替代 function calling —— 发现来的工具清单最终还是要喂给模型，靠它生成 tool_calls。</>,
  },
  {
    q: '为什么说它是"协议"而不是"框架"或者"插件"？',
    a: <>协议 = 与语言、厂商无关的消息格式约定：JSON-RPC 2.0 定义请求/响应长什么样，initialize / tools/list / tools/call 定义交互流程。任何 Host 和任何 Server 只要实现规范就能互通，谁都可以发起和演进 —— 插件是某家私有格式，框架是带实现的库，这些都不是 MCP。</>,
  },
  {
    q: 'MCP 和 RAG 怎么选？',
    a: <>看<b>决策权在谁手里</b>。RAG 的检索链路是你的代码写死的：固定数据源、固定触发时机，检回来的片段拼进 prompt。MCP 把"要不要查、查什么、用哪个数据源"的决定权交给模型，而且 Server 暴露的 resources 本身就能当 RAG 的数据源 —— 两者是不同层，经常配合用，不冲突。</>,
  },
  {
    q: '用 MCP 安全吗？要注意什么？',
    a: <>协议本身不保证安全，要 Host 侧落实四件事：<b>①用户确认</b> —— 写操作必须弹窗，不能静默执行；<b>②最小权限</b> —— Server 拿到的凭证只够干它那份活；<b>③审计日志</b> —— 每次 tools/call 留痕；<b>④不可信输入</b> —— Server 的 description、工具返回的内容都可能藏 prompt injection，要当外部数据过滤。可以顺势串到 XSS 的思路：模型输出和工具输出都是不可信数据。</>,
  },
  {
    q: 'Server 和 Client 怎么通信？本地和远程有什么区别？',
    a: <><b>stdio</b>：Client 把 Server 拉成本地子进程，标准输入输出传 JSON-RPC —— 桌面 Host 挂本地工具的首选，没有网络暴露面。<b>Streamable HTTP</b>：Server 独立部署，HTTP POST + 可选长连接（升级 SSE）推送通知 —— 跨机器、多用户、要鉴权（OAuth 2.1）和会话保持。旧文档里的 standalone SSE transport 已被合并进 Streamable HTTP，面试提到版本演进会显得真的读过规范。</>,
  },
  {
    q: 'MCP 里的 sampling（服务端反向采样）知道么？',
    a: <>进阶题。一般方向是 Host → Server 调工具；MCP 还允许 Server 反过来通过 Client 请求 Host 帮它跑一次 LLM 生成（createMessage），这样轻量的 Server 也能"借助宿主的能力"完成复杂任务，不用自己带密钥。知道这个方向的机制，说明规范读得比较深。</>,
  },
  {
    q: '你们项目里是怎么用的？（落地追问）',
    a: <>把真实链路讲清楚就行（见下方实战示例）：<b>需求 → 选型 → 协议流程 → 踩的坑</b>。如果没上过生产，就老实说"我做过 demo 级验证 + 读过规范"，然后把安全三件套（确认、权限、注入防护）的设计讲出来 —— 面试官考的是判断力，不是背 API。</>,
  },
]

export default function Summary() {
  const [open, setOpen] = useState(null)

  return (
    <div className="mcp-summary demo-wrap">
      <div className="demo-header">
        <h2>🎯 面试总结 · 被问"什么是 MCP"这样答</h2>
        <p className="desc">
          这题大概率是<b>顺着你的大模型项目追问</b>来的，所以答案的满分结构是：
          60 秒定义 → 一句话分工（vs function calling）→ 主动把话题引回你的项目。
        </p>
      </div>

      <section className="mcp-block">
        <h3>⏱️ 60 秒话术（六句，每句一个层次）</h3>
        <pre className="code">
          {SIXTY_LINES.map((l, i) => `【${i + 1}】${l}`).join('\n')}
        </pre>
        <p className="mcp-note">
          顺序别打乱：<b>定义 → USB-C 类比 → 三层角色 → 三步流程 → 与 function calling 的关系 → N×M → N+M 价值</b>。
          类比放第二句是为了让面试官先"接住"，再上术语。
        </p>
      </section>

      <section className="mcp-block">
        <h3>🗂️ 一句话分工速查（背这两行就够了）</h3>
        <table className="mcp-compare">
          <tbody>
            {COMPARE_ROWS.slice(0, 2).concat(COMPARE_ROWS.slice(-1)).map((r) => (
              <tr key={r.k}>
                <td>{r.k}</td>
                <td>{r.fc}</td>
                <td><b>{r.mcp}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul>
          <li><b>function calling</b>：模型 API 的能力 —— 请求里手写 <code>tools</code> 声明，模型输出 <code>tool_calls</code>，<b>执行和回注在你的代码里</b>。</li>
          <li><b>MCP</b>：应用 ↔ 工具的开放协议 —— Server 声明能力，Host 运行时<b>自动发现、协商、复用</b>，跨应用跨组织。</li>
          <li>关系一句话：<b>MCP 把 function calling 的工具声明标准化、生态化了</b>，不是替代它。</li>
        </ul>
      </section>

      <section className="mcp-block">
        <h3>❓ 高频追问（点开看答法）</h3>
        {FOLLOWUPS.map((f, i) => (
          <div
            key={f.q}
            className="mcp-stage"
            style={{ opacity: 1, cursor: 'pointer', borderLeftColor: open === i ? 'var(--accent)' : undefined }}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="mcp-stage-badge">{open === i ? '▾' : '▸'}</div>
            <div className="mcp-stage-main">
              <div className="mcp-stage-title">{i + 1}. {f.q}</div>
              {open === i && <p className="mcp-stage-text">{f.a}</p>}
            </div>
          </div>
        ))}
      </section>

      <section className="mcp-block">
        <h3>🛠️ 项目落地示例（按你的真实情况改写，别照背）</h3>
        <blockquote>{PROJECT_PARA}</blockquote>
        <p className="mcp-note">
          套用公式：<b>需求 → 最初的接法 → 为什么换成 MCP → 协议三步各对应代码里的哪一步 → 踩的坑与对策</b>。
          没上过生产就明说"demo 级验证 + 读过规范"，再把安全三件套（确认 / 权限 / 注入防护）讲出来 ——
          面试官考的是判断力，不是你有没有装过包。
        </p>
      </section>

      <section className="mcp-block">
        <h3>🚫 避雷清单（说错任何一条都会被打回）</h3>
        <ul>
          {DONTS.map((d) => (<li key={d}>{d}</li>))}
        </ul>
      </section>

      <section className="mcp-block">
        <h3>🧭 还可以主动带出去的两个方向（秀知识网络）</h3>
        <ul>
          <li><b>串 llm-answer-flow</b>：「模型拿到工具清单后输出 tool_calls，本质上还是自回归生成的 token —— 大模型一次只产出一个词，'想调工具'也是被算出来的，不是它真的调了。」</li>
          <li><b>串前端安全</b>：「Server 的 description 和工具返回都是不可信输入，防 prompt injection 的思路和防 XSS 一致：转义、隔离指令与数据、高危动作人工确认。」</li>
        </ul>
      </section>
    </div>
  )
}
