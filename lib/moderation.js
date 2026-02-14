const BLOCKLIST = ['slur', 'terror', 'kill all', 'hate group', 'explicit'];

export function isSafeText(text) {
  const t = String(text || '').toLowerCase();
  return !BLOCKLIST.some((b) => t.includes(b));
}

export function moderateOrThrow(text) {
  if (!isSafeText(text)) {
    throw new Error('Unsafe generated text blocked by moderation policy.');
  }
  return text;
}
