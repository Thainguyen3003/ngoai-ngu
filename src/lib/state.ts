import { COURSE, WORDS } from '../data/course';
import type { AppState, Lang, Profile, Unit } from '../types';
import { DAY, dayKey } from './util';

const KEY = 'bangu.v1';

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

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AppState;
    if (!s?.profile?.langs?.length) return null;
    if (!s.profile.langs.includes(s.cur)) s.cur = s.profile.langs[0];
    return s;
  } catch {
    return null;
  }
}

export function saveState(s: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* bộ nhớ trình duyệt bị chặn: app vẫn chạy, chỉ không lưu */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
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

export const learnedCount = (s: AppState, lang: Lang) => Object.keys(s.srs).filter((id) => id.startsWith(lang + ':')).length;

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

/** Cộng XP cho hôm nay và nối chuỗi ngày học. Thay đổi trực tiếp bản nháp. */
export function addXp(d: AppState, n: number) {
  const k = dayKey();
  d.xp[k] = (d.xp[k] || 0) + n;
  if (d.streak.last !== k) {
    d.streak.count = d.streak.last === dayKey(Date.now() - DAY) ? d.streak.count + 1 : 1;
    d.streak.last = k;
  }
}
