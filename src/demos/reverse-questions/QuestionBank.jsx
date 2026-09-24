import { useState } from 'react'

/* =========================================================
 * ❓ 反问清单：按场景分类、可勾选带计数的题库
 * ---------------------------------------------------------
 * 面试前打开这里，勾 2~3 条当场要问的；计数会提醒你别贪多。
 * 纯本地 UI 状态，刷新即清空——它是给你现场挑问题用的。
 * ========================================================= */

// 分组题库（模块级常量、未导出，符合 react-refresh 约定）
const GROUPS = [
  {
    cat: '🎯 岗位本身（最推荐，体现结果导向）',
    items: [
      '这个岗位为什么要招人？是新业务扩编还是补位？',
      '如果入职，前三个月你们最希望我交付 / 解决什么？',
      '我进来主要负责哪块业务或模块？向谁汇报？',
      '这个岗位做得好的人，身上有什么共同特质？',
    ],
  },
  {
    cat: '🛠️ 团队与技术（技术面首选）',
    items: [
      '团队现在主要的技术栈和架构是什么？',
      '目前技术上面临的最大的挑战 / 难点是什么？',
      '代码评审、测试、CI/CD、发布这些工程流程怎么做？',
      '技术决策怎么定？有没有技术债治理和做优化的空间？',
      '团队的迭代节奏和协作方式是怎样的？',
    ],
  },
  {
    cat: '📈 业务与产品',
    items: [
      '咱们产品主要服务谁、靠什么变现？',
      '目前最看重的业务指标是什么？',
      '这个团队在公司里是核心业务还是新方向？',
    ],
  },
  {
    cat: '🌱 成长与文化',
    items: [
      '团队的成长 / 晋升机制大概是什么样？',
      '绩效是怎么评估的？',
      '（问面试官本人）你在这个团队最有成就感的一点是什么？',
      '团队平时怎么做技术分享 / 学习的？',
    ],
  },
  {
    cat: '🧭 流程收尾',
    items: [
      '后续大概还有几轮面试？',
      '大概什么时候能有反馈？',
    ],
  },
]

// 示范话术（把挑好的问题自然说出来）
const SCRIPT = `谢谢，我确实有几个想了解的：
一个是这个岗位如果入职，前三个月你们最希望我帮忙解决什么问题？
另一个是团队目前在技术上最大的挑战，以及像代码评审、发布这些工程流程大致怎么做的？`

export default function QuestionBank() {
  // selected: 记录被勾选问题文本的集合
  const [selected, setSelected] = useState({})
  const count = Object.keys(selected).length

  const toggle = (q) =>
    setSelected((prev) => {
      const next = { ...prev }
      if (next[q]) delete next[q]
      else next[q] = true
      return next
    })

  return (
    <div className="demo-wrap rvq-root">
      <div className="demo-header">
        <h2>❓ 反问清单 · 面试前挑 2~3 条就够</h2>
        <p className="demo-sub">
          轮到你提问时<b>别再大脑空白</b>——这里按场景列好了能直接开口的问题。
          勾选你这次想问的（建议 <b>2~3 条</b>，别贪多），面试前扫一眼即可。
        </p>
      </div>

      <div className={'rvq-counter' + (count > 3 ? ' rvq-counter-warn' : '')}>
        已选 <b>{count}</b> 条
        {count > 3
          ? ' —— 偏多了，当场挑 2~3 个最关心的问就好，其余备用'
          : count > 0
            ? ' 👍 这个量刚好'
            : '（点下面的问题即可勾选）'}
        {count > 0 && (
          <button className="ghost rvq-clear" onClick={() => setSelected({})}>
            ↺ 清空选择
          </button>
        )}
      </div>

      {GROUPS.map((g) => (
        <section className="rvq-group" key={g.cat}>
          <h3>{g.cat}</h3>
          <ul className="rvq-qlist">
            {g.items.map((q) => (
              <li key={q}>
                <label className={'rvq-q' + (selected[q] ? ' rvq-q-on' : '')}>
                  <input
                    type="checkbox"
                    checked={!!selected[q]}
                    onChange={() => toggle(q)}
                  />
                  <span>{q}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="rvq-block">
        <h3>🗣️ 示范：怎么把问题自然问出口</h3>
        <pre className="code rvq-script">{SCRIPT}</pre>
        <p className="rvq-note">
          💡 小技巧：能<b>接着刚才面试聊过的内容</b>追问最好（"前面提到你们用 XX，我想了解…"），
          显得你专注、且做了衔接，而不是在背模板。
        </p>
      </section>
    </div>
  )
}
