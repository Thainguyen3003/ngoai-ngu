import { LANGS } from '../data/course';
import type { Lang } from '../types';

export const TTS_OK = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

let voices: SpeechSynthesisVoice[] = [];
const warned: Partial<Record<Lang, boolean>> = {};

function loadVoices() {
  try {
    voices = speechSynthesis.getVoices() || [];
  } catch {
    voices = [];
  }
}
if (TTS_OK) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

/** Đọc thành tiếng bằng giọng có sẵn của trình duyệt. onWarn nhận thông báo khi thiếu giọng. */
export function speak(text: string, lang: Lang, opts: { rate?: number; slow?: boolean; onWarn?: (msg: string) => void } = {}) {
  const { rate = 0.9, slow = false, onWarn } = opts;
  if (!TTS_OK) {
    onWarn?.('Trình duyệt này chưa hỗ trợ đọc thành tiếng');
    return;
  }
  try {
    const tag = LANGS[lang].tts;
    const prefix = tag.slice(0, 2);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = tag;
    u.rate = rate * (slow ? 0.65 : 1);
    const norm = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-');
    // Tránh giọng Quảng Đông (zh-HK) khi cần tiếng Phổ thông
    const voice = voices.find((v) => norm(v) === tag) || voices.find((v) => norm(v).toLowerCase().startsWith(prefix) && !/HK|yue/i.test(norm(v)));
    if (voice) u.voice = voice;
    else if (voices.length && !warned[lang]) {
      warned[lang] = true;
      onWarn?.(`Máy chưa có giọng đọc ${LANGS[lang].name}. Có thể cài thêm trong cài đặt ngôn ngữ của hệ thống.`);
    }
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    /* bỏ qua lỗi giọng đọc */
  }
}
