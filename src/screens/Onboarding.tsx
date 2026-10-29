import { useState } from 'react';
import { IconBack, IconCheck, IconX } from '../components/Icons';
import { LANGS, ORDER } from '../data/course';
import type { Lang } from '../types';

export interface OnboardAnswers {
  langs: Lang[];
  level: string | null;
  goal: number | null;
  reason: string | null;
}

type Key = 'level' | 'goal' | 'reason';
type Choice = [string | number, string, string];

const STEPS: { k: 'langs' | Key; h: string; s: string; c?: Choice[] }[] = [
  { k: 'langs', h: 'Bạn muốn học ngôn ngữ nào?', s: 'Chọn một hoặc nhiều. Bạn có thể đổi lại trong Cài đặt.' },
  { k: 'level', h: 'Bạn đang ở trình độ nào?', s: 'Ứng dụng sẽ gợi ý bài phù hợp để bắt đầu.', c: [
    ['new', 'Mới bắt đầu', 'Chưa biết gì, học từ câu chào và bảng chữ cái'],
    ['some', 'Biết một chút', 'Hiểu được vài câu đơn giản'],
    ['mid', 'Khá rồi', 'Muốn ôn lại và mở rộng vốn từ'],
  ] },
  { k: 'goal', h: 'Mỗi ngày bạn dành bao lâu?', s: 'Mục tiêu nhỏ mà đều đặn sẽ hiệu quả hơn học dồn.', c: [
    [20, '5 phút', 'Nhẹ nhàng · 20 XP mỗi ngày'],
    [40, '10 phút', 'Đều đặn · 40 XP mỗi ngày'],
    [80, '20 phút', 'Nghiêm túc · 80 XP mỗi ngày'],
  ] },
  { k: 'reason', h: 'Bạn học để làm gì?', s: 'Giúp chọn chủ đề và từ vựng sát nhu cầu hơn.', c: [
    ['travel', 'Du lịch', 'Gọi món, hỏi đường, mua sắm'],
    ['exam', 'Thi chứng chỉ', 'IELTS, HSK, JLPT'],
    ['work', 'Công việc', 'Email, họp, giao tiếp với đối tác'],
    ['fun', 'Sở thích', 'Phim, nhạc, anime, đọc sách'],
  ] },
];

interface Props {
  initial?: OnboardAnswers;
  /** Đang sửa hồ sơ có sẵn: giữ nguyên tiến độ */
  editing: boolean;
  /** Không có hồ sơ để quay về (vừa xóa dữ liệu) */
  mustFinish: boolean;
  onDone: (a: OnboardAnswers) => void;
  onClose: () => void;
}

export function Onboarding({ initial, editing, mustFinish, onDone, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<OnboardAnswers>(initial ?? { langs: [], level: null, goal: null, reason: null });
  const st = STEPS[step];
  const valid = st.k === 'langs' ? a.langs.length > 0 : a[st.k] != null;
  const last = step === STEPS.length - 1;
  const accent = ORDER.find((l) => a.langs.includes(l)) ?? 'zh';

  const toggleLang = (l: Lang) => setA({ ...a, langs: a.langs.includes(l) ? a.langs.filter((x) => x !== l) : [...a.langs, l] });
  const next = () => {
    if (!valid) return;
    if (last) onDone({ ...a, langs: ORDER.filter((l) => a.langs.includes(l)) });
    else setStep(step + 1);
  };

  return (
    <div data-l={accent}>
      <section className="ob">
        <div className="ob-top">
          {step > 0 ? (
            <button className="icon-b" onClick={() => setStep(step - 1)} aria-label="Quay lại">
              <IconBack />
            </button>
          ) : (
            !mustFinish && (
              <button className="icon-b" onClick={onClose} aria-label="Đóng">
                <IconX />
              </button>
            )
          )}
          <div className="dots">
            {STEPS.map((_, i) => (
              <i key={i} className={i <= step ? 'on' : ''} />
            ))}
          </div>
          <span className="plabel">
            {step + 1}/{STEPS.length}
          </span>
        </div>
        <div>
          <h1>{st.h}</h1>
          <p className="sub">{st.s}</p>
        </div>
        <div className="choices">
          {st.k === 'langs'
            ? ORDER.map((l) => {
                const on = a.langs.includes(l);
                return (
                  <button key={l} className={`choice ${on ? 'on' : ''}`} data-l={l} aria-pressed={on} onClick={() => toggleLang(l)}>
                    <span className="sample" lang={LANGS[l].tag}>
                      {LANGS[l].sample}
                    </span>
                    <span>
                      <b>{LANGS[l].name}</b>
                      <small>{LANGS[l].desc}</small>
                    </span>
                    <span className="ck">{on && <IconCheck />}</span>
                  </button>
                );
              })
            : st.c!.map(([v, t, d], i) => {
                const k = st.k as Key;
                const on = a[k] === v;
                return (
                  <button key={String(v)} className={`choice ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => setA({ ...a, [k]: v })}>
                    <span className="badge-n">{i + 1}</span>
                    <span>
                      <b>{t}</b>
                      <small>{d}</small>
                    </span>
                    <span className="ck">{on && <IconCheck />}</span>
                  </button>
                );
              })}
        </div>
      </section>
      <div className="abar">
        <div className="abar-in">
          <button className="btn wide" onClick={next} disabled={!valid}>
            {last ? (editing ? 'Lưu thay đổi' : 'Bắt đầu học') : 'Tiếp tục'}
          </button>
        </div>
      </div>
    </div>
  );
}
