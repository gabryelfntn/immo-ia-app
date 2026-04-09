import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "./_components/dashboard-header";
import { DashboardSidebar } from "./_components/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName = user?.email ?? "Utilisateur";
  let agencyName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, agency_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.full_name?.trim()) {
      userName = profile.full_name.trim();
    }

    if (profile?.agency_id) {
      const { data: agency } = await supabase
        .from("agencies")
        .select("name")
        .eq("id", profile.agency_id)
        .maybeSingle();
      agencyName = agency?.name ?? null;
    }
  }

  return (
    <div className="min-h-screen text-zinc-100 antialiased">
      <DashboardSidebar userName={userName} agencyName={agencyName} />
      <div className="min-h-screen lg:ml-[272px]">
        <DashboardHeader userName={userName} agencyName={agencyName} />
        <main className="dashboard-main-fade mx-auto max-w-[1440px] px-4 pb-12 pt-1 sm:px-6 lg:px-10 lg:pb-14">
          {children}
        </main>
      </div>
    </div>
  );
}
