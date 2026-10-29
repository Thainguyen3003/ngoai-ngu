import { WordInline } from '../components/Word';
import { LANGS, WORDS } from '../data/course';
import { dueLabel, strength } from '../lib/srs';
import { DAY } from '../lib/util';
import { useApp } from '../store';

export function Deck({ onReview, onPath }: { onReview: () => void; onPath: () => void }) {
  const { S } = useApp();
  const L = S.cur;
  const now = Date.now();
  const cards = Object.entries(S.srs)
    .filter(([id]) => id.startsWith(L + ':') && WORDS[id])
    .map(([id, c]) => ({ w: WORDS[id], c }))
    .sort((a, b) => a.c.due - b.c.due);

  const head = (
    <section className="hero">
      <p className="eyebrow">Ôn tập ngắt quãng · {LANGS[L].name}</p>
      <h1>Sổ từ vựng</h1>
      <p className="sub">Thẻ nhớ tốt sẽ được hẹn ôn thưa dần: 1 ngày, 3 ngày, 1 tuần, rồi vài tuần.</p>
    </section>
  );

  if (!cards.length)
    return (
      <>
        {head}
        <section className="card empty">
          <span className="ch" lang={LANGS[L].tag}>
            {L === 'en' ? 'Aa' : '字'}
          </span>
          <h2>Chưa có thẻ nào</h2>
          <p className="muted">Học xong một bài, các từ trong bài sẽ tự vào đây để ôn.</p>
          <button className="btn" onClick={onPath}>
            Mở lộ trình
          </button>
        </section>
      </>
    );

  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const endTomorrow = startToday.getTime() + 2 * DAY;
  const due = cards.filter((x) => x.c.due <= now).length;
  const tomorrow = cards.filter((x) => x.c.due > now && x.c.due < endTomorrow).length;
  const week = cards.filter((x) => x.c.due >= endTomorrow && x.c.due < now + 7 * DAY).length;

  return (
    <>
      {head}
      <div className="tiles">
        <div>
          <span className="big">{due}</span>
          <span>Đến hạn</span>
        </div>
        <div>
          <span className="big">{tomorrow}</span>
          <span>Đến ngày mai</span>
        </div>
        <div>
          <span className="big">{week}</span>
          <span>7 ngày tới</span>
        </div>
      </div>
      <button className="btn wide" onClick={onReview} disabled={!due}>
        {due ? `Ôn ${Math.min(due, 20)} thẻ đến hạn` : 'Chưa có thẻ đến hạn'}
      </button>
      <section className="sec-h">
        <h2>Tất cả từ</h2>
        <span className="muted">{cards.length} từ</span>
      </section>
      <ul className="dlist">
        {cards.map(({ w, c }) => {
          const [label, tone] = strength(c);
          return (
            <li key={w.id}>
              <span className="dw">
                <WordInline w={w} withReading />
              </span>
              <span className="dm">{w.m}</span>
              <span className={`tag ${tone === 'good' ? '' : tone}`}>{label}</span>
              <span className="dd">{dueLabel(c.due)}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
