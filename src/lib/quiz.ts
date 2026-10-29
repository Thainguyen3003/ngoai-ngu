import { COURSE } from '../data/course';
import type { Unit, Word } from '../types';
import { shuffle } from './util';

export type ChoiceQ = { type: 'meaning' | 'reverse' | 'listen'; word: Word; opts: Word[]; ans: number; retry?: boolean };
export type MatchQ = { type: 'match'; word: Word; words: Word[]; right: number[]; retry?: boolean };
export type ArrangeQ = { type: 'arrange'; word: Word; tokens: string[]; bank: number[]; retry?: boolean };
export type Question = ChoiceQ | MatchQ | ArrangeQ;

/** Câu trắc nghiệm: 3 đáp án nhiễu, ưu tiên từ cùng bài */
function choice(type: ChoiceQ['type'], w: Word): ChoiceQ {
  const pool = COURSE[w.lang].flatMap((u) => u.words).filter((x) => x.id !== w.id && x.m !== w.m);
  const ordered = [...shuffle(pool.filter((x) => x.unit === w.unit)), ...shuffle(pool.filter((x) => x.unit !== w.unit))];
  const picked: Word[] = [];
  for (const x of ordered) {
    if (picked.length === 3) break;
    if (!picked.some((p) => p.m === x.m || p.w === x.w)) picked.push(x);
  }
  const opts = shuffle([w, ...picked]);
  return { type, word: w, opts, ans: opts.indexOf(w) };
}

function arrange(w: Word): ArrangeQ {
  const tokens = w.ex.split('|');
  const idx = tokens.map((_, i) => i);
  let bank = shuffle(idx.slice());
  for (let k = 0; k < 5 && bank.every((v, i) => tokens[v] === tokens[i]); k++) bank = shuffle(idx.slice());
  return { type: 'arrange', word: w, tokens, bank };
}

/** 10 câu cho một bài 6 từ: chọn nghĩa, chọn từ, nghe, ghép cặp, sắp xếp câu */
export function buildQuiz(u: Unit, canListen: boolean): Question[] {
  const W = shuffle(u.words.slice());
  const longEx = shuffle(u.words.filter((w) => w.ex.split('|').length >= 3));
  const matchWords = shuffle(u.words.slice()).slice(0, 4);
  return [
    choice('meaning', W[0]),
    choice('reverse', W[1]),
    choice(canListen ? 'listen' : 'meaning', W[2]),
    choice('meaning', W[3]),
    { type: 'match', word: matchWords[0], words: matchWords, right: shuffle([0, 1, 2, 3]) },
    choice('reverse', W[4]),
    choice(canListen ? 'listen' : 'reverse', W[5]),
    arrange(longEx[0]),
    choice('meaning', W[5]),
    arrange(longEx[1] || longEx[0]),
  ];
}

/** Bản sao để hỏi lại câu sai ở cuối bài, đảo lại thứ tự đáp án */
export function retryOf(q: Question): Question {
  if (q.type === 'arrange') return { ...q, bank: shuffle(q.bank.slice()), retry: true };
  if (q.type === 'match') return { ...q, right: shuffle(q.right.slice()), retry: true };
  const opts = shuffle(q.opts.slice());
  return { ...q, opts, ans: opts.indexOf(q.word), retry: true };
}
