export type Lang = 'en' | 'zh' | 'ja';

export interface Word {
  /** Chữ viết: từ tiếng Anh, Hán tự hoặc chữ Nhật */
  w: string;
  /** Phiên âm: IPA (en), pinyin cách nhau theo âm tiết (zh), kana (ja, rỗng nếu từ đã là kana) */
  r: string;
  /** Nghĩa tiếng Việt */
  m: string;
  /** Câu ví dụ, các token cách nhau bởi "|" để dùng cho bài sắp xếp câu */
  ex: string;
  /** Phiên âm câu ví dụ (pinyin / romaji) */
  exR: string;
  /** Nghĩa câu ví dụ */
  exM: string;
  /** Romaji (chỉ tiếng Nhật) */
  ro: string;
  lang: Lang;
  unit: string;
  id: string;
}

export interface Unit {
  id: string;
  n: number;
  title: string;
  words: Word[];
}

export interface Card {
  ease: number;
  /** Khoảng cách ôn, tính bằng ngày */
  ivl: number;
  reps: number;
  /** Thời điểm đến hạn (ms) */
  due: number;
}

export interface Profile {
  langs: Lang[];
  goalXp: number;
  level: string | null;
  reason: string | null;
  demo: boolean;
}

export interface Settings {
  reading: boolean;
  rate: number;
}

export interface AppState {
  v: 1;
  profile: Profile;
  cur: Lang;
  /** XP theo ngày, khóa yyyy-mm-dd */
  xp: Record<string, number>;
  streak: { count: number; last: string | null };
  done: Record<Lang, string[]>;
  srs: Record<string, Card>;
  settings: Settings;
}

export interface LessonResult {
  kind: 'lesson';
  lang: Lang;
  unit: Unit;
  acc: number;
  xp: number;
  time: string;
  words: Word[];
  miss: string[];
  goalHit: boolean;
  next: string | null;
}

export interface ReviewResult {
  kind: 'review';
  lang: Lang;
  acc: number;
  xp: number;
  time: string;
  words: Word[];
  grades: Record<string, number>;
  goalHit: boolean;
}

export type Result = LessonResult | ReviewResult;
