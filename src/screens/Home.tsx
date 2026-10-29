import { IconFlame } from '../components/Icons';
import { LANGS, totalWords, unitById } from '../data/course';
import { dueLabel } from '../lib/srs';
import { dueIds, learnedCount, nextUnit, streakNow, todayXp } from '../lib/state';
import { DAY, WEEKDAYS, WEEKDAYS_SHORT, dayKey, fmtTime, pad } from '../lib/util';
import { useApp } from '../store';
import type { Unit } from '../types';

interface Props {
  onStartUnit: (u: Unit) => void;
  onReview: () => void;
  onTab: (t: 'path' | 'deck') => void;
  onFreshStart: () => void;
}

const BAR_H = 96;

export function Home({ onStartUnit, onReview, onTab, onFreshStart }: Props) {
  const { S, update } = useApp();
  const L = S.cur;
  const info = LANGS[L];
  const goal = S.profile.goalXp;
  const tx = todayXp(S);
  const due = dueIds(S, L).length;
  const nu = nextUnit(S, L);
  const pct = Math.min(1, tx / goal);
  const C = 2 * Math.PI * 30;
  const now = new Date();

  const days = [...Array(7)].map((_, i) => {
    const t = Date.now() - (6 - i) * DAY;
    return { k: dayKey(t), x: S.xp[dayKey(t)] || 0, wd: new Date(t).getDay(), today: i === 6 };
  });
  const max = Math.max(goal, ...days.map((d) => d.x));
  const recent = S.history.filter((h) => h.lang === L).slice(0, 5);

  let nextDue = '';
  if (!due) {
    const fut = Object.entries(S.srs)
      .filter(([id]) => id.startsWith(L + ':'))
      .map(([, c]) => c.due)
      .sort((a, b) => a - b)[0];
    if (fut) nextDue = dueLabel(fut).toLowerCase();
  }

  return (
    <>
      {S.profile.demo && (
        <div className="demo">
          <span>Bạn đang xem dữ liệu mẫu: 5 ngày học, vài bài đã xong.</span>
          <button className="linkb" onClick={onFreshStart}>
            Bắt đầu từ đầu
          </button>
        </div>
      )}

      <section className="hero">
        <p className="eyebrow">
          {WEEKDAYS[now.getDay()]}, {now.getDate()}/{now.getMonth() + 1}
        </p>
        <h1>Học {info.name}</h1>
        <p className="sub">
          {info.level} · {learnedCount(S, L)}/{totalWords(L)} từ đã học
        </p>
      </section>

      <section className="card goal">
        <div className="ringw">
          <svg className="ring" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" className="ring-bg" />
            <circle cx="36" cy="36" r="30" className="ring-fg" strokeDasharray={C.toFixed(2)} strokeDashoffset={(C * (1 - pct)).toFixed(2)} />
          </svg>
          <b>{Math.round(pct * 100)}%</b>
        </div>
        <div className="goal-t">
          <b>
            {tx}/{goal} XP
          </b>
          <br />
          <span className="muted">{tx >= goal ? 'Đã đạt mục tiêu hôm nay' : `Còn ${goal - tx} XP để đạt mục tiêu`}</span>
        </div>
        <div className="streak">
          <IconFlame />
          <b>{streakNow(S)}</b>
          <span>ngày liên tiếp</span>
        </div>
      </section>

      <section className="card next">
        {nu ? (
          <>
            <p className="eyebrow">
              Bài {nu.n} · {nu.title}
            </p>
            <div className="preview">
              {nu.words.slice(0, 4).map((w, i) => (
                <span key={w.id}>
                  {i > 0 && <span className="dot">· </span>}
                  <span lang={info.tag}>{w.w}</span>
                </span>
              ))}
            </div>
            <p className="muted">{nu.words.length} từ mới và 10 câu bài tập · khoảng 5 phút</p>
            <button className="btn" onClick={() => onStartUnit(nu)}>
              {S.done[L].length ? 'Tiếp tục học' : 'Bắt đầu bài đầu tiên'}
            </button>
          </>
        ) : (
          <>
            <p className="eyebrow">Lộ trình {info.level}</p>
            <h2>Bạn đã học hết các bài hiện có</h2>
            <p className="muted">Bài mới đang được soạn. Trong lúc chờ, hãy ôn lại các thẻ để nhớ lâu hơn.</p>
            <button className="btn" onClick={() => onTab('path')}>
              Xem lộ trình
            </button>
          </>
        )}
      </section>

      <section className="card rev">
        <div>
          <p className="eyebrow">Ôn tập ngắt quãng</p>
          <div className="rev-n">
            {due ? (
              <>
                <b>{due}</b>
                <span>thẻ đến hạn ôn</span>
              </>
            ) : (
              <span>Không có thẻ đến hạn{nextDue && ` · thẻ tiếp theo ${nextDue}`}</span>
            )}
          </div>
        </div>
        {due ? (
          <button className="btn" onClick={onReview}>
            Ôn tập ngay
          </button>
        ) : (
          <button className="btn ghost" onClick={() => onTab('deck')}>
            Xem sổ từ
          </button>
        )}
      </section>

      <section className="card">
        <div className="sec-h">
          <h2>7 ngày qua</h2>
          <span className="muted">{days.reduce((n, d) => n + d.x, 0)} XP</span>
        </div>
        <div className="bars">
          {days.map((d) => (
            <div key={d.k} className={`bar ${d.today ? 'today' : ''}`} title={`${d.x} XP`}>
              <i className={d.x === 0 ? 'zero' : d.x >= goal ? 'met' : 'under'} style={{ height: d.x ? Math.max(6, Math.round((BAR_H * d.x) / max)) : 4 }} />
              <span>{d.today ? 'Nay' : WEEKDAYS_SHORT[d.wd]}</span>
            </div>
          ))}
          <div className="goal-line" style={{ bottom: 22 + Math.round((BAR_H * goal) / max) }}>
            <em>mục tiêu</em>
          </div>
        </div>
      </section>

      <section>
        <div className="sec-h">
          <h2>Kết quả gần đây</h2>
          {recent.length > 0 && <span className="muted">{S.history.filter((h) => h.lang === L).length} lần học</span>}
        </div>
        {recent.length ? (
          <ul className="dlist hist">
            {recent.map((h) => {
              const u = h.unit ? unitById(L, h.unit) : undefined;
              const d = new Date(h.at);
              const tone = h.acc >= 80 ? '' : h.acc >= 50 ? 'mid' : 'bad';
              return (
                <li key={h.at}>
                  <span className="dw">
                    <b>{h.kind === 'lesson' ? `Bài ${u?.n ?? '?'} · ${u?.title ?? h.unit}` : `Ôn tập ${h.words} thẻ`}</b>
                  </span>
                  <span className="dm">
                    {d.getDate()}/{d.getMonth() + 1} lúc {pad(d.getHours())}:{pad(d.getMinutes())} · {fmtTime(h.ms)}
                  </span>
                  <span className={`tag ${tone}`}>{h.acc}%</span>
                  <span className="dd">+{h.xp} XP</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted hist-empty">Học xong một bài hoặc một phiên ôn tập, kết quả sẽ được ghi lại ở đây.</p>
        )}
      </section>

      <section>
        <h2>Ngôn ngữ của bạn</h2>
        <ul className="lrows">
          {S.profile.langs.map((l) => {
            const n = learnedCount(S, l);
            const t = totalWords(l);
            return (
              <li key={l}>
                <button className={`lrow ${l === L ? 'on' : ''}`} data-l={l} onClick={() => update((d) => void (d.cur = l))}>
                  <span className="lb" lang={LANGS[l].tag}>
                    {LANGS[l].badge}
                  </span>
                  <span>
                    <b>{LANGS[l].name}</b> <small>· {LANGS[l].level}</small>
                    <div className="prog">
                      <i style={{ width: `${t ? Math.round((100 * n) / t) : 0}%` }} />
                    </div>
                  </span>
                  <small>
                    {n}/{t} từ
                  </small>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
