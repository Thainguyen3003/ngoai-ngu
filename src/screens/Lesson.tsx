import { useEffect, useState } from 'react';
import { FocusBar } from '../components/FocusBar';
import { BigGlyph, Example, ReadingLine, SpeakRow } from '../components/Word';
import { useApp } from '../store';
import type { Unit } from '../types';

export function Lesson({ unit, onExit, onQuiz }: { unit: Unit; onExit: () => void; onQuiz: () => void }) {
  const { say } = useApp();
  const [i, setI] = useState(0);
  const n = unit.words.length;
  const w = unit.words[i];

  useEffect(() => {
    // chỉ đọc khi chuyển sang từ mới
    say(w.w, w.lang);
  }, [i]);

  const next = () => (i < n - 1 ? setI(i + 1) : onQuiz());
  const prev = () => i > 0 && setI(i - 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const onButton = (e.target as HTMLElement).closest?.('button');
      if (e.key === 'ArrowRight' || (e.key === 'Enter' && !onButton)) {
        next();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ' && !onButton) {
        say(w.w, w.lang);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <FocusBar progress={(i + 1) / (n + 1)} label={`${i + 1}/${n}`} exitTitle="Thoát bài học?" exitMsg="Tiến độ của bài này sẽ không được lưu." onExit={onExit} />
      <p className="eyebrow">
        Bài {unit.n} · {unit.title} · Từ mới
      </p>
      <article className="wcard" key={w.id}>
        <div className="glyph">
          <BigGlyph w={w} />
        </div>
        <ReadingLine w={w} />
        <p className="mean">{w.m}</p>
        <SpeakRow w={w} />
        <Example w={w} />
      </article>
      <div className="lesson-nav">
        <button className="btn ghost" onClick={prev} disabled={i === 0}>
          Trước
        </button>
        <button className="btn" onClick={next}>
          {i < n - 1 ? 'Từ tiếp theo' : 'Làm bài tập'}
        </button>
      </div>
    </>
  );
}
