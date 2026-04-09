"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

const STORAGE_KEY = "immo-sidebar-collapsed";

type Props = {
  userName: string;
  agencyName: string | null;
  children: ReactNode;
};

export function DashboardShell({ userName, agencyName, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen text-zinc-100 antialiased">
      <DashboardSidebar
        userName={userName}
        agencyName={agencyName}
        collapsed={ready ? collapsed : false}
        onToggleSidebar={toggle}
      />
      <div
        className={`min-h-screen transition-[margin] duration-300 ease-out motion-reduce:transition-none ${
          ready && collapsed ? "lg:ml-[76px]" : "lg:ml-[272px]"
        }`}
      >
        <DashboardHeader
          userName={userName}
          agencyName={agencyName}
          onMenuToggle={toggle}
          sidebarCollapsed={ready ? collapsed : false}
        />
        <main className="dashboard-main-fade mx-auto max-w-[1440px] px-4 pb-12 pt-1 sm:px-6 lg:px-10 lg:pb-14">
          {children}
        </main>
      </div>
    </div>
  );
}
