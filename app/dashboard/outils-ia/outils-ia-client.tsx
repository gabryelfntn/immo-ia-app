"use client";

import { Bot, FileText, Loader2, Megaphone, Mic, MicOff, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type PropertyOption = { id: string; title: string; city: string };

type TabId =
  | "assistant"
  | "dictation"
  | "document"
  | "social"
  | "mandate"
  | "anomaly"
  | "onboarding";

type ChatMsg = { role: "user" | "assistant"; content: string };

const tabs: { id: TabId; label: string }[] = [
  { id: "assistant", label: "Assistant CRM" },
  { id: "dictation", label: "Dictée → note" },
  { id: "document", label: "Coller un texte" },
  { id: "social", label: "Posts & newsletter" },
  { id: "mandate", label: "Score mandat" },
  { id: "anomaly", label: "Anomalies" },
  { id: "onboarding", label: "Onboarding" },
];

/** Sous-ensemble de l’API Web Speech (les noms globaux TS varient selon l’environnement de build). */
type WebSpeechResultEvent = {
  resultIndex: number;
  results: { length: number; [i: number]: { 0: { transcript: string } } };
};

type WebSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: WebSpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type WebSpeechRecognitionCtor = new () => WebSpeechRecognition;

function getSpeechRecognitionCtor(): WebSpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: WebSpeechRecognitionCtor;
    webkitSpeechRecognition?: WebSpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

type Props = { properties: PropertyOption[] };

export function OutilsIaClient({ properties }: Props) {
  const [tab, setTab] = useState<TabId>("assistant");
  const [propertyId, setPropertyId] = useState<string>("");

  useEffect(() => {
    if (properties.length && !propertyId) {
      setPropertyId(properties[0]!.id);
    }
  }, [properties, propertyId]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-900 text-white shadow-lg shadow-violet-600/25">
            <Sparkles className="h-6 w-6" strokeWidth={1.65} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-600/90">
              Intelligence
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Outils IA
            </h1>
            <p className="mt-1 max-w-xl text-sm text-stone-600">
              Chat, dictée, analyse de texte collé, contenus sociaux, scoring et
              contrôle de cohérence sur vos fiches biens.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/onboarding"
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
        >
          Premiers pas
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === t.id
                ? "bg-stone-900 text-white shadow-sm"
                : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "mandate" || tab === "anomaly" ? (
        <div className="mt-4 rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Bien concerné
          </label>
          <select
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-[#faf8f4] px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            {properties.length === 0 ? (
              <option value="">Aucun bien — créez-en un dans Biens</option>
            ) : null}
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} — {p.city}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="mt-4">
        {tab === "assistant" ? <AssistantPanel /> : null}
        {tab === "dictation" ? <DictationPanel /> : null}
        {tab === "document" ? <DocumentPanel /> : null}
        {tab === "social" ? <SocialPanel /> : null}
        {tab === "mandate" ? (
          <MandatePanel propertyId={propertyId} disabled={!propertyId} />
        ) : null}
        {tab === "anomaly" ? (
          <AnomalyPanel propertyId={propertyId} disabled={!propertyId} />
        ) : null}
        {tab === "onboarding" ? <OnboardingPanel /> : null}
      </div>
    </div>
  );
}

