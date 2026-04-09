export function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div>
        <div className="h-4 w-40 rounded bg-slate-200/90" />
        <div className="mt-4 h-12 w-2/3 max-w-xl rounded-lg bg-slate-200/80" />
        <div className="mt-3 h-5 w-1/2 max-w-md rounded bg-slate-100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/50"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-100" />
            <div className="mt-4 h-3 w-24 rounded bg-slate-100" />
            <div className="mt-3 h-9 w-16 rounded bg-slate-200/70" />
            <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[300px] rounded-2xl border border-slate-100 bg-white shadow-sm" />
        <div className="h-[300px] rounded-2xl border border-slate-100 bg-white shadow-sm" />
      </div>

      <div className="h-[320px] rounded-2xl border border-slate-100 bg-white shadow-sm" />

      <div className="h-64 rounded-2xl border border-slate-100 bg-white shadow-sm" />
    </div>
  );
}
