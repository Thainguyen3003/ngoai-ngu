import { LANGS } from '../data/course';
import { dueIds, streakNow } from '../lib/state';
import { useApp } from '../store';
import { IconFlame, IconGear, IconMenu } from './Icons';

export function Header({ onSettings, onMenu, menuOpen }: { onSettings: () => void; onMenu: () => void; menuOpen: boolean }) {
  const { S, update } = useApp();
  const due = dueIds(S, S.cur).length;
  return (
    <header className="top">
      {/* Chỉ hiện trên điện thoại, nơi menu là ngăn kéo bên trái */}
      <button className="icon-b menu-b" onClick={onMenu} aria-label="Mở menu" aria-expanded={menuOpen} aria-controls="main-nav">
        <IconMenu />
        {due > 0 && <span className="dot" aria-hidden="true" />}
      </button>
      <div className="brand">
        <span className="mark" aria-hidden="true">
          <i>A</i>
          <i>中</i>
          <i>あ</i>
        </span>
        <span>Ngoại Ngữ</span>
      </div>
      <div className="seg" aria-label="Ngôn ngữ đang học">
        {S.profile.langs.map((l) => (
          <button
            key={l}
            className={`seg-b ${l === S.cur ? 'on' : ''}`}
            data-l={l}
            aria-pressed={l === S.cur}
            title={LANGS[l].name}
            onClick={() => update((d) => void (d.cur = l))}
          >
            <b>{LANGS[l].badge}</b>
            <span>{LANGS[l].short}</span>
          </button>
        ))}
      </div>
      <div className="stats">
        <span className="stat" title="Chuỗi ngày học liên tiếp">
          <IconFlame />
          {streakNow(S)}
        </span>
        <button className="icon-b" onClick={onSettings} aria-label="Cài đặt">
          <IconGear />
        </button>
      </div>
    </header>
  );
}
