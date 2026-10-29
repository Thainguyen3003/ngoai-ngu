import { IconCheck, IconLock } from '../components/Icons';
import { COURSE, LANGS } from '../data/course';
import { unitStatus } from '../lib/state';
import { useApp } from '../store';
import type { Unit } from '../types';

const CHIP = { done: 'Đã xong', current: 'Học ngay', locked: 'Đang khóa', soon: 'Sắp có' };

export function Path({ onStartUnit }: { onStartUnit: (u: Unit) => void }) {
  const { S, toast } = useApp();
  const L = S.cur;
  const units = COURSE[L];
  const real = units.filter((u) => u.words.length).length;

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Lộ trình {LANGS[L].level}</p>
        <h1>{LANGS[L].name}</h1>
        <p className="sub">
          {S.done[L].length}/{real} bài đã xong
        </p>
      </section>
      <ol className="path">
        {units.map((u) => {
          const st = unitStatus(S, L, u);
          const first = u.words[0]?.w ?? '';
          const node =
            st === 'done' ? <IconCheck /> : st === 'current' ? <span lang={LANGS[L].tag}>{L === 'en' ? first[0].toUpperCase() : [...first][0]}</span> : <IconLock />;
          const open = () => {
            if (st === 'locked') toast('Hoàn thành bài trước để mở khóa bài này');
            else if (st !== 'soon') onStartUnit(u);
          };
          return (
            <li key={u.id} className={`unit ${st}`}>
              <button className="unit-b" onClick={open} disabled={st === 'soon'}>
                <span className="node">{node}</span>
                <span className="panel">
                  <span className="eyebrow">Bài {u.n}</span>
                  <span className="panel-h">
                    <b>{u.title}</b>
                    <span className="chip">{CHIP[st]}</span>
                  </span>
                  <span className="panel-w" lang={LANGS[L].tag}>
                    {u.words.length ? u.words.map((w) => w.w).join(' · ') : 'Đang soạn nội dung'}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}
