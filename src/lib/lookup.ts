import { COURSE, ORDER, exText } from '../data/course';
import type { Lang, Word } from '../types';
import type { TrLang } from './live';

const KANA = /[぀-ヿ]/;
const HAN = /[一-鿿]/;
const VI_MARKS = /[ăâđêôơưạảãáàặẳẵắằậẩẫấầẹẻẽéèệểễếềịỉĩíìọỏõóòộổỗốồợởỡớờụủũúùựửữứừỵỷỹýỳ]/i;

const clean = (s: string) => s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Chuẩn hoá để so khớp không dấu: chữ thường, bỏ dấu tiếng Việt và dấu thanh pinyin/romaji (ǎ → a, ō → o, đ → d),
 * bỏ ký hiệu IPA. Chữ Hán và kana giữ nguyên.
 */
export function fold(s: string) {
  return clean(s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').replace(/[/ˈˌː]/g, ''));
}

const noSpace = (s: string) => s.replace(/ /g, '');
/** Có chữ bắt đầu bằng q trong text: khớp "đi" trong "đi học" nhưng không khớp "an" trong "bạn" */
const wordStart = (text: string, q: string) => ` ${text}`.includes(` ${q}`);

/** Một cách viết của nghĩa / câu ví dụ: bản bỏ dấu và bản giữ dấu (dùng khi người dùng gõ có dấu) */
interface Variant {
  meanings: string[];
  meaningFull: string;
  example: string;
}

interface Entry {
  word: Word;
  /** Chữ viết, phiên âm, romaji đã chuẩn hoá, kèm bản bỏ dấu cách ("ni hao" → "nihao") */
  forms: string[];
  folded: Variant;
  accented: Variant;
}

function variant(w: Word, f: (s: string) => string): Variant {
  return {
    // Mỗi nghĩa tách theo dấu phẩy, bỏ phần trong ngoặc: "mẹ (của mình)" → "mẹ"
    meanings: w.m.split(',').map((m) => f(m.replace(/\(.*?\)/g, ''))),
    meaningFull: f(w.m),
    example: f(`${exText(w)} ${w.exR} ${w.exM}`),
  };
}

const INDEX: Entry[] = ORDER.flatMap((lang) =>
  COURSE[lang].flatMap((u) =>
    u.words.map((w): Entry => {
      const forms = [w.w, w.r, w.ro].filter(Boolean).map(fold);
      return { word: w, forms: [...new Set([...forms, ...forms.map(noSpace)])], folded: variant(w, fold), accented: variant(w, clean) };
    }),
  ),
);

export const ALL_WORDS = INDEX.map((e) => e.word);

function score(e: Entry, q: string, viOnly: boolean) {
  const v = viOnly ? e.accented : e.folded;
  const qn = noSpace(q);
  // Gõ có dấu tiếng Việt thì chắc chắn đang tìm theo nghĩa: bỏ qua chữ/phiên âm ngoại ngữ
  if (!viOnly && e.forms.some((f) => f === q || f === qn)) return 100;
  if (v.meanings.includes(q)) return 90;
  if (!viOnly && e.forms.some((f) => f.startsWith(q) || f.startsWith(qn))) return 70;
  if (v.meanings.some((m) => m.startsWith(q))) return 60;
  if (wordStart(v.meaningFull, q)) return 50;
  // Chữ Latin quá ngắn khớp một phần thì nhiễu; còn một chữ Hán/kana đã mang nghĩa (茶 → お茶)
  const cjk = HAN.test(q) || KANA.test(q);
  if ((q.length >= 3 || cjk) && !viOnly && e.forms.some((f) => f.includes(q))) return 40;
  if (q.length >= 3 && wordStart(v.example, q)) return 10;
  return 0;
}

/** Tìm trong các bài học: khớp chữ, phiên âm, romaji, nghĩa, rồi tới câu ví dụ. Kết quả khớp tốt nhất lên đầu. */
export function search(query: string, lang: Lang | 'all' = 'all'): Word[] {
  const viOnly = VI_MARKS.test(query);
  const q = viOnly ? clean(query) : fold(query);
  if (!q) return [];
  return INDEX.filter((e) => lang === 'all' || e.word.lang === lang)
    .map((e) => ({ e, s: score(e, q, viOnly) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.e.word);
}

/**
 * Đoán ngôn ngữ của từ người dùng gõ để tra online: kana → Nhật, chữ Hán → Trung (hoặc Nhật nếu đang chọn Nhật),
 * có dấu tiếng Việt → Việt, còn lại (chữ Latin không dấu) → Anh. Người dùng đổi lại được nếu đoán sai.
 */
export function detectSource(query: string, prefer: Lang): TrLang {
  if (KANA.test(query)) return 'ja';
  if (HAN.test(query)) return prefer === 'ja' ? 'ja' : 'zh';
  if (VI_MARKS.test(query)) return 'vi';
  return 'en';
}
