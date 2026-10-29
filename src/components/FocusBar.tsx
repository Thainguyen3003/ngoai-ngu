import { useEffect, useState } from 'react';
import { IconX } from './Icons';

interface Props {
  progress: number;
  label: string;
  exitTitle: string;
  exitMsg: string;
  onExit: () => void;
}

/** Thanh trên cùng của chế độ học: nút thoát (có hỏi lại), thanh tiến độ, số câu */
export function FocusBar({ progress, label, exitTitle, exitMsg, onExit }: Props) {
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAsk((a) => !a);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pct = Math.round(progress * 100);
  return (
    <>
      <div className="fbar">
        <button className="icon-b" onClick={() => setAsk(true)} aria-label="Thoát">
          <IconX />
        </button>
        <div className="pbar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${(progress * 100).toFixed(1)}%` }} />
        </div>
        <span className="plabel">{label}</span>
      </div>
      {ask && (
        <div className="card exitask">
          <p>
            <b>{exitTitle}</b>
            <br />
            <span className="muted">{exitMsg}</span>
          </p>
          <div className="row2">
            <button className="btn ghost" onClick={onExit}>
              Thoát
            </button>
            <button className="btn" onClick={() => setAsk(false)}>
              Học tiếp
            </button>
          </div>
        </div>
      )}
    </>
  );
}
