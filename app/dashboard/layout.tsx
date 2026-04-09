import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "./_components/dashboard-shell";

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
    <DashboardShell userName={userName} agencyName={agencyName}>
      {children}
    </DashboardShell>
  );
}
