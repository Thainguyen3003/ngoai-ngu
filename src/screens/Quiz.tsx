import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FocusBar } from '../components/FocusBar';
import { IconSound } from '../components/Icons';
import { BigGlyph, WordInline } from '../components/Word';
import { LANGS, exText, readingText } from '../data/course';
import { buildQuiz, retryOf, type ChoiceQ, type Question } from '../lib/quiz';
import { TTS_OK } from '../lib/tts';
import { pick } from '../lib/util';
import { useApp } from '../store';
import type { Unit, Word } from '../types';

export interface QuizStats {
  correct: number;
  answered: number;
  xp: number;
  miss: string[];
}

interface MatchState {
  pl: number | null;
  pr: number | null;
  done: number[];
  errs: number;
  bad: [number, number] | null;
}

const PRAISE = ['Chính xác!', 'Tuyệt vời!', 'Đúng rồi!', 'Giỏi lắm!'];
const freshMatch = (): MatchState => ({ pl: null, pr: null, done: [], errs: 0, bad: null });

export function Quiz({ unit, onExit, onFinish }: { unit: Unit; onExit: () => void; onFinish: (s: QuizStats) => void }) {
  const { S, say } = useApp();
  const [queue, setQueue] = useState<Question[]>(() => buildQuiz(unit, TTS_OK));
  const [pos, setPos] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [ok, setOk] = useState(false);
  const [praise, setPraise] = useState('');
  const [match, setMatch] = useState<MatchState>(freshMatch);
  const stats = useRef({ correct: 0, answered: 0, xp: 0, miss: new Set<string>() });

  const q = queue[pos];

  useEffect(() => {
    if (q.type === 'listen') say(q.word.w, q.word.lang);
  }, [pos]);

  const canCheck = q.type === 'arrange' ? order.length === q.tokens.length : q.type !== 'match' && sel != null;

  function check() {
    if (checked || !canCheck) return;
    const right = q.type === 'arrange' ? order.map((i) => q.tokens[i]).join('\u0001') === q.tokens.join('\u0001') : sel === (q as ChoiceQ).ans;
    const st = stats.current;
    st.answered++;
    if (right) {
      st.correct++;
      st.xp += 2;
    } else {
      st.miss.add(q.word.id);
      if (!q.retry) setQueue((qs) => [...qs, retryOf(q)]);
    }
    setOk(right);
    setPraise(pick(PRAISE));
    setChecked(true);
  }

  function next() {
    if (pos + 1 >= queue.length) {
      const st = stats.current;
      onFinish({ correct: st.correct, answered: st.answered, xp: st.xp, miss: [...st.miss] });
      return;
    }
    setPos(pos + 1);
    setSel(null);
    setOrder([]);
    setChecked(false);
    setOk(false);
    setMatch(freshMatch());
  }

  function pickMatch(side: 'l' | 'r', i: number) {
    if (q.type !== 'match' || checked || match.done.includes(i)) return;
    const m: MatchState = { ...match, done: [...match.done] };
    if (side === 'l') {
      m.pl = i;
      say(q.words[i].w, q.words[i].lang);
    } else m.pr = i;
    if (m.pl != null && m.pr != null) {
      if (m.pl === m.pr) m.done.push(m.pl);
      else {
        m.errs++;
        stats.current.miss.add(q.words[m.pl].id);
        m.bad = [m.pl, m.pr];
        setTimeout(() => setMatch((x) => ({ ...x, bad: null })), 450);
      }
      m.pl = m.pr = null;
      if (m.done.length === q.words.length) {
        const st = stats.current;
        st.answered++;
        if (!m.errs) {
          st.correct++;
          st.xp += 2;
        } else st.xp += 1;
        setOk(true);
        setChecked(true);
      }
    }
    setMatch(m);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const onButton = (e.target as HTMLElement).closest?.('button');
      if (/^[1-4]$/.test(e.key) && 'opts' in q && !checked && +e.key <= q.opts.length) {
        setSel(+e.key - 1);
        e.preventDefault();
      } else if (e.key === 'Enter' && !onButton) {
        if (checked) next();
        else check();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const options = (cq: ChoiceQ, render: (o: Word) => ReactNode) => (
    <div className="opts">
      {cq.opts.map((o, i) => {
        let cls = '';
        if (checked) cls = i === cq.ans ? 'right' : i === sel ? 'wrong' : '';
        else if (i === sel) cls = 'sel';
        return (
          <button key={o.id} className={`opt ${cls}`} disabled={checked} onClick={() => setSel(i)}>
            <kbd>{i + 1}</kbd>
            <span>{render(o)}</span>
          </button>
        );
      })}
    </div>
  );

  let body: ReactNode = null;
  const w = q.word;
  const tag = LANGS[w.lang].tag;
  if (q.type === 'meaning')
    body = (
      <>
        <p className="qlabel">Từ này nghĩa là gì?</p>
        <div className="qprompt">
          <div className="glyph">
            <BigGlyph w={w} max={76} />
          </div>
          <button className="icon-b" onClick={() => say(w.w, w.lang)} aria-label="Nghe">
            <IconSound />
          </button>
        </div>
        {options(q, (o) => o.m)}
      </>
    );
  else if (q.type === 'reverse')
    body = (
      <>
        <p className="qlabel">Chọn từ có nghĩa là</p>
        <div className="qprompt vi">“{w.m}”</div>
        {options(q, (o) => <WordInline w={o} withReading />)}
      </>
    );
  else if (q.type === 'listen')
    body = (
      <>
        <p className="qlabel">Nghe và chọn từ bạn nghe được</p>
        <div className="qprompt">
          <button className="listen" onClick={() => say(w.w, w.lang)} aria-label="Nghe lại">
            <IconSound />
          </button>
          <button className="btn soft" onClick={() => say(w.w, w.lang, true)}>
            Nghe chậm
          </button>
        </div>
        {options(q, (o) => <WordInline w={o} />)}
      </>
    );
  else if (q.type === 'match') {
    const cls = (side: 'l' | 'r', i: number) =>
      match.done.includes(i) ? 'done' : match.bad && match.bad[side === 'l' ? 0 : 1] === i ? 'bad' : (side === 'l' ? match.pl : match.pr) === i ? 'pick' : '';
    body = (
      <>
        <p className="qlabel">Ghép từ với nghĩa của nó</p>
        <div className="match">
          <div className="mcol">
            {q.words.map((x, i) => (
              <button key={x.id} className={`mb ${cls('l', i)}`} disabled={match.done.includes(i)} onClick={() => pickMatch('l', i)}>
                <span lang={LANGS[x.lang].tag}>{x.w}</span>
              </button>
            ))}
          </div>
          <div className="mcol">
            {q.right.map((i) => (
              <button key={i} className={`mb ${cls('r', i)}`} disabled={match.done.includes(i)} onClick={() => pickMatch('r', i)}>
                {q.words[i].m}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  } else if (q.type === 'arrange') {
    body = (
      <>
        <p className="qlabel">Sắp xếp thành câu đúng</p>
        <div className="qprompt vi">“{w.exM}”</div>
        <div className="ans-line" aria-label="Câu trả lời">
          {order.map((ti, k) => (
            <button key={k} className="tok" lang={tag} disabled={checked} onClick={() => setOrder(order.filter((_, j) => j !== k))}>
              {q.tokens[ti]}
            </button>
          ))}
        </div>
        <div className="bank">
          {q.bank.map((ti) => {
            const used = order.includes(ti);
            return (
              <button key={ti} className={`tok ${used ? 'used' : ''}`} lang={tag} disabled={used || checked} onClick={() => setOrder([...order, ti])}>
                {q.tokens[ti]}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
      <FocusBar progress={pos / queue.length} label={`${pos + 1}/${queue.length}`} exitTitle="Thoát bài học?" exitMsg="Tiến độ của bài này sẽ không được lưu." onExit={onExit} />
      <section className="quiz" key={pos}>
        {body}
      </section>
      <ActionBar q={q} checked={checked} ok={ok} praise={praise} errs={match.errs} canCheck={canCheck} reading={S.settings.reading} onCheck={check} onNext={next} />
    </>
  );
}

function Answer({ q }: { q: Question }) {
  const w = q.word;
  const tag = LANGS[w.lang].tag;
  if (q.type === 'meaning') return <>{w.m}</>;
  if (q.type === 'arrange') return <span lang={tag}>{exText(w)}</span>;
  const r = readingText(w);
  return (
    <>
      <span lang={tag}>{w.w}</span>
      {r && ` · ${r}`} ({w.m})
    </>
  );
}

interface BarProps {
  q: Question;
  checked: boolean;
  ok: boolean;
  praise: string;
  errs: number;
  canCheck: boolean;
  reading: boolean;
  onCheck: () => void;
  onNext: () => void;
}

function ActionBar({ q, checked, ok, praise, errs, canCheck, reading, onCheck, onNext }: BarProps) {
  if (!checked)
    return (
      <div className="abar">
        <div className="abar-in">
          {q.type === 'match' ? (
            <p className="muted">Chạm một từ ở cột trái, rồi chạm nghĩa tương ứng ở cột phải.</p>
          ) : (
            <button className="btn wide" onClick={onCheck} disabled={!canCheck}>
              Kiểm tra
            </button>
          )}
        </div>
      </div>
    );

  let head: string;
  let sub: ReactNode = null;
  if (q.type === 'match') {
    head = errs ? 'Xong rồi!' : 'Ghép đúng hết!';
    if (errs) sub = `Bạn ghép nhầm ${errs} lần, các từ đó sẽ được ôn lại.`;
  } else if (ok) {
    head = praise;
    if (q.type === 'arrange' && q.word.exR && reading) sub = q.word.exR;
  } else {
    head = 'Chưa đúng';
    sub = (
      <>
        Đáp án: <Answer q={q} />
      </>
    );
  }
  return (
    <div className={`abar ${ok ? 'ok' : 'no'}`}>
      <div className="abar-in">
        <div className="fb" role="status">
          <b>{head}</b>
          {sub && <span>{sub}</span>}
        </div>
        <button className="btn" onClick={onNext} autoFocus>
          Tiếp tục
        </button>
      </div>
    </div>
  );
}
