import { useEffect, useState } from 'react';
import { IconBack, IconSearch, IconSound, IconX } from '../components/Icons';
import { BigGlyph, Example, ReadingLine, SpeakRow, WordInline } from '../components/Word';
import { LANGS, ONLINE_UNIT, ORDER, WORDS, unitById } from '../data/course';
import type { TrLang } from '../lib/live';
import { ALL_WORDS, detectSource, search } from '../lib/lookup';
import { OnlineError, lookupOnline, type OnlineEntry } from '../lib/online';
import { dueLabel, newCard } from '../lib/srs';
import { unitStatus } from '../lib/state';
import { useApp } from '../store';
import type { Lang, Unit, Word } from '../types';

type Filter = Lang | 'all';

const KANA_HAN = /[぀-ヿ一-鿿]/;

function useWide() {
  const query = '(min-width: 1024px)';
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

/** Tra từ trong các bài học (không cần gõ dấu) và tra online (MyMemory, Free Dictionary, Wiktionary) */
export function Lookup({ onStartUnit }: { onStartUnit: (u: Unit) => void }) {
  const { S } = useApp();
  const wide = useWide();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selId, setSelId] = useState<string | null>(null);

  const query = q.trim();
  const all = query ? search(query) : ALL_WORDS;
  const results = filter === 'all' ? all : all.filter((w) => w.lang === filter);
  const count = (l: Filter) => (l === 'all' ? all.length : all.filter((w) => w.lang === l).length);
  // Màn rộng luôn có một từ đang mở ở cột phải; điện thoại chỉ mở khi người dùng chọn
  const sel = results.find((w) => w.id === selId) ?? (wide ? results[0] : undefined);
  const online = query && <OnlinePanel q={query} prefer={filter === 'all' ? S.cur : filter} />;

  const pick = (w: Word) => {
    setSelId(w.id);
    if (!wide) window.scrollTo(0, 0);
  };

  return (
    <div className="lookup">
      <section className="hero">
        <p className="eyebrow">Tra cứu</p>
        <h1>Tra từ</h1>
        <p className="sub">Gõ từ tiếng Anh, Trung, Nhật hoặc tiếng Việt. Tìm trong các bài học trước (không cần gõ dấu), rồi tra thêm trên mạng.</p>
      </section>

      <div className="lk-search">
        <IconSearch />
        <input
          id="lookup-q"
          type="search"
          value={q}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder="Ví dụ: xin loi, computer, 电脑, ありがとう…"
          aria-label="Từ cần tra"
          onChange={(e) => {
            setQ(e.target.value);
            setSelId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) pick(results[0]);
            if (e.key === 'Escape') setQ('');
          }}
        />
        {q && (
          <button className="icon-b sm" onClick={() => setQ('')} aria-label="Xoá ô tìm">
            <IconX />
          </button>
        )}
      </div>

      <div className="lk-filter" role="group" aria-label="Lọc theo ngôn ngữ">
        {(['all', ...ORDER] as Filter[]).map((l) => (
          <button key={l} className={`lk-chip ${filter === l ? 'on' : ''}`} data-l={l === 'all' ? undefined : l} aria-pressed={filter === l} onClick={() => setFilter(l)}>
            {l === 'all' ? 'Tất cả' : LANGS[l].name}
            <small>{count(l)}</small>
          </button>
        ))}
      </div>

      {query && !results.length ? (
        // Không có trong bài học: tra online chiếm cả chiều ngang
        <div className="lk-body solo">
          <p className="muted">Không có “{query}” trong các bài học.</p>
          {online}
        </div>
      ) : (
        <div className={`lk-body ${sel ? 'has-sel' : ''}`}>
          <section className="lk-list" aria-label="Kết quả trong bài học">
            <p className="eyebrow">{query ? `${results.length} kết quả trong bài học` : `${results.length} từ trong các bài học`}</p>
            <ul className="lk-items">
              {results.map((w) => (
                <li key={w.id}>
                  <button className={`lk-item ${sel?.id === w.id ? 'on' : ''}`} data-l={w.lang} aria-current={sel?.id === w.id || undefined} onClick={() => pick(w)}>
                    <span className="lk-badge" lang={LANGS[w.lang].tag}>
                      {LANGS[w.lang].badge}
                    </span>
                    <span className="lk-main">
                      <WordInline w={w} withReading />
                      <span className="lk-m">{w.m}</span>
                    </span>
                    {S.srs[w.id] ? <span className="tag">Đã học</span> : <span className="tag new">Mới</span>}
                  </button>
                </li>
              ))}
            </ul>
            {online}
          </section>

          <aside className="lk-detail" aria-label="Chi tiết từ">
            {sel ? (
              <WordDetail key={sel.id} w={sel} onBack={() => setSelId(null)} onStartUnit={onStartUnit} />
            ) : (
              <p className="lk-empty-detail">Chọn một từ để xem cách đọc, ví dụ và nghe phát âm.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function WordDetail({ w, onBack, onStartUnit }: { w: Word; onBack: () => void; onStartUnit: (u: Unit) => void }) {
  const { S, update, toast } = useApp();
  const u = unitById(w.lang, w.unit)!;
  const st = unitStatus(S, w.lang, u);
  const card = S.srs[w.id];

  const addToReview = () => {
    update((d) => {
      if (!d.srs[w.id]) d.srs[w.id] = newCard(Date.now());
    });
    toast(`Đã thêm “${w.w}” vào ôn tập`);
  };

  const openLesson = () => {
    update((d) => {
      if (d.profile.langs.includes(w.lang)) d.cur = w.lang;
    });
    onStartUnit(u);
  };

  return (
    <div className="lk-word" data-l={w.lang}>
      <button className="btn ghost lk-back" onClick={onBack}>
        <IconBack /> Kết quả
      </button>
      <p className="lk-src">
        <span className="lk-badge sm" lang={LANGS[w.lang].tag}>
          {LANGS[w.lang].badge}
        </span>
        {LANGS[w.lang].name} · {LANGS[w.lang].level} · Bài {u.n}: {u.title}
      </p>
      <article className="wcard">
        <div className="glyph">
          <BigGlyph w={w} reading />
        </div>
        <ReadingLine w={w} reading />
        <p className="mean">{w.m}</p>
        <SpeakRow w={w} />
        <Example w={w} reading />
      </article>
      <p className="lk-status">{card ? `Có trong sổ từ · ${dueLabel(card.due).toLowerCase()} ôn lại` : 'Chưa có trong sổ từ ôn tập.'}</p>
      <div className="lk-actions">
        {!card && (
          <button className="btn" onClick={addToReview}>
            Thêm vào ôn tập
          </button>
        )}
        {st === 'locked' ? (
          <span className="muted lk-locked">Bài {u.n} chưa mở: học xong các bài trước để mở khoá.</span>
        ) : (
          <button className="btn ghost" onClick={openLesson}>
            {st === 'done' ? `Học lại bài ${u.n}` : `Học bài ${u.n}`}
          </button>
        )}
      </div>
    </div>
  );
}

const SRC_CHOICES: TrLang[] = ['en', 'zh', 'ja', 'vi'];
const srcName = (l: TrLang) => (l === 'vi' ? 'Tiếng Việt' : LANGS[l].name);

type OnlineState = { status: 'idle' } | { status: 'loading' } | { status: 'done'; entry: OnlineEntry } | { status: 'error'; msg: string };

/**
 * Tra online sau khi người dùng ngừng gõ một nhịp; gõ tiếp thì huỷ yêu cầu cũ.
 * Ngôn ngữ của từ được đoán tự động, người dùng đổi lại được nếu đoán sai.
 */
function OnlinePanel({ q, prefer }: { q: string; prefer: Lang }) {
  const { S, update, toast, say } = useApp();
  const [srcPick, setSrcPick] = useState<TrLang | null>(null);
  const [target, setTarget] = useState<Lang>(prefer);
  const [state, setState] = useState<OnlineState>({ status: 'idle' });
  const [retry, setRetry] = useState(0);
  const src = srcPick ?? detectSource(q, prefer);

  // Gõ từ mới thì quay về đoán tự động
  useEffect(() => setSrcPick(null), [q]);
  useEffect(() => setTarget(prefer), [prefer]);

  useEffect(() => {
    // Chữ Latin 1 ký tự thì chưa đáng tra; một chữ Hán/kana đã là một từ
    if (q.length < 2 && !KANA_HAN.test(q)) {
      setState({ status: 'idle' });
      return;
    }
    const ctl = new AbortController();
    setState({ status: 'loading' });
    const t = window.setTimeout(() => {
      lookupOnline(q, src, target, ctl.signal).then(
        (entry) => setState({ status: 'done', entry }),
        (e) => {
          if (ctl.signal.aborted) return;
          setState({ status: 'error', msg: e instanceof OnlineError ? e.message : 'Tra online không thành công, hãy thử lại.' });
        },
      );
    }, 600);
    return () => {
      window.clearTimeout(t);
      ctl.abort();
    };
  }, [q, src, target, retry]);

  return (
    <section className="card lk-online" aria-label="Tra online" aria-busy={state.status === 'loading'}>
      <div className="sec-h">
        <h2>Tra online</h2>
        {state.status === 'loading' && <span className="muted lk-hint">Đang tra…</span>}
      </div>

      <div className="lk-dir">
        <span className="muted">Từ “{q}” là:</span>
        {SRC_CHOICES.map((l) => (
          <button key={l} className={`lk-chip sm ${src === l ? 'on' : ''}`} data-l={l === 'vi' ? undefined : l} aria-pressed={src === l} onClick={() => setSrcPick(l)}>
            {srcName(l)}
          </button>
        ))}
      </div>
      {src === 'vi' && (
        <div className="lk-dir">
          <span className="muted">Dịch sang:</span>
          {ORDER.map((l) => (
            <button key={l} className={`lk-chip sm ${target === l ? 'on' : ''}`} data-l={l} aria-pressed={target === l} onClick={() => setTarget(l)}>
              {LANGS[l].name}
            </button>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <p className="err" role="alert">
          {state.msg}{' '}
          <button className="linkb" onClick={() => setRetry((n) => n + 1)}>
            Thử lại
          </button>
        </p>
      )}

      {state.status === 'done' && <OnlineResult entry={state.entry} saved={!!S.srs[`${state.entry.lang}:${state.entry.word}`]} onSave={save} onSay={say} />}

      <p className="muted lk-privacy">
        Từ bạn tra được gửi tới MyMemory và {src === 'en' || (src === 'vi' && target === 'en') ? 'Free Dictionary' : 'Wiktionary'} để lấy kết quả. Bản dịch máy có thể chưa chính xác.
      </p>
    </section>
  );

  function save(e: OnlineEntry) {
    const id = `${e.lang}:${e.word}`;
    const inLesson = WORDS[id] && WORDS[id].unit !== ONLINE_UNIT;
    const firstDef = e.senses[0]?.defs[0];
    update((d) => {
      if (!inLesson)
        d.saved[id] = { lang: e.lang, w: e.word, r: e.phonetic, m: e.vi ?? firstDef?.text ?? '', ex: e.lang === 'en' ? (firstDef?.example ?? '') : '', at: Date.now() };
      if (!d.srs[id]) d.srs[id] = newCard(Date.now());
    });
    toast(`Đã lưu “${e.word}” vào sổ từ để ôn tập`);
  }
}

function OnlineResult({ entry: e, saved, onSave, onSay }: { entry: OnlineEntry; saved: boolean; onSave: (e: OnlineEntry) => void; onSay: (text: string, lang: Lang) => void }) {
  const tag = LANGS[e.lang].tag;
  const lesson = WORDS[`${e.lang}:${e.word}`];
  const inLesson = lesson && lesson.unit !== ONLINE_UNIT ? unitById(e.lang, lesson.unit) : undefined;

  const play = () => {
    // Ưu tiên giọng đọc thật của từ điển, lỗi thì dùng giọng đọc của trình duyệt
    if (e.audio) new Audio(e.audio).play().catch(() => onSay(e.word, e.lang));
    else onSay(e.word, e.lang);
  };

  return (
    <div className="lk-on" data-l={e.lang}>
      <div className="lk-on-head">
        <span className="lk-badge sm" lang={tag}>
          {LANGS[e.lang].badge}
        </span>
        <span className="lk-on-word" lang={tag}>
          {e.word}
        </span>
        {e.phonetic && <span className="reading">{e.phonetic}</span>}
        <button className="icon-b" onClick={play} aria-label={`Nghe “${e.word}”`}>
          <IconSound />
        </button>
      </div>

      {e.vi && (
        <p className="lk-on-vi">
          <span className="eyebrow">Nghĩa tiếng Việt</span>
          <b>{e.vi}</b>
        </p>
      )}
      {e.alts.length > 0 && (
        <p className="muted lk-hint">
          Cách dịch khác: {e.alts.join(' · ')}
        </p>
      )}

      {e.senses.length > 0 && (
        <div className="lk-senses">
          <span className="eyebrow">Định nghĩa (tiếng Anh)</span>
          {e.senses.map((s, i) => (
            <div key={i} className="lk-sense">
              <span className="chip">{s.pos}</span>
              <ol>
                {s.defs.map((d, j) => (
                  <li key={j}>
                    {d.text}
                    {d.example && <i lang={tag}> “{d.example}”</i>}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      <div className="lk-actions">
        {saved ? (
          <span className="tag">Đã có trong sổ từ</span>
        ) : (
          <button className="btn" onClick={() => onSave(e)} disabled={!e.vi && !e.senses.length}>
            Lưu vào sổ từ
          </button>
        )}
        {inLesson && <span className="muted lk-hint">Từ này có trong Bài {inLesson.n}: {inLesson.title}.</span>}
        {e.source && (
          <a className="linkb" href={e.source.url} target="_blank" rel="noreferrer">
            Xem thêm trên {e.source.name === 'Free Dictionary' ? 'Wiktionary' : e.source.name} ↗
          </a>
        )}
      </div>
    </div>
  );
}
