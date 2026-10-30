import { useEffect, useRef, useState } from 'react';
import { IconMic, IconSound } from '../components/Icons';
import { LANGS, ORDER } from '../data/course';
import { STT_OK, TRANSLATE_OK, getTranslator, listen, type Translator } from '../lib/live';
import { dayKey, pad } from '../lib/util';
import { useApp } from '../store';
import type { Lang } from '../types';

interface Line {
  id: number;
  at: number;
  lang: Lang;
  src: string;
  /** Bản dịch tiếng Việt, null khi đang dịch hoặc không dịch được */
  vi: string | null;
}

const clock = (t: number) => {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** Nghe người nói qua micro, chép lại từng câu và dịch song song sang tiếng Việt */
export function Live({ onRecording }: { onRecording: (on: boolean) => void }) {
  const { S, toast, say } = useApp();
  const [lang, setLang] = useState<Lang>(S.cur);
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState('');
  const [interimVi, setInterimVi] = useState('');
  const [on, setOn] = useState(false);
  /** Chữ trên nút khi đang chuẩn bị hoặc tải gói dịch */
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [canTranslate, setCanTranslate] = useState(TRANSLATE_OK);
  const stopRef = useRef<(() => void) | null>(null);
  const tr = useRef<Translator | null>(null);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => onRecording(on), [on, onRecording]);
  useEffect(() => () => stopRef.current?.(), []);
  useEffect(() => {
    if (on) endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [lines.length, on]);

  // Dịch cả câu đang nói dở, nhưng đợi người nói ngừng một nhịp để không dịch lại sau mỗi chữ
  useEffect(() => {
    if (!interim || !tr.current) {
      setInterimVi('');
      return;
    }
    let stale = false;
    const t = window.setTimeout(() => {
      tr.current?.translate(interim).then(
        (v) => !stale && setInterimVi(v),
        () => {},
      );
    }, 500);
    return () => {
      stale = true;
      window.clearTimeout(t);
    };
  }, [interim]);

  function addLine(src: string, L: Lang) {
    const id = nextId.current++;
    setLines((ls) => [...ls, { id, at: Date.now(), lang: L, src, vi: null }]);
    tr.current?.translate(src).then(
      (vi) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, vi } : l))),
      () => {},
    );
  }

  async function start() {
    setErr(null);
    setBusy('Đang chuẩn bị…');
    tr.current = await getTranslator(lang, (p) => setBusy(`Đang tải gói dịch ${p}%`));
    setCanTranslate(!!tr.current);
    setBusy(null);
    try {
      stopRef.current = listen(lang, {
        onInterim: setInterim,
        onSentence: (s) => addLine(s, lang),
        onError: setErr,
        onStop: () => {
          stopRef.current = null;
          setOn(false);
        },
      });
      setOn(true);
    } catch {
      setErr('Không bật được micro.');
    }
  }

  const text = () => lines.map((l) => `[${clock(l.at)}] ${l.src}${l.vi ? `\n${l.vi}` : ''}`).join('\n\n');

  function copy() {
    navigator.clipboard.writeText(text()).then(
      () => toast('Đã chép bản ghi'),
      () => toast('Không chép được, hãy thử "Tải .txt"'),
    );
  }

  function download() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text()], { type: 'text/plain;charset=utf-8' }));
    a.download = `phien-dich-${dayKey()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clear() {
    if (window.confirm(`Xoá ${lines.length} câu đã ghi?`)) setLines([]);
  }

  const head = (
    <section className="hero">
      <p className="eyebrow">Phiên dịch trực tiếp</p>
      <h1>Nghe và dịch</h1>
      <p className="sub">Bật micro khi người khác nói. Mỗi câu được chép lại và dịch sang tiếng Việt ngay khi nói xong.</p>
    </section>
  );

  if (!STT_OK)
    return (
      <>
        {head}
        <section className="card empty">
          <IconMic />
          <h2>Trình duyệt chưa hỗ trợ</h2>
          <p className="muted">Tính năng này cần nhận giọng nói của Chrome hoặc Edge trên máy tính.</p>
        </section>
      </>
    );

  return (
    <div className="live" data-l={lang}>
      {head}
      <div className="pick3" role="group" aria-label="Người nói dùng tiếng">
        {ORDER.map((l) => (
          <button key={l} className={`pk ${l === lang ? 'on' : ''}`} aria-pressed={l === lang} disabled={on || !!busy} onClick={() => setLang(l)}>
            {LANGS[l].name}
            <small>sang tiếng Việt</small>
          </button>
        ))}
      </div>
      {!canTranslate && (
        <p className="note">
          Trình duyệt này chưa dịch được {LANGS[lang].name} sang tiếng Việt, nên chỉ chép lại lời nói. Bản dịch cần Chrome trên máy tính, bản 138 trở lên.
        </p>
      )}
      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}

      <section className="live-log" aria-live="polite">
        {!lines.length && !interim && <p className="muted live-empty">{on ? 'Đang nghe…' : 'Chưa có câu nào.'}</p>}
        {lines.map((l) => (
          <article key={l.id} className="ll">
            <div className="ll-h">
              <time>{clock(l.at)}</time>
              <button className="icon-b sm" onClick={() => say(l.src, l.lang)} aria-label="Đọc lại câu này">
                <IconSound />
              </button>
            </div>
            <p className="ll-src" lang={LANGS[l.lang].tag}>
              {l.src}
            </p>
            {canTranslate && <p className="ll-vi">{l.vi ?? '…'}</p>}
          </article>
        ))}
        {interim && (
          <article className="ll now">
            <div className="ll-h">
              <time>Đang nói</time>
            </div>
            <p className="ll-src" lang={LANGS[lang].tag}>
              {interim}
            </p>
            {canTranslate && interimVi && <p className="ll-vi">{interimVi}</p>}
          </article>
        )}
        <div ref={endRef} />
      </section>

      <p className="muted live-tip">
        Chrome gửi âm thanh tới máy chủ Google để nhận giọng nói, phần dịch chạy ngay trên máy. Họp trực tuyến thì mở loa ngoài để micro nghe được người nói.
      </p>

      <div className="live-bar">
        <button className={`btn live-go ${on ? 'danger' : ''}`} onClick={on ? () => stopRef.current?.() : start} disabled={!!busy}>
          {busy ?? (on ? <><span className="rec-dot" aria-hidden="true" />Dừng nghe</> : <><IconMic />Bắt đầu nghe</>)}
        </button>
        <button className="btn ghost" onClick={copy} disabled={!lines.length}>
          Chép
        </button>
        <button className="btn ghost" onClick={download} disabled={!lines.length}>
          Tải .txt
        </button>
        <button className="btn ghost danger" onClick={clear} disabled={!lines.length || on}>
          Xoá
        </button>
      </div>
    </div>
  );
}
