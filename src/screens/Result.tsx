import { IconCheck } from '../components/Icons';
import { WordInline } from '../components/Word';
import { LANGS } from '../data/course';
import { GRADES } from '../lib/srs';
import { streakNow } from '../lib/state';
import { useApp } from '../store';
import type { Result as ResultData } from '../types';

interface Props {
  result: ResultData;
  onHome: () => void;
  onTab: (t: 'deck' | 'path') => void;
  onStartUnit: (unitId: string) => void;
}

const GRADE_TONE = ['bad', 'mid', '', ''];

export function Result({ result: r, onHome, onTab, onStartUnit }: Props) {
  const { S } = useApp();
  const isLesson = r.kind === 'lesson';

  return (
    <section className="result">
      <div className="res-mark">
        <IconCheck />
      </div>
      <h1>{isLesson ? `Hoàn thành bài ${r.unit.n}` : 'Xong phiên ôn tập'}</h1>
      <p className="sub">{isLesson ? `${r.unit.title} · ${LANGS[r.lang].name}` : `${r.words.length} thẻ · ${LANGS[r.lang].name}`}</p>
      <div className="res-stats">
        <div>
          <span className="big">{r.acc}%</span>
          <span>{isLesson ? 'Độ chính xác' : 'Nhớ tốt'}</span>
        </div>
        <div>
          <span className="big">+{r.xp}</span>
          <span>XP</span>
        </div>
        <div>
          <span className="big">{r.time}</span>
          <span>Thời gian</span>
        </div>
      </div>
      {r.goalHit && (
        <p className="note">
          Bạn đã đạt mục tiêu {S.profile.goalXp} XP hôm nay. Chuỗi {streakNow(S)} ngày liên tiếp!
        </p>
      )}
      <h2>{isLesson ? 'Từ trong bài' : 'Các thẻ vừa ôn'}</h2>
      <ul className="wlist">
        {r.words.map((w) => {
          const [label, tone] =
            r.kind === 'lesson' ? (r.miss.includes(w.id) ? ['Cần ôn', 'bad'] : ['Đã thuộc', '']) : [GRADES[r.grades[w.id]], GRADE_TONE[r.grades[w.id]]];
          return (
            <li key={w.id}>
              <WordInline w={w} withReading />
              <span className="muted">{w.m}</span>
              <span className={`tag ${tone}`}>{label}</span>
            </li>
          );
        })}
      </ul>
      <div className="res-actions">
        {r.kind === 'lesson' ? (
          <>
            {r.next ? (
              <button className="btn" onClick={() => onStartUnit(r.next!)}>
                Học bài tiếp theo
              </button>
            ) : (
              <button className="btn" onClick={onHome}>
                Về trang chủ
              </button>
            )}
            <button className="btn ghost" onClick={() => onStartUnit(r.unit.id)}>
              Học lại bài này
            </button>
            {r.next ? (
              <button className="btn ghost" onClick={onHome}>
                Về trang chủ
              </button>
            ) : (
              <button className="btn ghost" onClick={() => onTab('deck')}>
                Mở sổ từ
              </button>
            )}
          </>
        ) : (
          <>
            <button className="btn" onClick={onHome}>
              Về trang chủ
            </button>
            <button className="btn ghost" onClick={() => onTab('deck')}>
              Mở sổ từ
            </button>
            <button className="btn ghost" onClick={() => onTab('path')}>
              Học bài mới
            </button>
          </>
        )}
      </div>
    </section>
  );
}
