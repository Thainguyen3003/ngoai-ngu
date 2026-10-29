import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { SettingsSheet } from './components/SettingsSheet';
import { Tabs, type TabName } from './components/Tabs';
import { COURSE, WORDS, unitById } from './data/course';
import { newCard } from './lib/srs';
import { addXp, baseState, clearState, demoState, dueIds, loadState, saveState, todayXp } from './lib/state';
import { speak } from './lib/tts';
import { DAY, fmtTime } from './lib/util';
import { Deck } from './screens/Deck';
import { Home } from './screens/Home';
import { Lesson } from './screens/Lesson';
import { Onboarding, type OnboardAnswers } from './screens/Onboarding';
import { Path } from './screens/Path';
import { Quiz, type QuizStats } from './screens/Quiz';
import { Result } from './screens/Result';
import { Review, type ReviewStats } from './screens/Review';
import { AppContext, type AppCtx } from './store';
import type { AppState, Lang, Result as ResultData, Unit } from './types';

type Route =
  | { name: TabName }
  | { name: 'lesson'; unit: Unit; t0: number }
  | { name: 'quiz'; unit: Unit; t0: number; run: number }
  | { name: 'review'; t0: number }
  | { name: 'result'; result: ResultData }
  | { name: 'onboard'; editing: boolean; mustFinish: boolean };

