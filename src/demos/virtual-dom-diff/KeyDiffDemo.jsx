import { useState } from 'react'

/* =========================================================
 * 场景 3：Element Diff（同层元素比较）—— key 的作用与陷阱
 * 规则：同层子节点通过 key 唯一标识
 *      key 相同 → 复用（可能 move）
 *      key 不同 → 销毁 + 新建
 * ========================================================= */

const INITIAL_USERS = [
  { id: 'u1', name: '张三' },
  { id: 'u2', name: '李四' },
  { id: 'u3', name: '王五' },
]

let uidSeq = 100

function KeyTrapDemo() {
  // 一份 users 数据，同时喂给两个列表 —— 操作完全一致，才能看出 key 的差别
  const [users, setUsers] = useState(INITIAL_USERS)

  const insertHead = () => {
    const id = `u${++uidSeq}`
    setUsers([{ id, name: `新人 ${id}` }, ...users])
  }
  const insertTail = () => {
    const id = `u${++uidSeq}`
    setUsers([...users, { id, name: `新人 ${id}` }])
  }
  const remove = (id) => setUsers(users.filter((u) => u.id !== id))
  const reset = () => setUsers(INITIAL_USERS)

  return (
    <div className="demo-box full-width">
      <h4>🎯 亲自复现：index 作 key 的错位 bug</h4>
      <div className="playbook">
        <b>玩法：</b>
        <ol>
          <li>在左右两边的输入框里都填上"给张三的备注 a"、"给李四的备注 b"、"给王五的备注 c"</li>
          <li>点击 <b>"在头部插入"</b> 按钮</li>
          <li>观察：左边（index 作 key）所有备注<b>错位到了下一个人身上</b>；右边（id 作 key）备注<b>正确跟着人走</b></li>
        </ol>
      </div>

      <div className="btn-row" style={{ margin: '0.6rem 0 1rem' }}>
        <button className="primary-btn" onClick={insertHead}>➕ 在头部插入</button>
        <button className="primary-btn" onClick={insertTail}>➕ 在尾部插入</button>
        <button className="primary-btn" onClick={reset}>🔄 重置</button>
        <span className="count-tag">当前共 {users.length} 人</span>
      </div>

      <div className="key-compare">
        <div className="key-side bad">
          <div className="key-side-head">
            <span>❌ key={'{index}'}</span>
            <code>key={'{i}'}</code>
          </div>
          <UserList users={users} useIndexKey={true} onRemove={remove} />
        </div>
        <div className="key-side good">
          <div className="key-side-head">
            <span>✅ key={'{user.id}'}</span>
            <code>key={'{u.id}'}</code>
          </div>
          <UserList users={users} useIndexKey={false} onRemove={remove} />
        </div>
      </div>

      <pre className="code">{`// ❌ 反面：index 作 key
{users.map((u, i) => (
  <li key={i}>
    <span>{u.name}</span>
    <input defaultValue="" />   {/* 非受控，DOM 状态 */}
  </li>
))}

// ✅ 正面：稳定 id 作 key
{users.map(u => (
  <li key={u.id}>
    <span>{u.name}</span>
    <input defaultValue="" />
  </li>
))}`}</pre>

      <p className="tip warn">
        <b>为什么会错位？</b> —— 头部插入后，React 看到 <code>key=0</code> 依然存在，
        认为是"同一项，只是 <code>u.name</code> 变了"，于是复用 DOM，只更新 span 文本。
        但 <code>&lt;input&gt;</code> 是<b>非受控</b>的（defaultValue），它的内容存在 DOM 里，
        React 不会碰 —— 结果就是"备注留在了原位，名字换了一个"，出现错位。
      </p>
      <p className="tip">
        <b>为什么 id 作 key 就没问题？</b> —— 插入的新用户带全新 id，React 认出它是"新节点"，
        直接 INSERT；原有的三个 id 都没变，React 认出是"同一批节点"，整体下移即可，DOM 状态自然跟着走。
      </p>
    </div>
  )
}

function UserList({ users, useIndexKey, onRemove }) {
  return (
    <ol className="user-list">
      {users.map((u, i) => (
        <li key={useIndexKey ? i : u.id}>
          <span className="user-idx">#{i}</span>
          <span className="user-name">{u.name}</span>
          <input
            className="user-note"
            defaultValue=""
            placeholder={`给 ${u.name} 的备注`}
          />
          <button className="user-del" onClick={() => onRemove(u.id)}>删</button>
        </li>
      ))}
      {users.length === 0 && <li className="empty">列表已空，点重置恢复</li>}
    </ol>
  )
}

// ---------- 反面用法：用 key 强制重新挂载 ----------
function KeyRemountDemo() {
  const [userId, setUserId] = useState('u1')
  const [formKey, setFormKey] = useState(0)

  return (
    <div className="demo-box full-width">
      <h4>💡 key 的正面用法：强制"重置组件"</h4>
      <p className="case-desc">
        反过来利用 Element Diff 的规则 —— <b>改变 key 就能强制销毁并重建组件</b>，
        这是"重置表单"最优雅的实现方式，比手动 <code>setState</code> 一个个清空干净得多。
      </p>
      <div className="btn-row" style={{ marginBottom: '0.6rem' }}>
        <button className="primary-btn" onClick={() => setUserId(userId === 'u1' ? 'u2' : 'u1')}>
          切换用户（当前 {userId}）
        </button>
        <button className="primary-btn" onClick={() => setFormKey((k) => k + 1)}>
          🔄 重置表单（formKey = {formKey}）
        </button>
      </div>
      <UserProfileForm key={`${userId}-${formKey}`} userId={userId} />
      <pre className="code">{`// 在表单里输入点内容，然后点"重置表单"
<UserProfileForm key={\`\${userId}-\${formKey}\`} userId={userId} />
// key 变化 → React 销毁旧实例、挂载新实例 → 内部 state 全部归零`}</pre>
      <p className="tip">
        👉 这个技巧在实际项目里非常好用：切换用户时表单自动清空、切换 tab 时子组件自动重置，
        一行 <code>key</code> 就搞定。
      </p>
    </div>
  )
}

function UserProfileForm({ userId }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  return (
    <div className="profile-form">
      <div className="profile-row">
        <label>用户 ID：</label>
        <b>{userId}</b>
      </div>
      <div className="profile-row">
        <label>姓名：</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入姓名" />
      </div>
      <div className="profile-row">
        <label>邮箱：</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="输入邮箱" />
      </div>
    </div>
  )
}

export default function KeyDiffDemo() {
  return (
    <div className="demo-wrap">
      <div className="demo-header">
        <h3>场景 3：Element Diff（key 的作用与陷阱）</h3>
        <p className="desc">
          规则：同层子节点通过 <b>key</b> 唯一标识，React 据此判断
          <b>插入 / 移动 / 删除</b>。<code>key</code> 选错会带来性能问题甚至 UI Bug。
        </p>
      </div>
      <KeyTrapDemo />
      <div style={{ marginTop: '1rem' }}>
        <KeyRemountDemo />
      </div>
    </div>
  )
}
