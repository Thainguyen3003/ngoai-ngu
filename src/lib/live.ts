import { LANGS } from '../data/course';
import type { Lang } from '../types';

// Web Speech API và Translator API của Chrome chưa có trong lib.dom của TypeScript, nên khai báo phần dùng tới
interface RecResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecEvent {
  resultIndex: number;
  results: { length: number; [i: number]: RecResult };
}
interface Rec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available';
interface TranslatorOpts {
  sourceLanguage: string;
  targetLanguage: string;
}
export interface Translator {
  translate(text: string): Promise<string>;
}
interface TranslatorApi {
  availability(o: TranslatorOpts): Promise<Availability>;
  create(o: TranslatorOpts & { monitor?: (m: EventTarget) => void }): Promise<Translator>;
}

const W = (typeof window !== 'undefined' ? window : {}) as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec; Translator?: TranslatorApi };
const RecImpl = W.SpeechRecognition ?? W.webkitSpeechRecognition;

export const STT_OK = !!RecImpl;
export const TRANSLATE_OK = !!W.Translator;

const ERRORS: Record<string, string> = {
  'not-allowed': 'Chưa được phép dùng micro. Bấm biểu tượng ổ khoá trên thanh địa chỉ để cho phép.',
  'service-not-allowed': 'Trình duyệt chặn dịch vụ nhận giọng nói.',
  'audio-capture': 'Không tìm thấy micro.',
  network: 'Mất kết nối: nhận giọng nói cần có mạng.',
  'language-not-supported': 'Trình duyệt chưa nhận giọng nói cho ngôn ngữ này.',
};

/** Tách đoạn đã nhận thành từng câu theo dấu câu; đoạn không có dấu câu được giữ nguyên là một câu */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|(?<=[。！？])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface ListenHandlers {
  /** Câu đang nói dở (chưa chốt), rỗng khi không còn */
  onInterim: (text: string) => void;
  /** Một câu đã chốt */
  onSentence: (text: string) => void;
  onError: (msg: string) => void;
  /** Đã dừng hẳn, do người dùng bấm dừng hoặc do lỗi */
  onStop: () => void;
}

/** Nghe micro liên tục. Trả về hàm dừng. */
export function listen(lang: Lang, h: ListenHandlers) {
  const rec = new RecImpl!();
  rec.lang = LANGS[lang].tts;
  rec.continuous = true;
  rec.interimResults = true;
  let on = true;
  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) splitSentences(r[0].transcript).forEach(h.onSentence);
      else interim += r[0].transcript;
    }
    h.onInterim(interim.trim());
  };
  rec.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    on = false;
    h.onError(ERRORS[e.error] ?? `Lỗi nhận giọng nói (${e.error})`);
  };
  rec.onend = () => {
    // Chrome tự ngắt sau một quãng im lặng hoặc khoảng một phút: nghe tiếp nếu chưa bấm dừng
    if (on)
      try {
        rec.start();
        return;
      } catch {
        on = false;
      }
    h.onInterim('');
    h.onStop();
  };
  rec.start();
  return () => {
    on = false;
    rec.stop();
  };
}

const cache: Record<string, Translator> = {};

/** Mã ngôn ngữ cho Translator API: 'vi' hoặc mã hai chữ của một ngôn ngữ đang học */
export type TrLang = Lang | 'vi';
const code = (l: TrLang) => (l === 'vi' ? 'vi' : LANGS[l].tts.slice(0, 2));

/**
 * Bộ dịch sang tiếng Việt chạy trên máy (Translator API của Chrome). Trả về null nếu trình duyệt không hỗ trợ.
 * Lần đầu Chrome phải tải gói ngôn ngữ, việc này chỉ được phép ngay sau khi người dùng bấm nút.
 */
export function getTranslator(lang: Lang, onProgress?: (pct: number) => void) {
  return getTranslatorPair(lang, 'vi', onProgress);
}

/** Như getTranslator nhưng chọn được cả hai chiều, ví dụ ('vi', 'ja') để dịch tiếng Việt sang tiếng Nhật */
export async function getTranslatorPair(from: TrLang, to: TrLang, onProgress?: (pct: number) => void): Promise<Translator | null> {
  const key = `${from}>${to}`;
  if (cache[key]) return cache[key];
  const T = W.Translator;
  if (!T) return null;
  const opts = { sourceLanguage: code(from), targetLanguage: code(to) };
  try {
    // Có trình duyệt nhúng không bao giờ trả lời câu hỏi này: quá 5 giây thì coi như không dịch được
    const timeout = new Promise<Availability>((ok) => window.setTimeout(() => ok('unavailable'), 5000));
    if ((await Promise.race([T.availability(opts), timeout])) === 'unavailable') return null;
    const tr = await T.create({
      ...opts,
      monitor: (m) => m.addEventListener('downloadprogress', (e) => onProgress?.(Math.round((e as ProgressEvent).loaded * 100))),
    });
    cache[key] = tr;
    return tr;
  } catch {
    return null;
  }
}
