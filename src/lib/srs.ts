import type { Card } from '../types';
import { DAY } from './util';

/** Điểm tự chấm khi ôn: 0 Quên, 1 Khó, 2 Được, 3 Dễ */
export type Grade = 0 | 1 | 2 | 3;
export const GRADES = ['Quên', 'Khó', 'Được', 'Dễ'] as const;

export const newCard = (due: number): Card => ({ ease: 2.5, ivl: 0, reps: 0, due });

/** Lịch ôn theo SM-2 rút gọn */
export function schedule(card: Card, g: Grade, now = Date.now()): Card {
  const c = { ...card };
  if (g === 0) {
    c.reps = 0;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.ivl = 0;
    c.due = now + 10 * 60e3;
    return c;
  }
  if (g === 1) {
    c.ivl = c.reps === 0 ? 1 : Math.max(1, Math.round(c.ivl * 1.2));
    c.ease = Math.max(1.3, c.ease - 0.15);
  } else if (g === 2) {
    c.ivl = c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.max(c.ivl + 1, Math.round(c.ivl * c.ease));
  } else {
    c.ivl = c.reps === 0 ? 4 : Math.round(Math.max(c.ivl, 1) * c.ease * 1.3);
    c.ease += 0.15;
  }
  c.reps++;
  c.due = now + c.ivl * DAY;
  return c;
}

export function intervalLabel(c: Card) {
  if (c.ivl === 0) return '10 phút';
  if (c.ivl < 30) return `${c.ivl} ngày`;
  return `${Math.round(c.ivl / 30)} tháng`;
}

export function dueLabel(t: number, now = Date.now()) {
  const d = t - now;
  if (d <= 0) return 'Đến hạn';
  if (d < 3600e3) return `Sau ${Math.max(1, Math.round(d / 60e3))} phút`;
  if (d < DAY) return `Sau ${Math.round(d / 3600e3)} giờ`;
  return `Sau ${Math.round(d / DAY)} ngày`;
}

export function strength(c: Card): [string, 'bad' | 'mid' | 'good'] {
  if (c.reps === 0) return ['Cần ôn', 'bad'];
  if (c.ivl < 7) return ['Đang nhớ', 'mid'];
  return ['Vững', 'good'];
}
