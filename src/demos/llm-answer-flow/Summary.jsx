/* ==================== 面试总结页 ====================
 * 作用域统一挂在 .lm-summary 下，样式自带一份（懒加载不依赖其它主题）。
 * 目标：把「问大模型一个问题，背后发生了什么、怎么回答出来的」
 * 从本质、链路、前端接入、追问四个层面讲透。
 * ========================================================= */

const MAIN_FLOW = `你按下回车
  │
  ├─【1 组装上下文】system + 历史 + 本轮 user + 工具声明 → messages（模型无状态，每轮重传）
  ├─【2 分词】文本 → token → token ID 序列（计费/窗口/限流都按 token）
  ├─【3 向量化】ID → embedding 向量 + 位置编码（否则分不清词序）
  ├─【4 Prefill】整摞向量过 N 层 Transformer：Attention 混合上下文 + FFN
  │        → 最后一个位置算出一整条 logits   ← 首字延迟 TTFT 花在这里
  ├─【5 采样】softmax → temperature → top-k/top-p 截断 → 按概率抽 1 个 token（抽骰子，不是查库）
  ├─【6 自回归】新 token 接回输入 → 再算一次（KV Cache 复用历史）→ 直到 <EOS> / max_tokens
  ├─【7 回传】stream:true 时每 token 推一条 SSE：data: {"delta":{...}} … data: [DONE]
  └─【8 前端渲染】累加进 state → 增量 Markdown + 高亮 + 跟随滚动 + 可 abort → 展示 usage`

const STAGE_TABLE = [
  { s: '① 组装 messages', what: '把 system/历史/工具/本轮输入拼成一份上下文', kpi: 'prompt token 数', fe: '✅ 完全可控（最重要的调优点）' },
  { s: '② 分词 Tokenize', what: '文本切成 token 并映射成 ID', kpi: 'token ≠ 字符', fe: '⚠️ 只能用同一套 tokenizer 计数' },
  { s: '③ Embedding + 位置', what: 'ID 查向量表，叠加位置信息', kpi: 'd_model / 层数', fe: '❌ 不可见' },
  { s: '④ Prefill 前向', what: 'N 层 Attention+FFN，算出下一词分布', kpi: 'TTFT 首字延迟', fe: '⚠️ 靠削上下文长度来降' },
  { s: '⑤ 采样', what: 'softmax/temperature/top-p 后抽一个 token', kpi: '稳定性 vs 多样性', fe: '✅ 请求参数可控' },
  { s: '⑥ 自回归解码', what: '接回输入循环，一次一个 token', kpi: 'TPS 输出速度', fe: '✅ max_tokens/stop 可控' },
  { s: '⑦ SSE 回传', what: '每生成就推一条 event，直到 [DONE]', kpi: '流式不省时间只省等待', fe: '✅ stream=true + 缓冲解析' },
  { s: '⑧ 前端渲染', what: '增量 Markdown/高亮/滚动/中断/计费展示', kpi: 'INP、长任务、滚动锁定', fe: '✅ 全在你的代码里' },
]

const QUESTIONS = [
  {
    q: '既然大模型不查资料，为什么它能"知道"事情？',
    a: <>知识被压缩进了<b>权重参数</b>里 —— 预训练时看过海量文本，学到的是"在这种前文之后，下一个词更可能是什么"的统计规律。所以它答的是"最像答案的续写"，不是"检索到的事实"，这也是它会编造的根因。</>,
  },
  {
    q: '怎么降低幻觉？（几乎必问）',
    a: <>
      分四层答：<b>①上下文层</b> —— 用 RAG 把权威资料塞进 prompt，并明确要求"只根据给定材料回答，材料不足就说不清"；
      <b>②解码层</b> —— 事实类任务 temperature 调低、收紧 top_p；
      <b>③结构层</b> —— 需要实时/精确值就走 function calling 让工具给答案，别让它心算；
      <b>④校验层</b> —— 要求输出引用位置/结构化字段，后端做一致性校验，不通过就重试。
    </>,
  },
  {
    q: 'temperature=0 就一定能复现吗？',
    a: <>不一定。贪心解码消掉了采样随机，但服务端的<b>批处理顺序、浮点累加、MoE 路由、版本更新</b>都可能让临界分数翻转。要真复现得同时固定 seed、模型版本、完整 messages，并接受厂商"best effort 确定性"的口径。</>,
  },
  {
    q: '上下文窗口很大，是不是就不用做记忆了？',
    a: <>不是。推理阶段<b>权重不更新</b>，窗口只是"每次重传的工作区"：超了要砍、越长越贵越慢，而且中部内容命中率会掉（lost in the middle）。真正的记忆要靠外部的检索/摘要/结构化存储，而不是指望长窗口。</>,
  },
  {
    q: '为什么用 SSE 而不是 WebSocket？',
    a: <>
      LLM 输出是<b>单向流</b>，SSE 走普通 HTTP、自动重连（Last-Event-ID）、实现简单、代理友好，够用。
      要双向实时（协同编辑、语音打断）才上 WebSocket。另外注意 SSE 的坑：字节级 chunk 可能切断多字节字符，
      必须用同一个 <code>TextDecoder</code> 加 <code>{'{ stream: true }'}</code>，并按空行切事件、尾巴留 buffer。
    </>,
  },
  {
    q: '首字很慢（TTFT 高）你怎么排查和优化？',
    a: <>先拆耗时：<b>排队/网络 + Prefill（正比于 prompt 长度）+ 首 token 解码</b>。优化顺序：削上下文（历史滑动窗口 + 摘要、检索只留 top-k）→ 固定前缀放开头吃 prompt caching → 换更小/更快模型或流式提前渲染 → 用占位与骨架屏把"等待"变成"可读"。</>,
  },
  {
    q: 'function calling / MCP 的原理是什么？',
    a: <>模型<b>不执行任何东西</b>，它只是把"我想调用哪个工具、参数是什么"也当作 token 生成出来（finish_reason=tool_calls）。是你的代码真的去执行，再把结果以新消息回注上下文、发起第二次请求 —— 所以是两次计费，且工具结果的真实性由你的后端负责。RAG/Agent 循环都是这套壳子的不同包装。</>,
  },
  {
    q: '本地部署和调用 API 怎么选？',
    a: <><b>数据不能出域/需要可控可审计</b> → 本地（但要吃显卡：7B FP16 约 14GB 权重 + KV Cache）；<b>要最强能力与弹性扩容</b> → API。前端常见中间方案：调自己的后端代理，代理里做鉴权、限流、缓存、审计与供应商切换。</>,
  },
  {
    q: '前端接 LLM 有哪些安全要注意？（能串到安全主题）',
    a: <>
      <b>①密钥只放后端</b>，浏览器里放 API Key 等于公开；
      <b>②模型输出是不可信数据</b>，直接 innerHTML 或让它驱动跳转/eval 就是 XSS/注入面，要过滤转义；
      <b>③Prompt 注入</b> —— 用户输入或检索到的文档里写"忽略以上指令"就会改变行为，要把指令与数据分离、限制工具权限、审计高危动作。
    </>,
  },
]

