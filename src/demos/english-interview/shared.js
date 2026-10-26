/* =========================================================
 * 英文面试主题 · 共享数据
 * ---------------------------------------------------------
 * questions：一道题一张卡（原题 → 英式改写 → 30s → 要点 → 加分句 → 收尾 → 坑）
 * phrases / grammar：口语表达速查
 * 内容以根目录 english-interview-notes.md 为原始记录，这里是可练习的线上版
 * ========================================================= */

export const questions = [
  {
    id: 'react-vs-vue',
    num: 1,
    icon: '⚛️',
    topic: '框架对比',
    source: '外企前端一面 · 2026-10-26',
    question:
      "I see you've got quite a bit of experience with React, so could you tell me a bit more about the differences between React and Vue?",
    hook: {
      zh: '先给结论：React 是库，Vue 是全家桶；React 要自己优化，Vue 自动优化。三句说完，每句都是主谓宾短句。',
      text:
        'React is a library. You build the rest yourself. Vue is a full framework. It gives you more things by default.',
    },
    points: [
      { dim: '渲染模型', react: '重跑整个组件函数，再 diff 虚拟 DOM', vue: '模板编译成渲染函数 + 静态提升 / patch flags，只重渲染真正依赖变更的节点' },
      { dim: '状态更新', react: '不可变，必须 setState / 返回新对象', vue: '响应式代理，直接 state.count++，Vue 自动追踪' },
      { dim: '模板写法', react: 'JSX：就是 JavaScript，类型与 IDE 补全支持好', vue: 'SFC 模板：类 HTML，更贴近平台原生，逻辑放进 script setup' },
      { dim: '生态', react: '官方只管库，路由 / 状态自己选（React Router、Redux、Zustand）', vue: '官方 Router 与 Pinia，随核心一起维护' },
      { dim: '学习曲线', react: '前置概念多：Hooks 规则、memo 化、引用相等', vue: '入门更平缓，但要学框架自身规则（响应式坑、ref vs reactive）' },
    ],
    extra: [
      {
        zh: '性能怎么说：两个都在优化，但方式不同——React 要你自己动手（memo），Vue 帮你自动做。',
        text:
          'Both care about performance, but in different ways. React asks you to do the work, like memo and useMemo. Vue does it for you. So Vue is fast by default. React is fast if you work hard.',
      },
      {
        zh: '为什么选 React：它只是库，和 React Native 这类东西搭配更灵活。',
        text: 'React is just a library, so it works well with other tools, like React Native. That is why my last team chose it.',
      },
    ],
    closing: {
      zh: '表态 + 承认对方优点，别踩一捧一。',
      text:
        'I like React better, because the code is just JavaScript. But I think Vue is also a good choice for a small team.',
    },
    pitfalls: [
      { tip: '短句就够', desc: '四级水平不用堆长句，主谓宾一句一句说，慢一点反而更稳、更听得清' },
      { tip: 'full framework', desc: '“全家桶”就说 full framework / gives you more，想不起来 batteries-included 也没关系' },
      { tip: 're-render vs update', desc: 'React 重渲染整棵树，Vue 精确到节点，两个词别混用' },
      { tip: '别说 "React is faster than Vue"', desc: '这话题无结论、必被追问；改说 it depends on how you optimize' },
    ],
  },
]

export const phrases = [
  {
    group: '撤回 / 算了',
    items: [
      { text: 'OK, never mind.', zh: '好吧，算了 / 不用管了', note: '主动撤回刚才的请求或话题；正式场合可换 It\'s nothing, actually.' },
      { text: 'It\'s nothing, actually.', zh: '其实没什么', note: '很自然的「打断撤回」用语，面试里比 never mind 得体' },
      { text: 'No worries.', zh: '没关系', note: '英式更常用' },
      { text: 'Forget it.', zh: '算了', note: '语气随意，正式场合慎用' },
      { text: 'Let it go.', zh: '不提这事了', note: '' },
    ],
  },
]

export const grammar = [
  {
    group: 'ever = 曾经 / 到底 / 究竟（核心义「在任何时间点」）',
    items: [
      { usage: '现在完成时 · 疑问或否定（主流）', eg: 'Have you ever used React?', zh: '曾经' },
      { usage: 'wh- 问句加强语气', eg: 'What ever are you doing?', zh: '到底、究竟（惊讶或不解）' },
      { usage: 'if / whenever 从句', eg: 'If you ever need help, just ping me.', zh: '万一、哪天' },
      { usage: '最高级或比较级强化', eg: 'the best candidate ever', zh: '有史以来' },
    ],
    warn:
      '⚠️ 不能在肯定句里用 ever 表「曾经」（中式坑）：I have ever been to America ❌ → I\'ve been to America ✅。中文的「我曾经…」不能逐字译成 have ever…。',
  },
]

/* localStorage key：已掌握的题目 id */
export const MASTERED_KEY = 'eie-mastered'
