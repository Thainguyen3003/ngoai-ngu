import { useEffect, useRef, useState } from 'react';
import { LANGS, ORDER } from '../data/course';
import { backupFileName, makeBackup, parseBackup } from '../lib/state';
import { useApp } from '../store';
import type { AppState, Lang } from '../types';
import { IconX } from './Icons';

interface Props {
  onClose: () => void;
  onRestartSurvey: () => void;
  onReset: () => void;
  onImport: (s: AppState) => void;
}

function summary(s: AppState) {
  const words = Object.keys(s.srs).length;
  const lessons = ORDER.reduce((n, l) => n + s.done[l].length, 0);
  const xp = Object.values(s.xp).reduce((n, x) => n + x, 0);
  return `${words} từ đã học · ${lessons} bài đã xong · ${xp} XP · ${s.history.length} lần học`;
}

function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const GOALS: [number, string][] = [[20, '5 phút'], [40, '10 phút'], [80, '20 phút']];

export function SettingsSheet({ onClose, onRestartSurvey, onReset, onImport }: Props) {
  const { S, update, toast } = useApp();
  const [resetAsk, setResetAsk] = useState(false);
  const [pending, setPending] = useState<{ state: AppState; file: string; exportedAt: string | null } | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportNow = () => {
    const name = backupFileName();
    downloadText(name, makeBackup(S));
    toast(`Đã tải về ${name}`);
  };

  const readFile = async (f: File | undefined) => {
    setImportErr(null);
    setPending(null);
    if (!f) return;
    try {
      const { state, exportedAt } = parseBackup(await f.text());
      setPending({ state, file: f.name, exportedAt });
    } catch (e) {
      setImportErr(`Không đọc được ${f.name}: ${e instanceof Error ? e.message : 'lỗi không rõ'}`);
    }
    if (fileRef.current) fileRef.current.value = '';
  };
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
          <span>
            <b>Sao lưu tiến độ</b>
            <small>Mang tiến độ sang máy hoặc trình duyệt khác: xuất ra file ở máy này, rồi nhập file đó ở máy kia.</small>
            <small>Hiện có: {summary(S)}</small>
          </span>
          <div className="row2">
            <button className="btn ghost" onClick={exportNow}>
              Xuất ra file
            </button>
            <button className="btn ghost" onClick={() => fileRef.current?.click()}>
              Nhập từ file
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => readFile(e.target.files?.[0])} />
          </div>
          {importErr && (
            <p className="err" role="alert">
              {importErr}
            </p>
          )}
          {pending && (
            <div className="confirm">
              <span>
                <b>{pending.file}</b>
                {pending.exportedAt && <> · xuất lúc {new Date(pending.exportedAt).toLocaleString('vi-VN')}</>}
                <br />
                {summary(pending.state)}
                <br />
                Thay toàn bộ tiến độ hiện tại bằng dữ liệu trong file này?
              </span>
              <div className="row2">
                <button className="btn ghost" onClick={() => setPending(null)}>
                  Hủy
                </button>
                <button className="btn" onClick={() => onImport(pending.state)}>
                  Thay bằng file này
                </button>
              </div>
            </div>
          )}
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
