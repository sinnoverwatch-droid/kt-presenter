import { useEffect, useState } from "react";
interface Clock {
  running: boolean;
  anchor: number;
  total: number;
  phases: Record<string, number>;
  active: string;
}
function settle(clock: Clock, now = Date.now()): Clock {
  const delta = clock.running ? Math.max(0, now - clock.anchor) : 0;
  return {
    ...clock,
    anchor: now,
    total: clock.total + delta,
    phases: {
      ...clock.phases,
      [clock.active]: (clock.phases[clock.active] || 0) + delta,
    },
  };
}
export function formatTime(seconds: number) {
  const value = Math.abs(Math.floor(seconds));
  return `${seconds < 0 ? "+" : ""}${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
export function useSessionClock(phaseId: string) {
  const [clock, setClock] = useState<Clock>(() => ({
    running: false,
    anchor: Date.now(),
    total: 0,
    phases: {},
    active: phaseId,
  }));
  const [, refresh] = useState(0);
  useEffect(() => {
    setClock((c) => ({ ...settle(c), active: phaseId }));
  }, [phaseId]);
  useEffect(() => {
    if (!clock.running) return;
    const interval = setInterval(() => refresh((n) => n + 1), 250);
    return () => clearInterval(interval);
  }, [clock.running]);
  const snapshot = settle(clock);
  return {
    running: clock.running,
    elapsed: Math.floor(snapshot.total / 1000),
    phaseElapsed: Math.floor((snapshot.phases[phaseId] || 0) / 1000),
    toggle: () => setClock((c) => ({ ...settle(c), running: !c.running })),
    resetPhase: () =>
      setClock((c) => {
        const next = settle(c);
        return { ...next, phases: { ...next.phases, [phaseId]: 0 } };
      }),
    resetAll: () =>
      setClock({
        running: false,
        anchor: Date.now(),
        total: 0,
        phases: {},
        active: phaseId,
      }),
  };
}