function AssistantPanel() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setErr(null);
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai-lab/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as { error?: string; reply?: string };
      if (!res.ok) {
        setErr(data.error ?? `Erreur ${res.status}`);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      setMessages([...next, { role: "assistant", content: data.reply ?? "" }]);
    } catch {
      setErr("Réseau ou serveur indisponible.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-stone-800">
        <Bot className="h-5 w-5 text-violet-700" strokeWidth={1.65} />
        <h2 className="text-lg font-semibold">Assistant conversationnel</h2>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        Posez des questions sur votre activité, rédigez un mail court, préparez
        un appel.
      </p>
      <div className="mt-4 flex max-h-[min(420px,55vh)] flex-col gap-3 overflow-y-auto rounded-xl border border-stone-100 bg-[#faf8f4] p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-stone-500">
            Aucun message pour l’instant. Écrivez votre première question
            ci-dessous.
          </p>
        ) : null}
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={`max-w-[95%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-stone-900 text-white"
                : "mr-auto border border-stone-200 bg-white text-stone-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Réponse en cours…
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
      {err ? (
        <p className="mt-2 text-sm text-red-600">{err}</p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Votre message…"
          rows={3}
          className="min-h-[88px] flex-1 resize-y rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading || !input.trim()}
          className="h-11 shrink-0 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40"
        >
          Envoyer
        </button>
      </div>
    </section>
  );
}

function DictationPanel() {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<{
    title: string;
    structured_note: string;
    next_actions: string[];
    tags?: string[];
  } | null>(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<WebSpeechRecognition | null>(null);

  const stopRec = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }, []);

  const startRec = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setErr("La dictée vocale n’est pas supportée par ce navigateur (essayez Chrome).");
      return;
    }
    setErr(null);
    const rec = new Ctor();
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (ev: WebSpeechResultEvent) => {
      let chunk = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        chunk += ev.results[i]![0]!.transcript;
      }
      if (chunk) {
        setTranscript((t) => (t ? `${t} ${chunk}` : chunk).trim());
      }
    };
    rec.onerror = () => {
      setErr("Erreur micro / reconnaissance vocale.");
      stopRec();
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [stopRec]);

  useEffect(() => () => stopRec(), [stopRec]);

  const run = async () => {
    if (transcript.trim().length < 3) return;
    setLoading(true);
    setErr(null);
    setNote(null);
    try {
      const res = await fetch("/api/ai-lab/dictation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim() }),
      });
      const data = (await res.json()) as {
        error?: string;
        note?: {
          title: string;
          structured_note: string;
          next_actions: string[];
          tags?: string[];
        };
      };
      if (!res.ok) {
        setErr(data.error ?? `Erreur ${res.status}`);
        return;
      }
      setNote(data.note ?? null);
    } catch {
      setErr("Réseau ou serveur indisponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-stone-800">
        <Mic className="h-5 w-5 text-violet-700" strokeWidth={1.65} />
        <h2 className="text-lg font-semibold">Dictée → note structurée</h2>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        Dictée (Chrome recommandé) ou collez une prise de notes brute. L’IA
        propose titre, note et actions.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!listening ? (
          <button
            type="button"
            onClick={startRec}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-[#faf8f4] px-4 py-2 text-sm font-medium text-stone-800 hover:border-stone-300"
          >
            <Mic className="h-4 w-4" />
            Démarrer le micro
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRec}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800"
          >
            <MicOff className="h-4 w-4" />
            Arrêter
          </button>
        )}
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading || transcript.trim().length < 3}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? "Traitement…" : "Structurer"}
        </button>
      </div>
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={6}
        className="mt-3 w-full rounded-xl border border-stone-200 bg-[#faf8f4] px-3 py-2 text-sm outline-none focus:border-stone-400"
        placeholder="Texte dicté ou collé…"
      />
      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
      {note ? (
        <div className="mt-4 space-y-3 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
          <p className="text-base font-semibold text-stone-900">{note.title}</p>
          <p className="whitespace-pre-wrap text-sm text-stone-800">
            {note.structured_note}
          </p>
          {note.next_actions.length ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                Actions
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-stone-800">
                {note.next_actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {note.tags?.length ? (
            <p className="text-xs text-stone-600">
              Tags : {note.tags.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function DocumentPanel() {
  const [text, setText] = useState("");
  const [docType, setDocType] = useState<
    "mandat" | "offre" | "compromis" | "autre"
  >("autre");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    resume: string;
    points_cles: string[];
    points_vigilance: string[];
  } | null>(null);

  const run = async () => {
    if (text.trim().length < 20) return;
    setLoading(true);
    setErr(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/ai-lab/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), docType }),
      });
      const data = (await res.json()) as {
        error?: string;
        analysis?: {
          resume: string;
          points_cles: string[];
          points_vigilance: string[];
        };
      };
      if (!res.ok) {
        setErr(data.error ?? `Erreur ${res.status}`);
        return;
      }
      setAnalysis(data.analysis ?? null);
    } catch {
      setErr("Réseau ou serveur indisponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-stone-800">
        <FileText className="h-5 w-5 text-violet-700" strokeWidth={1.65} />
        <h2 className="text-lg font-semibold">Lecture / résumé (texte collé)</h2>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        Collez le contenu d’un mandat, d’une offre, etc. Pas d’upload PDF pour
        l’instant.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="text-sm text-stone-600">
          Type indicatif{" "}
          <select
            value={docType}
            onChange={(e) =>
              setDocType(e.target.value as typeof docType)
            }
            className="ml-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm"
          >
            <option value="mandat">Mandat</option>
            <option value="offre">Offre</option>
            <option value="compromis">Compromis</option>
            <option value="autre">Autre</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading || text.trim().length < 20}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? "Analyse…" : "Analyser"}
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        className="mt-3 w-full rounded-xl border border-stone-200 bg-[#faf8f4] px-3 py-2 text-sm outline-none focus:border-stone-400"
        placeholder="Collez le texte du document…"
      />
      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
      {analysis ? (
        <div className="mt-4 space-y-4 rounded-xl border border-stone-200 bg-stone-50/80 p-4">
          <div>
            <p className="text-xs font-bold uppercase text-stone-500">Résumé</p>
            <p className="mt-1 text-sm text-stone-900">{analysis.resume}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-stone-500">
              Points clés
            </p>
            <ul className="mt-1 list-inside list-disc text-sm text-stone-800">
              {analysis.points_cles.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-amber-700">
              Vigilance
            </p>
            <ul className="mt-1 list-inside list-disc text-sm text-stone-800">
              {analysis.points_vigilance.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SocialPanel() {
  const [topic, setTopic] = useState("");
  const [channel, setChannel] = useState<"linkedin" | "instagram" | "newsletter">(
    "linkedin"
  );
  const [tone, setTone] = useState<"pro" | "chaleureux" | "direct">("pro");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);

  const run = async () => {
    if (topic.trim().length < 10) return;
    setLoading(true);
    setErr(null);
    setContent(null);
    try {
      const res = await fetch("/api/ai-lab/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          channel,
          tone,
        }),
      });
      const data = (await res.json()) as { error?: string; content?: string };
      if (!res.ok) {
        setErr(data.error ?? `Erreur ${res.status}`);
        return;
      }
      setContent(data.content ?? null);
    } catch {
      setErr("Réseau ou serveur indisponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-stone-800">
        <Megaphone className="h-5 w-5 text-violet-700" strokeWidth={1.65} />
        <h2 className="text-lg font-semibold">Posts & newsletter</h2>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        Décrivez l’angle (nouveau bien, conseil, actu locale). Le texte est à
        relire avant publication.
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2 text-stone-600">
          Canal
          <select
            value={channel}
            onChange={(e) =>
              setChannel(e.target.value as typeof channel)
            }
            className="rounded-lg border border-stone-200 bg-white px-2 py-1"
          >
            <option value="linkedin">LinkedIn</option>
            <option value="instagram">Instagram</option>
            <option value="newsletter">Newsletter</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-stone-600">
          Ton
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as typeof tone)}
            className="rounded-lg border border-stone-200 bg-white px-2 py-1"
          >
            <option value="pro">Professionnel</option>
            <option value="chaleureux">Chaleureux</option>
            <option value="direct">Direct</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading || topic.trim().length < 10}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? "Rédaction…" : "Générer"}
        </button>
      </div>
      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        rows={5}
        className="mt-3 w-full rounded-xl border border-stone-200 bg-[#faf8f4] px-3 py-2 text-sm outline-none focus:border-stone-400"
        placeholder="Ex. : annoncer une nouvelle exclusivité T3 à Lyon, ton premium…"
      />
      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
      {content ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-800">
          {content}
        </pre>
      ) : null}
    </section>
  );
}

function MandatePanel({
  propertyId,
  disabled,
}: {
  propertyId: string;
  disabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    summary: string;
    strengths: string[];
    risks: string[];
  } | null>(null);

  const run = async () => {
    if (!propertyId) return;
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai-lab/mandate-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      const data = (await res.json()) as {
        error?: string;
        result?: {
          score: number;
          summary: string;
          strengths: string[];
          risks: string[];
        };
      };
      if (!res.ok) {
        setErr(data.error ?? `Erreur ${res.status}`);
        return;
      }
      setResult(data.result ?? null);
    } catch {
      setErr("Réseau ou serveur indisponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">Score mandat (indicatif)</h2>
      <p className="mt-1 text-sm text-stone-600">
        Basé sur la fiche bien uniquement — à utiliser comme aide à la décision,
        pas comme verdict.
      </p>
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading || disabled}
        className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {loading ? "Calcul…" : "Calculer le score"}
      </button>
      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
      {result ? (
        <div className="mt-4 space-y-3 rounded-xl border border-violet-200/80 bg-violet-50/30 p-4">
          <p className="text-4xl font-bold text-violet-900">{result.score}</p>
          <p className="text-sm text-stone-800">{result.summary}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase text-emerald-700">
                Forces
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-stone-800">
                {result.strengths.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-amber-800">
                Risques
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-stone-800">
                {result.risks.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AnomalyPanel({
  propertyId,
  disabled,
}: {
  propertyId: string;
  disabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [flags, setFlags] = useState<string[] | null>(null);
  const [comment, setComment] = useState<string | null>(null);

  const run = async () => {
    if (!propertyId) return;
    setLoading(true);
    setErr(null);
    setFlags(null);
    setComment(null);
    try {
      const res = await fetch("/api/ai-lab/anomaly-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      const data = (await res.json()) as {
        error?: string;
        flags?: string[];
        comment?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? `Erreur ${res.status}`);
        return;
      }
      setFlags(data.flags ?? []);
      setComment(data.comment ?? null);
    } catch {
      setErr("Réseau ou serveur indisponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">
        Détection d’anomalies
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Contrôles automatiques + commentaire IA sur la cohérence de la fiche.
      </p>
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading || disabled}
        className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {loading ? "Analyse…" : "Analyser le bien"}
      </button>
      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
      {flags ? (
        <div className="mt-4 space-y-3">
          {flags.length ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
              <p className="text-xs font-bold uppercase text-amber-800">
                Alertes automatiques
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-stone-800">
                {flags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-stone-600">
              Aucune alerte automatique déclenchée.
            </p>
          )}
          {comment ? (
            <div className="rounded-xl border border-stone-200 bg-[#faf8f4] p-4 text-sm leading-relaxed text-stone-800 whitespace-pre-wrap">
              {comment}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function OnboardingPanel() {
  const [focus, setFocus] = useState<
    "general" | "relances" | "mandats" | "annonces" | "visites"
  >("general");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setErr(null);
    setTip(null);
    try {
      const res = await fetch("/api/ai-lab/onboarding-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus,
          question: question.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; tip?: string };
      if (!res.ok) {
        setErr(data.error ?? `Erreur ${res.status}`);
        return;
      }
      setTip(data.tip ?? null);
    } catch {
      setErr("Réseau ou serveur indisponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">
        Conseils nouvel agent
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Checklist rapide + aide IA selon votre besoin du moment.
      </p>
      <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-stone-700">
        <li>Vérifiez les infos de votre agence (paramètres / équipe).</li>
        <li>Créez au moins un bien et un contact pour tester le CRM.</li>
        <li>
          Essayez les{" "}
          <Link href="/dashboard/relances" className="font-medium underline">
            relances
          </Link>{" "}
          et les{" "}
          <Link href="/dashboard/annonces" className="font-medium underline">
            annonces IA
          </Link>
          .
        </li>
      </ul>
      <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4">
        <label className="text-sm text-stone-600">
          Thème
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value as typeof focus)}
            className="mt-1 w-full rounded-lg border border-stone-200 bg-[#faf8f4] px-3 py-2 text-sm text-stone-900"
          >
            <option value="general">Démarrage général</option>
            <option value="relances">Relances</option>
            <option value="mandats">Mandats</option>
            <option value="annonces">Annonces</option>
            <option value="visites">Visites</option>
          </select>
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="Question optionnelle…"
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
        />
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="w-fit rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? "Génération…" : "Obtenir un conseil IA"}
        </button>
      </div>
      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
      {tip ? (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50/90 p-4 text-sm leading-relaxed text-stone-800">
          {tip}
        </div>
      ) : null}
    </section>
  );
}
