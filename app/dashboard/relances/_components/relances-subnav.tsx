import Link from "next/link";

type Props = {
  current: "liste" | "historique";
};

export function RelancesSubnav({ current }: Props) {
  return (
    <nav className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200/90 bg-white/[0.03] p-2 backdrop-blur-sm">
      <Link
        href="/dashboard/relances"
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
          current === "liste"
            ? "border border-stone-400/50 bg-stone-200/50 text-stone-900"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        }`}
      >
        Contacts à relancer
      </Link>
      <Link
        href="/dashboard/relances/historique"
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
          current === "historique"
            ? "border border-stone-400/50 bg-stone-200/50 text-stone-900"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        }`}
      >
        Historique des relances
      </Link>
    </nav>
  );
}
