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

/** Một lần học xong bài hoặc xong phiên ôn tập */
export interface HistoryEntry {
  /** Thời điểm kết thúc (ms) */
  at: number;
  kind: 'lesson' | 'review';
  lang: Lang;
  /** Id bài (chỉ với kind = lesson) */
  unit?: string;
  /** Tỉ lệ đúng / nhớ tốt, 0–100 */
  acc: number;
  xp: number;
  /** Số từ trong bài hoặc số thẻ đã ôn */
  words: number;
  /** Thời lượng (ms) */
  ms: number;
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
  /** Mới nhất ở đầu, giữ tối đa HISTORY_MAX mục */
  history: HistoryEntry[];
  /** Từ tra online đã lưu vào sổ từ, khoá `${lang}:${w}` như từ trong bài học */
  saved: Record<string, SavedWord>;
}

/** Từ không có trong bài học, người học tra online rồi lưu để ôn tập */
export interface SavedWord {
  lang: Lang;
  w: string;
  /** Phiên âm nếu từ điển có (IPA với tiếng Anh), có thể rỗng */
  r: string;
  m: string;
  /** Câu ví dụ nếu từ điển có, có thể rỗng */
  ex: string;
  at: number;
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
