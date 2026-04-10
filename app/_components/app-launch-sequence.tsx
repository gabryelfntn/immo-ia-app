"use client";

import { Home } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

/** v2 : la v1 ne tournait que sur `/`, souvent contournée par la redirection dashboard. */
const STORAGE_KEY = "immo-launch-seen-v2";

type Boot = "ssr" | "splash" | "nosplash";
type Phase = "playing" | "handoff" | "done";

export function AppLaunchSequence({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [boot, setBoot] = useState<Boot>("ssr");
  const [phase, setPhase] = useState<Phase>("playing");
  const [reducedMotion, setReducedMotion] = useState(false);

  const skipSplashRoute = (pathname ?? "").startsWith("/client");

  const finish = useCallback(() => {
    setPhase((p) => (p === "done" ? p : "handoff"));
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  useLayoutEffect(() => {
    if (skipSplashRoute) {
      setBoot("nosplash");
      setPhase("done");
      return;
    }
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setBoot("nosplash");
        setPhase("done");
        return;
      }
    } catch {
      /* ignore */
    }
    setBoot("splash");
    setPhase("playing");
  }, [skipSplashRoute]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMq = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    if (boot !== "splash" || phase !== "playing") return undefined;

    if (reducedMotion) {
      const t = window.setTimeout(finish, 380);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(finish, 2400);
    return () => window.clearTimeout(t);
  }, [boot, phase, reducedMotion, finish]);

  useEffect(() => {
    if (phase !== "handoff") return undefined;
    const t = window.setTimeout(() => setPhase("done"), 720);
    return () => window.clearTimeout(t);
  }, [phase]);

  const showOverlay =
    !skipSplashRoute &&
    boot === "splash" &&
    (phase === "playing" || phase === "handoff");
  const revealContent =
    skipSplashRoute ||
    boot === "nosplash" ||
    boot === "ssr" ||
    phase === "handoff" ||
    phase === "done";

  if (skipSplashRoute) {
    return <>{children}</>;
  }

  return (
    <>
      {showOverlay ? (
        <div
          className={`app-launch-layer ${phase === "handoff" ? "app-launch-layer--out" : ""}`}
          aria-hidden={phase === "handoff"}
        >
          <div className="app-launch-aurora" aria-hidden />
          <div className="app-launch-grid" aria-hidden />
          <div className="app-launch-inner">
            <div
              className={`app-launch-mark ${reducedMotion ? "app-launch-mark--static" : ""}`}
            >
              <Home className="h-10 w-10" strokeWidth={1.75} />
            </div>
            <p
              className={`app-launch-brand ${reducedMotion ? "app-launch-brand--static" : ""}`}
            >
              ImmoAI
            </p>
            <p
              className={`app-launch-tagline ${reducedMotion ? "app-launch-tagline--static" : ""}`}
            >
              Suite agence immobilière
            </p>
            <div
              className={`app-launch-rule ${reducedMotion ? "app-launch-rule--static" : ""}`}
              aria-hidden
            />
          </div>
          <button type="button" className="app-launch-skip" onClick={finish}>
            Passer l’introduction
          </button>
        </div>
      ) : null}

      <div
        className={
          revealContent
            ? "app-launch-content app-launch-content--visible"
            : "app-launch-content"
        }
      >
        {children}
      </div>
    </>
  );
}
