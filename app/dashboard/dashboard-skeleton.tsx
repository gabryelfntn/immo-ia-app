export function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div>
        <div className="h-4 w-40 rounded bg-white/10" />
        <div className="mt-4 h-12 w-2/3 max-w-xl rounded-lg bg-white/10" />
        <div className="mt-3 h-5 w-1/2 max-w-md rounded bg-white/5" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-[0_0_40px_-20px_rgba(99,102,241,0.35)]"
          >
            <div className="h-10 w-10 rounded-xl bg-white/10" />
            <div className="mt-4 h-3 w-24 rounded bg-white/10" />
            <div className="mt-3 h-9 w-16 rounded bg-white/15" />
            <div className="mt-2 h-3 w-20 rounded bg-white/5" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[300px] rounded-2xl border border-gray-100 bg-white/80" />
        <div className="h-[300px] rounded-2xl border border-gray-100 bg-white/80" />
      </div>

      <div className="h-[320px] rounded-2xl border border-gray-100 bg-white/80" />

      <div className="h-64 rounded-2xl border border-gray-100 bg-white/80" />
    </div>
  );
}
