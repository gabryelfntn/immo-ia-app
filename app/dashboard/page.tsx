import { Suspense } from "react";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { DashboardView } from "./dashboard-view";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
