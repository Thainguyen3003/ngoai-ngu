import type { Lang, Unit, Word } from '../types';
import enJson from './lessons/en.json';
import jaJson from './lessons/ja.json';
import zhJson from './lessons/zh.json';

export const LANGS: Record<Lang, { name: string; short: string; badge: string; level: string; tts: string; tag: string; join: string; sample: string; desc: string }> = {
  en: { name: 'Tiếng Anh', short: 'Anh', badge: 'EN', level: 'A1', tts: 'en-US', tag: 'en', join: ' ', sample: 'ABC', desc: 'Lộ trình A1 → C2 · phiên âm IPA' },
  zh: { name: 'Tiếng Trung', short: 'Trung', badge: '中', level: 'HSK 1', tts: 'zh-CN', tag: 'zh-CN', join: '', sample: '汉字', desc: 'Lộ trình HSK 1 → 9 · pinyin và thanh điệu' },
  ja: { name: 'Tiếng Nhật', short: 'Nhật', badge: '日', level: 'N5', tts: 'ja-JP', tag: 'ja', join: '', sample: 'かな', desc: 'Lộ trình N5 → N1 · Hiragana, Katakana, Kanji' },
};

export const ORDER: Lang[] = ['en', 'zh', 'ja'];

/**
 * Định dạng file src/data/lessons/<lang>.json. Thêm bài hoặc từ mới chỉ cần sửa các file đó.
 * exR (phiên âm câu ví dụ) và ro (romaji, chỉ tiếng Nhật) có thể bỏ trống.
 */
interface LessonFile {
  lang: string;
  units: { id: string; title: string; words: { w: string; r: string; m: string; ex: string; exR?: string; exM: string; ro?: string }[] }[];
}

const FILES: Record<Lang, LessonFile> = { en: enJson, zh: zhJson, ja: jaJson };

export const WORDS: Record<string, Word> = {};

function buildUnits(lang: Lang, file: LessonFile): Unit[] {
  if (file.lang !== lang) throw new Error(`lessons/${lang}.json đang khai báo lang "${file.lang}"`);
  const seenUnits = new Set<string>();
  return file.units.map((u, i) => {
    if (seenUnits.has(u.id)) throw new Error(`lessons/${lang}.json: trùng id bài "${u.id}"`);
    seenUnits.add(u.id);
    return {
      id: u.id,
      n: i + 1,
      title: u.title,
      words: u.words.map((raw) => {
        const word: Word = { w: raw.w, r: raw.r, m: raw.m, ex: raw.ex, exR: raw.exR ?? '', exM: raw.exM, ro: raw.ro ?? '', lang, unit: u.id, id: `${lang}:${raw.w}` };
        if (WORDS[word.id]) throw new Error(`lessons/${lang}.json: từ "${raw.w}" xuất hiện ở hơn một bài`);
        WORDS[word.id] = word;
        return word;
      }),
    };
  });
}

export const COURSE = Object.fromEntries(ORDER.map((lang) => [lang, buildUnits(lang, FILES[lang])])) as Record<Lang, Unit[]>;

export const unitById = (lang: Lang, id: string) => COURSE[lang].find((u) => u.id === id);
export const totalWords = (lang: Lang) => COURSE[lang].reduce((n, u) => n + u.words.length, 0);
export const exText = (w: Word) => w.ex.split('|').join(LANGS[w.lang].join);
/** Phiên âm ngắn để hiện cạnh từ: pinyin, kana (hoặc romaji với từ kana), IPA */
export const readingText = (w: Word) => (w.lang === 'ja' ? w.r || w.ro : w.r);
