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

interface Props {
  active: TabName;
  onChange: (t: TabName) => void;
  /** Trên điện thoại menu là ngăn kéo: open điều khiển việc trượt ra */
  open: boolean;
  onClose: () => void;
}

/** Menu bên trái: cột cố định trên màn rộng, ngăn kéo trượt ra trên điện thoại */
export function Tabs({ active, onChange, open, onClose }: Props) {
  const { S } = useApp();
  const due = dueIds(S, S.cur).length;
  return (
    <>
      {open && <button className="nav-bg" onClick={onClose} aria-label="Đóng menu" />}
      <nav id="main-nav" className={`tabs ${open ? 'open' : ''}`} data-l={S.cur} aria-label="Điều hướng chính">
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
            <button
              key={k}
              className={`tab ${active === k ? 'on' : ''}`}
              aria-current={active === k ? 'page' : undefined}
              onClick={() => {
                onChange(k);
                onClose();
              }}
            >
              {icon}
              <span>{label}</span>
              {k === 'deck' && due > 0 && <span className="cnt">{due}</span>}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
