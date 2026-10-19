/* =========================================================
 * 主题共享数据 + 纯函数：什么是 Skill（Agent Skills）
 * ---------------------------------------------------------
 * 这里只放数据与工具函数（组件一律放 .jsx），满足 react-refresh。
 * ⚠️ 含 JSX 片段的话术（高频追问等）放 Summary.jsx，不放本文件。
 * 事实基于 Anthropic 官方《Equipping agents for the real world with
 * Agent Skills》(2025-10-16 发布，2025-12-18 开放为标准)。token 数为教学示意量级。
 * ========================================================= */

export const TOPIC_QUESTION = '既然大模型能连 MCP 调工具了，那 Skill 又是什么？它和 MCP 什么关系？'

export const SKILL_ONE_LINE = 'Agent Skills：一个带 SKILL.md 的文件夹 = 一块可组合、可按需加载的专业能力'

/* ==================== ① 名字拆解 ==================== */
export const SKILL_BREAKDOWN = [
  { k: '形态', v: '不是一个进程、不是一套协议 —— 就是一堆文件：一个目录 + 一个 SKILL.md（可再带脚本和参考资料）' },
  { k: '内容', v: '过程性知识（procedural knowledge）：告诉 Agent"这类任务该怎么做"，像给新人的入职手册' },
  { k: '关键机制', v: '渐进式披露 Progressive Disclosure —— 分三层按需加载，平时几乎不吃上下文' },
]

/* ==================== ② 渐进式披露三层（核心） ==================== */
export const DISCLOSURE_LEVELS = [
  {
    level: 'L1',
    name: '元数据 Metadata',
    file: 'SKILL.md 的 YAML frontmatter',
    content: 'name + description（必填）',
    when: 'Agent 启动时，把每个已装 skill 的 name+description 预加载进 system prompt',
    tokens: 80,
    tokenNote: '≈ 80 token / 个',
    why: '只给"够判断该不该用它"的信息，绝不多塞',
  },
  {
    level: 'L2',
    name: '技能主体 Instructions',
    file: 'SKILL.md 正文',
    content: '具体步骤、注意事项、示例',
    when: '模型判断当前任务与该 skill 相关时，才把整篇 SKILL.md 读进上下文',
    tokens: 1200,
    tokenNote: '≈ 1200 token',
    why: '命中才展开正文，没命中一行都不进',
  },
  {
    level: 'L3+',
    name: '附带文件 Resources',
    file: 'reference.md / forms.md / *.py …',
    content: '深度参考、模板、可执行脚本',
    when: '正文里引用了、且当前场景真需要时，模型再按需去读某个文件',
    tokens: 2500,
    tokenNote: '单文件 ≈ 2500 token（容量近乎无上限）',
    why: '把"只有少数情况才用"的内容拆出去，省 token',
  },
]

/* 一个真实场景：填 PDF 表单，四层上下文逐步累加 */
export const DISCLOSURE_STEPS = [
  {
    icon: '🚀',
    title: '启动：只装"名片"',
    loaded: ['system'],
    added: 5000,
    note: '上下文里只有核心 system prompt + 50 个 skill 的 name/description（约 5000 token）。pdf 这个 skill 此刻只是名片上"能填 PDF 表单"这一行字。',
    highlight: null,
  },
  {
    icon: '💬',
    title: '用户提问 → 模型判断命中',
    loaded: ['system', 'user'],
    added: 0,
    note: '「帮我把这份 PDF 的表单填了」。模型扫一遍手里的 skill 名片，发现 description 命中，决定用 pdf skill —— 于是去读它的 SKILL.md 正文（进入 L2）。',
    highlight: 'SKILL.md',
  },
  {
    icon: '📖',
    title: 'L2：读入 SKILL.md 正文',
    loaded: ['system', 'user', 'skillmd'],
    added: 1200,
    note: '正文进了上下文：它写着"填表单请先看 forms.md，抽取字段可运行 extract_fields.py"。模型据此规划下一步。',
    highlight: 'SKILL.md',
  },
  {
    icon: '📑',
    title: 'L3：按需再读 forms.md',
    loaded: ['system', 'user', 'skillmd', 'forms'],
    added: 2500,
    note: '只有真要填表时才把 forms.md 读进来。reference.md（PDF 结构详解）这轮没用到，就一直留在磁盘上，一个 token 都不占。',
    highlight: 'forms.md',
  },
  {
    icon: '⚙️',
    title: '代码执行：跑脚本但不读脚本',
    loaded: ['system', 'user', 'skillmd', 'forms', 'scriptout'],
    added: 60,
    note: 'extract_fields.py 作为工具直接运行，把"抽到的字段"这一小段结果进上下文 —— 脚本本身和 PDF 原文都不进。确定、可复现、省 token。',
    highlight: 'extract_fields.py',
  },
]

