import type { ReactNode } from "react";
import "../globals.css";

export default function ClientPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f1eb] text-stone-900 antialiased">
      {children}
    </div>
  );
}
