import { createContext, useContext } from 'react';
import type { AppState, Lang } from './types';

export interface AppCtx {
  S: AppState;
  /** Sửa state qua một bản nháp đã được sao chép; tự lưu vào trình duyệt */
  update: (fn: (draft: AppState) => void) => void;
  toast: (msg: string) => void;
  say: (text: string, lang: Lang, slow?: boolean) => void;
}

export const AppContext = createContext<AppCtx | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp phải nằm trong AppContext');
  return ctx;
}
