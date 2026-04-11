"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { PwaRegister } from "@/app/_components/pwa-register";
import { PushNotificationsOptIn } from "./push-notifications-opt-in";
import { DashboardKeyboardShortcuts } from "./dashboard-keyboard-shortcuts";

const STORAGE_KEY = "immo-sidebar-collapsed";

type Props = {
  userName: string;
  agencyName: string | null;
  roleLabel: string;
  showTeamNav?: boolean;
  children: ReactNode;
};

export function DashboardShell({
  userName,
  agencyName,
  roleLabel,
  showTeamNav = false,
  children,
}: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isLg, setIsLg] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isLg) setMobileNavOpen(false);
  }, [isLg]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileNavOpen && !isLg) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [mobileNavOpen, isLg]);

  const toggleDesktop = useCallback(() => {
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

  const handleSidebarChromeToggle = useCallback(() => {
    if (isLg) toggleDesktop();
    else setMobileNavOpen(false);
  }, [isLg, toggleDesktop]);

  const desktopCollapsed = ready ? collapsed : false;
  const narrowDesktop = desktopCollapsed && isLg;

  return (
    <div className="min-h-screen text-stone-900 antialiased">
      <DashboardKeyboardShortcuts />
      <DashboardSidebar
        userName={userName}
        agencyName={agencyName}
        roleLabel={roleLabel}
        showTeamNav={showTeamNav}
        narrowDesktop={narrowDesktop}
        mobileDrawerOpen={mobileNavOpen}
        isDesktopLayout={isLg}
        onToggleSidebar={handleSidebarChromeToggle}
      />
      {mobileNavOpen && !isLg ? (
        <div
          role="presentation"
          className="fixed inset-0 z-30 bg-stone-900/20 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      ) : null}
      <div
        className={`min-h-screen transition-[margin] duration-300 ease-out motion-reduce:transition-none ${
          narrowDesktop ? "lg:ml-[76px]" : "lg:ml-[272px]"
        }`}
      >
        <DashboardHeader
          userName={userName}
          agencyName={agencyName}
          onMobileMenuToggle={() => setMobileNavOpen((o) => !o)}
          mobileNavOpen={mobileNavOpen}
          onDesktopSidebarToggle={toggleDesktop}
          sidebarCollapsed={desktopCollapsed}
        />
        <main className="dashboard-main-fade mx-auto max-w-[1440px] px-4 pb-12 pt-1 sm:px-6 lg:px-10 lg:pb-14">
          <PwaRegister />
          <div className="mb-4">
            <PushNotificationsOptIn />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
