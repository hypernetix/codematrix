/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
}

export function highlightRustHtml(code: string): string {
  if (!code) return '';

  // IMPORTANT: Escape HTML entities FIRST to prevent XSS
  let highlighted = escapeHtml(code);

  // Strings (now working with escaped HTML)
  highlighted = highlighted.replace(/&quot;([^&]*?)&quot;/g, '<span class="rust-string">&quot;$1&quot;</span>');
  highlighted = highlighted.replace(/&#39;([^&]*?)&#39;/g, '<span class="rust-string">&#39;$1&#39;</span>');

  // Comments
  highlighted = highlighted.replace(/\/\/(.*?)$/gm, '<span class="rust-comment">//$1</span>');
  highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, (m) => `<span class="rust-comment">${m}</span>`);

  // Macros
  highlighted = highlighted.replace(/\b(\w+)!/g, '<span class="rust-macro">$1!</span>');

  // Numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="rust-number">$1</span>');

  // Keywords
  const keywords = [
    'fn', 'pub', 'struct', 'enum', 'impl', 'trait', 'type', 'const', 'static',
    'let', 'mut', 'ref', 'if', 'else', 'match', 'loop', 'while', 'for', 'in',
    'return', 'break', 'continue', 'as', 'use', 'mod', 'crate', 'super', 'self',
    'async', 'await', 'move', 'unsafe', 'where', 'dyn', 'Self'
  ];
  keywords.forEach((kw) => {
    const re = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(re, '<span class="rust-keyword">$1</span>');
  });

  // Types
  const types = [
    'String', 'str', 'i8', 'i16', 'i32', 'i64', 'i128', 'isize',
    'u8', 'u16', 'u32', 'u64', 'u128', 'usize', 'f32', 'f64',
    'bool', 'char', 'Result', 'Option', 'Vec', 'Box', 'Ok', 'Err', 'Some', 'None'
  ];
  types.forEach((tp) => {
    const re = new RegExp(`\\b(${tp})\\b`, 'g');
    highlighted = highlighted.replace(re, '<span class="rust-type">$1</span>');
  });

  return highlighted;
}
