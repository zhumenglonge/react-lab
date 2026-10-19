import { useState } from 'react'
import { SIXTY_LINES, SKILL_VS_MCP, PROJECT_PARA } from './shared.js'

/* ==================== 面试总结页 ====================
 * 作用域统一挂在 .sk-summary 下，样式自带一份（懒加载不依赖其它主题）。
 * 目标：把「什么是 Skill」从 60 秒话术、一句话分工、高频追问、
 * 项目落地示例四个层面讲透 —— 尤其接住"它和 MCP 什么关系"这个必问追问。
 * ========================================================= */

const DONTS = [
  '别说 Skill 是"又一个协议"或"一个服务" —— 它就是一堆文件，没有进程在跑。',
  '别说"Skill 会取代 MCP" —— 一个管连接、一个管知识流程，正交叠加。',
  '别把 Skill 讲成"把 prompt 写长一点" —— 它的灵魂是渐进式披露（分层按需加载）。',
  '别漏掉 description 的地位 —— 模型只凭 name+description 决定要不要触发这个 skill。',
  '别只说"能带脚本"却不解释价值 —— 关键是脚本可直接运行、不进上下文，确定且省 token。',
]

/* 高频追问：含 JSX 片段，按主题约定放在组件文件内，shared.js 保持纯数据 */
const FOLLOWUPS = [
  {
    q: 'Skill 和 MCP 到底什么区别？（最高频）',
    a: <>一句话：<b>MCP 管"连得上"，Skill 管"会不会做"</b>。MCP 是客户端/服务器协议，你要跑一个 Server 进程，把外部工具/数据标准化地暴露出来；Skill 就是一堆文件（一个目录 + 一个 SKILL.md），把"这类任务该怎么做"的过程知识打包给 Agent。进上下文的方式也不同：MCP 一连上就把全部工具 schema 平铺进去，Skill 靠渐进式披露平时只留一张名片。类比：MCP 是水电气管线接口，Skill 是写给厨房的操作手册。</>,
  },
  {
    q: '什么是渐进式披露？为什么它是核心？',
    a: <><b>分三层按需加载</b>：L1 是每个 skill 的 <code>name+description</code>，启动就预载进 system prompt（几十 token）；L2 是 SKILL.md 正文，模型判断任务相关才读进来；L3+ 是正文引用的附件/脚本，用到才读或才运行。它的价值是<b>上下文经济学</b>：装几十个 skill 平时也只占很少 token，而单个 skill 能承载的知识近乎无上限 —— 这正是它相对"MCP 一次性平铺 schema"的关键优势。</>,
  },
  {
    q: 'Skill 会取代 MCP 吗？',
    a: <>不会，两者解决的是完全不同的问题，<b>正交且常叠加</b>。常见组合是 Skill 教流程 + MCP 供连接：比如一个"代码审查" skill 告诉 Agent 审查步骤，真正去 GitHub 拉 PR 还是靠 MCP。甚至能用一层轻 Skill 包住重 MCP 当"网关"，把初始上下文从上万 token 降到几百 —— 是协作不是竞争。</>,
  },
  {
    q: '一个 Skill 具体长什么样？',
    a: <>一个目录，核心是一个 <code>SKILL.md</code>：开头必须是 YAML frontmatter，含必填的 <code>name</code> 和 <code>description</code>；下面是 Markdown 正文（步骤/注意/示例）。还可以往目录里放 <code>reference.md</code> 等附件、放 <code>xxx.py</code> 脚本，正文里按名字引用。就这么朴素 —— 官方的话说"简单到就是一个文件夹"。</>,
  },
  {
    q: 'Skill 和 RAG / 微调 / 普通 prompt 有何不同？',
    a: <>对 <b>prompt</b>：skill 结构化、可发现、按需加载、可带脚本，prompt 写死在对话里常驻且不可复用。对 <b>RAG</b>：RAG 按向量相似度被动喂"知识碎片"，skill 是模型按任务理解主动选"完整自洽的流程"（树状目录 vs 高维向量）。对<b>微调</b>：微调改权重、贵且不透明，skill 只在上下文按需注入文本/代码，随时增删改、可读可审计。</>,
  },
  {
    q: '用 Skill 有什么安全风险？',
    a: <>Skill 本质是<b>"可执行的第三方知识"</b>：恶意 skill 可以用指令诱导 Agent 外泄数据、连接不可信网络，或在脚本/依赖里下毒。原则和 npm 供应链一样 —— <b>只装可信来源，第三方 skill 先通读目录里所有文件再启用</b>，尤其注意代码依赖和"让 Claude 去连外部"的指令。可顺势串到 prompt 注入：skill 内容和工具返回都是不可信输入。</>,
  },
  {
    q: '你们项目里是怎么用的？（落地追问）',
    a: <>讲清链路即可（见下方示例）：<b>需求 → 写成 skill 的哪几层 → 怎么和 MCP 配合 → 踩的坑</b>。没上生产就老实说"本地在 Claude Code 里做过 skill 验证 + 读过官方规范"，再把"description 决定触发""渐进式披露省 token"讲出来 —— 考的是理解，不是你有没有装过。</>,
  },
]