export default function App() {
  const [S, setS] = useState<AppState>(() => loadState() ?? demoState());
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [sheet, setSheet] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  useEffect(() => {
    saveState(S);
  }, [S]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const update = useCallback((fn: (d: AppState) => void) => {
    setS((prev) => {
      const d = structuredClone(prev);
      fn(d);
      return d;
    });
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const rate = S.settings.rate;
  const say = useCallback((text: string, lang: Lang, slow = false) => speak(text, lang, { rate, slow, onWarn: toast }), [rate, toast]);

  const ctx = useMemo<AppCtx>(() => ({ S, update, toast, say }), [S, update, toast, say]);

  const goTab = (name: TabName) => setRoute({ name });
  const startLesson = (u: Unit) => setRoute({ name: 'lesson', unit: u, t0: Date.now() });
  const startReview = () => {
    if (!dueIds(S, S.cur).length) toast('Chưa có thẻ nào đến hạn ôn');
    else setRoute({ name: 'review', t0: Date.now() });
  };

  function finishQuiz(unit: Unit, t0: number, st: QuizStats) {
    const L = unit.words[0].lang;
    const now = Date.now();
    const before = todayXp(S);
    const xp = st.xp + 5;
    update((d) => {
      if (!d.done[L].includes(unit.id)) d.done[L].push(unit.id);
      for (const w of unit.words) {
        const missed = st.miss.includes(w.id);
        // Từ mới hẹn ôn ngày mai; từ làm sai thì ôn ngay
        if (!d.srs[w.id]) d.srs[w.id] = newCard(missed ? now : now + DAY);
        else if (missed) d.srs[w.id].due = Math.min(d.srs[w.id].due, now);
      }
      addXp(d, xp);
    });
    const next = COURSE[L].find((u) => u.words.length && u.id !== unit.id && !S.done[L].includes(u.id));
    setRoute({
      name: 'result',
      result: {
        kind: 'lesson',
        lang: L,
        unit,
        acc: Math.round((100 * st.correct) / Math.max(1, st.answered)),
        xp,
        time: fmtTime(now - t0),
        words: unit.words,
        miss: st.miss,
        goalHit: before < S.profile.goalXp && before + xp >= S.profile.goalXp,
        next: next?.id ?? null,
      },
    });
  }

  function finishReview(t0: number, st: ReviewStats) {
    const before = todayXp(S);
    update((d) => addXp(d, st.xp));
    const good = st.seen.filter((id) => st.grades[id] >= 2).length;
    setRoute({
      name: 'result',
      result: {
        kind: 'review',
        lang: S.cur,
        acc: Math.round((100 * good) / Math.max(1, st.seen.length)),
        xp: st.xp,
        time: fmtTime(Date.now() - t0),
        words: st.seen.map((id) => WORDS[id]),
        grades: st.grades,
        goalHit: before < S.profile.goalXp && before + st.xp >= S.profile.goalXp,
      },
    });
  }

  function finishOnboard(a: OnboardAnswers, editing: boolean) {
    const profile = { langs: a.langs, goalXp: a.goal!, level: a.level, reason: a.reason, demo: false };
    if (editing)
      update((d) => {
        d.profile = profile;
        if (!d.profile.langs.includes(d.cur)) d.cur = d.profile.langs[0];
      });
    else setS((prev) => ({ ...baseState(profile), settings: prev.settings }));
    setRoute({ name: 'home' });
    toast(a.langs.length > 1 ? `Đã tạo lộ trình cho ${a.langs.length} ngôn ngữ` : 'Đã tạo lộ trình học');
  }

  function resetAll() {
    clearState();
    setS((prev) => ({ ...demoState(), settings: prev.settings }));
    setSheet(false);
    setRoute({ name: 'onboard', editing: false, mustFinish: true });
  }

  const focus = !['home', 'path', 'deck'].includes(route.name);

  let screen;
  switch (route.name) {
    case 'home':
      screen = <Home onStartUnit={startLesson} onReview={startReview} onTab={goTab} onFreshStart={() => setRoute({ name: 'onboard', editing: false, mustFinish: false })} />;
      break;
    case 'path':
      screen = <Path onStartUnit={startLesson} />;
      break;
    case 'deck':
      screen = <Deck onReview={startReview} onPath={() => goTab('path')} />;
      break;
    case 'lesson': {
      const { unit, t0 } = route;
      screen = <Lesson key={unit.id + t0} unit={unit} onExit={() => goTab('home')} onQuiz={() => setRoute({ name: 'quiz', unit, t0, run: Date.now() })} />;
      break;
    }
    case 'quiz': {
      const { unit, t0, run } = route;
      screen = <Quiz key={run} unit={unit} onExit={() => goTab('home')} onFinish={(st) => finishQuiz(unit, t0, st)} />;
      break;
    }
    case 'review': {
      const { t0 } = route;
      screen = (
        <Review
          key={t0}
          onExit={(xp) => {
            if (xp) update((d) => addXp(d, xp));
            goTab('home');
          }}
          onFinish={(st) => finishReview(t0, st)}
        />
      );
      break;
    }
    case 'result':
      screen = (
        <Result
          result={route.result}
          onHome={() => goTab('home')}
          onTab={goTab}
          onStartUnit={(id) => {
            const u = unitById(route.result.lang, id);
            if (u) startLesson(u);
          }}
        />
      );
      break;
    case 'onboard': {
      const { editing, mustFinish } = route;
      const p = S.profile;
      screen = (
        <Onboarding
          editing={editing}
          mustFinish={mustFinish}
          initial={editing ? { langs: p.langs, level: p.level, goal: p.goalXp, reason: p.reason } : undefined}
          onDone={(a) => finishOnboard(a, editing)}
          onClose={() => goTab('home')}
        />
      );
      break;
    }
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className={`shell ${focus ? '' : 'has-nav'}`}>
        {!focus && <Tabs active={route.name as TabName} onChange={goTab} />}
        <div className={`app ${focus ? 'focus' : ''}`} data-l={S.cur}>
          {!focus && <Header onSettings={() => setSheet(true)} />}
          <main id="view">{screen}</main>
        </div>
      </div>
      {sheet && (
        <SettingsSheet
          onClose={() => setSheet(false)}
          onRestartSurvey={() => {
            setSheet(false);
            setRoute({ name: 'onboard', editing: !S.profile.demo, mustFinish: false });
          }}
          onReset={resetAll}
        />
      )}
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
    </AppContext.Provider>
  );
}
