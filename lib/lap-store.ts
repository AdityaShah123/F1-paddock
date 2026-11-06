type Snap = { t: number; v: number };

let snap: Snap = { t: 0, v: 0 };
const listeners = new Set<() => void>();

export const lapRef = {
  t: 0,
  v: 0,
};

export function setLap(t: number, v: number) {
  lapRef.t = t;
  lapRef.v = v;
}

export function publishHud(t: number, v: number) {
  snap = { t, v };
  listeners.forEach((listener) => listener());
}

export function subscribeHud(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getHudSnap() {
  return snap;
}