export default function Summary() {
  return (
    <div className="demo-wrap lm-summary">
      <section className="lm-block">
        <h3>🧠 一句话本质</h3>
        <p className="lm-lead">
          大模型回答一个问题，不是去数据库里查出答案，而是<b>把整份上下文变成向量、过 N 层 Transformer
          算出"下一个 token 的概率分布"、按概率抽一个词、接回输入再算一遍</b>，循环到结束符，
          途中把抽出来的 token 用 SSE 一条条推回浏览器，前端边收边渲染。
          全程<b>不查库、不更新权重</b> —— 这两点同时解释了"它懂得像人"和"它会一本正经地胡说"。
        </p>
      </section>

      <section className="lm-block">
        <h3>🚀 答题主线（开口第一段就背这个）</h3>
        <pre className="code">{MAIN_FLOW}</pre>
      </section>

      <section className="lm-block">
        <h3>📋 八步速查表：谁负责、指标是什么、前端能不能干预</h3>
        <table className="lm-compare">
          <thead>
            <tr><th>阶段</th><th>在干什么</th><th>关键指标</th><th>前端可控吗</th></tr>
          </thead>
          <tbody>
            {STAGE_TABLE.map((r) => (
              <tr key={r.s}>
                <td>{r.s}</td><td>{r.what}</td><td>{r.kpi}</td><td>{r.fe}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="lm-note">
          答题技巧：面试官问这题，八成不是要听 Transformer 公式，而是看你能不能
          <b>把链路拆清楚 + 指出自己能在哪几层动手</b>。①⑤⑥⑦⑧ 都是开发者可控的，务必点出来。
        </p>
      </section>

      <section className="lm-block">
        <h3>❓ 高频追问点</h3>
        <ul>
          {QUESTIONS.map((item) => (
            <li key={item.q}>
              <b>{item.q}</b>
              <br />
              {item.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="lm-block">
        <h3>🗣️ 面试话术模板（背下来）</h3>
        <blockquote>
          <p>
            "我按<b>模型侧 → 服务侧 → 前端侧</b>三段说。<b>模型侧</b>：我按下回车后，前端并不是把原话直接丢过去，
            而是把 system prompt、历史轮次、本轮问题和工具声明拼成一个 messages 数组 —— 因为模型<b>是无状态的</b>，
            所谓记得我，只是每次把历史重传一遍。服务端先<b>分词</b>：文本切成 token ID，
            中文大概一字一两个 token，计费和窗口都是按 token 而不是按字。然后每个 ID 查 embedding 表变成向量，
            再叠加位置编码 —— 不加位置信息 Transformer 就分不清"猫抓老鼠"和"老鼠抓猫"。
          </p>
          <p>
            "接着是<b>前向传播</b>：这一摞向量过 N 层 Transformer，每层用 self-attention 让每个位置和上下文里其它位置交换信息，
            再经 FFN 做非线性变换，最后那个位置会输出一整条 logits —— 也就是词表里每个候选词的分数。
            注意这一步是<b>并行算完整个 prompt</b>，所以首字延迟 TTFT 主要花在这里，上下文越长越慢。
          </p>
          <p>
            "然后<b>采样</b>：logits 经 softmax 变概率，temperature 决定分布是尖还是平，top-k/top-p 把长尾砍掉，
            再按剩下的分布<b>随机抽一个 token</b> —— 这就是为什么同一个问题两次答案会不一样。
            抽到的 token 接回输入序列，再跑一次前向，只产出下一个 token，这叫<b>自回归</b>；
            靠 KV Cache 复用历史层的 Key/Value，所以能一个字一个字往外蹦，直到抽到结束符或者撞到 max_tokens。
          </p>
          <p>
            "<b>前端侧</b>我做过的事：请求带 <code>stream:true</code>，用 fetch 拿 ReadableStream，
            同一个 TextDecoder 加 <code>{'{ stream: true }'}</code> 避免汉字被切在 chunk 边界，
            按空行切 SSE 事件、尾巴留 buffer；每个 delta 累加进 state 做增量 Markdown 渲染和跟随滚动，
            用户上滑就锁定、"停止生成"用 AbortController 真的把后端生成掐掉。
            优化的抓手很清楚：<b>削上下文降 TTFT、固定前缀吃缓存省钱、结构化输出 + 工具调用降幻觉</b>。
          </p>
        </blockquote>
      </section>
    </div>
  )
}
