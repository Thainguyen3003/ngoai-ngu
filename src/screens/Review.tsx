import { useEffect, useRef, useState } from 'react';
import { FocusBar } from '../components/FocusBar';
import { BigGlyph, Example, ReadingLine, SpeakRow } from '../components/Word';
import { LANGS, WORDS } from '../data/course';
import { GRADES, intervalLabel, schedule, type Grade } from '../lib/srs';
import { dueIds } from '../lib/state';
import { useApp } from '../store';

export interface ReviewStats {
  xp: number;
  seen: string[];
  grades: Record<string, number>;
}

/** Phiên ôn tối đa 20 thẻ đến hạn. Thẻ "Quên" được hỏi lại cuối phiên, tối đa 2 lần. */
export function Review({ onExit, onFinish }: { onExit: (xp: number) => void; onFinish: (s: ReviewStats) => void }) {
  const { S, update, say } = useApp();
  const [queue, setQueue] = useState<string[]>(() => dueIds(S, S.cur).slice(0, 20));
  const [pos, setPos] = useState(0);
  const [flip, setFlip] = useState(false);
  const st = useRef({ xp: 0, seen: [] as string[], grades: {} as Record<string, number>, again: {} as Record<string, number> });

  const id = queue[pos];
  const w = WORDS[id];
  const card = S.srs[id];

  const reveal = () => {
    if (flip) return;
    setFlip(true);
    say(w.w, w.lang);
  };

  const rate = (g: Grade) => {
    const s = st.current;
    update((d) => void (d.srs[id] = schedule(d.srs[id], g)));
    s.grades[id] = g;
    s.xp += 1;
    if (!s.seen.includes(id)) s.seen.push(id);
    let len = queue.length;
    if (g === 0 && (s.again[id] || 0) < 2) {
      s.again[id] = (s.again[id] || 0) + 1;
      setQueue((qs) => [...qs, id]);
      len++;
    }
    if (pos + 1 >= len) onFinish({ xp: s.xp, seen: s.seen, grades: s.grades });
    else {
      setPos(pos + 1);
      setFlip(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const onButton = (e.target as HTMLElement).closest?.('button');
      if (!flip && (e.key === ' ' || e.key === 'Enter') && !onButton) {
        reveal();
        e.preventDefault();
      } else if (flip && /^[1-4]$/.test(e.key)) rate((+e.key - 1) as Grade);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!w || !card) return null;

  return (
    <>
      <FocusBar progress={pos / queue.length} label={`${pos + 1}/${queue.length}`} exitTitle="Dừng phiên ôn tập?" exitMsg="Các thẻ đã chấm vẫn được lưu." onExit={() => onExit(st.current.xp)} />
      <p className="eyebrow">Ôn tập · {LANGS[w.lang].name}</p>
      <article className="wcard" key={`${id}-${pos}`}>
        <div className="glyph">
          <BigGlyph w={w} reading={flip} />
        </div>
        {flip ? (
          <>
            <ReadingLine w={w} reading />
            <p className="mean">{w.m}</p>
            <SpeakRow w={w} />
            <Example w={w} reading />
          </>
        ) : (
          <p className="hint">Bạn có nhớ nghĩa và cách đọc của từ này?</p>
        )}
      </article>
      <div className="abar">
        <div className="abar-in">
          {flip ? (
            <div className="rate">
              {GRADES.map((t, g) => (
                <button key={t} className={`rate-b g${g}`} onClick={() => rate(g as Grade)}>
                  <b>{t}</b>
                  <span>{intervalLabel(schedule(card, g as Grade))}</span>
                </button>
              ))}
            </div>
          ) : (
            <button className="btn wide" onClick={reveal}>
              Hiện đáp án <kbd>Space</kbd>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
