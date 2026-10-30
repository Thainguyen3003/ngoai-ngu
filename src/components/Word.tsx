import type { CSSProperties } from 'react';
import { LANGS, exText, readingText } from '../data/course';
import { toneOf } from '../lib/util';
import { useApp } from '../store';
import type { Word } from '../types';
import { IconSound } from './Icons';

/** Chữ lớn: Hán/Nhật trong ô 田字格 (pinyin hoặc furigana phía trên), tiếng Anh trên dòng kẻ ô li */
export function BigGlyph({ w, reading, max = 104 }: { w: Word; reading?: boolean; max?: number }) {
  const { S } = useApp();
  const rd = reading ?? S.settings.reading;
  if (w.lang === 'en') return <span className="en-word" lang="en">{w.w}</span>;
  const chars = [...w.w];
  const cs = Math.min(max, Math.floor(300 / chars.length));
  const syl = w.lang === 'zh' ? w.r.split(' ') : [];
  return (
    <>
      {w.lang === 'ja' && w.r && rd && <span className="kana" lang="ja">{w.r}</span>}
      <span className={`cells ${w.lang}`} style={{ '--cs': `${cs}px` } as CSSProperties} lang={LANGS[w.lang].tag}>
        {chars.map((c, i) => (
          <span className="cell" key={i}>
            {w.lang === 'zh' && rd && <span className={`py t${toneOf(syl[i] || '')}`}>{syl[i]}</span>}
            <span className="ch">{c}</span>
          </span>
        ))}
      </span>
    </>
  );
}

export function ReadingLine({ w, reading }: { w: Word; reading?: boolean }) {
  const { S } = useApp();
  // Từ tra online lưu lại có thể không có phiên âm
  if (!(reading ?? S.settings.reading) || !(w.r || w.ro)) return null;
  if (w.lang === 'en') return <p className="reading">{w.r}</p>;
  if (w.lang === 'zh')
    return (
      <p className="reading">
        {w.r.split(' ').map((s, i) => (
          <span key={i} className={`t${toneOf(s)}`}>
            {i > 0 && ' '}
            {s}
          </span>
        ))}
      </p>
    );
  return <p className="reading ro">{w.ro}</p>;
}

/** Từ cỡ chữ thường, kèm phiên âm nhỏ bên dưới nếu bật */
export function WordInline({ w, withReading }: { w: Word; withReading?: boolean }) {
  const { S } = useApp();
  const r = withReading && S.settings.reading ? readingText(w) : '';
  return (
    <span className="wi">
      <span className="wi-w" lang={LANGS[w.lang].tag}>{w.w}</span>
      {r && <small>{r}</small>}
    </span>
  );
}

function Highlight({ text, word }: { text: string; word: string }) {
  const i = text.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + word.length)}</mark>
      {text.slice(i + word.length)}
    </>
  );
}

export function Example({ w, reading }: { w: Word; reading?: boolean }) {
  const { S, say } = useApp();
  const rd = reading ?? S.settings.reading;
  const text = exText(w);
  // Từ tra online lưu lại có thể không có câu ví dụ
  if (!text) return null;
  return (
    <div className="ex">
      <div className="ex-head">
        <span className="eyebrow">Ví dụ</span>
        <button className="icon-b sm" onClick={() => say(text, w.lang)} aria-label="Nghe câu ví dụ">
          <IconSound />
        </button>
      </div>
      <p className="ex-t" lang={LANGS[w.lang].tag}>
        <Highlight text={text} word={w.w} />
      </p>
      {w.exR && rd && <p className="ex-r">{w.exR}</p>}
      {w.exM && <p className="ex-m">{w.exM}</p>}
    </div>
  );
}

export function SpeakRow({ w }: { w: Word }) {
  const { say } = useApp();
  return (
    <div className="speak-row">
      <button className="btn soft" onClick={() => say(w.w, w.lang)}>
        <IconSound /> Nghe
      </button>
      <button className="btn soft" onClick={() => say(w.w, w.lang, true)}>
        Nghe chậm
      </button>
    </div>
  );
}
