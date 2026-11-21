/* =========================================================
 * 轻量 JS 语法高亮：只服务本主题 sp-code 里的教学代码片段
 * ---------------------------------------------------------
 * 不引第三方库（prism/shiki 对几段静态代码太重），一个正则
 * 按优先级分词：注释 → 字符串(含模板串) → 关键词 → 数字 →
 * 标识符（集合内的全局对象，或后面跟着 ( 的调用名）。
 * 颜色只在 styles.css 的 .sp-code .tok-* 里定义，全部引用
 * index.css 变量。只导出纯函数，满足 react-refresh 约定。
 * ========================================================= */

const KEYWORDS = new Set([
  'function', 'return', 'const', 'let', 'var', 'async', 'await',
  'while', 'if', 'else', 'for', 'of', 'in', 'new', 'typeof',
  'break', 'continue', 'switch', 'case', 'default', 'do',
  'try', 'catch', 'finally', 'throw', 'class', 'extends', 'this',
  'null', 'true', 'false', 'undefined',
]);

/* 常见全局对象：即使后面不跟 ( 也染调用色（如 Date.now() 里的 Date） */
const GLOBALS = new Set([
  'Date', 'setTimeout', 'setInterval', 'Promise', 'performance',
  'console', 'Math', 'JSON', 'Object', 'Array', 'requestAnimationFrame',
]);

const TOKEN_RE = /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(function|return|const|let|var|async|await|while|if|else|for|of|in|new|typeof|break|continue|switch|case|default|do|try|catch|finally|throw|class|extends|this|null|true|false|undefined)\b|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

export function highlightJs(code) {
  const out = [];
  let last = 0;
  let m;
  let key = 0;
  while ((m = TOKEN_RE.exec(code)) !== null) {
    const [text, comment, str, kw, num, ident] = m;
    let cls = 'tok-plain';
    if (comment) cls = 'tok-comment';
    else if (str) cls = 'tok-string';
    else if (kw) cls = 'tok-kw';
    else if (num) cls = 'tok-num';
    else if (ident && (GLOBALS.has(ident) || code[m.index + text.length] === '(')) cls = 'tok-call';
    if (m.index > last) out.push(<span key={key++} className="tok-plain">{code.slice(last, m.index)}</span>);
    out.push(<span key={key++} className={cls}>{text}</span>);
    last = m.index + text.length;
  }
  if (last < code.length) out.push(<span key={key++} className="tok-plain">{code.slice(last)}</span>);
  return out;
}
