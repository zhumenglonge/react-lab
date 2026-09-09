/* =========================================================
 * 本主题内复用的展示组件：CommLog（通信日志）
 * ---------------------------------------------------------
 * 把组件间每一次通信实时打印出来，直观看到"数据往哪个方向流"
 * （↓ 父→子 / ↑ 子→父 / ↕ 兄弟双向中转）。
 * 只导出组件；管理日志状态的 useCommLog hook 放在 shared.js，
 * 以符合 react-refresh「一个文件只导出组件」的约定。
 * 类名统一 cc- 前缀，自包含，删除本文件夹即可整体移除。
 * ========================================================= */

const ARROW = { down: '↓', up: '↑', both: '↕' }

export function CommLog({ title = '通信日志', log }) {
  return (
    <div className="cc-comm-log">
      <div className="cc-comm-log-title">📡 {title}</div>
      {log.length === 0 ? (
        <div className="cc-comm-log-empty">
          还没有通信记录，点上面的按钮试试 👆
        </div>
      ) : (
        <ul className="cc-comm-log-list">
          {log.map((item, i) => (
            <li key={i} className={`cc-comm-log-item ${item.dir}`}>
              <span className="cc-comm-log-arrow">
                {ARROW[item.dir] ?? '·'}
              </span>
              <span className="cc-comm-log-text">{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
