"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * Raccourcis style « g » puis lettre (fenêtre ~1 s) : g+d accueil, g+c contacts, etc.
 */
export function DashboardKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let prefix = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function clearPrefix() {
      prefix = false;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (e.key === "g" || e.key === "G") {
        prefix = true;
        if (timer) clearTimeout(timer);
        timer = setTimeout(clearPrefix, 1000);
        return;
      }

      if (!prefix) return;
      prefix = false;
      if (timer) clearTimeout(timer);

      const k = e.key.toLowerCase();
      const go: Record<string, string> = {
        d: "/dashboard",
        c: "/dashboard/contacts",
        b: "/dashboard/biens",
        j: "/dashboard/journee",
        p: "/dashboard/contacts/pipeline",
        r: "/dashboard/relances",
        v: "/dashboard/visites",
        t: "/dashboard/taches",
        a: "/dashboard/audit",
        i: "/dashboard/integrations",
      };
      const href = go[k];
      if (href) {
        e.preventDefault();
        router.push(href);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [router]);

  return null;
}
