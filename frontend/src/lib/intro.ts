/**
 * Intro state on <html data-intro="pending | revealing | done">.
 */
export const INTRO_REVEAL_EVENT = "clover:intro-reveal";
export const INTRO_STORAGE_KEY = "clover:intro";

type IntroState = "pending" | "revealing" | "done";

function getState(): IntroState {
  if (typeof document === "undefined") return "done";
  const v = document.documentElement.dataset.intro;
  return v === "pending" || v === "revealing" ? v : "done";
}

export function whenIntroRevealing(cb: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  if (getState() !== "pending") {
    cb();
    return () => {};
  }
  const handler = () => cb();
  window.addEventListener(INTRO_REVEAL_EVENT, handler, { once: true });
  return () => window.removeEventListener(INTRO_REVEAL_EVENT, handler);
}

export function setIntroState(state: IntroState) {
  document.documentElement.dataset.intro = state;
  if (state === "revealing") {
    window.dispatchEvent(new Event(INTRO_REVEAL_EVENT));
  }
  if (state === "done") {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      /* private mode */
    }
  }
}

export function fontsReady(timeoutMs = 2500): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) {
    return Promise.resolve();
  }
  return Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
}