export default function Summary() {
  const [open, setOpen] = useState(null)

  return (
    <div className="sk-summary demo-wrap">
      <div className="demo-header">
        <h2>🎯 面试总结 · 被问"什么是 Skill"这样答</h2>
        <p className="desc">
          这题几乎一定紧跟在 MCP 后面，考的是<b>你会不会把两者混为一谈</b>。
          满分结构：60 秒定义 → 一句话分工（vs MCP）→ 主动讲渐进式披露 → 引回你的项目。
        </p>
      </div>

      <section className="sk-block">
        <h3>⏱️ 60 秒话术（六句，每句一个层次）</h3>
        <pre className="code">
          {SIXTY_LINES.map((l, i) => `【${i + 1}】${l}`).join('\n')}
        </pre>
        <p className="sk-note">
          顺序：<b>定义（文件夹+SKILL.md）→ 与 MCP 分工 → 渐进式披露三层 → 省上下文收益 → 能带代码 → 一句话收束</b>。
          第三句的"三层"是全场技术含量最高处，务必说全。
        </p>
      </section>

      <section className="sk-block">
        <h3>🗂️ 一句话分工速查</h3>
        <table className="sk-compare">
          <tbody>
            {SKILL_VS_MCP.filter((r) => ['一句话', '本质形态', '关系'].includes(r.k)).map((r) => (
              <tr key={r.k}>
                <td>{r.k}</td>
                <td><b>{r.skill}</b></td>
                <td>{r.mcp}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul>
          <li><b>Skill</b>：一个带 <code>SKILL.md</code> 的文件夹，装"怎么做"的过程知识，靠<b>渐进式披露</b>按需加载。</li>
          <li><b>MCP</b>：客户端/服务器协议，管"连得上"外部工具与数据，工具 schema 连上即常驻上下文。</li>
          <li>关系一句话：<b>正交、可叠加</b> —— Skill 教流程，MCP 供连接，还能用 Skill 包 MCP 当省 token 的网关。</li>
        </ul>
      </section>

      <section className="sk-block">
        <h3>❓ 高频追问（点开看答法）</h3>
        {FOLLOWUPS.map((f, i) => (
          <div
            key={f.q}
            className="sk-stage"
            style={{ opacity: 1, cursor: 'pointer', borderLeftColor: open === i ? 'var(--accent)' : undefined }}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="sk-stage-badge">{open === i ? '▾' : '▸'}</div>
            <div className="sk-stage-main">
              <div className="sk-stage-title">{i + 1}. {f.q}</div>
              {open === i && <p className="sk-stage-text">{f.a}</p>}
            </div>
          </div>
        ))}
      </section>

      <section className="sk-block">
        <h3>🛠️ 项目落地示例（按你的真实情况改写，别照背）</h3>
        <blockquote>{PROJECT_PARA}</blockquote>
        <p className="sk-note">
          套用公式：<b>需求 → skill 拆成哪几层 → description 怎么写才触发得动 → 与 MCP 的分工 → 收益/坑</b>。
          没上过生产就明说"本地验证过 + 读过规范"，把渐进式披露和 description 命门讲出来即可。
        </p>
      </section>

      <section className="sk-block">
        <h3>🚫 避雷清单（说错任何一条都会被打回）</h3>
        <ul>
          {DONTS.map((d) => (<li key={d}>{d}</li>))}
        </ul>
      </section>

      <section className="sk-block">
        <h3>🧭 还可以主动带出去的两个方向（秀知识网络）</h3>
        <ul>
          <li><b>串 mcp-protocol 主题</b>：「MCP 解决连接、Skill 解决知识与流程，我用一个 skill 描述'何时调哪个 MCP 工具'，就把重 MCP 的上下文成本降下来了。」</li>
          <li><b>串 llm-answer-flow</b>：「渐进式披露本质是在管理上下文窗口 —— 和'窗口不是免费记忆、中部命中率下降'是同一套 token 经济学。」</li>
        </ul>
      </section>
    </div>
  )
}