/* 上下文条目（用于渲染"上下文窗口"面板） */
export const CONTEXT_BLOCKS = {
  system: { label: 'system prompt + 50 个 skill 名片', tokens: 5000, tone: 'base' },
  user: { label: '本轮 user 输入', tokens: 40, tone: 'base' },
  skillmd: { label: 'pdf/SKILL.md 正文（L2）', tokens: 1200, tone: 'load' },
  forms: { label: 'pdf/forms.md（L3）', tokens: 2500, tone: 'load' },
  scriptout: { label: '脚本输出（脚本本身不进）', tokens: 60, tone: 'code' },
}

/* 文件树 */
export const SKILL_TREE = [
  { path: 'pdf/', kind: 'dir', level: 0 },
  { path: 'SKILL.md', kind: 'file', level: 1, tag: 'L1 frontmatter + L2 正文' },
  { path: 'forms.md', kind: 'file', level: 1, tag: 'L3 · 填表细则' },
  { path: 'reference.md', kind: 'file', level: 1, tag: 'L3 · PDF 结构详解（本轮未读）' },
  { path: 'extract_fields.py', kind: 'file', level: 1, tag: '可执行脚本 · 不进上下文' },
]

/* ==================== ③ SKILL.md 结构示例 ==================== */
export const SKILL_MD_EXAMPLE = `---
name: pdf-form-filler
description: 读取并填写 PDF 表单。当用户要求填 PDF 表单、
  提取表单字段、或操作可填写的 PDF 文档时使用。
---

# PDF 表单填写

## 步骤
1. 先运行 \`python extract_fields.py <file>\` 抽取全部表单字段。
2. 若字段含日期/下拉等受限类型，阅读 forms.md 的"字段类型"一节。
3. 需要理解 PDF 底层结构时，再查 reference.md（平时不用读）。

## 注意
- 不要手工解析 PDF 字节，一律用脚本。
- 写回前先备份原文件。`

export const FRONTMATTER_FIELDS = [
  { field: 'name', req: '必填', desc: 'skill 唯一标识，小写短横线' },
  { field: 'description', req: '必填', desc: '一句话说明"做什么 + 何时用" —— 模型就靠这一行决定要不要触发，最关键' },
  { field: '（正文）', req: 'L2', desc: 'Markdown 主体：步骤、注意事项、示例，命中后整体读入' },
  { field: '（附带文件）', req: 'L3+', desc: '在正文里按名字引用，模型按需才读；也可放可执行脚本' },
]

