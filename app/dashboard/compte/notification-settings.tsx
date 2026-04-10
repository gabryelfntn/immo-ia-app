"use client";

import { useEffect, useState } from "react";

export function NotificationSettings() {
  const [hour, setHour] = useState(7);
  const [mute, setMute] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/user/notification-preferences")
      .then((r) => r.json())
      .then((j) => {
        if (typeof j.push_digest_hour_utc === "number") {
          setHour(j.push_digest_hour_utc);
        }
        setMute(Boolean(j.push_mute_weekends));
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setMsg(null);
    const res = await fetch("/api/user/notification-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        push_digest_hour_utc: hour,
        push_mute_weekends: mute,
      }),
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setMsg(j.error ?? "Erreur");
      return;
    }
    setMsg("Préférences enregistrées.");
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-800">
        Notifications push (digest)
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Le digest automatique suit l’horaire du cron Vercel. La coupure
        week-end (UTC) évite les notifications samedi/dimanche si activée.
      </p>
      <div className="mt-4 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mute}
            onChange={(e) => setMute(e.target.checked)}
          />
          Ne pas recevoir de push le week-end (UTC)
        </label>
        <label className="block text-sm">
          <span className="text-slate-500">
            Heure UTC préférée (réserve, cron global)
          </span>
          <input
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="mt-1 w-24 rounded-lg border border-slate-200 px-2 py-1"
          />
        </label>
        <button
          type="button"
          onClick={() => void save()}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Enregistrer
        </button>
        {msg ? (
          <p className="text-sm text-slate-600" role="status">
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  );
}
