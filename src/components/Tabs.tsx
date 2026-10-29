import type { ReactNode } from 'react';
import { dueIds } from '../lib/state';
import { useApp } from '../store';
import { IconCards, IconHome, IconMap } from './Icons';

export type TabName = 'home' | 'path' | 'deck';

const TABS: [TabName, string, ReactNode][] = [
  ['home', 'Trang chủ', <IconHome />],
  ['path', 'Lộ trình', <IconMap />],
  ['deck', 'Ôn tập', <IconCards />],
];

export function Tabs({ active, onChange }: { active: TabName; onChange: (t: TabName) => void }) {
  const { S } = useApp();
  const due = dueIds(S, S.cur).length;
  return (
    <nav className="tabs" data-l={S.cur} aria-label="Điều hướng chính">
      {/* Chỉ hiện khi menu nằm bên trái (màn rộng) */}
      <div className="brand side-brand">
        <span className="mark" aria-hidden="true">
          <i>A</i>
          <i>中</i>
          <i>あ</i>
        </span>
        <span>Ngoại Ngữ</span>
      </div>
      <div className="tabs-in">
        {TABS.map(([k, label, icon]) => (
          <button key={k} className={`tab ${active === k ? 'on' : ''}`} aria-current={active === k ? 'page' : undefined} onClick={() => onChange(k)}>
            {icon}
            <span>{label}</span>
            {k === 'deck' && due > 0 && <span className="cnt">{due}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}