/* ==================== ④ Skill vs MCP 对拍 ==================== */
export const SKILL_VS_MCP = [
  { k: '一句话', skill: '教 Agent"怎么做"（过程性知识）', mcp: '让 Agent"连得上"（外部能力接口）' },
  { k: '本质形态', skill: '一堆文件：目录 + SKILL.md（没有进程在跑）', mcp: '客户端/服务器协议：Server 是个进程（stdio 或 HTTP）' },
  { k: '解决什么', skill: '知识 / 工作流 / 判断力（怎么做对）', mcp: '连接 / 数据 / 工具（够不够得着）' },
  { k: '怎么进上下文', skill: '渐进式披露：平时只有 name+description，命中才展开', mcp: '连上就 tools/list，把全部工具 JSON Schema 平铺进上下文' },
  { k: '谁决定用', skill: '模型基于任务相关性主动决定读哪个 skill', mcp: '模型决定调哪个工具，但工具清单必须常驻' },
  { k: '典型成本', skill: '装几十个，平时也只占很少 token', mcp: '几个重型 Server 叠起来轻松吃掉上万 token' },
  { k: '类比', skill: '写给这个厨房的操作手册', mcp: '水、电、燃气的管线接口（USB-C）' },
  { k: '关系', skill: '正交、可叠加：Skill 能把"何时调哪个 MCP"写进流程', mcp: '底层能力；Skills 常包在外层当"省 token 的网关"' },
]

/* 网关对拍：把重型 MCP 用轻 Skill 包一层 */
export const GATEWAY_COMPARE = [
  {
    name: '直连重型 MCP Server',
    color: 'tone-danger',
    initial: 16000,
    steps: [
      'Client 一连接就 tools/list，拿到几十个工具的完整 JSON Schema',
      '这些 schema 常驻上下文，还没干活就被挤掉 16k token',
      '工具越多，模型选择困难、成本线性上涨',
    ],
    verdict: { tone: 'danger', text: '上下文爆炸 + 选择困难：MCP 接得越多越明显' },
  },
  {
    name: '外面包一层 Skill 当网关',
    color: 'tone-success',
    initial: 500,
    steps: [
      'Skill 只在 frontmatter 写"这个域能干什么"，平时仅 ~500 token',
      '模型判断相关后才读正文，正文再指示"去调哪个 MCP 工具"',
      '底层 MCP 工具按需才暴露，初始上下文极轻',
    ],
    verdict: { tone: 'success', text: '16k → 500：渐进式披露把"先全塞"改成"用时再取"' },
  },
]

/* ==================== ⑤ 能力谱系（从 Prompt 到 Skills） ==================== */
export const LINEAGE = [
  {
    era: 'Prompt / System',
    icon: '✍️',
    what: '把要求写进提示词',
    limit: '一次性、不可复用、长了就挤爆上下文、易互相干扰',
  },
  {
    era: 'Function Calling / Tool Use',
    icon: '🔧',
    what: '模型输出结构化"我想调 X"，你的代码去执行',
    limit: '解决"能不能调"，但工具声明要手写、单应用内、换处重写',
  },
  {
    era: 'MCP',
    icon: '🔌',
    what: '把工具/数据提供方标准化成可发现的 Server',
    limit: '解决"谁来提供、怎么复用"；但清单常驻上下文，接多了会膨胀',
  },
  {
    era: 'Agent Skills',
    icon: '📚',
    what: '把"怎么做"的过程知识做成按需加载的文件包',
    limit: '解决"知识与流程如何低成本、可组合地注入" —— 与上面几层正交叠加',
  },
]

/* 四种"能力包"辨析 */
export const CONFUSION_TABLE = [
  { a: 'Skill vs 一段 Prompt', b: 'Skill 是结构化、可发现、按需加载、可带脚本的文件包；Prompt 是写死在对话里、常驻、不可复用' },
  { a: 'Skill vs RAG', b: 'RAG 按向量相似度被动喂"知识碎片"；Skill 由模型按任务理解主动选"完整自洽的流程"（树状目录 vs 高维向量）' },
  { a: 'Skill vs MCP', b: 'MCP 管连接（够不够得着外部工具/数据）；Skill 管知识与流程（会不会做）。一个是管线接口，一本操作手册' },
  { a: 'Skill vs 微调', b: '微调改权重、贵且不透明；Skill 只是在上下文里按需注入文本/代码，随时可增删改、可读可审计' },
]

