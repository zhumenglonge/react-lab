/* =========================================================
 * 🔮 收尾信号解读：「还有什么想问的」= 通过了吗？
 * ---------------------------------------------------------
 * 结论先行：不能靠这个判断，通过率≈随机。它是标准收尾礼仪。
 * ========================================================= */

const POSITIVE = [
  '主动详细介绍团队 / 项目，甚至"安利"这个岗位——他开始反向推销了',
  '聊具体的入职场景："你来了可以先负责…"',
  '明显超时还聊得投入，或主动加微信 / 留联系方式',
  '追问你的到岗时间、薪资期望、手上有无其他 offer（在评估能不能谈成）',
  '明确告知后续流程和时间："还有两轮，HR 这两天联系你"',
]

const NEUTRAL_NEG = [
  '收尾很程式化、冷淡，没到点就早早结束',
  '对你的反问敷衍、不想多聊',
  '反复揪着你某个没答好的点追问到底（可能在找否决理由）',
]

export default function SignalDecode() {
  return (
    <div className="demo-wrap rvq-root rvq-signal">
      <section className="rvq-block">
        <h3>🧠 一句话结论</h3>
        <p className="rvq-lead">
          <b>「还有什么想问的吗」是几乎每场都走的收尾流程，问 ≠ 通过，聊得久 ≠ 稳了。</b>
          用它揣测结果的预测力，基本等于抛硬币。把它当成<b>你</b>能主动加分的环节，而不是成绩单。
        </p>
      </section>

      <section className="rvq-block">
        <h3>🟢 相对积极的信号（比"问不问"靠谱，但仍是参考）</h3>
        <ul className="rvq-list rvq-good">
          {POSITIVE.map((p) => (
            <li key={p}>✅ {p}</li>
          ))}
        </ul>
      </section>

      <section className="rvq-block">
        <h3>🔴 相对中性 / 偏消极</h3>
        <ul className="rvq-list rvq-bad">
          {NEUTRAL_NEG.map((p) => (
            <li key={p}>⚠️ {p}</li>
          ))}
        </ul>
      </section>

      <section className="rvq-block">
        <h3>🎯 那到底该怎么判断、怎么做</h3>
        <ul className="rvq-list">
          <li><b>看整体不看单点</b>：技术问题顺不顺、有没有被引导深入、面试官投入度——这些比"最后问没问"准得多。</li>
          <li><b>照问不误，认真问</b>：这恰恰是你的加分项，用「反问清单」挑 2~3 条问出来。</li>
          <li><b>把不确定交给流程</b>：最多 1~3 个工作日没消息，主动问 HR 进展，而不是回家脑补。</li>
          <li><b>心态默认"没结果、继续下一家"</b>：单面自我感觉的预测力很低——感觉好的常挂、感觉差的反而过。</li>
        </ul>
      </section>
    </div>
  )
}
