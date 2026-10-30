import { COURSE, WORDS } from '../data/course';
import type { AppState, HistoryEntry, Lang, Profile, Unit } from '../types';
import { DAY, dayKey } from './util';

const KEY = 'ngoaingu.v1';
/** Khóa của tên cũ "Ba Ngữ": đọc một lần để không mất tiến độ */
const LEGACY_KEY = 'bangu.v1';

export function baseState(profile: Profile): AppState {
  return {
    v: 1,
    profile,
    cur: profile.langs[0],
    xp: {},
    streak: { count: 0, last: null },
    done: { en: [], zh: [], ja: [] },
    srs: {},
    settings: { reading: true, rate: 0.9 },
    history: [],
    saved: {},
  };
}

/** Dữ liệu mẫu để app mở ra đã có tiến độ: 5 ngày liên tiếp, vài bài đã xong, có thẻ đến hạn */
export function demoState(): AppState {
  const s = baseState({ langs: ['en', 'zh', 'ja'], goalXp: 40, level: 'new', reason: 'travel', demo: true });
  const now = Date.now();
  s.cur = 'zh';
  for (const [d, x] of [[1, 35], [2, 20], [3, 45], [4, 30], [6, 15]]) s.xp[dayKey(now - d * DAY)] = x;
  s.xp[dayKey()] = 12;
  s.streak = { count: 5, last: dayKey() };
  s.done.en = ['u1'];
  s.done.zh = ['u1', 'u2'];
  const add = (l: Lang, u: string, due: (i: number) => number, reps: number, ivl: number) =>
    COURSE[l].find((x) => x.id === u)!.words.forEach((w, i) => {
      s.srs[w.id] = { ease: 2.5, ivl, reps, due: now + due(i) };
    });
  add('zh', 'u1', (i) => -3600e3 * (i + 1), 2, 3);
  add('zh', 'u2', (i) => (i < 3 ? -1800e3 : DAY * (i - 1)), 1, 1);
  add('en', 'u1', (i) => (i < 2 ? -7200e3 : DAY * 2), 2, 3);
  return s;
}

export const HISTORY_MAX = 300;

const LANG_SET: Lang[] = ['en', 'zh', 'ja'];
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * Kiểm tra và bổ sung các trường còn thiếu cho state đọc từ localStorage hoặc từ file sao lưu
 * (kể cả bản lưu từ phiên bản cũ chưa có history). Ném lỗi kèm lý do nếu dữ liệu không dùng được.
 */