/* ==================== ⑥ 陷阱 ==================== */
export const TRAPS = [
  {
    title: 'Skill 不是"又一个协议"，它没有进程',
    detail: 'MCP 是 Client/Server 协议，你要跑一个 Server 进程；Skill 就是一堆文件，Agent 启动时扫描目录、读 frontmatter 建索引。把它说成"协议/服务"会被追问。',
  },
  {
    title: '核心创新是渐进式披露，不是"把说明写长"',
    detail: '价值全在"分层按需加载"：L1 名片常驻、L2 正文命中才读、L3 附件用到才读。若把一切都塞进 SKILL.md 正文，等于退化成一个大 prompt，丢掉省 token 的意义。',
  },
  {
    title: 'description 写不好，skill 就永远不触发',
    detail: '模型只凭 name+description 决定"这题要不要用它"。描述要同时说清"做什么"和"何时用"、带上触发词。官方最佳实践：重点打磨 name/description，并观察真实轨迹迭代。',
  },
  {
    title: 'Skill 能带代码：能跑的脚本不必进上下文',
    detail: '排序、解析、精确计算交给脚本执行，比让模型逐 token 生成更便宜且确定。关键区分：这段代码是给 Claude"当文档读"还是"直接运行"，要写清楚。',
  },
  {
    title: 'Skill 与 MCP 是正交叠加，不是二选一',
    detail: '常见组合：Skill 教流程 + MCP 供连接；或用轻 Skill 包住重 MCP 当网关（16k→500）。面试说"它们竞争"是错的，说"分工协作"才对。',
  },
  {
    title: '安全：Skill 是"可执行的第三方知识"',
    detail: '恶意 skill 可用指令诱导 Agent 外泄数据、连接不可信网络，或藏在脚本/依赖里下毒。原则：只装可信来源，第三方 skill 先通读全部文件再启用（同 npm 供应链思路）。',
  },
  {
    title: '容量近乎无上限，但一次能用的上下文仍有限',
    detail: '因为附件"按需才读"，一个 skill 理论上能打包海量知识/数据。但同一轮里如果命中并读入了很多 L3 文件，上下文照样会吃紧 —— 拆分与引用路径设计仍是门手艺。',
  },
]

/* ==================== 🎯 60 秒话术 ==================== */
export const SIXTY_LINES = [
  'Agent Skills 是 Anthropic 提出的一种模块化能力封装标准：一个 Skill 就是一个文件夹，核心是一个带 YAML frontmatter 的 SKILL.md，可以再附带脚本和参考文件。',
  '它和 MCP 的分工是：MCP 管"连得上外部工具和数据"，Skill 管"知不知道这类任务该怎么做" —— 一个是管线接口，一本写给 Agent 的操作手册。',
  '最核心的设计是渐进式披露，分三层：启动时只把每个 skill 的 name 和 description 预加载进系统提示（几十 token）；模型判断相关才读 SKILL.md 正文；正文引用的附件、脚本用到时才读或才运行。',
  '这样做的收益是省上下文：装几十个 skill 平时也只占很少 token，而单个 skill 能打包的知识量近乎无上限。',
  'Skill 还能带可执行脚本，让模型直接运行而不必把代码读进上下文 —— 又快又确定。',
  '一句话：Skill 把"过程性知识"做成了可组合、可按需加载、可跨平台移植的能力包。',
]

/* ==================== 🎯 项目落地示例（按真实情况改写） ==================== */
export const PROJECT_PARA = `「我在 Claude Code / 自研 Agent 里用过 Agent Skill。需求是：让 Agent 稳定按我们团队的
规范生成周报。我把这套流程写成一个 skill 文件夹：SKILL.md 的 description 写清"生成/汇总团队周报时使用"，
正文列出取数→套模板→校对的结构，再附带一个 render.py 脚本和一个 example.md 模板。
平时它只占几十 token，只有我让它写周报时才展开正文、才运行脚本。
和 MCP 的配合是：MCP Server 负责连我们的 Jira / 数据库取原始数据，Skill 负责教它"取到之后按什么流程整理"。」`
