import type { Lang } from '../types';
import { getTranslatorPair, type TrLang } from './live';
import { fold } from './lookup';

/**
 * Tra từ online, gọi thẳng từ trình duyệt (các dịch vụ đều trả header CORS, không cần máy chủ riêng):
 * - MyMemory: nghĩa tiếng Việt / dịch tiếng Việt sang ngoại ngữ. Miễn phí khoảng 5.000 từ mỗi ngày cho mỗi máy.
 * - Free Dictionary (dictionaryapi.dev): tiếng Anh, có IPA, file phát âm, từ loại, định nghĩa, ví dụ.
 * - Wiktionary: tiếng Trung, Nhật (và dự phòng cho tiếng Anh); định nghĩa bằng tiếng Anh, dạng HTML.
 */

const MM_CODE: Record<TrLang, string> = { en: 'en', zh: 'zh-CN', ja: 'ja', vi: 'vi' };
const WIKT_SECTION: Record<Lang, string> = { en: 'English', zh: 'Chinese', ja: 'Japanese' };

const POS_VI: Record<string, string> = {
  noun: 'danh từ',
  'proper noun': 'danh từ riêng',
  verb: 'động từ',
  adjective: 'tính từ',
  adverb: 'trạng từ',
  pronoun: 'đại từ',
  preposition: 'giới từ',
  conjunction: 'liên từ',
  interjection: 'thán từ',
  numeral: 'số từ',
  number: 'số từ',
  particle: 'trợ từ',
  classifier: 'lượng từ',
  counter: 'trợ từ đếm',
  phrase: 'cụm từ',
  idiom: 'thành ngữ',
  proverb: 'tục ngữ',
  suffix: 'hậu tố',
  prefix: 'tiền tố',
  determiner: 'từ hạn định',
  article: 'mạo từ',
  'han character': 'chữ Hán',
  kanji: 'chữ kanji',
};
const posVi = (pos: string) => POS_VI[pos.toLowerCase()] ?? pos.toLowerCase();

export interface Sense {
  /** Từ loại, đã dịch sang tiếng Việt */
  pos: string;
  defs: { text: string; example?: string }[];
}

export interface OnlineEntry {
  /** Ngôn ngữ của từ ngoại ngữ (với chiều Việt → ngoại ngữ là ngôn ngữ đích) */
  lang: Lang;
  /** Từ ngoại ngữ: chính từ đã gõ, hoặc bản dịch nếu gõ tiếng Việt */
  word: string;
  /** Nghĩa tiếng Việt (chính từ đã gõ nếu gõ tiếng Việt) */
  vi: string | null;
  /** Nghĩa / cách nói khác lấy từ bộ nhớ dịch của MyMemory */
  alts: string[];
  phonetic: string;
  audio: string;
  senses: Sense[];
  /** Nguồn định nghĩa (để ghi công và mở xem thêm) */
  source: { name: string; url: string } | null;
}

export class OnlineError extends Error {}

async function getJson(url: string, signal: AbortSignal) {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function htmlText(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('style, link, sup, .reference').forEach((e) => e.remove());
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

const uniq = <T,>(a: T[]) => [...new Set(a)];

/** Dịch qua MyMemory; lỗi hoặc hết lượt thì thử bộ dịch trên máy của Chrome nếu đã sẵn sàng */
async function translate(text: string, from: TrLang, to: TrLang, signal: AbortSignal): Promise<{ text: string; alts: string[] } | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${MM_CODE[from]}|${MM_CODE[to]}`;
    const d = await getJson(url, signal);
    const main = String(d?.responseData?.translatedText ?? '').trim();
    if (d?.quotaFinished || d?.responseStatus !== 200 || !main || /MYMEMORY WARNING/i.test(main)) throw new Error('mymemory');
    // Bộ nhớ dịch của MyMemory do người dùng đóng góp, có cả câu rác chấm điểm cao ("máy tính" → "our friends have a crush…"),
    // nên chỉ giữ bản dịch cho đúng từ đã gõ và dài xấp xỉ bản dịch chính
    const tidy = (t: string) => t.trim().replace(/^["'“”「」]+|["'“”「」.。!！?？]+$/g, '').trim();
    const words = (t: string) => t.split(/\s+/).length;
    const alts = uniq(
      ((d.matches ?? []) as { segment?: unknown; translation?: unknown }[])
        .filter((m) => fold(String(m.segment ?? '')) === fold(text))
        .map((m) => tidy(String(m.translation ?? ''))),
    )
      .filter((t) => t && fold(t) !== fold(main) && fold(t) !== fold(text))
      .filter((t) => words(t) <= words(main) + 2 && t.length <= main.length * 2 + 8)
      .slice(0, 3);
    return { text: main, alts };
  } catch (e) {
    if (signal.aborted) throw e;
    try {
      const tr = await getTranslatorPair(from, to);
      return tr ? { text: await tr.translate(text), alts: [] } : null;
    } catch {
      return null;
    }
  }
}

type Dict = Pick<OnlineEntry, 'phonetic' | 'audio' | 'senses' | 'source'>;

async function freeDictionary(word: string, signal: AbortSignal): Promise<Dict | null> {
  try {
    const d = await getJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`, signal);
    if (!Array.isArray(d) || !d.length) return null;
    type Ph = { text?: string; audio?: string };
    type M = { partOfSpeech?: string; definitions?: { definition?: string; example?: string }[] };
    const phonetics: Ph[] = d.flatMap((e: { phonetics?: Ph[] }) => e.phonetics ?? []);
    const meanings: M[] = d.flatMap((e: { meanings?: M[] }) => e.meanings ?? []);
    const senses = meanings
      .map((m) => ({
        pos: posVi(m.partOfSpeech ?? ''),
        defs: (m.definitions ?? []).filter((x) => x.definition).slice(0, 3).map((x) => ({ text: x.definition!, example: x.example })),
      }))
      .filter((s) => s.defs.length)
      .slice(0, 4);
    return {
      phonetic: d[0].phonetic ?? phonetics.find((p) => p.text)?.text ?? '',
      audio: phonetics.find((p) => p.audio)?.audio ?? '',
      senses,
      source: { name: 'Free Dictionary', url: `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}#English` },
    };
  } catch (e) {
    if (signal.aborted) throw e;
    return null;
  }
}

