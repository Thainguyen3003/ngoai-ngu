export const DAY = 864e5;

export const pad = (n: number) => String(n).padStart(2, '0');

/** Khóa ngày theo giờ địa phương, dạng yyyy-mm-dd */
export const dayKey = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export const WEEKDAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Thanh điệu (1–4, 5 là thanh nhẹ) của một âm tiết pinyin có dấu */
export function toneOf(syllable: string) {
  const marks: [string, number][] = [['āēīōūǖ', 1], ['áéíóúǘ', 2], ['ǎěǐǒǔǚ', 3], ['àèìòùǜ', 4]];
  for (const ch of syllable.toLowerCase()) for (const [set, t] of marks) if (set.includes(ch)) return t;
  return 5;
}

export function fmtTime(ms: number) {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${pad(s % 60)}`;
}
