import { useEffect, useState } from 'react';
import { LANGS, ORDER } from '../data/course';
import { useApp } from '../store';
import type { Lang } from '../types';
import { IconX } from './Icons';

interface Props {
  onClose: () => void;
  onRestartSurvey: () => void;
  onReset: () => void;
}

const GOALS: [number, string][] = [[20, '5 phút'], [40, '10 phút'], [80, '20 phút']];

export function SettingsSheet({ onClose, onRestartSurvey, onReset }: Props) {
  const { S, update, toast } = useApp();
  const [resetAsk, setResetAsk] = useState(false);
  const p = S.profile;
  const s = S.settings;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggleLang = (l: Lang) => {
    if (p.langs.includes(l) && p.langs.length === 1) {
      toast('Cần giữ ít nhất một ngôn ngữ');
      return;
    }
    update((d) => {
      const has = d.profile.langs.includes(l);
      d.profile.langs = ORDER.filter((x) => (x === l ? !has : d.profile.langs.includes(x)));
      if (!d.profile.langs.includes(d.cur)) d.cur = d.profile.langs[0];
    });
  };

  return (
    <div className="sheet-wrap" data-l={S.cur}>
      <button className="sheet-bg" onClick={onClose} aria-label="Đóng cài đặt" />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-h">
        <div className="sheet-head">
          <h2 id="sheet-h">Cài đặt</h2>
          <button className="icon-b" onClick={onClose} aria-label="Đóng">
            <IconX />
          </button>
        </div>

        <label className="srow" htmlFor="set-reading">
          <span>
            <b>Hiện phiên âm</b>
            <small>IPA, pinyin, furigana và romaji khi học</small>
          </span>
          <input className="sw" type="checkbox" id="set-reading" checked={s.reading} onChange={(e) => update((d) => void (d.settings.reading = e.target.checked))} />
        </label>

        <div className="srow">
          <label htmlFor="set-rate">
            <b>Tốc độ giọng đọc</b>
            <small>{s.rate.toFixed(1)}×</small>
          </label>
          <input type="range" id="set-rate" min={0.5} max={1.2} step={0.1} value={s.rate} onChange={(e) => update((d) => void (d.settings.rate = +e.target.value))} />
        </div>

        <div className="srow col">
          <b>Mục tiêu mỗi ngày</b>
          <div className="pick3">
            {GOALS.map(([x, t]) => (
              <button key={x} className={`pk ${p.goalXp === x ? 'on' : ''}`} onClick={() => update((d) => void (d.profile.goalXp = x))}>
                {t}
                <small>{x} XP</small>
              </button>
            ))}
          </div>
        </div>

        <div className="srow col">
          <b>Ngôn ngữ đang học</b>
          <div className="pick3">
            {ORDER.map((l) => (
              <button key={l} className={`pk ${p.langs.includes(l) ? 'on' : ''}`} data-l={l} aria-pressed={p.langs.includes(l)} onClick={() => toggleLang(l)}>
                {LANGS[l].name}
                <small>{LANGS[l].level}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="srow col">
          <b>Dữ liệu</b>
          <div className="row2">
            <button className="btn ghost" onClick={onRestartSurvey}>
              Làm lại khảo sát đầu
            </button>
            {!resetAsk && (
              <button className="btn ghost danger" onClick={() => setResetAsk(true)}>
                Xóa toàn bộ tiến độ
              </button>
            )}
          </div>
          {resetAsk && (
            <div className="confirm">
              <span>Xóa hết XP, chuỗi ngày và thẻ ôn tập? Không thể hoàn tác.</span>
              <div className="row2">
                <button className="btn ghost" onClick={() => setResetAsk(false)}>
                  Hủy
                </button>
                <button className="btn danger" onClick={onReset}>
                  Xóa hết
                </button>
              </div>
            </div>
          )}
          <small>Tiến độ chỉ được lưu trên trình duyệt này.</small>
        </div>
      </div>
    </div>
  );
}