export function normalizeState(raw: unknown): AppState {
  if (!isObj(raw) || !isObj(raw.profile)) throw new Error('Thiếu thông tin hồ sơ học');
  const p = raw.profile;
  const langs = Array.isArray(p.langs) ? LANG_SET.filter((l) => (p.langs as unknown[]).includes(l)) : [];
  if (!langs.length) throw new Error('Hồ sơ không có ngôn ngữ nào');

  const s = baseState({
    langs,
    goalXp: typeof p.goalXp === 'number' && p.goalXp > 0 ? p.goalXp : 40,
    level: typeof p.level === 'string' ? p.level : null,
    reason: typeof p.reason === 'string' ? p.reason : null,
    demo: p.demo === true,
  });
  s.cur = langs.includes(raw.cur as Lang) ? (raw.cur as Lang) : langs[0];

  if (isObj(raw.xp)) for (const [k, v] of Object.entries(raw.xp)) if (typeof v === 'number') s.xp[k] = v;
  if (isObj(raw.streak) && typeof raw.streak.count === 'number')
    s.streak = { count: raw.streak.count, last: typeof raw.streak.last === 'string' ? raw.streak.last : null };
  if (isObj(raw.done))
    for (const l of LANG_SET) {
      const d = raw.done[l];
      if (Array.isArray(d)) s.done[l] = d.filter((x): x is string => typeof x === 'string');
    }
  if (isObj(raw.srs))
    for (const [id, c] of Object.entries(raw.srs))
      if (isObj(c) && [c.ease, c.ivl, c.reps, c.due].every((n) => typeof n === 'number'))
        s.srs[id] = { ease: c.ease as number, ivl: c.ivl as number, reps: c.reps as number, due: c.due as number };
  if (isObj(raw.settings)) {
    if (typeof raw.settings.reading === 'boolean') s.settings.reading = raw.settings.reading;
    if (typeof raw.settings.rate === 'number') s.settings.rate = raw.settings.rate;
  }
  if (Array.isArray(raw.history))
    s.history = raw.history
      .filter((h): h is AppState['history'][number] => isObj(h) && typeof h.at === 'number' && (h.kind === 'lesson' || h.kind === 'review') && LANG_SET.includes(h.lang as Lang))
      .slice(0, HISTORY_MAX);
  if (isObj(raw.saved))
    for (const [id, w] of Object.entries(raw.saved))
      if (isObj(w) && LANG_SET.includes(w.lang as Lang) && typeof w.w === 'string' && typeof w.m === 'string')
        s.saved[id] = { lang: w.lang as Lang, w: w.w, m: w.m, r: typeof w.r === 'string' ? w.r : '', ex: typeof w.ex === 'string' ? w.ex : '', at: typeof w.at === 'number' ? w.at : 0 };
  return s;
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/* ---------- sao lưu ra file ---------- */

const BACKUP_APP = 'ngoai-ngu';

export function backupFileName(now = new Date()) {
  return `ngoai-ngu-tien-do-${dayKey(now.getTime())}.json`;
}

export function makeBackup(s: AppState) {
  return JSON.stringify({ app: BACKUP_APP, format: 1, exportedAt: new Date().toISOString(), state: s }, null, 2);
}

/** Đọc nội dung file sao lưu. Nhận cả file chỉ chứa state (không có lớp bọc). */
export function parseBackup(text: string): { state: AppState; exportedAt: string | null } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('File không phải JSON hợp lệ');
  }
  if (isObj(data) && 'state' in data) {
    if (data.app !== BACKUP_APP) throw new Error('Đây không phải file sao lưu của Ngoại Ngữ');
    return { state: normalizeState(data.state), exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : null };
  }
  return { state: normalizeState(data), exportedAt: null };
}

export function saveState(s: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* bộ nhớ trình duyệt bị chặn: app vẫn chạy, chỉ không lưu */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* bỏ qua */
  }
}

export const nextUnit = (s: AppState, lang: Lang) => COURSE[lang].find((u) => u.words.length && !s.done[lang].includes(u.id));

export type UnitStatus = 'done' | 'current' | 'locked' | 'soon';
export function unitStatus(s: AppState, lang: Lang, u: Unit): UnitStatus {
  if (!u.words.length) return 'soon';
  if (s.done[lang].includes(u.id)) return 'done';
  return u === nextUnit(s, lang) ? 'current' : 'locked';
}

/** Số từ trong bài học đã học (không tính từ tra online đã lưu, để khớp với tổng số từ của lộ trình) */
export const learnedCount = (s: AppState, lang: Lang) => Object.keys(s.srs).filter((id) => id.startsWith(lang + ':') && !s.saved[id]).length;

export function dueIds(s: AppState, lang: Lang, now = Date.now()) {
  return Object.entries(s.srs)
    .filter(([id, c]) => id.startsWith(lang + ':') && WORDS[id] && c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

export const todayXp = (s: AppState) => s.xp[dayKey()] || 0;

export function streakNow(s: AppState) {
  const k = s.streak.last;
  return k === dayKey() || k === dayKey(Date.now() - DAY) ? s.streak.count : 0;
}

/** Ghi một kết quả vào đầu lịch sử. Thay đổi trực tiếp bản nháp. */
export function pushHistory(d: AppState, entry: HistoryEntry) {
  d.history = [entry, ...d.history].slice(0, HISTORY_MAX);
}

/** Cộng XP cho hôm nay và nối chuỗi ngày học. Thay đổi trực tiếp bản nháp. */
export function addXp(d: AppState, n: number) {
  const k = dayKey();
  d.xp[k] = (d.xp[k] || 0) + n;
  if (d.streak.last !== k) {
    d.streak.count = d.streak.last === dayKey(Date.now() - DAY) ? d.streak.count + 1 : 1;
    d.streak.last = k;
  }
}