/**
 * Trang của chữ giản thể (电脑) hay cách viết kana (たべる) trên Wiktionary thường chỉ trỏ sang trang chính
 * bằng {{zh-see|電腦}} / {{ja-see|食べる}}, nên REST API trả 404. Đọc wikitext để lấy trang chính.
 */
async function seeAlso(word: string, signal: AbortSignal) {
  try {
    const d = await getJson(`https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&formatversion=2&origin=*`, signal);
    return String(d?.parse?.wikitext ?? '').match(/\{\{(?:zh|ja)-see\|([^|}]+)/)?.[1]?.trim() ?? null;
  } catch (e) {
    if (signal.aborted) throw e;
    return null;
  }
}

async function wiktionary(word: string, lang: Lang, signal: AbortSignal): Promise<Dict | null> {
  const direct = await wiktionaryPage(word, lang, signal);
  if (direct || lang === 'en') return direct;
  const main = await seeAlso(word, signal);
  return main && main !== word ? wiktionaryPage(main, lang, signal) : null;
}

async function wiktionaryPage(word: string, lang: Lang, signal: AbortSignal): Promise<Dict | null> {
  try {
    const d = await getJson(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`, signal);
    type Def = { definition?: string; parsedExamples?: { example?: string }[]; examples?: string[] };
    const items: { partOfSpeech?: string; definitions?: Def[] }[] = d?.[lang] ?? [];
    const senses = items
      .map((it) => ({
        pos: posVi(it.partOfSpeech ?? ''),
        defs: (it.definitions ?? [])
          .map((x) => ({ text: htmlText(x.definition ?? ''), example: htmlText(x.parsedExamples?.[0]?.example ?? x.examples?.[0] ?? '') || undefined }))
          .filter((x) => x.text)
          .slice(0, 4),
      }))
      .filter((s) => s.defs.length)
      .slice(0, 4);
    if (!senses.length) return null;
    return { phonetic: '', audio: '', senses, source: { name: 'Wiktionary', url: `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}#${WIKT_SECTION[lang]}` } };
  } catch (e) {
    if (signal.aborted) throw e;
    return null;
  }
}

const cache = new Map<string, OnlineEntry>();

/**
 * Tra một từ. src là ngôn ngữ của từ đã gõ; nếu là 'vi' thì dịch sang `target` trước rồi mới tra từ điển.
 * Ném OnlineError kèm lời nhắn tiếng Việt khi không tra được.
 */
export async function lookupOnline(query: string, src: TrLang, target: Lang, signal: AbortSignal): Promise<OnlineEntry> {
  const q = query.trim();
  const key = `${src}>${src === 'vi' ? target : 'vi'}:${q.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (!navigator.onLine) throw new OnlineError('Máy đang không có mạng nên chưa tra online được.');

  const dict = (word: string, lang: Lang) =>
    lang === 'en' ? freeDictionary(word, signal).then((r) => r ?? wiktionary(word, 'en', signal)) : wiktionary(word, lang, signal);

  let entry: OnlineEntry;
  if (src === 'vi') {
    const t = await translate(q, 'vi', target, signal);
    if (!t) throw new OnlineError('Không dịch được từ này. Có thể đã hết lượt tra miễn phí hôm nay, hãy thử lại sau.');
    const d = await dict(t.text, target);
    entry = { lang: target, word: t.text, vi: q, alts: t.alts, phonetic: '', audio: '', senses: [], source: null, ...d };
  } else {
    const [t, d] = await Promise.all([translate(q, src, 'vi', signal), dict(q, src)]);
    if (!t && !d) throw new OnlineError(`Không tìm thấy “${q}” trên mạng. Kiểm tra lại chính tả hoặc chọn đúng ngôn ngữ của từ.`);
    entry = { lang: src, word: q, vi: t?.text ?? null, alts: t?.alts ?? [], phonetic: '', audio: '', senses: [], source: null, ...d };
  }
  cache.set(key, entry);
  return entry;
}
