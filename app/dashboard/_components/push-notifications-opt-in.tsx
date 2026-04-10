"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationsOptIn() {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setReady(true);
    setSupported(
      typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window
    );
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribe = useCallback(async () => {
    setMessage(null);
    if (!vapidPublic) {
      setMessage("Clé VAPID publique non configurée (voir doc déploiement).");
      return;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setMessage("Permission refusée.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = urlBase64ToUint8Array(vapidPublic);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // TS 5 + DOM : Uint8Array<ArrayBufferLike> vs BufferSource (évite SharedArrayBuffer variance)
        applicationServerKey: key as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `Erreur ${res.status}`);
        return;
      }
      setMessage("Notifications activées (résumé quotidien si cron configuré).");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Échec de l’activation.");
    } finally {
      setLoading(false);
    }
  }, [vapidPublic]);

  const unsubscribe = useCallback(async () => {
    setMessage(null);
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch("/api/push/subscribe", { method: "DELETE" });
      setMessage("Notifications désactivées.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Échec.");
    } finally {
      setLoading(false);
    }
  }, []);

  if (!ready || !supported || !vapidPublic) {
    return null;
  }

  return (
    <div className="rounded-xl border border-stone-200/90 bg-[#faf8f4] px-4 py-3 text-sm text-stone-800">
      <div className="flex flex-wrap items-center gap-3">
        <Bell className="h-4 w-4 shrink-0 text-stone-600" />
        <span className="font-medium">Notifications navigateur</span>
        {permission === "granted" ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void unsubscribe()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BellOff className="h-3.5 w-3.5" />
            )}
            Désactiver
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => void subscribe()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bell className="h-3.5 w-3.5" />
            )}
            Activer
          </button>
        )}
      </div>
      {message ? (
        <p className="mt-2 text-xs text-stone-600">{message}</p>
      ) : (
        <p className="mt-2 text-xs text-stone-600">
          Résumé des tâches et rappels (cron + clés VAPID requis en production).
        </p>
      )}
    </div>
  );
}
